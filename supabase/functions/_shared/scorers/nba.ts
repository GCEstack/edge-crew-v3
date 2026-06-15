import type { EnrichedGame, Side, TeamProfile } from '../grade-types.ts'

// Local helper utilities (mirrors grade_engine.py helpers)
function clamp(val: number, lo = 1, hi = 10): number {
  return Math.max(lo, Math.min(hi, Math.round(val * 10) / 10))
}

interface NbaQuarters {
  leads_blown_l10?: number
  comebacks_l10?: number
  label?: string
  q1_avg_for?: number
  q1_avg_against?: number
  q4_avg_for?: number
  q4_avg_against?: number
}

function getNbaQuarters(game: EnrichedGame, side: Side): NbaQuarters | undefined {
  const profile = game[`${side}_profile`] ?? {}
  const q = profile.nba_quarters
  if (!q) return undefined
  return q as NbaQuarters
}

// ─── NBA-Specific Scorers (quarter splits, late-game closing, bench) ──────────
// Each returns [score: 1-10, note: string]

export function scoreLateGameStrength(game: EnrichedGame, side: Side): [number, string] {
  const q = getNbaQuarters(game, side)
  if (!q) {
    return [5.0, 'no quarter data']
  }
  const blown = q.leads_blown_l10 ?? 0
  const comebacks = q.comebacks_l10 ?? 0
  const label = q.label ?? 'L10'
  let score = 5.0 + (comebacks - blown) * 1.25
  if (blown >= 3 && comebacks === 0) {
    score = Math.min(score, 2.5)
  }
  if (blown === 0 && comebacks >= 2) {
    score = Math.max(score, 7.5)
  }
  let note = `closing ${label}: blown ${blown} / comebacks ${comebacks}`
  if (score >= 7.5) {
    note += ' (strong closer)'
  } else if (score <= 2.5) {
    note += ' (collapse-prone)'
  }
  return [clamp(score), note]
}

export function scoreQuarterPace(game: EnrichedGame, side: Side): [number, string] {
  const oppSide: Side = side === 'home' ? 'away' : 'home'
  const us = getNbaQuarters(game, side)
  const them = getNbaQuarters(game, oppSide)
  if (!us || !them) {
    return [5.0, 'no quarter data']
  }

  let base = 5.0
  const parts: string[] = []

  const ourQ1For = us.q1_avg_for ?? 0
  const oppQ1Def = them.q1_avg_against ?? 0
  if (ourQ1For >= 28 && oppQ1Def >= 28) {
    base += 1
    parts.push('Q1 attack vs weak Q1 D')
  } else if (ourQ1For <= 24 && oppQ1Def <= 24) {
    base -= 0.5
    parts.push('Q1 mismatch against us')
  }

  const ourQ4For = us.q4_avg_for ?? 0
  const oppQ4Def = them.q4_avg_against ?? 0
  if (ourQ4For >= 27 && oppQ4Def >= 27) {
    base += 1
    parts.push('Q4 closing edge')
  } else if (ourQ4For <= 22 && oppQ4Def <= 22) {
    base -= 0.5
    parts.push('Q4 stalls')
  }

  const note = parts.length > 0 ? parts.join(', ') : 'neutral quarter rhythm'
  return [clamp(base), note]
}

export function scoreBenchDiff(game: EnrichedGame, side: Side): [number, string] {
  const oppSide: Side = side === 'home' ? 'away' : 'home'
  const us = game[`${side}_profile`] ?? {}
  const them = game[`${oppSide}_profile`] ?? {}
  const ourBench = us.bench_ppg_l5
  const oppBench = them.bench_ppg_l5
  if (ourBench == null || oppBench == null) {
    return [5.0, 'no bench data']
  }
  const diff = ourBench - oppBench
  const score = 5.0 + diff / 5.0
  return [
    clamp(score),
    `bench L5: us ${ourBench} / them ${oppBench} (${diff >= 0 ? '+' : ''}${diff.toFixed(1)})`,
  ]
}

// ─── NBA Extended Variables ──────────────────────────────────────────────────

export function scoreThreePtRate(profile: TeamProfile, opponent: TeamProfile): [number, string] {
  const ppg = profile.ppg_L5 ?? 0
  const pace = profile.pace_L5 ?? 0
  if (!ppg) {
    return [5, 'no PPG data']
  }
  let score: number
  if (ppg >= 120 && pace) {
    score = 9
  } else if (ppg >= 115 && pace) {
    score = 8
  } else if (ppg >= 115) {
    score = 7.5
  } else if (ppg >= 110) {
    score = 6.5
  } else if (ppg >= 105) {
    score = 5.5
  } else {
    score = 4
  }
  const oppDef = opponent.opp_ppg_L5 ?? 0
  if (oppDef && oppDef >= 115) {
    score += 0.5
  } else if (oppDef && oppDef <= 105) {
    score -= 0.5
  }
  return [clamp(score), `PPG proxy: ${ppg} | pace: ${pace}`]
}

export function scoreB2bFatigue(profile: TeamProfile, opponent: TeamProfile): [number, string] {
  const rest = profile.rest_days
  if (rest == null) {
    return [5, 'no rest data']
  }
  let score: number
  let label: string
  if (rest <= 0) {
    score = 9
    label = 'B2B zero rest'
  } else if (rest === 1) {
    score = 8
    label = 'B2B 1-day rest'
  } else if (rest === 2) {
    score = 5
    label = '2 days rest'
  } else {
    score = 2
    label = `${rest}+ days rest`
  }
  const oppRest = opponent.rest_days
  if (oppRest != null && oppRest >= 3 && rest <= 1) {
    score += 0.5
    label += ' vs rested opp'
  }
  return [clamp(score), label]
}

export function scoreTravelDistance(
  profile: TeamProfile,
  _game: EnrichedGame,
  pickSide: Side,
): [number, string] {
  if (pickSide === 'home') {
    return [clamp(1), 'Home game']
  }
  const roadLen = profile.road_trip_len ?? 0
  let score: number
  if (roadLen >= 5) {
    score = 9
  } else if (roadLen >= 4) {
    score = 8
  } else if (roadLen >= 3) {
    score = 6.5
  } else if (roadLen >= 2) {
    score = 5
  } else {
    score = 3
  }
  return [clamp(score), `Road trip game ${roadLen}`]
}

export function scoreAltitude(game: EnrichedGame, pickSide: Side): [number, string] {
  let homeName = (game.home_team || game.homeTeam || game.home || '').toLowerCase()
  const homeProfile = (game.home_profile ?? {}) as Record<string, unknown>
  const homeNameAlt = homeProfile.team as string | undefined
  if (homeNameAlt) {
    homeName = `${homeName} ${homeNameAlt}`.toLowerCase()
  }
  const isDenver =
    homeName.includes('nuggets') || homeName.includes('denver') || homeName.includes('avalanche')
  if (!isDenver) {
    return [clamp(5), 'No altitude factor']
  }
  if (pickSide === 'home') {
    return [clamp(2), 'Home altitude advantage (Denver)']
  }
  return [clamp(8), 'Visiting Denver altitude penalty']
}

export function scoreRefereePace(_game: EnrichedGame): [number, string] {
  return [5, 'no referee data']
}

export function scoreTurnoverRate(profile: TeamProfile, opponent: TeamProfile): [number, string] {
  const oppPpgAllowed = opponent.opp_ppg_L5 ?? 0
  const ourDef = profile.opp_ppg_L5 ?? 0
  if (!oppPpgAllowed && !ourDef) {
    return [5, 'no defensive data']
  }
  const target = oppPpgAllowed || ourDef
  let score: number
  if (target <= 100) {
    score = 9
  } else if (target <= 105) {
    score = 8
  } else if (target <= 108) {
    score = 7
  } else if (target <= 112) {
    score = 5.5
  } else if (target <= 115) {
    score = 4
  } else {
    score = 3
  }
  return [clamp(score), `OPP allows L5: ${oppPpgAllowed} | our def: ${ourDef}`]
}

export function scorePaceMatchup(profile: TeamProfile, opponent: TeamProfile): [number, string] {
  const our = profile.pace_L5 ?? 0
  const their = opponent.pace_L5 ?? 0
  if (!our || !their) {
    return [5, 'No pace data']
  }
  const diff = Math.abs(our - their)
  if (our >= 235 && their >= 235) {
    return [5.5, 'FAST matchup']
  }
  if (our <= 210 && their <= 210) {
    return [5, 'Grind game']
  }
  if (diff >= 20) {
    return [3.5, `PACE MISMATCH: ${diff.toFixed(0)}`]
  }
  return [5, `Pace diff: ${diff.toFixed(0)}`]
}
