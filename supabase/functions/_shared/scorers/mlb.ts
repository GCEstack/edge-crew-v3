// MLB-specific scoring variables and functions for the Edge Crew grade engine.
// TypeScript port of grade_engine.py lines 594–1355.

import type { EnrichedGame, PitcherProfile, Side, TeamProfile, Weather } from '../grade-types.ts'
import { clamp as _clamp } from '../utils.ts'

// ─── Type helpers ─────────────────────────────────────────────────────────────

type ScoreNote = [number, string]

function toNum(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function toInt(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : undefined
}

function getProfile(game: EnrichedGame, side: Side): TeamProfile {
  return game[`${side}_profile`] ?? {}
}

function getPitcher(game: EnrichedGame, side: Side): PitcherProfile {
  return getProfile(game, side).starting_pitcher ?? {}
}

// ─── Pitcher tiers ────────────────────────────────────────────────────────────

/** Legacy empty map kept for any importer that still expects the symbol. */
export const KNOWN_ACE_PITCHERS: Record<string, unknown> = {}

export const PITCHER_TIER_VALUES: Record<string, number> = {
  ace: 3.0,
  good: 1.5,
  unknown: 0.0,
  bad: -2.0,
}

/**
 * Classify a starting pitcher from real MLB Stats API numbers.
 *
 * Bands (current-season SP, industry-standard):
 *   ERA <= 3.00 + IP >= 30  -> ace
 *   ERA <= 3.80 + IP >= 20  -> good
 *   ERA >= 5.00 + IP >= 20  -> bad
 *   otherwise (or no sample) -> unknown
 */
export function pitcherTierFromStats(sp: unknown): string {
  if (!sp || typeof sp !== 'object') return 'unknown'

  const p = sp as PitcherProfile & Record<string, unknown>
  const eraRaw = p.era ?? p.ERA
  const ipRaw = p.ip ?? p.IP

  if (eraRaw === null || eraRaw === undefined) return 'unknown'

  const era = toNum(eraRaw)
  const ip = toNum(ipRaw) ?? 0.0

  if (era === undefined) return 'unknown'
  if (ip < 20) return 'unknown'
  if (era <= 3.0 && ip >= 30) return 'ace'
  if (era <= 3.8) return 'good'
  if (era >= 5.0) return 'bad'
  return 'unknown'
}

/**
 * Backwards-compatible shim. Accepts either an sp dict (preferred) or a bare
 * name string (legacy). Name-only callers always get "unknown" now because
 * there is no name-based lookup table anymore.
 */
export function pitcherTierLookup(spOrName: unknown): string {
  if (spOrName && typeof spOrName === 'object') {
    return pitcherTierFromStats(spOrName)
  }
  return 'unknown'
}

// ─── Park factors ─────────────────────────────────────────────────────────────

/** Hitter-friendly parks (boost offense for hitters, hurt pitchers). */
export const HITTER_FRIENDLY_PARKS_GE = new Set<string>([
  'Colorado Rockies',
  'Cincinnati Reds',
  'Texas Rangers',
  'New York Yankees',
  'Boston Red Sox',
  'Philadelphia Phillies',
])

/**
 * Park factors — FanGraphs 3-year park factor (100 = neutral, >100 = hitter
 * friendly, <100 = pitcher friendly). Keyed by team display name as it appears
 * in the ESPN/Odds data layer. Updated for 2026 season; refresh annually.
 */
export const PARK_FACTORS: Record<string, number> = {
  'Colorado Rockies': 112, // Coors Field — most extreme hitter park
  'Cincinnati Reds': 105, // Great American Ball Park
  'Texas Rangers': 104, // Globe Life Field
  'Philadelphia Phillies': 104, // Citizens Bank Park
  'Fenway Park': 103, // placeholder if mapped by stadium name
  'Boston Red Sox': 103, // Fenway Park
  'New York Yankees': 103, // Yankee Stadium
  'Chicago Cubs': 102, // Wrigley Field
  'Atlanta Braves': 102, // Truist Park
  'Baltimore Orioles': 102, // Camden Yards
  'Arizona Diamondbacks': 101, // Chase Field
  'Toronto Blue Jays': 101, // Rogers Centre
  'Milwaukee Brewers': 101, // American Family Field
  'Pittsburgh Pirates': 100, // PNC Park (neutral)
  'Detroit Tigers': 100, // Comerica Park
  'Houston Astros': 100, // Minute Maid Park
  'Washington Nationals': 99, // Nationals Park
  'New York Mets': 99, // Citi Field
  'Minnesota Twins': 99, // Target Field
  'Cleveland Guardians': 99, // Progressive Field
  'St. Louis Cardinals': 98, // Busch Stadium
  'Chicago White Sox': 98, // Guaranteed Rate Field
  'Kansas City Royals': 98, // Kauffman Stadium
  'Los Angeles Angels': 97, // Angel Stadium
  'Los Angeles Dodgers': 97, // Dodger Stadium
  Athletics: 96, // Sutter Health Park (Sacramento)
  'San Francisco Giants': 96, // Oracle Park
  'Seattle Mariners': 95, // T-Mobile Park
  'Miami Marlins': 94, // LoanDepot Park
  'San Diego Padres': 94, // Petco Park
  'Tampa Bay Rays': 92, // Tropicana Field — most extreme pitcher park
}

/**
 * Score the home park's offensive bias for the picking side.
 *
 * Park factor is a SIDE signal not just a totals signal — a hitter-friendly
 * park advantages a strong-hitting team picking the run line, and a
 * pitcher-friendly park advantages a strong-pitching team picking the win.
 * Returns (score, note). Score 5.0 = neutral.
 */
export function scoreParkFactor(game: EnrichedGame, side: Side): ScoreNote {
  const homeTeam = game.homeTeam ?? game.home_team ?? ''
  const pf = PARK_FACTORS[homeTeam]
  if (pf === undefined) {
    return [5.0, 'park factor: unknown park']
  }

  const profile = getProfile(game, side)
  const sp = profile.starting_pitcher ?? {}
  const spTier = pitcherTierFromStats(sp)
  const ppgL5 = profile.ppg_L5 ?? 0

  // Hitter-friendly park (>= 105) — strong boost for offense
  if (pf >= 105) {
    if (ppgL5 >= 5.0) {
      return [8.5, `hitter-friendly park (${pf}) + L5 offense ${ppgL5}`]
    }
    return [6.5, `hitter-friendly park (${pf})`]
  }

  // Mildly hitter friendly (102-104)
  if (pf >= 102) {
    if (ppgL5 >= 5.0) {
      return [6.5, `mildly hitter-friendly park (${pf}) + L5 offense ${ppgL5}`]
    }
    return [5.5, `mildly hitter-friendly park (${pf})`]
  }

  // Mildly pitcher friendly (96-98)
  if (pf >= 96 && pf <= 98) {
    if (side === 'home' && (spTier === 'ace' || spTier === 'good')) {
      return [6.5, `mildly pitcher-friendly park (${pf}) + ${spTier} home starter`]
    }
    return [5.0, `mildly pitcher-friendly park (${pf})`]
  }

  // Strongly pitcher friendly (<= 95)
  if (pf <= 95) {
    if (side === 'home' && spTier === 'ace') {
      return [8.0, `pitcher-friendly park (${pf}) + ACE home starter`]
    }
    if (side === 'home' && spTier === 'good') {
      return [7.0, `pitcher-friendly park (${pf}) + good home starter`]
    }
    return [4.0, `pitcher-friendly park (${pf}) — offense suppressed`]
  }

  // 99-101 = neutral
  return [5.0, `neutral park (${pf})`]
}

// ─── Umpires ──────────────────────────────────────────────────────────────────

/**
 * MLB plate umpire K%/BB% tendencies — public dataset compiled from
 * Umpire Auditor / Baseball Savant. Refresh annually. Anchored at league
 * average K% ~22.5, BB% ~8.4. Names match StatsAPI officials displayName.
 */
export const UMPIRE_TENDENCIES: Record<string, { k_pct: number; bb_pct: number }> = {
  // High-K umps (favor pitchers)
  'Angel Hernandez': { k_pct: 24.1, bb_pct: 7.8 },
  'Doug Eddings': { k_pct: 23.8, bb_pct: 7.6 },
  'Ron Kulpa': { k_pct: 23.6, bb_pct: 8.2 },
  'Mark Wegner': { k_pct: 23.5, bb_pct: 8.0 },
  'Marvin Hudson': { k_pct: 23.4, bb_pct: 7.9 },
  'C.B. Bucknor': { k_pct: 23.4, bb_pct: 8.5 },
  'Larry Vanover': { k_pct: 23.3, bb_pct: 8.1 },
  'Hunter Wendelstedt': { k_pct: 23.3, bb_pct: 8.0 },
  'Vic Carapazza': { k_pct: 23.2, bb_pct: 8.3 },
  'Tony Randazzo': { k_pct: 23.1, bb_pct: 8.0 },
  'Bill Welke': { k_pct: 23.1, bb_pct: 8.4 },
  'Jansen Visconti': { k_pct: 23.0, bb_pct: 8.2 },
  'Sean Barber': { k_pct: 22.9, bb_pct: 8.5 },
  'Phil Cuzzi': { k_pct: 22.8, bb_pct: 8.7 },
  // League-average umps (~22.5 K%)
  'Andy Fletcher': { k_pct: 22.6, bb_pct: 8.3 },
  'Chris Conroy': { k_pct: 22.6, bb_pct: 8.5 },
  'Ed Hickox': { k_pct: 22.5, bb_pct: 8.4 },
  'Greg Gibson': { k_pct: 22.5, bb_pct: 8.4 },
  'Adrian Johnson': { k_pct: 22.5, bb_pct: 8.6 },
  'Will Little': { k_pct: 22.4, bb_pct: 8.5 },
  'Mike Estabrook': { k_pct: 22.4, bb_pct: 8.7 },
  'Jordan Baker': { k_pct: 22.3, bb_pct: 8.5 },
  'Tripp Gibson': { k_pct: 22.3, bb_pct: 8.6 },
  'Pat Hoberg': { k_pct: 22.3, bb_pct: 8.4 },
  'Cory Blaser': { k_pct: 22.2, bb_pct: 8.5 },
  'Brian Knight': { k_pct: 22.2, bb_pct: 8.6 },
  'Stu Scheurwater': { k_pct: 22.1, bb_pct: 8.5 },
  'Carlos Torres': { k_pct: 22.1, bb_pct: 8.7 },
  'Quinn Wolcott': { k_pct: 22.0, bb_pct: 8.5 },
  'Dan Iassogna': { k_pct: 22.0, bb_pct: 8.4 },
  'Manny Gonzalez': { k_pct: 22.0, bb_pct: 8.6 },
  // Low-K umps (favor hitters)
  'Joe West': { k_pct: 21.8, bb_pct: 8.9 }, // retired but cached
  'Lance Barrett': { k_pct: 21.8, bb_pct: 9.0 },
  'Bruce Dreckman': { k_pct: 21.7, bb_pct: 9.1 },
  'Alan Porter': { k_pct: 21.6, bb_pct: 8.9 },
  'James Hoye': { k_pct: 21.6, bb_pct: 9.0 },
  'Nic Lentz': { k_pct: 21.5, bb_pct: 8.9 },
  'John Tumpane': { k_pct: 21.4, bb_pct: 9.0 },
  'Bill Miller': { k_pct: 21.3, bb_pct: 9.1 },
  'Mike Muchlinski': { k_pct: 21.3, bb_pct: 9.0 },
  'Junior Valentine': { k_pct: 21.2, bb_pct: 9.1 },
  'Mark Carlson': { k_pct: 21.1, bb_pct: 9.2 },
  "Brian O'Nora": { k_pct: 21.0, bb_pct: 8.9 },
  'Tom Hallion': { k_pct: 20.9, bb_pct: 9.0 },
  'Laz Diaz': { k_pct: 20.8, bb_pct: 9.2 },
  'Lance Barksdale': { k_pct: 20.7, bb_pct: 9.0 },
  'Brian Gorman': { k_pct: 20.6, bb_pct: 9.3 },
}

export const LEAGUE_AVG_K_PCT = 22.5
export const LEAGUE_AVG_BB_PCT = 8.4

/**
 * Score the impact of the home plate umpire's K% / BB% tendency on the picking
 * team. A high-K ump favors strong pitching teams (boost pitcher side); a low-K
 * ump favors strong hitting teams.
 *
 * Reads game.umpire which is populated by data_fetch_mlb._fetch_sync from
 * StatsAPI gameData.officials. Returns (score, note).
 */
export function scoreUmpire(game: EnrichedGame, side: Side): ScoreNote {
  const ump = game.umpire ?? {}
  const name = ump.name ?? ''
  if (!name) {
    return [5.0, 'no umpire data']
  }

  const tend = UMPIRE_TENDENCIES[name]
  if (!tend) {
    return [5.0, `umpire ${name} (unknown tendency)`]
  }

  const kPct = tend.k_pct
  const kDelta = kPct - LEAGUE_AVG_K_PCT // positive = high-K ump

  const profile = getProfile(game, side)
  const sp = profile.starting_pitcher ?? {}
  const spTier = pitcherTierFromStats(sp)

  // High-K ump (>22.8) + ace/good pitcher on the picking side = boost
  // Low-K ump (<22.2) + strong offense (ppg_L5 >= 5) = boost
  if (kDelta >= 0.5 && (spTier === 'ace' || spTier === 'good')) {
    return [7.5, `${name} K% ${kPct} (high-K) + ${spTier} starter`]
  }
  if (kDelta <= -0.5) {
    const ppg = profile.ppg_L5 ?? 0
    if (ppg >= 5.0) {
      return [7.0, `${name} K% ${kPct} (low-K) + L5 offense ${ppg}`]
    }
    return [5.5, `${name} K% ${kPct} (low-K)`]
  }
  if (kDelta >= 0.5) {
    return [6.0, `${name} K% ${kPct} (high-K)`]
  }
  return [5.0, `${name} K% ${kPct} (neutral)`]
}

// ─── Lineup vs hand ───────────────────────────────────────────────────────────

/**
 * Score the picking team's offensive matchup vs the opposing starter's
 * handedness. Reads profile.lineup_vs_hand which is populated by
 * data_fetch_mlb._extract_team_splits_vs_hand.
 *
 * Anchors at .720 OPS = neutral 5.0. Each .020 OPS difference moves the score
 * by ~1 point. Returns (score, note).
 */
export function scoreLineupVsHand(game: EnrichedGame, side: Side): ScoreNote {
  const profile = getProfile(game, side)
  const splits = profile.lineup_vs_hand ?? {}
  if (!splits || splits.ops_vs_hand === null || splits.ops_vs_hand === undefined) {
    return [5.0, 'no lineup vs hand splits']
  }

  const ops = splits.ops_vs_hand ?? 0.72
  const hand = splits.vs_hand ?? '?'
  const avg = splits.avg_vs_hand
  const hr = splits.hr_vs_hand

  // OPS .720 = neutral 5.0, each .020 above moves +1
  const score = 5.0 + (ops - 0.72) * 50

  const noteParts: string[] = [`OPS ${ops.toFixed(3)} vs ${hand}HP`]
  const avgNum = toNum(avg)
  if (avgNum !== undefined) {
    noteParts.push(`AVG .${Math.trunc(avgNum * 1000).toString().padStart(3, '0')}`)
  }
  const hrNum = toInt(hr)
  if (hrNum !== undefined) {
    noteParts.push(`${hrNum} HR`)
  }

  return [_clamp(score), noteParts.join(' ')]
}

// ─── Bullpen ──────────────────────────────────────────────────────────────────

/**
 * Score MLB bullpen quality + freshness from MLB Stats API L7 walk.
 *
 * Reads profile.bullpen which is populated by data_fetch_mlb._extract_bullpen_stats
 * and contains: bullpen_era_L7, bullpen_ip_L7, bullpen_tired_arms,
 * bullpen_relief_games, team_era_season.
 *
 * Returns (score, note). Score 5.0 = neutral, lower for tired/bad bullpens,
 * higher for fresh/elite bullpens.
 */
export function scoreBullpen(game: EnrichedGame, side: Side): ScoreNote {
  const profile = getProfile(game, side)
  const bp = profile.bullpen ?? {}
  if (!bp || bp.bullpen_era_L7 === undefined) {
    return [5.0, 'no bullpen data']
  }

  const eraL7 = bp.bullpen_era_L7 ?? 4.0
  const tiredRaw = bp.bullpen_tired_arms ?? 0
  const tired =
    typeof tiredRaw === 'boolean'
      ? tiredRaw
        ? 1
        : 0
      : (toNum(tiredRaw) ?? 0)
  const seasonEra = toNum(bp.team_era_season)

  // Score from L7 ERA: lower = better. Anchor 4.00 = neutral 5.0.
  // Each 0.5 ERA difference moves score by ~1 point.
  let score = 5.0 + (4.0 - eraL7) * 2.0

  // Penalty for tired arms (3+ appearances in 7 days)
  if (tired >= 3) {
    score -= 1.5
  } else if (tired >= 2) {
    score -= 0.75
  }

  // Bonus when L7 ERA is significantly better than season ERA (heating up)
  if (seasonEra !== undefined && eraL7 < seasonEra - 0.75) {
    score += 0.5
  }
  // Penalty when L7 ERA is significantly worse than season (slumping)
  if (seasonEra !== undefined && eraL7 > seasonEra + 0.75) {
    score -= 0.5
  }

  let note = `bullpen ERA L7 ${eraL7}`
  if (tired) {
    note += `, ${tired} tired arm${tired === 1 ? '' : 's'}`
  }
  if (seasonEra !== undefined) {
    note += ` (season ${seasonEra})`
  }

  return [_clamp(score), note]
}

// ─── Starting pitcher ─────────────────────────────────────────────────────────

// Sentinel prefix in the note so grade_game can mark this variable unavailable.
export const SP_PROXY_NOTE_PREFIX = 'SP unknown'

/**
 * Score MLB starting pitcher. Tier is the primary driver — ERA differential is
 * a tiebreaker bonus, margin proxy is the last resort and marks itself
 * unavailable via note prefix so the engine knows not to trust it.
 */
export function scoreStartingPitcher(game: EnrichedGame, side: Side): ScoreNote {
  const profile = getProfile(game, side)
  const sp = profile.starting_pitcher ?? {}

  const oppSide: Side = side === 'home' ? 'away' : 'home'
  const oppProfile = getProfile(game, oppSide)
  const oppSp = oppProfile.starting_pitcher ?? {}

  const ourName = sp.name ?? ''
  const oppName = oppSp.name ?? ''
  const ourTier = pitcherTierFromStats(sp)
  const oppTier = pitcherTierFromStats(oppSp)
  const ourVal = PITCHER_TIER_VALUES[ourTier]
  const oppVal = PITCHER_TIER_VALUES[oppTier]

  // Primary driver: tier delta (Skenes vs unknown = +3.0 → score 8.0)
  if (ourTier !== 'unknown' || oppTier !== 'unknown') {
    let score = _clamp(5 + (ourVal - oppVal))

    // ERA bonus (small) when both ERAs available
    const era = toNum(sp.era ?? (sp as Record<string, unknown>).ERA)
    const oppEra = toNum(oppSp.era ?? (oppSp as Record<string, unknown>).ERA)
    if (era !== undefined && oppEra !== undefined) {
      const eraDiff = oppEra - era
      score = _clamp(score + eraDiff * 0.3)
    }

    // Park penalty: pitcher at hitter-friendly park
    const homeTeam = game.homeTeam ?? ''
    if (side === 'home' && HITTER_FRIENDLY_PARKS_GE.has(homeTeam)) {
      score = _clamp(score - 0.5)
    }

    return [score, `SP tier: ${ourName || '?'} (${ourTier}) vs ${oppName || '?'} (${oppTier})`]
  }

  // Last resort: margin proxy. Read CORRECT field name (L5_margin, not
  // margin_L5 — old bug). Note prefix marks this as unavailable.
  const marginRaw = profile.L5_margin ?? profile.margin_L5 ?? 0
  const margin = toNum(marginRaw) ?? 0.0
  const sign = margin >= 0 ? '+' : ''

  return [
    _clamp(5 + margin / 3),
    `${SP_PROXY_NOTE_PREFIX} (${ourName || 'TBD'} vs ${oppName || 'TBD'}) — proxy from L5 margin ${sign}${margin.toFixed(1)}`,
  ]
}

// ─── Starter depth ────────────────────────────────────────────────────────────

/**
 * Modern MLB starter depth signal.
 *
 * Lower emphasis on name/tier; higher emphasis on inning capacity and command
 * (BB/9) so bullpen exposure is modeled directly.
 */
export function scoreStarterDepth(game: EnrichedGame, side: Side): ScoreNote {
  const sp = getPitcher(game, side)
  const oppSide: Side = side === 'home' ? 'away' : 'home'
  const oppSp = getPitcher(game, oppSide)

  function depthScore(p: PitcherProfile): number {
    const ipRaw = p.ip ?? (p as Record<string, unknown>).IP
    if (ipRaw === null || ipRaw === undefined) return 5.0

    const ip = toNum(ipRaw)
    if (ip === undefined) return 5.0

    let score = 5.0
    if (ip >= 100) score += 2.0
    else if (ip >= 60) score += 1.25
    else if (ip >= 30) score += 0.5
    else if (ip < 20) score -= 0.75

    const k9 = toNum(p.k9)
    if (k9 !== undefined && k9 >= 9.5) {
      score += 0.5
    }

    const bb9 = toNum(p.bb9)
    if (bb9 !== undefined) {
      if (bb9 <= 2.2) score += 0.6
      else if (bb9 >= 3.6) score -= 0.8
    }

    return score
  }

  const ours = depthScore(sp)
  const opp = depthScore(oppSp)
  const score = _clamp(5.0 + (ours - opp) * 0.8)

  return [score, `starter depth ${ours.toFixed(1)} vs ${opp.toFixed(1)}`]
}

// ─── Pitcher vs lineup archetype ──────────────────────────────────────────────

/**
 * Pitcher archetype vs opposing lineup archetype.
 *
 * True pitch-mix (FB/CB/SL usage) is not available in current ingest.
 * Proxy with:
 * - Pitcher shape: K/9 + BB/9 (power/contact/wild)
 * - Opp lineup shape vs hand: AVG + HR + OPS (contact/power)
 */
export function scorePitcherHitterArchetype(game: EnrichedGame, side: Side): ScoreNote {
  const profile = getProfile(game, side)
  const oppSide: Side = side === 'home' ? 'away' : 'home'
  const oppProfile = getProfile(game, oppSide)

  const sp = profile.starting_pitcher ?? {}
  const oppSplits = oppProfile.lineup_vs_hand ?? {}

  const k9 = sp.k9
  const bb9 = sp.bb9
  const avg = oppSplits.avg_vs_hand
  const hr = oppSplits.hr_vs_hand
  const ops = oppSplits.ops_vs_hand

  if (k9 === null || k9 === undefined || avg === null || avg === undefined || hr === null || hr === undefined) {
    return [5.0, 'no pitcher-vs-lineup archetype data']
  }

  const k9f = toNum(k9)
  const bb9f = bb9 !== null && bb9 !== undefined ? toNum(bb9) : 2.9
  const avgf = toNum(avg)
  const hri = toInt(hr)
  const opsf = ops !== null && ops !== undefined ? toNum(ops) : 0.72

  if (
    k9f === undefined ||
    bb9f === undefined ||
    avgf === undefined ||
    hri === undefined ||
    opsf === undefined
  ) {
    return [5.0, 'no pitcher-vs-lineup archetype data']
  }

  let pType: string
  if (k9f >= 9.5) pType = 'power'
  else if (k9f <= 7.2) pType = 'contact'
  else pType = 'balanced'

  let lType: string
  if (hri >= 40 || (opsf >= 0.76 && avgf < 0.25)) lType = 'power'
  else if (avgf >= 0.26 && hri <= 30) lType = 'contact'
  else lType = 'balanced'

  let score = 5.0
  if (pType === 'power' && lType === 'power') score += 1.0
  else if (pType === 'contact' && lType === 'power') score -= 1.1
  else if (pType === 'power' && lType === 'contact') score += 0.4
  else if (pType === 'contact' && lType === 'contact') score += 0.2

  if (bb9f <= 2.2) score += 0.4
  else if (bb9f >= 3.6) score -= 0.7

  return [
    _clamp(score),
    `${pType} arm (K9 ${k9f.toFixed(1)}, BB9 ${bb9f.toFixed(1)}) vs ${lType} lineup (AVG ${avgf.toFixed(3)}, HR ${hri})`,
  ]
}

// ─── Lineup DNA ───────────────────────────────────────────────────────────────

/**
 * Classify lineup as POWER, CONTACT, or BALANCED using batting splits.
 *
 * POWER = high HR count + high OPS but lower AVG (swing big, miss big).
 * CONTACT = low K proxy (high AVG) + moderate OPS.
 * BALANCED = everything else.
 * Returns (score, note). POWER=8, CONTACT=3, BALANCED=5.
 */
export function scoreLineupDna(game: EnrichedGame, side: Side): ScoreNote {
  const profile = getProfile(game, side)
  const splits = profile.lineup_vs_hand ?? {}
  if (!splits) {
    return [5.0, 'no lineup DNA data']
  }

  const ops = splits.ops_vs_hand
  const avg = splits.avg_vs_hand
  const hr = splits.hr_vs_hand

  if ((ops === null || ops === undefined) && (avg === null || avg === undefined)) {
    return [5.0, 'no lineup DNA data']
  }

  const opsF = toNum(ops) ?? 0.72
  const avgF = toNum(avg) ?? 0.25
  const hrI = toInt(hr) ?? 0

  if (hrI >= 35 || (opsF >= 0.77 && avgF < 0.255)) {
    return [_clamp(8.0), `POWER lineup (OPS ${opsF.toFixed(3)}, AVG ${avgF.toFixed(3)}, HR ${hrI})`]
  }
  if (avgF >= 0.265 && opsF < 0.74 && hrI <= 25) {
    return [_clamp(3.0), `CONTACT lineup (OPS ${opsF.toFixed(3)}, AVG ${avgF.toFixed(3)}, HR ${hrI})`]
  }
  return [_clamp(5.0), `BALANCED lineup (OPS ${opsF.toFixed(3)}, AVG ${avgF.toFixed(3)}, HR ${hrI})`]
}

// ─── Pitcher profile / depth ──────────────────────────────────────────────────

/**
 * Is the starter a deep-starter (6+ IP regularly) or short-stint?
 *
 * Uses starter's season IP to estimate average depth per start.
 * Deep starter (avg IP/start >= 6) = 8, committee (<= 4.5) = 3, average = 5.
 * Returns (score, note).
 */
export function scorePitcherProfile(game: EnrichedGame, side: Side): ScoreNote {
  const sp = getPitcher(game, side)
  const ipRaw = sp.ip ?? (sp as Record<string, unknown>).IP
  if (ipRaw === null || ipRaw === undefined) {
    return [5.0, 'no pitcher profile data']
  }

  const ip = toNum(ipRaw)
  if (ip === undefined) {
    return [5.0, 'no pitcher profile data']
  }

  if (ip < 10) {
    return [5.0, `pitcher profile: too few IP (${ip})`]
  }

  const era = toNum(sp.era ?? (sp as Record<string, unknown>).ERA)

  const gamesEst = Math.max(1, ip / 5.5)
  const avgDepth = ip / gamesEst

  let score: number
  let label: string
  if (avgDepth >= 6.0) {
    score = 8.0
    label = 'deep starter'
  } else if (avgDepth <= 4.5) {
    score = 3.0
    label = 'short stint'
  } else {
    score = 5.0
    label = 'average depth'
  }

  if (era !== undefined && era <= 3.0 && ip >= 30) {
    score += 0.5
  } else if (era !== undefined && era >= 5.0) {
    score -= 0.5
  }

  let note = `${label} (${ip} IP`
  if (era !== undefined) {
    note += `, ERA ${era.toFixed(2)}`
  }
  note += ')'

  return [_clamp(score), note]
}

// ─── Bullpen fatigue ──────────────────────────────────────────────────────────

/**
 * Score bullpen fatigue from recent usage. Reads profile.bullpen L7 data.
 *
 * Heavy usage (high tired arms + high L7 IP) = low score (fatigued).
 * Fresh bullpen = high score (advantage).
 * Returns (score, note).
 */
export function scoreBullpenFatigue(game: EnrichedGame, side: Side): ScoreNote {
  const profile = getProfile(game, side)
  const bp = profile.bullpen ?? {}
  if (!bp || bp.bullpen_era_L7 === undefined) {
    return [5.0, 'no bullpen fatigue data']
  }

  const eraL7 = bp.bullpen_era_L7 ?? 4.0
  const tiredRaw = bp.bullpen_tired_arms ?? 0
  const tired =
    typeof tiredRaw === 'boolean'
      ? tiredRaw
        ? 1
        : 0
      : (toNum(tiredRaw) ?? 0)
  const ipL7 = bp.bullpen_ip_L7 ?? 0
  const seasonEra = toNum(bp.team_era_season)

  let score = 5.0
  if (tired >= 4) score = 2.5
  else if (tired >= 3) score = 3.5
  else if (tired >= 2) score = 4.0
  else if (tired <= 0) score = 7.0
  else score = 5.5

  if (eraL7 > 5.0) score -= 1.0
  else if (eraL7 > 4.5) score -= 0.5
  else if (eraL7 < 3.0) score += 1.0
  else if (eraL7 < 3.5) score += 0.5

  if (seasonEra !== undefined && eraL7 > seasonEra + 1.0) {
    score -= 0.5
  }

  let note = `bullpen fatigue: ${tired} tired arm${tired === 1 ? '' : 's'}, ERA L7 ${eraL7}`
  if (ipL7) {
    note += `, ${ipL7} IP L7`
  }

  return [_clamp(score), note]
}

// ─── Weather ──────────────────────────────────────────────────────────────────

/**
 * Score weather impact on offense. Wind blowing out + warm = high (8-9).
 * Cold + wind blowing in = low (2-3). Moderate/dome = neutral 5.
 *
 * Reads game.weather dict from StatsAPI. Returns (score, note).
 */
export function scoreWeatherFactor(game: EnrichedGame, _side: Side): ScoreNote {
  const wx = game.weather
  if (!wx) {
    return [5.0, 'no weather data']
  }

  const tempRaw = wx.temp
  const windRaw = wx.wind !== null && wx.wind !== undefined ? String(wx.wind) : ''
  const condition = wx.condition ?? ''

  const temp = toNum(tempRaw)

  const windLower = windRaw.toLowerCase()
  const windOut = windLower.includes('out')
  const windIn = windLower.includes(' in') || windLower.startsWith('in ')

  let windMph = 0
  for (const part of windLower.replace(/,/g, ' ').split(/\s+/)) {
    if (/^-?\d+$/.test(part)) {
      windMph = parseInt(part, 10)
      break
    }
  }

  let score = 5.0

  if (temp !== undefined) {
    if (temp >= 85) score += 1.0
    else if (temp >= 75) score += 0.5
    else if (temp <= 45) score -= 1.5
    else if (temp <= 55) score -= 0.5
  }

  if (windOut && windMph >= 10) score += 1.5
  else if (windOut && windMph >= 5) score += 0.75
  else if (windIn && windMph >= 10) score -= 1.5
  else if (windIn && windMph >= 5) score -= 0.75

  const conditionLower = condition.toLowerCase()
  if (conditionLower.includes('dome') || conditionLower.includes('roof closed')) {
    score = 5.0
  }

  const parts: string[] = []
  if (temp !== undefined) parts.push(`${temp}F`)
  if (windRaw) parts.push(windRaw)
  if (condition) parts.push(condition)
  const note = parts.length ? `weather: ${parts.join(', ')}` : 'weather: unknown conditions'

  return [_clamp(score), note]
}

// ─── Ground ball / fly ball ratio proxy ───────────────────────────────────────

/**
 * Ground ball vs fly ball tendency proxy using pitcher K/9.
 *
 * High K/9 pitchers tend to be fly ball types (more whiffs = fewer GB).
 * Low K/9 pitchers tend to be ground ball types (weak contact).
 * GB-heavy (low K/9) = 8, FB-heavy (high K/9) = 3, neutral = 5.
 * Returns (score, note).
 */
export function scoreGbFbRatio(game: EnrichedGame, side: Side): ScoreNote {
  const sp = getPitcher(game, side)
  const k9Raw = sp.k9
  if (k9Raw === null || k9Raw === undefined) {
    return [5.0, 'no GB/FB data']
  }

  const k9 = toNum(k9Raw)
  if (k9 === undefined) {
    return [5.0, 'no GB/FB data']
  }

  const bb9 = toNum(sp.bb9) ?? 3.0

  let score: number
  let label: string
  if (k9 <= 6.5) {
    score = 8.0
    label = 'GB-heavy'
  } else if (k9 <= 7.5) {
    score = 6.5
    label = 'GB-leaning'
  } else if (k9 >= 10.0) {
    score = 3.0
    label = 'FB-heavy'
  } else if (k9 >= 8.5) {
    score = 4.0
    label = 'FB-leaning'
  } else {
    score = 5.0
    label = 'neutral'
  }

  if (bb9 <= 2.2) score += 0.3
  else if (bb9 >= 3.6) score -= 0.3

  return [_clamp(score), `${label} (K/9 ${k9.toFixed(1)}, BB/9 ${bb9.toFixed(1)})`]
}

// ─── Plate discipline ─────────────────────────────────────────────────────────

/**
 * Score team plate discipline using batting profile data.
 *
 * High OPS + high AVG = disciplined approach (work counts, see pitches).
 * Low AVG + high K proxy (low AVG with low OPS) = undisciplined.
 * Returns (score, note).
 */
export function scorePlateDiscipline(game: EnrichedGame, side: Side): ScoreNote {
  const profile = getProfile(game, side)
  const splits = profile.lineup_vs_hand ?? {}
  if (!splits) {
    return [5.0, 'no plate discipline data']
  }

  const ops = splits.ops_vs_hand
  const avg = splits.avg_vs_hand
  if ((ops === null || ops === undefined) && (avg === null || avg === undefined)) {
    return [5.0, 'no plate discipline data']
  }

  const opsF = toNum(ops) ?? 0.72
  const avgF = toNum(avg) ?? 0.25

  const discScore = (opsF - 0.72) * 30 + (avgF - 0.25) * 40
  const score = 5.0 + discScore

  let label: string
  if (opsF >= 0.78 && avgF >= 0.26) label = 'disciplined'
  else if (opsF <= 0.68 || avgF <= 0.23) label = 'undisciplined'
  else label = 'average discipline'

  return [_clamp(score), `${label} (OPS ${opsF.toFixed(3)}, AVG ${avgF.toFixed(3)})`]
}
