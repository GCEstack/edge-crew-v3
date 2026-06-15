// MMA / Boxing grading ported from grade_engine.py.
// Combat sports don't have team profiles, rest days, bullpens, etc. — they have
// fighter records, reach/stance/style, and a moneyline. This scorer mirrors the
// Python return shape so downstream /api/analyze and the frontend can use the
// same unpacking path for every sport.

import type { EnrichedGame, Fighter, GradeLetter, Side } from '../grade-types.ts'
import { score_to_grade, score_to_sizing } from '../utils.ts'

// ─── Type helpers ─────────────────────────────────────────────────────────────

interface CombatFighter extends Fighter {
  wins?: number
  losses?: number
}

export interface CombatVariable {
  score: number
  weight: number
  weighted: number
  note: string
  available: boolean
}

export interface GradeMMASideResult {
  grade: GradeLetter
  score: number
  composite: number
  chain_bonus: number
  chains_fired: string[]
  sizing: string
  confidence: number
  variables: Record<string, CombatVariable>
  pick_side: Side
}

export interface MMAProfileResult {
  grade: GradeLetter
  final: number
  composite: number
  sizing: string
  chains_fired: string[]
  pick_side: Side
  picks: Side
  margin: number
}

export interface MMAProfilesOutput {
  [name: string]: MMAProfileResult | undefined
  crew?: MMAProfileResult & { blend: Record<string, number> }
}

export interface GradeMMAFightResult {
  home: GradeMMASideResult
  away: GradeMMASideResult
  best: GradeMMASideResult & { pick_team: string }
  profiles: MMAProfilesOutput
}

function toInt(value: unknown): number {
  if (value == null) return 0
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : 0
}

function getFighter(game: EnrichedGame, side: Side): CombatFighter {
  const fighter = side === 'home' ? game.home_fighter : game.away_fighter
  return (fighter as CombatFighter) ?? {}
}

// ─── Individual sub-scorers ───────────────────────────────────────────────────

function _mma_record_score(fighter: CombatFighter | null | undefined): [number, string] {
  if (!fighter || fighter.wins == null) {
    return [5.0, 'no record data']
  }
  const wins = toInt(fighter.wins)
  const losses = toInt(fighter.losses)
  const total = wins + losses
  if (total < 3) {
    return [5.0, `${wins}-${losses} (rookie, insufficient sample)`]
  }
  const win_pct = wins / total
  // Shape: 50% = 5.0, 70% = 7.0, 85%+ = 8.5+, 100% = 9.5
  let score = 2.0 + win_pct * 7.5
  // Volume bonus — veterans with 15+ fights edge up
  if (total >= 20) {
    score += 0.5
  } else if (total >= 15) {
    score += 0.3
  }
  score = Math.max(3.0, Math.min(9.5, score))
  return [Math.round(score * 10) / 10, `${wins}-${losses} (${(win_pct * 100).toFixed(0)}%)`]
}

function _mma_moneyline_score(ml_home: number, ml_away: number): [number, string, number] {
  if (!ml_home || !ml_away) {
    return [5.0, 'no ML data', 0]
  }
  const gap = Math.abs(ml_home - ml_away)
  if (gap < 80) {
    return [8.0, `coin-flip (gap ${gap})`, gap]
  }
  if (gap < 150) {
    return [7.3, `competitive (gap ${gap})`, gap]
  }
  if (gap < 250) {
    return [6.5, `clear favorite (gap ${gap})`, gap]
  }
  if (gap < 400) {
    return [5.5, `one-sided (gap ${gap})`, gap]
  }
  return [4.5, `mismatch (gap ${gap})`, gap]
}

function _mma_line_value_score(ml_home: number, ml_away: number, side: Side): [number, string] {
  if (!ml_home || !ml_away) {
    return [5.0, 'no ML']
  }
  const side_ml = side === 'home' ? ml_home : ml_away
  if (side_ml > 200) {
    return [7.5, `plus-money dog (${side_ml >= 0 ? '+' : ''}${side_ml}, upside)`]
  }
  if (side_ml > 100) {
    return [6.8, `live dog (${side_ml >= 0 ? '+' : ''}${side_ml})`]
  }
  if (side_ml > -150) {
    return [6.2, `near pick'em (${side_ml >= 0 ? '+' : ''}${side_ml})`]
  }
  if (side_ml > -250) {
    return [5.5, `moderate chalk (${side_ml >= 0 ? '+' : ''}${side_ml})`]
  }
  return [4.5, `heavy chalk (${side_ml >= 0 ? '+' : ''}${side_ml})`]
}

function _mma_style_score(
  fighter: CombatFighter | null | undefined,
  opp: CombatFighter | null | undefined,
): [number, string] {
  if (!fighter) {
    return [5.0, 'no style data']
  }
  const stance = (fighter.stance ?? '').toLowerCase()
  const opp_stance = (opp?.stance ?? '').toLowerCase()
  if (!stance) {
    return [5.0, 'no stance data']
  }
  // Southpaw vs orthodox is a known real edge for the southpaw in MMA.
  if (stance === 'southpaw' && opp_stance === 'orthodox') {
    return [6.3, 'southpaw vs orthodox (slight edge)']
  }
  if (stance === 'orthodox' && opp_stance === 'southpaw') {
    return [4.7, 'orthodox vs southpaw (slight disadvantage)']
  }
  return [5.5, `stance: ${stance}`]
}

// ─── Side grader ──────────────────────────────────────────────────────────────

export function _grade_mma_side(game: EnrichedGame, side: Side): GradeMMASideResult {
  const odds = game.odds ?? {}
  const ml_home = toInt(odds.mlHome)
  const ml_away = toInt(odds.mlAway)

  const home_f = getFighter(game, 'home')
  const away_f = getFighter(game, 'away')
  const fighter = side === 'home' ? home_f : away_f
  const opp = side === 'home' ? away_f : home_f

  const [record_s, record_n] = _mma_record_score(fighter)
  const [opp_record_s] = _mma_record_score(opp)
  const [ml_s, ml_n, ml_gap] = _mma_moneyline_score(ml_home, ml_away)
  const [line_s, line_n] = _mma_line_value_score(ml_home, ml_away, side)
  const [style_s, style_n] = _mma_style_score(fighter, opp)

  // Favorite bonus: if this side IS the ML favorite, their "form" variable
  // gets a nudge because the market is usually right on UFC ML.
  const side_ml = side === 'home' ? ml_home : ml_away
  const other_ml = side === 'home' ? ml_away : ml_home
  const is_fav = Boolean(side_ml && other_ml && side_ml < other_ml)
  const form_s = record_s
    ? Math.round(Math.min(9.5, record_s + (is_fav ? 0.5 : -0.3)) * 10) / 10
    : 5.0
  const form_n = `${record_n}${is_fav ? ' (favorite)' : ''}`

  // Record vs opponent — delta in win %
  let matchup_s = 5.0
  let matchup_n = 'insufficient data'
  if (record_s > 5.0 && opp_record_s > 5.0) {
    const delta = record_s - opp_record_s
    matchup_s = Math.round(Math.max(3.0, Math.min(9.0, 5.0 + delta * 0.8)) * 10) / 10
    matchup_n = `record delta ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`
  }

  // Variables table matches the team-sport shape so downstream code reading
  // game["ourGrade"]["variables"] doesn't blow up.
  const variables: Record<string, CombatVariable> = {
    form: {
      score: form_s,
      weight: 9,
      weighted: Math.round(form_s * 9 * 10) / 10,
      note: form_n,
      available: record_s !== 5.0,
    },
    off_ranking: {
      score: matchup_s,
      weight: 8,
      weighted: Math.round(matchup_s * 8 * 10) / 10,
      note: matchup_n,
      available: matchup_s !== 5.0,
    },
    def_ranking: {
      score: matchup_s,
      weight: 8,
      weighted: Math.round(matchup_s * 8 * 10) / 10,
      note: matchup_n,
      available: matchup_s !== 5.0,
    },
    moneyline_gap: {
      score: ml_s,
      weight: 7,
      weighted: Math.round(ml_s * 7 * 10) / 10,
      note: ml_n,
      available: ml_gap !== 0,
    },
    line_value: {
      score: line_s,
      weight: 7,
      weighted: Math.round(line_s * 7 * 10) / 10,
      note: line_n,
      available: Boolean(side_ml),
    },
    style: {
      score: style_s,
      weight: 5,
      weighted: Math.round(style_s * 5 * 10) / 10,
      note: style_n,
      available: style_s !== 5.0,
    },
  }

  const active = Object.fromEntries(
    Object.entries(variables).filter(([, v]) => v.available),
  )
  const total_weighted = Object.values(active).reduce((sum, v) => sum + v.weighted, 0)
  const max_possible = Object.values(active).reduce((sum, v) => sum + v.weight * 10, 0)
  const composite = max_possible > 0
    ? Math.round((total_weighted / max_possible) * 10 * 100) / 100
    : 5.0

  // Small chain: favorite with strong record + competitive line = high conviction
  let chain_bonus = 0.0
  const chains_fired: string[] = []
  if (is_fav && record_s >= 7.0 && ml_gap && ml_gap < 250) {
    chain_bonus += 0.4
    chains_fired.push('favorite_sharp_record')
  }
  if (line_s >= 7.0 && record_s >= 6.5) {
    chain_bonus += 0.3
    chains_fired.push('live_dog_with_record')
  }
  chain_bonus = Math.max(-1.0, Math.min(1.0, chain_bonus))

  // DISABLED: chains zeroed until system is dialed in
  const final = Math.round(Math.max(1.0, Math.min(10.0, composite + 0.0)) * 100) / 100
  const grade = score_to_grade(final)

  return {
    grade,
    score: final,
    composite,
    chain_bonus,
    chains_fired,
    sizing: score_to_sizing(final),
    confidence: Math.min(95, Math.max(40, Math.floor(55 + (final - 5) * 8))),
    variables,
    pick_side: side,
  }
}

// Three MMA grader profiles — each re-weights the same variables differently.
// Mirrors how PROFILE_WEIGHTS works for team sports.
export const MMA_PROFILE_WEIGHTS: Record<string, Record<string, number>> = {
  odds_sharp: {
    // Market-first. Trusts ML gap + line value over record.
    moneyline_gap: 1.5,
    line_value: 1.4,
    form: 0.9,
    off_ranking: 0.7,
    def_ranking: 0.7,
    style: 0.5,
  },
  form_scout: {
    // Record/form first. Downweights line value.
    form: 1.6,
    off_ranking: 1.2,
    def_ranking: 1.2,
    moneyline_gap: 0.8,
    line_value: 0.6,
    style: 0.7,
  },
  finisher: {
    // Style + stance matchup first. For coin-flip fights where market
    // pricing is weak.
    style: 1.5,
    form: 1.1,
    moneyline_gap: 1.0,
    off_ranking: 0.9,
    def_ranking: 0.9,
    line_value: 0.9,
  },
}

export function _mma_profiles(game: EnrichedGame, pick_side: Side): MMAProfilesOutput {
  const base = _grade_mma_side(game, pick_side)
  const base_vars = base.variables
  const other_side: Side = pick_side === 'home' ? 'away' : 'home'
  const other_base = _grade_mma_side(game, other_side)
  const other_vars = other_base.variables

  const profiles: MMAProfilesOutput = {}

  for (const [name, multipliers] of Object.entries(MMA_PROFILE_WEIGHTS)) {
    // Pick-side composite
    let tw = 0.0
    let ts = 0.0
    for (const [var_name, var_data] of Object.entries(base_vars)) {
      if (!var_data.available) {
        continue
      }
      const mult = multipliers[var_name] ?? 1.0
      const w = var_data.weight * mult
      tw += w * 10
      ts += var_data.score * w
    }
    const composite = tw > 0 ? Math.round((ts / tw) * 10 * 100) / 100 : 5.0
    // DISABLED: chains zeroed until system is dialed in
    const final = Math.round(Math.max(1.0, Math.min(10.0, composite + 0.0)) * 100) / 100

    // Other-side composite (so the profile can pick a side)
    let otw = 0.0
    let ots = 0.0
    for (const [var_name, var_data] of Object.entries(other_vars)) {
      if (!var_data.available) {
        continue
      }
      const mult = multipliers[var_name] ?? 1.0
      const w = var_data.weight * mult
      otw += w * 10
      ots += var_data.score * w
    }
    const other_composite = otw > 0 ? Math.round((ots / otw) * 10 * 100) / 100 : 5.0
    // DISABLED: chains zeroed until system is dialed in
    const other_final = Math.round(Math.max(1.0, Math.min(10.0, other_composite + 0.0)) * 100) / 100

    const picks: Side = final >= other_final ? pick_side : other_side
    profiles[name] = {
      grade: score_to_grade(final),
      final,
      composite,
      sizing: score_to_sizing(final),
      chains_fired: base.chains_fired,
      pick_side: pick_side,
      picks,
      margin: Math.round((final - other_final) * 100) / 100,
    }
  }

  // Crew blend — equal-weighted for MMA since we only have 3 profiles
  const profile_names = Object.keys(profiles)
  if (profile_names.length >= 3) {
    const blend_weights: Record<string, number> = {}
    for (const name of profile_names) {
      blend_weights[name] = 1.0 / profile_names.length
    }
    let crew_final = 0.0
    for (const name of profile_names) {
      crew_final += (profiles[name]?.final ?? 0) * blend_weights[name]
    }
    crew_final = Math.round(Math.max(1.0, Math.min(10.0, crew_final)) * 100) / 100

    const side_votes: Record<string, number> = {}
    for (const name of profile_names) {
      const s = profiles[name]?.picks ?? pick_side
      side_votes[s] = (side_votes[s] ?? 0) + 1
    }

    let crew_pick: Side = pick_side
    let best_votes = -1
    for (const [side, votes] of Object.entries(side_votes)) {
      if (votes > best_votes) {
        best_votes = votes
        crew_pick = side as Side
      }
    }

    profiles.crew = {
      grade: score_to_grade(crew_final),
      final: crew_final,
      composite: crew_final,
      sizing: score_to_sizing(crew_final),
      chains_fired: [],
      pick_side: pick_side,
      picks: crew_pick,
      margin: Math.round((crew_final - 5.0) * 100) / 100,
      blend: Object.fromEntries(
        Object.entries(blend_weights).map(([k, v]) => [k, Math.round(v * 100) / 100]),
      ),
    }
  }

  return profiles
}

// ─── Top-level fight grader ───────────────────────────────────────────────────

export function grade_mma_fight(game: EnrichedGame): GradeMMAFightResult {
  const home = _grade_mma_side(game, 'home')
  const away = _grade_mma_side(game, 'away')

  let best: GradeMMASideResult & { pick_team: string }
  let pick_side: Side

  if (home.score >= away.score) {
    best = {
      ...home,
      pick_team: game.homeTeam ?? game.home_team ?? 'Home Fighter',
    }
    pick_side = 'home'
  } else {
    best = {
      ...away,
      pick_team: game.awayTeam ?? game.away_team ?? 'Away Fighter',
    }
    pick_side = 'away'
  }

  const profiles = _mma_profiles(game, pick_side)

  return {
    home,
    away,
    best,
    profiles,
  }
}
