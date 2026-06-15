import type { EnrichedGame, GoalieProfile, Side, TeamProfile } from '../grade-types.ts'
import { ELITE_NHL_GOALIES, GOOD_NHL_GOALIES } from '../constants.ts'

function goalieName(value: string | GoalieProfile | undefined): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') return value
  const name = (value as Record<string, unknown>).name
  return typeof name === 'string' ? name : undefined
}

// Local helper utilities (mirrors grade_engine.py helpers)
function clamp(val: number, lo = 1, hi = 10): number {
  return Math.max(lo, Math.min(hi, Math.round(val * 10) / 10))
}

function normalizeSvPct(val: unknown): number | null {
  if (val == null) return null
  const s = Number(val)
  if (Number.isNaN(s)) return null
  let normalized = s
  if (normalized > 1.5) normalized /= 100.0
  if (0.8 <= normalized && normalized <= 1.0) return normalized
  return null
}

function goalieTier(name: string | null | undefined): 'ELITE' | 'GOOD' | null {
  if (!name) return null
  const last = name.trim().toLowerCase().split(/\s+/).pop()
  if (!last) return null
  if (ELITE_NHL_GOALIES.has(last)) return 'ELITE'
  if (GOOD_NHL_GOALIES.has(last)) return 'GOOD'
  return null
}

// ─── NHL-Specific Scorers ────────────────────────────────────────────────────
// Each returns [score: 1-10, note: string]

export function scorePpPct(profile: TeamProfile): [number, string] {
  const pp = profile.pp_pct
  if (pp == null) {
    return [5, 'no PP data']
  }
  if (pp >= 25) return [9, `PP ${pp.toFixed(1)}%`]
  if (pp >= 22) return [7, `PP ${pp.toFixed(1)}%`]
  if (pp >= 20) return [5, `PP ${pp.toFixed(1)}%`]
  if (pp >= 18) return [3, `PP ${pp.toFixed(1)}%`]
  return [2, `PP ${pp.toFixed(1)}% (weak)`]
}

export function scorePkPct(profile: TeamProfile): [number, string] {
  const pk = profile.pk_pct
  if (pk == null) {
    return [5, 'no PK data']
  }
  if (pk >= 84) return [9, `PK ${pk.toFixed(1)}%`]
  if (pk >= 80) return [7, `PK ${pk.toFixed(1)}%`]
  if (pk >= 78) return [5, `PK ${pk.toFixed(1)}%`]
  if (pk >= 75) return [3, `PK ${pk.toFixed(1)}%`]
  return [2, `PK ${pk.toFixed(1)}% (weak)`]
}

export function scoreGoalieWorkload(game: EnrichedGame, side: Side): [number, string] {
  const profile = game[`${side}_profile`] ?? {}
  const g = (profile.starting_goalie as Record<string, unknown> | undefined) || {}
  const ourSv = normalizeSvPct(g.sv_pct ?? g['SV%'] ?? g.svp)
  if (ourSv == null) {
    return [5, 'No goalie workload data']
  }
  if (ourSv >= 0.925) return [clamp(3), `SV% ${ourSv.toFixed(3)} — fresh/elite`]
  if (ourSv >= 0.915) return [clamp(4), `SV% ${ourSv.toFixed(3)} — manageable`]
  if (ourSv >= 0.905) return [clamp(6), `SV% ${ourSv.toFixed(3)} — moderate load`]
  if (ourSv >= 0.9) return [clamp(7), `SV% ${ourSv.toFixed(3)} — heavy`]
  return [clamp(8), `SV% ${ourSv.toFixed(3)} — overworked/struggling`]
}

export function scoreB2bFlag(profile: TeamProfile): [number, string] {
  const rest = profile.rest_days
  if (rest == null) {
    return [5, 'No rest data']
  }
  if (rest <= 1) return [clamp(9), `B2B — ${rest}d rest`]
  if (rest === 2) return [clamp(5), `${rest}d rest — normal`]
  return [clamp(2), `${rest}d rest — well rested`]
}

export function scoreShotQuality(profile: TeamProfile, opponent: TeamProfile): [number, string] {
  const pace = profile.nhl_pace ?? {}
  const oppPace = opponent.nhl_pace ?? {}
  const sf = pace.shots_for_per_game
  const sa = oppPace.shots_against_per_game
  if (sf == null || sa == null) {
    return [5, 'No shot quality data']
  }
  const diff = sf - sa
  let score: number
  if (diff >= 5) score = 8.5
  else if (diff >= 3) score = 7.0
  else if (diff >= 1) score = 6.0
  else if (diff >= -1) score = 5.0
  else if (diff >= -3) score = 4.0
  else score = 2.5
  return [
    clamp(score),
    `SF/g ${sf.toFixed(1)} vs OPP SA/g ${sa.toFixed(1)} (Δ${diff >= 0 ? '+' : ''}${diff.toFixed(1)})`,
  ]
}

export function scoreTravelFatigue(
  profile: TeamProfile,
  _game: EnrichedGame,
  side: Side,
): [number, string] {
  const road = profile.road_trip_len ?? 0
  let rest = profile.rest_days
  const isHome = side === 'home'
  if (rest == null) rest = 3
  if (isHome && rest >= 2) return [clamp(2), `Home + ${rest}d rest — fresh`]
  if (isHome) return [clamp(4), `Home + ${rest}d rest`]
  if (road >= 5 && rest <= 1) return [clamp(8), `Road trip ${road}g + ${rest}d rest — heavy fatigue`]
  if (road >= 3 && rest <= 1) return [clamp(7), `Road trip ${road}g + ${rest}d rest — fatigued`]
  if (road >= 3) return [clamp(5), `Road trip ${road}g + ${rest}d rest`]
  return [clamp(4), `Road ${road}g + ${rest}d rest — manageable`]
}

export function scoreStartingGoalie(game: EnrichedGame, side: Side): [number, string] {
  const profile = game[`${side}_profile`] ?? {}
  const oppSide: Side = side === 'home' ? 'away' : 'home'
  const oppProfile = game[`${oppSide}_profile`] ?? {}
  const g = (profile.starting_goalie as Record<string, unknown> | undefined) || {}
  const oppG = (oppProfile.starting_goalie as Record<string, unknown> | undefined) || {}

  const ourName = (g.name as string | undefined) || profile.recent_starter || goalieName(profile.goalie)
  const oppName = (oppG.name as string | undefined) || oppProfile.recent_starter || goalieName(oppProfile.goalie)

  if (!ourName && !oppName) {
    return [5, 'No goalie data']
  }

  const tierBase: Record<string, number> = { ELITE: 8.5, GOOD: 7.0, UNKNOWN: 5.0 }
  const ourTier = ourName ? goalieTier(ourName) : null
  const oppTier = oppName ? goalieTier(oppName) : null

  let score = tierBase[ourTier ?? 'UNKNOWN']

  const ourSv = normalizeSvPct(g.sv_pct ?? g['SV%'] ?? g.svp)
  const oppSv = normalizeSvPct(oppG.sv_pct ?? oppG['SV%'] ?? oppG.svp)
  if (ourSv != null) {
    if (ourSv > 0.92) {
      score += 0.5
    } else if (ourSv > 0.91) {
      score += 0.25
    } else if (ourSv < 0.89) {
      score -= 0.5
    }
  }

  score += (tierBase[ourTier ?? 'UNKNOWN'] - tierBase[oppTier ?? 'UNKNOWN']) * 0.3

  const ourLabel = ourTier ?? 'UNKNOWN'
  const oppLabel = oppTier ?? 'UNKNOWN'
  const ourSvTxt = ourSv != null ? ` ${ourSv.toFixed(3)}` : ''
  const oppSvTxt = oppSv != null ? ` ${oppSv.toFixed(3)}` : ''
  const note = `Goalie: ${ourName ?? '?'} (${ourLabel}${ourSvTxt}) vs ${oppName ?? '?'} (${oppLabel}${oppSvTxt})`
  return [clamp(score), note]
}

export function scoreGoalieTierDelta(game: EnrichedGame, side: Side): [number, string] {
  const profile = game[`${side}_profile`] ?? {}
  const oppSide: Side = side === 'home' ? 'away' : 'home'
  const opp = game[`${oppSide}_profile`] ?? {}
  const g = (profile.starting_goalie as Record<string, unknown> | undefined) || {}
  const oppG = (opp.starting_goalie as Record<string, unknown> | undefined) || {}
  const ourName = (g.name as string | undefined) || 'TBD'
  const oppName = (oppG.name as string | undefined) || 'TBD'

  function tier(name: string): number {
    if (!name || name === 'TBD') return 0
    const last = name.trim().toLowerCase().split(/\s+/).pop()
    if (!last) return 0
    if (ELITE_NHL_GOALIES.has(last)) return 3
    if (GOOD_NHL_GOALIES.has(last)) return 2
    return 1
  }

  const ours = tier(ourName)
  const theirs = tier(oppName)
  const delta = ours - theirs
  if (delta >= 2) return [8.5, `ELITE vs AVG (${ourName} vs ${oppName})`]
  if (delta === 1) return [6.5, `tier edge (${ourName} vs ${oppName})`]
  if (delta === 0) return [5, `even (${ourName} vs ${oppName})`]
  if (delta === -1) return [3.5, `tier disadvantage (${ourName} vs ${oppName})`]
  return [2, `AVG vs ELITE (${ourName} vs ${oppName})`]
}

export function scoreSpecialTeamsCombined(game: EnrichedGame, side: Side): [number, string] {
  const profile = game[`${side}_profile`] ?? {}
  const p = profile as Record<string, unknown>
  const pp = p.pp_pct ?? p.powerplay_pct
  const pk = p.pk_pct ?? p.penalty_kill_pct
  if (pp == null && pk == null) {
    return [5, 'no special teams data']
  }
  let ppScore = 5.0
  let pkScore = 5.0
  if (pp != null) {
    const ppf = Number(pp)
    if (!Number.isNaN(ppf)) {
      ppScore = 5.0 + (ppf - 20.0) * 0.3
    }
  }
  if (pk != null) {
    const pkf = Number(pk)
    if (!Number.isNaN(pkf)) {
      pkScore = 5.0 + (pkf - 80.0) * 0.3
    }
  }
  const combined = (ppScore + pkScore) / 2
  return [clamp(combined), `PP+PK combined ${combined.toFixed(1)}`]
}

export function scoreScheduleDensity(game: EnrichedGame, side: Side): [number, string] {
  const profile = game[`${side}_profile`] ?? {}
  const oppSide: Side = side === 'home' ? 'away' : 'home'
  const opp = game[`${oppSide}_profile`] ?? {}
  const ourGames = profile.matches_in_10d ?? 0
  const theirGames = opp.matches_in_10d ?? 0
  if (!ourGames && !theirGames) {
    return [5, 'no schedule data']
  }
  const delta = theirGames - ourGames
  const score = 5.0 + delta * 0.8
  return [clamp(score), `schedule ${ourGames} vs ${theirGames} games in 10d`]
}

export function scorePaceMatchup(profile: TeamProfile, opponent: TeamProfile): [number, string] {
  const our = profile.pace_L5 ?? 0
  const their = opponent.pace_L5 ?? 0
  if (!our || !their) {
    return [5, 'No pace data']
  }
  const diff = Math.abs(our - their)
  const avg = (our + their) / 2
  if (avg >= 65) return [7.0, `FAST matchup (${avg.toFixed(1)} sh/g)`]
  if (avg <= 55) return [4.0, `Grind game (${avg.toFixed(1)} sh/g)`]
  if (diff >= 8) return [6.0, `Pace mismatch: ${diff.toFixed(1)} sh/g`]
  return [5.5, `Pace diff: ${diff.toFixed(1)} sh/g`]
}
