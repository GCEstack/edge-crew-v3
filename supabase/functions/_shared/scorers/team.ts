import type { EnrichedGame, Side, TeamProfile } from '../grade-types.ts'

// Local helper utilities (mirrors grade_engine.py helpers)
function clamp(val: number, lo = 1, hi = 10): number {
  return Math.max(lo, Math.min(hi, Math.round(val * 10) / 10))
}

function parseRecord(rec: string | null | undefined): [number, number] {
  if (!rec) return [0, 0]
  const parts = rec.split('-')
  if (parts.length < 2) return [0, 0]
  const w = parseInt(parts[0], 10)
  const l = parseInt(parts[1], 10)
  if (Number.isNaN(w) || Number.isNaN(l)) return [0, 0]
  return [w, l]
}

function winPct(rec: string | null | undefined): number {
  const [w, l] = parseRecord(rec)
  return w + l > 0 ? w / (w + l) : 0.5
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

// ─── Universal Team Scorers ───────────────────────────────────────────────────
// Each returns [score: 1-10, note: string]

export function scoreOffRanking(
  profile: TeamProfile,
  opponent: TeamProfile,
  sport: string,
): [number, string] {
  const ppg = profile.ppg_L5 ?? 0
  const oppDef = opponent.opp_ppg_L5 ?? 0
  if (!ppg) {
    return [5, 'No PPG data']
  }
  const breakpoints: Record<string, [number, number][]> = {
    NBA: [[122, 9], [118, 7.5], [114, 6], [110, 5], [105, 4], [0, 2.5]],
    NHL: [[4.0, 9], [3.5, 7], [3.0, 5], [2.5, 3.5], [0, 2]],
    MLB: [[6.0, 9], [5.5, 7.5], [5.0, 6], [4.5, 5], [4.0, 3.5], [0, 2]],
    NFL: [[27, 9], [24, 7.5], [21, 6], [18, 5], [15, 3.5], [0, 2]],
    SOCCER: [[2.5, 9], [2.0, 7.5], [1.5, 6], [1.2, 5], [0.8, 3.5], [0, 2]],
    NCAAB: [[82, 9], [78, 7.5], [74, 6], [70, 5], [65, 3.5], [0, 2]],
  }
  let base = 5
  for (const [threshold, val] of breakpoints[sport] ?? breakpoints['NBA']) {
    if (ppg >= threshold) {
      base = val
      break
    }
  }
  if (oppDef) {
    const avgMap: Record<string, [number, number]> = {
      NBA: [115, 100],
      NHL: [3.5, 2.5],
      MLB: [5.5, 3.5],
      NFL: [24, 17],
      SOCCER: [2.0, 1.0],
    }
    const [hi, lo] = avgMap[sport] ?? [115, 100]
    if (oppDef >= hi) {
      base += 0.5
    } else if (oppDef <= lo) {
      base -= 0.5
    }
  }
  return [clamp(base), `PPG L5: ${ppg} | OPP allows: ${oppDef}`]
}

export function scoreDefRanking(
  profile: TeamProfile,
  _opponent: TeamProfile,
  sport: string,
): [number, string] {
  const oppPpg = profile.opp_ppg_L5 ?? 0
  if (!oppPpg) {
    return [5, 'No OPP PPG data']
  }
  const breakpoints: Record<string, [number, number][]> = {
    NBA: [[100, 9], [105, 7.5], [110, 6], [114, 5], [118, 3.5], [999, 2]],
    NHL: [[2.0, 9], [2.5, 7], [3.0, 5], [3.5, 3.5], [999, 2]],
    MLB: [[3.0, 9], [3.5, 7.5], [4.0, 6], [4.5, 5], [5.5, 3.5], [999, 2]],
    NFL: [[15, 9], [18, 7.5], [21, 6], [24, 5], [27, 3.5], [999, 2]],
    SOCCER: [[0.5, 9], [0.8, 7.5], [1.0, 6], [1.3, 5], [1.8, 3.5], [999, 2]],
    NCAAB: [[62, 9], [66, 7.5], [70, 5], [75, 3.5], [999, 2]],
  }
  let base = 5
  for (const [threshold, val] of breakpoints[sport] ?? breakpoints['NBA']) {
    if (oppPpg <= threshold) {
      base = val
      break
    }
  }
  return [clamp(base), `Allow L5: ${oppPpg}`]
}

export function scoreRecentForm(
  profile: TeamProfile,
  opponent: TeamProfile,
): [number, string] {
  const [w, l] = parseRecord(profile.L5)
  const [ow] = parseRecord(opponent.L5)
  const streak = profile.streak ?? ''
  const margin = profile.L5_margin ?? profile.margin_L5 ?? 0
  if (w + l === 0) {
    return [5, 'No L5 data']
  }
  const baseMap: Record<number, number> = { 5: 9, 4: 7, 3: 5, 2: 3.5, 1: 2, 0: 1 }
  let base = baseMap[w] ?? 5
  if (streak.startsWith('W')) {
    const tail = streak.slice(1)
    const n = /^\d+$/.test(tail) ? parseInt(tail, 10) : 0
    base += n >= 6 ? 1.5 : n >= 3 ? 0.5 : 0
  } else if (streak.startsWith('L')) {
    const tail = streak.slice(1)
    const n = /^\d+$/.test(tail) ? parseInt(tail, 10) : 0
    base -= n >= 6 ? 1.5 : n >= 3 ? 0.5 : 0
  }
  const formEdge = w - ow
  if (formEdge >= 3) base += 1
  else if (formEdge <= -3) base -= 1
  if (margin > 10) base += 0.5
  else if (margin < -10) base -= 0.5
  return [clamp(base), `L5: ${profile.L5 ?? '?'} streak:${streak} margin:${margin >= 0 ? '+' : ''}${margin.toFixed(1)}`]
}

export function scoreHomeAway(game: EnrichedGame, side: Side): [number, string] {
  const profile = game[`${side}_profile`]
  const isHome = side === 'home'
  let base = isHome ? 5.5 : 4.5
  const recKey = isHome ? 'home_record' : 'away_record'
  const [w, l] = parseRecord(profile[recKey])
  if (w + l > 0) {
    const pct = w / (w + l)
    if (pct >= 0.7) base += 2
    else if (pct >= 0.55) base += 1
    else if (pct <= 0.3) base -= 2
    else if (pct <= 0.4) base -= 1
  }
  return [clamp(base), `${isHome ? 'Home' : 'Away'}: ${profile[recKey] ?? '?'}`]
}

export function scoreRestAdvantage(
  profile: TeamProfile,
  opponent: TeamProfile,
): [number, string] {
  const ourRest = profile.rest_days
  const oppRest = opponent.rest_days
  const ourB2b = profile.is_b2b ?? false
  const oppB2b = opponent.is_b2b ?? false
  if (ourRest == null || oppRest == null) {
    return [5, 'Rest data unavailable']
  }
  let score = 5
  const parts: string[] = []
  if (oppB2b && !ourB2b) {
    score += 3
    parts.push('OPP on B2B')
  } else if (ourB2b && !oppB2b) {
    score -= 3
    parts.push('WE on B2B')
  }
  const restDiff = (ourRest ?? 0) - (oppRest ?? 0)
  if (restDiff >= 3) score += 2
  else if (restDiff >= 1) score += 1
  else if (restDiff <= -3) score -= 2
  else if (restDiff <= -1) score -= 1
  return [clamp(score), `Us:${ourRest}d Them:${oppRest}d ${parts.join('; ')}`]
}

export function scoreH2h(profile: TeamProfile): [number, string] {
  const h2h = profile.h2h_season ?? '0-0'
  const [w, l] = parseRecord(h2h)
  if (w + l === 0) {
    return [5, 'No H2H']
  }
  const pct = w / (w + l)
  let score: number
  if (pct >= 0.75 && w + l >= 2) score = 9
  else if (pct >= 0.6) score = 7
  else if (pct === 0.5) score = 5
  else if (pct <= 0.25 && w + l >= 2) score = 2
  else if (pct <= 0.4) score = 3
  else score = 5
  return [clamp(score), `H2H: ${h2h}`]
}

export function scoreStarPlayer(game: EnrichedGame, side: Side): [number, string] {
  const oppSide: Side = side === 'home' ? 'away' : 'home'
  const oppInj = game.injuries?.[oppSide] ?? []
  const ourInj = game.injuries?.[side] ?? []
  let oppImpact = 0
  let ourImpact = 0
  for (const inj of oppInj) {
    if (inj.status === 'OUT' || inj.status === 'DOUBTFUL') {
      const ppg = inj.ppg ?? 0
      const disc = inj.freshness === 'ESTABLISHED' || inj.freshness === 'SEASON' ? 0.5 : 1.0
      oppImpact += (ppg >= 20 ? 3 : ppg >= 12 ? 2 : 0.5) * disc
    }
  }
  for (const inj of ourInj) {
    if (inj.status === 'OUT' || inj.status === 'DOUBTFUL') {
      const ppg = inj.ppg ?? 0
      const disc = inj.freshness === 'ESTABLISHED' || inj.freshness === 'SEASON' ? 0.5 : 1.0
      ourImpact += (ppg >= 20 ? 3 : ppg >= 12 ? 2 : 0.5) * disc
    }
  }

  const oppOutCount = oppInj.filter(
    (inj) => inj.status === 'OUT' || inj.status === 'DOUBTFUL',
  ).length
  if (oppOutCount >= 5) oppImpact = Math.max(oppImpact, 8.0)
  else if (oppOutCount >= 4) oppImpact = Math.max(oppImpact, 6.0)
  else if (oppOutCount >= 3) oppImpact = Math.max(oppImpact, 4.0)

  const ownOutCount = ourInj.filter(
    (inj) => inj.status === 'OUT' || inj.status === 'DOUBTFUL',
  ).length
  let ownPenalty = 0
  if (ownOutCount >= 5) ownPenalty = -4.0
  else if (ownOutCount >= 4) ownPenalty = -3.0
  else if (ownOutCount >= 3) ownPenalty = -2.0

  let note = `Injury diff: +${oppImpact.toFixed(1)} -${ourImpact.toFixed(1)}`
  if (oppOutCount >= 3) note += ` | OPP rest(${oppOutCount} out)`
  if (ownOutCount >= 3) note += ` | OWN rest(${ownOutCount} out)`
  return [clamp(5 + oppImpact - ourImpact + ownPenalty), note]
}

export function scoreDepthInjuries(game: EnrichedGame, side: Side): [number, string] {
  const oppSide: Side = side === 'home' ? 'away' : 'home'
  const oppOut = (game.injuries?.[oppSide] ?? []).filter(
    (i) => i.status === 'OUT' || i.status === 'DOUBTFUL',
  ).length
  const ourOut = (game.injuries?.[side] ?? []).filter(
    (i) => i.status === 'OUT' || i.status === 'DOUBTFUL',
  ).length
  const diff = oppOut - ourOut
  let score: number
  if (diff >= 4) score = 9
  else if (diff >= 2) score = 7
  else if (diff >= 0) score = 5
  else if (diff >= -2) score = 4
  else score = 2
  return [clamp(score), `Them:${oppOut} out Us:${ourOut} out`]
}

export function scoreLineMovement(game: EnrichedGame): [number, string] {
  const shifts = game.shifts ?? {}
  const delta = Math.abs(shifts.spread_delta ?? 0)
  if (delta >= 3) return [9, `BIG MOVE: ${delta.toFixed(1)} pts`]
  if (delta >= 1.5) return [7, `Sig move: ${delta.toFixed(1)} pts`]
  if (delta >= 0.5) return [5, `Moved ${delta.toFixed(1)} pts`]
  return [5, 'Line flat']
}

export function scoreAtsTrend(profile: TeamProfile): [number, string] {
  const margin = profile.avg_margin_L10 ?? 0
  if (margin >= 10) return [9, `Margin L10: ${margin >= 0 ? '+' : ''}${margin.toFixed(1)}`]
  if (margin >= 5) return [7, `Margin L10: ${margin >= 0 ? '+' : ''}${margin.toFixed(1)}`]
  if (margin >= 0) return [5, `Margin L10: ${margin >= 0 ? '+' : ''}${margin.toFixed(1)}`]
  if (margin >= -5) return [4, `Margin L10: ${margin >= 0 ? '+' : ''}${margin.toFixed(1)}`]
  return [2, `Margin L10: ${margin >= 0 ? '+' : ''}${margin.toFixed(1)}`]
}

export function scoreRoadTrip(profile: TeamProfile): [number, string] {
  const road = profile.road_trip_len ?? 0
  const home = profile.home_stand_len ?? 0
  if (home >= 4) return [6, `Home stand: ${home}`]
  if (home >= 2) return [5.5, `Home stand: ${home}`]
  if (road >= 5) return [2, `Road trip: ${road}`]
  if (road >= 3) return [4, `Road trip: ${road}`]
  return [5, 'Neutral']
}

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
  return [clamp(score), `SF/g ${sf.toFixed(1)} vs OPP SA/g ${sa.toFixed(1)} (Δ${diff >= 0 ? '+' : ''}${diff.toFixed(1)})`]
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

export function scorePaceMatchup(
  profile: TeamProfile,
  opponent: TeamProfile,
  sport: string,
): [number, string] {
  const our = profile.pace_L5 ?? 0
  const their = opponent.pace_L5 ?? 0
  if (!our || !their) {
    return [5, 'No pace data']
  }
  const diff = Math.abs(our - their)
  if (sport === 'NBA') {
    if (our >= 235 && their >= 235) return [5.5, 'FAST matchup']
    if (our <= 210 && their <= 210) return [5, 'Grind game']
    if (diff >= 20) return [3.5, `PACE MISMATCH: ${diff.toFixed(0)}`]
  }
  if (sport === 'NHL') {
    const avg = (our + their) / 2
    if (avg >= 65) return [7.0, `FAST matchup (${avg.toFixed(1)} sh/g)`]
    if (avg <= 55) return [4.0, `Grind game (${avg.toFixed(1)} sh/g)`]
    if (diff >= 8) return [6.0, `Pace mismatch: ${diff.toFixed(1)} sh/g`]
    return [5.5, `Pace diff: ${diff.toFixed(1)} sh/g`]
  }
  if (sport === 'NFL' || sport === 'NCAAF') {
    const avg = (our + their) / 2
    if (avg >= 68) return [7.0, `HIGH-TEMPO (${avg.toFixed(1)} plays/g)`]
    if (avg <= 58) return [4.0, `Slow grind (${avg.toFixed(1)} plays/g)`]
    if (diff >= 5) return [6.0, `Pace mismatch: ${diff.toFixed(1)} plays/g`]
    return [5.5, `Pace diff: ${diff.toFixed(1)} plays/g`]
  }
  if (sport === 'NCAAB') {
    const avg = (our + their) / 2
    if (avg >= 75) return [7.0, `FAST matchup (${avg.toFixed(1)} pos/g)`]
    if (avg <= 65) return [4.0, `Grind game (${avg.toFixed(1)} pos/g)`]
    if (diff >= 7) return [6.0, `Pace mismatch: ${diff.toFixed(1)} pos/g`]
    return [5.5, `Pace diff: ${diff.toFixed(1)} pos/g`]
  }
  return [5, `Pace diff: ${diff.toFixed(0)}`]
}

export function scoreFixtureCongestion(game: EnrichedGame, side: Side): [number, string] {
  const p = game[`${side}_profile`] ?? {}
  const oppSide: Side = side === 'home' ? 'away' : 'home'
  const opp = game[`${oppSide}_profile`] ?? {}
  let our: number | undefined | null = p.matches_in_10d
  if (our == null) our = p.congestion_10d
  let their: number | undefined | null = opp.matches_in_10d
  if (their == null) their = opp.congestion_10d
  if (our == null && their == null) {
    return [5, 'No congestion data']
  }
  const ourI = parseInt(String(our ?? 0), 10)
  const theirI = parseInt(String(their ?? 0), 10)
  if (Number.isNaN(ourI) || Number.isNaN(theirI)) {
    return [5, 'No congestion data']
  }
  const diff = theirI - ourI
  if (diff >= 3) return [9, `Them:${theirI} vs Us:${ourI} in 10d (heavy legs opp)`]
  if (diff === 2) return [8, `Them:${theirI} vs Us:${ourI} in 10d`]
  if (diff === 1) return [6.5, `Them:${theirI} vs Us:${ourI} in 10d`]
  if (diff === 0) return [5, `Even:${ourI} matches in 10d`]
  if (diff === -1) return [3.5, `Them:${theirI} vs Us:${ourI} in 10d`]
  if (diff === -2) return [2, `Them:${theirI} vs Us:${ourI} in 10d (heavy legs us)`]
  return [1.5, `Them:${theirI} vs Us:${ourI} in 10d (very heavy legs us)`]
}

export function scoreMotivation(game: EnrichedGame, side: Side): [number, string] {
  const p = game[`${side}_profile`] ?? {}
  const oppSide: Side = side === 'home' ? 'away' : 'home'
  const opp = game[`${oppSide}_profile`] ?? {}
  const ourPct = winPct(p.record)
  const oppPct = winPct(opp.record)
  if (oppPct < 0.35 && ourPct > 0.55) {
    return [8, `Motivation: us ${(ourPct * 100).toFixed(0)}% vs them ${(oppPct * 100).toFixed(0)}%`]
  }
  if (ourPct < 0.35 && oppPct > 0.55) {
    return [2, `They're motivated: ${(oppPct * 100).toFixed(0)}% vs us ${(ourPct * 100).toFixed(0)}%`]
  }
  return [clamp(5 + (ourPct - oppPct) * 6), `Records: ${(ourPct * 100).toFixed(0)}% vs ${(oppPct * 100).toFixed(0)}%`]
}
