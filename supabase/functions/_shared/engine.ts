// Edge Crew v3 grade engine orchestration.
// TypeScript port of grade_engine.py lines 2785–3839 for Deno / Supabase Edge Functions.
// Keeps the math and flow identical to the Python source.

import type { EnrichedGame, GoalieProfile, GradeLetter, Side, Sport, TeamProfile } from './grade-types.ts'
import { CHAINS, CHAIN_CAP, SPORT_VARIABLES, ELITE_NHL_GOALIES, GOOD_NHL_GOALIES } from './constants.ts'
import type { ChainDef } from './constants.ts'
import {
  _apply_spread_amplifier,
  _clamp,
  _parse_record,
  score_to_grade,
  score_to_sizing,
} from './utils.ts'

import {
  scoreAtsTrend,
  scoreDefRanking,
  scoreDepthInjuries,
  scoreH2h,
  scoreHomeAway,
  scoreLineMovement,
  scoreMotivation,
  scoreOffRanking,
  scorePaceMatchup,
  scoreRecentForm,
  scoreRestAdvantage,
  scoreRoadTrip,
  scoreStarPlayer,
} from './scorers/team.ts'

import {
  scoreLateGameStrength,
  scoreQuarterPace,
  scoreBenchDiff,
  scoreThreePtRate,
  scoreB2bFatigue,
  scoreTravelDistance,
  scoreAltitude,
  scoreRefereePace,
  scoreTurnoverRate,
} from './scorers/nba.ts'

import {
  scorePpPct,
  scorePkPct,
  scoreGoalieWorkload,
  scoreB2bFlag,
  scoreShotQuality,
  scoreTravelFatigue,
  scoreStartingGoalie,
  scoreGoalieTierDelta,
  scoreSpecialTeamsCombined,
  scoreScheduleDensity,
} from './scorers/nhl.ts'

import {
  scoreSoccerKeyPlayer,
  scoreFixtureCongestion,
  scoreGoalkeeper,
  scoreXgDiff,
  scoreSquadRotation,
  scoreLeagueHomeBoost,
  scoreSetPiece,
} from './scorers/soccer.ts'

import {
  LEAGUE_AVG_K_PCT,
  PARK_FACTORS,
  SP_PROXY_NOTE_PREFIX,
  UMPIRE_TENDENCIES,
  pitcherTierFromStats,
  scoreBullpen,
  scoreBullpenFatigue,
  scoreGbFbRatio,
  scoreLineupDna,
  scoreLineupVsHand,
  scoreParkFactor,
  scorePitcherHitterArchetype,
  scorePitcherProfile,
  scorePlateDiscipline,
  scoreStarterDepth,
  scoreStartingPitcher,
  scoreUmpire,
  scoreWeatherFactor,
} from './scorers/mlb.ts'

import { grade_mma_fight } from './scorers/combat.ts'

// ─── Local types ──────────────────────────────────────────────────────────────

type ScoreNote = [number, string]

interface VariableEntry {
  score: number
  weight: number
  weighted: number
  note: string
  available: boolean
}

export interface GradeGameResult {
  grade: GradeLetter
  score: number
  composite: number
  chain_bonus: number
  chains_fired: string[]
  sizing: string
  confidence: number
  variables: Record<string, VariableEntry>
  pick_side: Side
  thesis: string
}

export interface TotalGradeResult {
  verdict: 'OVER' | 'UNDER' | 'SKIP'
  score: number
  confidence: number
  factors: string[]
  total_line: number
}

export interface ProfileResult {
  grade: GradeLetter
  final: number
  composite: number
  sizing: string
  chains_fired: string[]
  pick_side: Side
  picks?: Side
  margin?: number
  blend?: Record<string, number>
}

export interface BothSidesResult {
  home: GradeGameResult
  away: GradeGameResult
  best: GradeGameResult & { pick_team?: string }
  profiles: Record<string, ProfileResult>
}

// ─── Local helpers (mirrors grade_engine.py internals) ────────────────────────

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function getProfile(game: EnrichedGame, side: Side): TeamProfile {
  return ((game as unknown as Record<string, unknown>)[`${side}_profile`] as TeamProfile) ?? {}
}

function goalieName(value: string | GoalieProfile | undefined): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') return value
  const name = (value as Record<string, unknown>).name
  return typeof name === 'string' ? name : undefined
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

function goalieTier(name: string): 'ELITE' | 'GOOD' | null {
  if (!name) return null
  const last = name.trim().toLowerCase().split(' ').pop() ?? ''
  if (ELITE_NHL_GOALIES.has(last)) return 'ELITE'
  if (GOOD_NHL_GOALIES.has(last)) return 'GOOD'
  return null
}

// ─── Chain system ─────────────────────────────────────────────────────────────

function checkChain(name: string, v: Record<string, number>): boolean {
  const g = (k: string, defaultValue = 0): number => v[k] ?? defaultValue

  switch (name) {
    case 'THE_MISPRICING':
      return g('star_player') >= 8 && g('line_movement') <= 3
    case 'FATIGUE_FADE':
      return g('rest') >= 8 && g('road_trip') >= 7 && g('depth') >= 7
    case 'FORM_WAVE':
      return g('form') >= 8 && g('off_ranking') >= 8 && g('ats') >= 7
    case 'INJURY_GOLDMINE':
      return g('star_player') >= 8 && g('line_movement') <= 3 && g('form') >= 6
    case 'REST_DOMINATION':
      return g('rest') >= 8 && g('home_away') >= 6 && g('road_trip') >= 6
    case 'SHARPS_LOVE':
      return g('line_movement') >= 8 && g('form') >= 6
    case 'BLOWOUT_INCOMING':
      return g('off_ranking') >= 8 && g('def_ranking') >= 7 && g('home_away') >= 6
    case 'MISMATCH_MASSACRE':
      return g('off_ranking') >= 8 && g('def_ranking') >= 7
    case 'ROAD_WARRIOR':
      return g('home_away') <= 4 && g('form') >= 7 && g('rest') >= 6
    case 'BENCH_MOB':
      return g('depth') >= 7 && g('star_player') >= 6 && g('form') >= 6
    case 'REVENGE_GAME':
      return g('h2h', 10) <= 3 && g('form') >= 7 && g('home_away') >= 6
    case 'BOUNCE_BACK':
      return g('form', 10) <= 3 && g('off_ranking') >= 7 && g('home_away') >= 6
    case 'HUNGRY_DOG':
      return g('form') >= 7 && g('motivation') >= 7 && g('line_movement') >= 6
    case 'DUMPSTER_FIRE':
      return g('form', 10) <= 3 && g('off_ranking', 10) <= 3 && g('star_player', 10) <= 4
    case 'COLD_TAKE': {
      const vals = Object.values(v)
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 5
      return avg <= 4.5
    }
    case 'GLASS_CANNON':
      return g('off_ranking') >= 7 && g('def_ranking', 10) <= 3
    case 'SCHEDULE_LOSS':
      return g('rest', 10) <= 3 && g('road_trip', 10) <= 3 && g('form', 10) <= 4
    case 'THIN_ROSTER':
      return g('depth', 10) <= 3 && g('star_player', 10) <= 4
    case 'COASTING_FAV':
      return g('form', 10) <= 4 && g('motivation', 10) <= 4 && g('off_ranking', 10) <= 5
    case 'FADE_THE_STREAK':
      return g('form') >= 9 && g('home_away', 10) <= 4 && g('rest', 10) <= 4
    case 'GOALIE_EDGE':
      return g('goalie') >= 8 && g('def_ranking') >= 7 && g('rest') >= 6
    case 'GOALIE_WORKLOAD_WALL':
      if (g('goalie') >= 9) return false
      return g('goalie_workload') >= 8 && g('rest', 10) <= 4
    case 'SPECIAL_TEAMS_EDGE':
      if (g('form', 10) <= 3) return false
      return g('pp_pct') >= 8 && g('pk_pct') >= 7
    case 'B2B_BLEED':
      if (g('home_away') >= 7) return false
      return g('b2b_flag') >= 8 && g('travel_fatigue') >= 7
    case 'SHOT_QUALITY_SURGE':
      if (g('goalie', 10) <= 4) return false
      return g('shot_quality') >= 8 && g('off_ranking') >= 7
    case 'BACKUP_MISMATCH':
      if (g('form', 10) <= 3) return false
      return g('goalie') >= 7 && g('goalie_workload', 10) <= 3
    case 'SPECIAL_TEAMS_VOID':
      if (g('off_ranking') >= 8) return false
      return g('pp_pct', 10) <= 3 && g('pk_pct', 10) <= 3
    case 'ALTITUDE_ICE':
      if (g('form') >= 8) return false
      return g('travel_fatigue') >= 7 && g('b2b_flag') >= 6 && g('home_away', 10) <= 4
    case 'BULLPEN_LOCKDOWN':
      return g('bullpen') >= 8 && g('starter_depth') <= 5 && g('pitcher_profile') <= 5
    case 'BULLPEN_FATIGUE_CASCADE':
      if (g('off_ranking') >= 8) return false
      return g('bullpen_fatigue') >= 8 && g('starter_depth') <= 5
    case 'POWER_FLYBALL_OVER':
      if (g('bullpen') >= 8) return false
      return g('lineup_dna') >= 8 && g('gb_fb_ratio') <= 3 && g('park_factor') >= 6
    case 'CONTACT_PRESSURE':
      if (g('def_ranking') >= 8) return false
      return g('lineup_dna') <= 3 && g('plate_discipline') >= 7 && g('pitcher_hitter_archetype') <= 4
    case 'GROUNDBALL_DUEL':
      if (g('bullpen_fatigue') >= 7) return false
      return g('gb_fb_ratio') >= 8 && g('def_ranking') >= 7 && g('park_factor') <= 5
    case 'COORS_ACTUAL':
      if (g('weather_factor') <= 3) return false
      return g('park_factor') >= 9 && (g('lineup_dna') >= 7 || g('gb_fb_ratio') <= 3) && g('bullpen') <= 6
    case 'ACE_ISOLATION_TRAP':
      if (g('off_ranking') >= 8) return false
      return g('starting_pitcher') >= 8 && g('bullpen') <= 4 && g('def_ranking') <= 5
    case 'PLATOON_EXPLOIT':
      if (g('starter_depth') >= 8) return false
      return g('lineup_vs_hand') >= 9 && g('pitcher_hitter_archetype') <= 4
    case 'FIVE_AND_DIVE':
      if (g('park_factor') <= 3) return false
      return g('starter_depth') <= 4 && g('bullpen') <= 5 && g('off_ranking') >= 6
    case 'WEATHER_WIND_BOOST':
      if (g('gb_fb_ratio') >= 7) return false
      return g('weather_factor') >= 8 && g('lineup_dna') >= 7 && g('park_factor') >= 6
    case 'CONGESTION_FADE':
      return g('congestion') >= 8 && g('rest') >= 7
    case 'CLASS_GAP':
      return g('form') >= 8 && g('off_ranking') >= 7 && g('home_away') >= 7
    case 'FORTRESS_HOME':
      return g('home_away') >= 8 && g('def_ranking') >= 7 && g('form') >= 7
    case 'TOURIST_TRAP':
      return g('home_away', 10) <= 4 && g('congestion', 10) <= 3
    case 'DERBY_CHAOS':
      return g('h2h') >= 7 && g('form') >= 6 && g('motivation') >= 6
    case 'KEEPER_WALL':
      if (g('congestion') >= 8) return false
      return g('goalkeeper') >= 8 && g('def_ranking') >= 7 && g('form') >= 6
    case 'ROTATION_RISK':
      if (g('depth') >= 7) return false
      return g('squad_rotation') >= 8 && g('congestion') >= 7 && g('motivation', 10) <= 5
    case 'XG_REGRESSION':
      if (g('star_player', 10) <= 3) return false
      return g('xg_diff') >= 8 && g('form', 10) <= 5
    case 'SET_PIECE_THREAT':
      if (g('home_away', 10) <= 3) return false
      return g('set_piece') >= 8 && g('off_ranking') >= 6
    case 'EUROPEAN_HANGOVER':
      if (g('home_away') >= 7) return false
      return g('congestion') >= 8 && g('squad_rotation', 10) <= 3 && g('rest', 10) <= 3
    case 'LEAGUE_FORTRESS':
      if (g('star_player', 10) <= 3) return false
      return g('league_home_boost') >= 8 && g('home_away') >= 8 && g('form') >= 6
    case 'AWAY_DAY_FADE':
      if (g('form') >= 9) return false
      return g('home_away', 10) <= 3 && g('league_home_boost') >= 7 && g('congestion') >= 6
    case 'BLUE_BLOOD_TRAP':
      return g('line_movement') >= 8 && g('off_ranking', 10) <= 5
    case 'MARCH_MADNESS_UPSET':
      if (g('off_ranking') <= 3) return false
      return g('conference_strength') >= 7 && g('motivation') >= 8 && g('line_movement') >= 7
    case 'TEMPO_TRAP':
      if (g('def_ranking') <= 3) return false
      return g('pace') >= 8 && g('tempo_real') >= 7 && g('off_ranking') >= 7
    case 'CONFERENCE_MISMATCH':
      if (g('form') <= 3) return false
      return g('conference_strength') >= 8 && g('off_ranking') >= 7 && g('def_ranking') >= 7
    case 'HOME_COURT_CAULDRON':
      if (g('star_player') <= 3) return false
      return g('home_away') >= 8 && g('form') >= 7 && g('motivation') >= 7
    case 'DEPTH_DRAIN':
      if (g('form') >= 8) return false
      return g('depth', 10) <= 3 && g('pace') >= 7
    case 'TOURNAMENT_PEDIGREE':
      if (g('conference_strength') <= 3) return false
      return g('tournament_exp') >= 8 && g('form') >= 6 && g('motivation') >= 7
    case 'THREE_POINT_STORM':
      if (g('def_ranking', 10) <= 3) return false
      return g('three_pt_rate') >= 8 && g('off_ranking') >= 7 && g('pace') >= 7
    case 'B2B_CORPSE':
      if (g('rest') >= 7) return false
      return g('b2b_fatigue') >= 8 && g('travel_distance') >= 7
    case 'ALTITUDE_BLEED':
      if (g('form') >= 8) return false
      return g('altitude') >= 8 && g('travel_distance') >= 7 && g('b2b_fatigue') >= 6
    case 'PACE_MISMATCH':
      if (g('def_ranking', 10) <= 3) return false
      return g('pace') >= 8 && g('off_ranking') >= 7 && g('quarter_pace') >= 7
    case 'LOAD_MANAGEMENT_ARB':
      if (g('form', 10) <= 3) return false
      return g('star_player', 10) <= 4 && g('bench_diff') >= 7 && g('line_movement') >= 7
    case 'CLUTCH_LOCK':
      if (g('star_player', 10) <= 4) return false
      return g('late_game_strength') >= 8 && g('def_ranking') >= 7 && g('form') >= 7
    case 'TURNOVER_PRESSURE':
      if (g('off_ranking', 10) <= 4) return false
      return g('turnover_rate') >= 8 && g('def_ranking') >= 7
    case 'REF_PACE_BOOST':
      if (g('def_ranking') >= 8) return false
      return g('referee_pace') >= 8 && g('pace') >= 7 && g('off_ranking') >= 7
    case 'WEATHER_FADE':
      if (g('def_ranking') >= 8) return false
      return g('weather') <= 3 && g('home_away') <= 4 && g('form') <= 5
    case 'DOME_TEAM_FREEZE':
      if (g('form') >= 8) return false
      return g('weather') <= 3 && g('home_away') <= 4 && g('pace') >= 7
    case 'DIVISIONAL_DOGFIGHT':
      if (g('star_player') <= 3) return false
      return g('divisional') >= 7 && g('motivation') >= 7 && g('home_away') >= 6
    case 'TURNOVER_MACHINE':
      if (g('off_ranking') <= 3) return false
      return g('turnover_diff') >= 8 && g('def_ranking') >= 7
    case 'RED_ZONE_HAMMER':
      if (g('turnover_diff') <= 3) return false
      return g('red_zone') >= 8 && g('off_ranking') >= 7
    case 'PRIMETIME_LETDOWN':
      if (g('star_player') >= 8) return false
      return g('motivation') <= 4 && g('form') <= 4 && g('home_away') <= 4
    case 'QB_WEATHER_EDGE':
      if (g('off_ranking') <= 4) return false
      return g('weather') <= 4 && g('star_player') >= 8 && g('rest') >= 6
    case 'GROUND_AND_POUND':
      if (g('off_ranking') <= 3) return false
      return g('pace') <= 4 && g('def_ranking') >= 7 && g('rest') >= 6
    case 'COACHING_MISMATCH':
      if (g('star_player') <= 3) return false
      return g('coaching') >= 8 && g('motivation') >= 6
    case 'SCHEDULE_TRAP':
      if (g('form') >= 8) return false
      return g('rest') <= 3 && g('home_away') <= 4 && g('motivation') <= 4
    case 'RECRUITING_GAP':
      if (g('coaching_change') >= 7) return false
      return g('recruiting') >= 8 && g('off_ranking') >= 7
    case 'HOME_FORTRESS_CFB':
      if (g('star_player') <= 3) return false
      return g('home_away') >= 8 && g('motivation') >= 7 && g('form') >= 6
    case 'COACHING_CHAOS':
      if (g('recruiting') >= 8) return false
      return g('coaching_change') >= 8 && g('form', 10) <= 4
    case 'RIVALRY_UPSET':
      if (g('off_ranking') <= 3) return false
      return g('h2h') >= 7 && g('motivation') >= 8 && g('home_away') >= 6
    case 'PORTAL_FLUX':
      if (g('recruiting') >= 7) return false
      return g('depth', 10) <= 4 && g('coaching_change') >= 6
    // MMA chains
    case 'REACH_STRIKER':
      if (g('ground_game') <= 3) return false
      return g('reach_advantage') >= 8 && g('off_ranking') >= 7
    case 'GRAPPLER_TRAP':
      if (g('reach_advantage') <= 3) return false
      return g('ground_game') >= 8 && g('def_ranking') >= 7 && g('finish_rate') >= 6
    case 'CAMP_EDGE':
      if (g('star_player') <= 3) return false
      return g('camp_quality') >= 8 && g('form') >= 7
    case 'FINISH_THREAT':
      if (g('def_ranking') <= 3) return false
      return g('finish_rate') >= 8 && g('off_ranking') >= 7
    case 'RING_RUST':
      if (g('camp_quality') >= 8) return false
      return g('rest') >= 8 && g('form', 10) <= 4
    // Boxing chains
    case 'REACH_KING':
      if (g('form') <= 3) return false
      return g('reach_advantage') >= 8 && g('off_ranking') >= 7
    case 'SOUTHPAW_ANGLE':
      if (g('reach_advantage') <= 3) return false
      return g('stance_matchup') >= 8 && g('form') >= 6
    case 'RING_RUST_BOX':
      if (g('form') >= 7) return false
      return g('activity', 10) <= 3 && g('rest') >= 8
    case 'KO_ARTIST':
      if (g('def_ranking') <= 3) return false
      return g('finish_rate') >= 8 && g('off_ranking') >= 8
    default:
      return false
  }
}

// ─── Optional dynamic weight learning ─────────────────────────────────────────
// Dynamic weight learning is disabled: fall back to hardcoded SPORT_VARIABLES.

async function loadDynamicWeights(_sport: string): Promise<Record<string, number> | null> {
  return null
}

// ─── Optional MLB matchup depth service ───────────────────────────────────────
// Dynamic matchup-depth module is disabled; all variables resolve as unavailable.

async function scoreMlbMatchupDepth(
  _varName: string,
  _game: EnrichedGame,
  _pickSide: Side,
): Promise<ScoreNote> {
  return [5, 'matchup depth unavailable']
}

// ─── Implemented new-age / cross-sport scorers ────────────────────────────────

function scoreScoringMarginDiff(game: EnrichedGame, pickSide: Side): ScoreNote {
  const profile = getProfile(game, pickSide)
  const oppSide: Side = pickSide === 'home' ? 'away' : 'home'
  const opp = getProfile(game, oppSide)
  const ppg = profile.ppg_L5 ?? 0
  const oppPpg = profile.opp_ppg_L5 ?? 0
  const oPpg = opp.ppg_L5 ?? 0
  const oOpp = opp.opp_ppg_L5 ?? 0
  if (!ppg && !oppPpg) {
    return [5, 'no scoring data']
  }
  const ourDiff = ppg - oppPpg
  const theirDiff = oPpg - oOpp
  const delta = ourDiff - theirDiff
  const score = 5.0 + delta * 0.8
  return [_clamp(score), `margin diff ${ourDiff >= 0 ? '+' : ''}${ourDiff.toFixed(1)} vs ${theirDiff >= 0 ? '+' : ''}${theirDiff.toFixed(1)} (delta ${delta >= 0 ? '+' : ''}${delta.toFixed(1)})`]
}

function scoreHomeAwaySplit(game: EnrichedGame, pickSide: Side): ScoreNote {
  const profile = getProfile(game, pickSide)
  const isHome = pickSide === 'home'
  const splitRec = profile[isHome ? 'home_record' : 'away_record']
  if (!splitRec || !splitRec.includes('-')) {
    return [5, 'no split data']
  }
  const parts = splitRec.replace(/-/g, ' ').split(/\s+/)
  try {
    const wins = parseInt(parts[0], 10)
    const losses = parseInt(parts[1], 10)
    const total = wins + losses
    if (total < 5) {
      return [5, `small sample (${splitRec})`]
    }
    const pct = wins / total
    const score = 5.0 + (pct - 0.5) * 8
    const venue = isHome ? 'home' : 'away'
    return [_clamp(score), `${venue} ${splitRec} (${pct.toFixed(3)})`]
  } catch {
    return [5, `parse error: ${splitRec}`]
  }
}

function scoreLeaguePositionGap(game: EnrichedGame, pickSide: Side): ScoreNote {
  const profile = getProfile(game, pickSide)
  const oppSide: Side = pickSide === 'home' ? 'away' : 'home'
  const opp = getProfile(game, oppSide)
  if (profile.league_position == null || opp.league_position == null) {
    return [5, 'no standing data']
  }
  const ourPos = Number(profile.league_position)
  const theirPos = Number(opp.league_position)
  if (Number.isNaN(ourPos) || Number.isNaN(theirPos)) {
    return [5, 'parse error']
  }
  const gap = theirPos - ourPos
  const score = 5.0 + gap * 0.25
  return [_clamp(score), `standing #${ourPos} vs #${theirPos} (gap ${gap >= 0 ? '+' : ''}${gap})`]
}

function scoreBullpenKDominance(game: EnrichedGame, pickSide: Side): ScoreNote {
  const profile = getProfile(game, pickSide)
  const oppSide: Side = pickSide === 'home' ? 'away' : 'home'
  const opp = getProfile(game, oppSide)
  const bp = profile.bullpen ?? {}
  const oppBp = opp.bullpen ?? {}
  const era = bp.bullpen_era_L7
  const oppEra = oppBp.bullpen_era_L7
  if (era == null && oppEra == null) {
    return [5, 'no bullpen K data']
  }
  const ourEra = era != null ? Number(era) : 4.0
  const theirEra = oppEra != null ? Number(oppEra) : 4.0
  if (Number.isNaN(ourEra) || Number.isNaN(theirEra)) {
    return [5, 'parse error']
  }
  const delta = theirEra - ourEra
  const score = 5.0 + delta * 1.2
  return [_clamp(score), `pen ERA ${ourEra.toFixed(2)} vs ${theirEra.toFixed(2)} (delta ${delta >= 0 ? '+' : ''}${delta.toFixed(1)})`]
}

function scoreKRateVsBarrel(game: EnrichedGame, pickSide: Side): ScoreNote {
  const profile = getProfile(game, pickSide)
  const oppSide: Side = pickSide === 'home' ? 'away' : 'home'
  const opp = getProfile(game, oppSide)
  const sp = profile.starting_pitcher ?? {}
  const oppSplits = opp.lineup_vs_hand ?? {}
  const k9 = sp.k9
  const oppOps = oppSplits.ops_vs_hand
  const oppHr = oppSplits.hr_vs_hand
  const oppAvg = oppSplits.avg_vs_hand
  if (k9 == null || oppOps == null) {
    return [5, 'no K vs barrel data']
  }
  const k9f = Number(k9)
  const opsF = Number(oppOps)
  const avgF = oppAvg != null ? Number(oppAvg) : 0.26
  const hrI = oppHr != null ? Number(oppHr) : 10
  if (Number.isNaN(k9f) || Number.isNaN(opsF) || Number.isNaN(avgF) || Number.isNaN(hrI)) {
    return [5, 'parse error']
  }
  const isKPitcher = k9f >= 9.0
  const isPowerLineup = opsF >= 0.75 && avgF <= 0.25
  let score = 5.0
  if (isKPitcher && isPowerLineup) score = 8.0
  else if (isKPitcher) score = 6.5
  else if (!isKPitcher && isPowerLineup) score = 3.5
  score += (k9f - 8.5) * 0.5
  if (opsF >= 0.8) score -= 0.5
  return [_clamp(score), `K9 ${k9f.toFixed(1)} vs OPS ${opsF.toFixed(3)}/AVG ${avgF.toFixed(3)}/HR ${hrI}`]
}

function scoreRunDifferentialL5(game: EnrichedGame, pickSide: Side): ScoreNote {
  const profile = getProfile(game, pickSide)
  const margin = profile.margin_L5 ?? profile.L5_margin ?? 0
  if (margin == null) {
    return [5, 'no margin data']
  }
  const marginF = Number(margin)
  if (Number.isNaN(marginF)) {
    return [5, 'parse error']
  }
  const score = 5.0 + marginF * 0.6
  return [_clamp(score), `L5 margin ${marginF >= 0 ? '+' : ''}${marginF.toFixed(1)}`]
}

function scoreRecordStrength(game: EnrichedGame, pickSide: Side): ScoreNote {
  const profile = getProfile(game, pickSide)
  const rec = profile.record
  if (!rec || !rec.includes('-')) {
    return [5, 'no record']
  }
  const parts = rec.replace(/-/g, ' ').split(/\s+/)
  try {
    const wins = parseInt(parts[0], 10)
    const losses = parseInt(parts[1], 10)
    const total = wins + losses
    if (total < 10) {
      return [5, `small sample (${rec})`]
    }
    const pct = wins / total
    const score = 5.0 + (pct - 0.5) * 10
    return [_clamp(score), `record ${rec} (${pct.toFixed(3)})`]
  } catch {
    return [5, `parse error: ${rec}`]
  }
}

// ─── Stubs for scorers not yet ported ─────────────────────────────────────────
// Each returns a neutral score + a note that the engine marks as unavailable.

function scoreWeather(_game: EnrichedGame): ScoreNote {
  return [5, 'no weather data']
}
function scoreTurnoverDiff(_profile: TeamProfile): ScoreNote {
  return [5, 'no turnover data']
}
function scoreRedZone(_profile: TeamProfile): ScoreNote {
  return [5, 'no red zone data']
}
function scoreDivisional(_game: EnrichedGame, _side: Side): ScoreNote {
  return [5, 'divisional stub']
}
function scoreCoaching(_profile: TeamProfile): ScoreNote {
  return [5, 'coaching stub']
}
function scoreConferenceStrength(_profile: TeamProfile): ScoreNote {
  return [5, 'no conference data']
}
function scoreTournamentExp(_profile: TeamProfile): ScoreNote {
  return [5, 'no tournament data']
}
function scoreTempoReal(_profile: TeamProfile, _opp: TeamProfile, _sport: string): ScoreNote {
  return [5, 'no tempo data']
}
function scoreRecruiting(_profile: TeamProfile): ScoreNote {
  return [5, 'no recruiting data']
}
function scoreCoachingChange(_profile: TeamProfile): ScoreNote {
  return [5, 'no coaching change data']
}
function scoreReachAdvantage(_game: EnrichedGame, _side: Side): ScoreNote {
  return [5, 'no reach data']
}
function scoreFinishRate(_game: EnrichedGame, _side: Side): ScoreNote {
  return [5, 'no fighter data']
}
function scoreGroundGame(_game: EnrichedGame, _side: Side): ScoreNote {
  return [5, 'no ground game data']
}
function scoreCampQuality(_game: EnrichedGame, _side: Side): ScoreNote {
  return [5, 'no camp data']
}
function scoreStanceMatchup(_game: EnrichedGame, _side: Side): ScoreNote {
  return [5, 'no stance data']
}
function scoreActivity(_game: EnrichedGame, _side: Side): ScoreNote {
  return [5, 'no activity data']
}

// ─── Grade one side ───────────────────────────────────────────────────────────

export async function grade_game(
  game: EnrichedGame,
  pick_side: Side,
): Promise<GradeGameResult> {
  const sport = (game.sport ?? 'NBA').toString().toUpperCase()
  const profile = getProfile(game, pick_side)
  const opp_side: Side = pick_side === 'home' ? 'away' : 'home'
  const opp = getProfile(game, opp_side)

  const baseVars = SPORT_VARIABLES[sport as keyof typeof SPORT_VARIABLES] ?? SPORT_VARIABLES.NBA
  const var_weights: Record<string, number> = { ...baseVars }

  // Dynamic weight learning — override hardcoded weights when enough game data exists.
  const learned = await loadDynamicWeights(sport)
  if (learned) {
    Object.assign(var_weights, learned)
  }

  const variables: Record<string, VariableEntry> = {}

  // Data availability checks.
  const injuries = game.injuries ?? {}
  const has_injuries = !!(injuries.home?.length || injuries.away?.length)
  const has_rest = profile.rest_days != null
  const has_form = !!profile.L5
  const h2hSeason = profile.h2h_season
  const has_h2h = typeof h2hSeason === 'string' && h2hSeason.length > 0 && h2hSeason !== '0-0'
  const has_shifts = !!game.shifts?.spread_delta
  const has_pace = !!profile.pace_L5

  for (const [var_name, weight] of Object.entries(var_weights)) {
    let available = true
    let score = 5
    let note = `${var_name}: no data`

    if (var_name === 'star_player') {
      if (has_injuries) {
        if (sport === 'SOCCER') {
          ;[score, note] = scoreSoccerKeyPlayer(game, pick_side)
        } else {
          ;[score, note] = scoreStarPlayer(game, pick_side)
        }
      } else {
        score = 5
        note = 'No injury data'
        available = false
      }
    } else if (var_name === 'rest') {
      if (has_rest) {
        ;[score, note] = scoreRestAdvantage(profile, opp)
      } else {
        score = 5
        note = 'No rest data'
        available = false
      }
    } else if (var_name === 'off_ranking') {
      ;[score, note] = scoreOffRanking(profile, opp, sport)
      if (score === 5 && note.includes('No')) {
        available = false
      }
      if ((sport === 'NHL' || sport === 'SOCCER') && profile.ppg_synthetic) {
        available = false
        note = `${note} (synthetic from record)`
      }
    } else if (var_name === 'def_ranking') {
      ;[score, note] = scoreDefRanking(profile, opp, sport)
      if (score === 5 && note.includes('No')) {
        available = false
      }
      if ((sport === 'NHL' || sport === 'SOCCER') && profile.ppg_synthetic) {
        available = false
        note = `${note} (synthetic from record)`
      }
    } else if (var_name === 'form') {
      if (has_form) {
        ;[score, note] = scoreRecentForm(profile, opp)
      } else {
        score = 5
        note = 'No L5 data'
        available = false
      }
    } else if (var_name === 'home_away') {
      ;[score, note] = scoreHomeAway(game, pick_side)
      if (note.includes('?')) {
        available = false
      }
    } else if (var_name === 'h2h') {
      if (has_h2h) {
        ;[score, note] = scoreH2h(profile)
      } else {
        score = 5
        note = 'No H2H data'
        available = false
      }
    } else if (var_name === 'ats') {
      ;[score, note] = scoreAtsTrend(profile)
      if (profile.avg_margin_L10 == null) {
        available = false
      }
    } else if (var_name === 'line_movement') {
      if (has_shifts) {
        ;[score, note] = scoreLineMovement(game)
      } else {
        score = 5
        note = 'No line movement data'
        available = false
      }
    } else if (var_name === 'road_trip') {
      ;[score, note] = scoreRoadTrip(profile)
      if (note === 'Neutral' && profile.road_trip_len == null && profile.home_stand_len == null) {
        available = false
      }
    } else if (var_name === 'depth') {
      if (has_injuries) {
        ;[score, note] = scoreDepthInjuries(game, pick_side)
      } else {
        score = 5
        note = 'No injury data'
        available = false
      }
    } else if (var_name === 'pace') {
      if (has_pace) {
        ;[score, note] = scorePaceMatchup(profile, opp, sport)
      } else {
        score = 5
        note = 'No pace data'
        available = false
      }
    } else if (var_name === 'motivation') {
      ;[score, note] = scoreMotivation(game, pick_side)
    } else if (var_name === 'starting_pitcher') {
      ;[score, note] = scoreStartingPitcher(game, pick_side)
      if (note.startsWith(SP_PROXY_NOTE_PREFIX)) {
        available = false
      }
    } else if (var_name === 'starter_depth') {
      ;[score, note] = scoreStarterDepth(game, pick_side)
      if (note.toLowerCase().includes('no ')) {
        available = false
      }
    } else if (var_name === 'goalie') {
      ;[score, note] = scoreStartingGoalie(game, pick_side)
      if (note === 'No goalie data') {
        available = false
      }
    } else if (var_name === 'congestion') {
      ;[score, note] = scoreFixtureCongestion(game, pick_side)
    } else if (var_name === 'park_factor') {
      ;[score, note] = scoreParkFactor(game, pick_side)
      if (note.includes('unknown park')) {
        available = false
      }
    } else if (var_name === 'bullpen') {
      ;[score, note] = scoreBullpen(game, pick_side)
      if (note === 'no bullpen data') {
        available = false
      }
    } else if (var_name === 'lineup_vs_hand') {
      ;[score, note] = scoreLineupVsHand(game, pick_side)
      if (note === 'no lineup vs hand splits') {
        available = false
      }
    } else if (var_name === 'pitcher_hitter_archetype') {
      ;[score, note] = scorePitcherHitterArchetype(game, pick_side)
      if (note.includes('no pitcher-vs-lineup archetype data')) {
        available = false
      }
    } else if (var_name === 'umpire') {
      ;[score, note] = scoreUmpire(game, pick_side)
      if (note === 'no umpire data' || note.includes('unknown tendency')) {
        available = false
      }
    } else if (var_name === 'late_game_strength') {
      ;[score, note] = scoreLateGameStrength(game, pick_side)
      if (note === 'no quarter data') {
        available = false
      }
    } else if (var_name === 'quarter_pace') {
      ;[score, note] = scoreQuarterPace(game, pick_side)
      if (note === 'no quarter data') {
        available = false
      }
    } else if (var_name === 'bench_diff') {
      ;[score, note] = scoreBenchDiff(game, pick_side)
      if (note === 'no bench data') {
        available = false
      }
    } else if (var_name === 'pp_pct') {
      ;[score, note] = scorePpPct(profile)
      if (note === 'no PP data') {
        available = false
      }
    } else if (var_name === 'pk_pct') {
      ;[score, note] = scorePkPct(profile)
      if (note === 'no PK data') {
        available = false
      }
    } else if (var_name === 'goalie_workload') {
      ;[score, note] = scoreGoalieWorkload(game, pick_side)
      if (note === 'No goalie workload data') {
        available = false
      }
    } else if (var_name === 'b2b_flag') {
      ;[score, note] = scoreB2bFlag(profile)
      if (note === 'No rest data') {
        available = false
      }
    } else if (var_name === 'shot_quality') {
      ;[score, note] = scoreShotQuality(profile, opp)
      if (note === 'No shot quality data') {
        available = false
      }
    } else if (var_name === 'travel_fatigue') {
      ;[score, note] = scoreTravelFatigue(profile, game, pick_side)
    } else if (var_name === 'three_pt_rate') {
      ;[score, note] = scoreThreePtRate(profile, opp)
      if (note === 'no PPG data') {
        available = false
      }
    } else if (var_name === 'b2b_fatigue') {
      ;[score, note] = scoreB2bFatigue(profile, opp)
      if (note === 'no rest data') {
        available = false
      }
    } else if (var_name === 'travel_distance') {
      ;[score, note] = scoreTravelDistance(profile, game, pick_side)
    } else if (var_name === 'altitude') {
      ;[score, note] = scoreAltitude(game, pick_side)
    } else if (var_name === 'referee_pace') {
      if (profile.referee_pace != null) {
        ;[score, note] = scoreRefereePace(game)
      } else {
        score = 5
        note = 'No referee pace data'
        available = false
      }
    } else if (var_name === 'turnover_rate') {
      ;[score, note] = scoreTurnoverRate(profile, opp)
      if (note === 'no defensive data') {
        available = false
      }
    } else if (var_name === 'lineup_dna') {
      ;[score, note] = scoreLineupDna(game, pick_side)
      if (note === 'no lineup DNA data') {
        available = false
      }
    } else if (var_name === 'pitcher_profile') {
      ;[score, note] = scorePitcherProfile(game, pick_side)
      if (note.includes('no pitcher profile data')) {
        available = false
      }
    } else if (var_name === 'bullpen_fatigue') {
      ;[score, note] = scoreBullpenFatigue(game, pick_side)
      if (note === 'no bullpen fatigue data') {
        available = false
      }
    } else if (var_name === 'weather_factor') {
      ;[score, note] = scoreWeatherFactor(game, pick_side)
      if (note === 'no weather data') {
        available = false
      }
    } else if (var_name === 'gb_fb_ratio') {
      ;[score, note] = scoreGbFbRatio(game, pick_side)
      if (note === 'no GB/FB data') {
        available = false
      }
    } else if (var_name === 'plate_discipline') {
      ;[score, note] = scorePlateDiscipline(game, pick_side)
      if (note === 'no plate discipline data') {
        available = false
      }
    } else if (
      ['bullpen_sequencing', 'manager_tendencies', 'platoon_depth', 'pitcher_fatigue', 'run_environment'].includes(var_name)
    ) {
      ;[score, note] = await scoreMlbMatchupDepth(var_name, game, pick_side)
      if (
        note === 'data unavailable' ||
        note === 'matchup depth module error' ||
        note === 'matchup depth unavailable'
      ) {
        available = false
      }
    } else if (var_name === 'weather') {
      const wx = game.weather
      if (wx) {
        ;[score, note] = scoreWeather(game)
      } else {
        score = 5
        note = 'no weather data'
        available = false
      }
    } else if (var_name === 'turnover_diff') {
      ;[score, note] = scoreTurnoverDiff(profile)
      if (profile.turnover_diff == null) {
        available = false
      }
    } else if (var_name === 'red_zone') {
      ;[score, note] = scoreRedZone(profile)
      if (profile.red_zone_pct == null) {
        available = false
      }
    } else if (var_name === 'divisional') {
      ;[score, note] = scoreDivisional(game, pick_side)
      available = false
    } else if (var_name === 'coaching') {
      ;[score, note] = scoreCoaching(profile)
      available = false
    } else if (var_name === 'goalkeeper') {
      ;[score, note] = scoreGoalkeeper(game, pick_side)
      if (note.includes('no goalkeeper data')) {
        available = false
      }
    } else if (var_name === 'xg_diff') {
      ;[score, note] = scoreXgDiff(profile)
      available = false
    } else if (var_name === 'squad_rotation') {
      ;[score, note] = scoreSquadRotation(game, pick_side)
      if (note.includes('no congestion data')) {
        available = false
      }
    } else if (var_name === 'league_home_boost') {
      ;[score, note] = scoreLeagueHomeBoost(game, pick_side)
      if (note.includes('no league home boost')) {
        available = false
      }
    } else if (var_name === 'set_piece') {
      ;[score, note] = scoreSetPiece(profile)
      available = false
    } else if (var_name === 'conference_strength') {
      ;[score, note] = scoreConferenceStrength(profile)
      available = false
    } else if (var_name === 'tournament_exp') {
      ;[score, note] = scoreTournamentExp(profile)
      available = false
    } else if (var_name === 'tempo_real') {
      ;[score, note] = scoreTempoReal(profile, opp, sport)
      if (note === 'no tempo data') {
        available = false
      }
    } else if (var_name === 'recruiting') {
      ;[score, note] = scoreRecruiting(profile)
      available = false
    } else if (var_name === 'coaching_change') {
      ;[score, note] = scoreCoachingChange(profile)
      available = false
    } else if (var_name === 'reach_advantage') {
      ;[score, note] = scoreReachAdvantage(game, pick_side)
      if (note === 'no reach data') {
        available = false
      }
    } else if (var_name === 'finish_rate') {
      ;[score, note] = scoreFinishRate(game, pick_side)
      if (note.includes('no fighter data') || note.includes('no KO% data')) {
        available = false
      }
    } else if (var_name === 'ground_game') {
      ;[score, note] = scoreGroundGame(game, pick_side)
      available = false
    } else if (var_name === 'camp_quality') {
      ;[score, note] = scoreCampQuality(game, pick_side)
      available = false
    } else if (var_name === 'stance_matchup') {
      ;[score, note] = scoreStanceMatchup(game, pick_side)
      if (note === 'no stance data') {
        available = false
      }
    } else if (var_name === 'activity') {
      ;[score, note] = scoreActivity(game, pick_side)
      available = false
    } else if (var_name === 'scoring_margin_diff') {
      ;[score, note] = scoreScoringMarginDiff(game, pick_side)
      if (note.includes('no scoring')) {
        available = false
      }
    } else if (var_name === 'home_away_split') {
      ;[score, note] = scoreHomeAwaySplit(game, pick_side)
      if (note.includes('no split') || note.includes('small sample')) {
        available = false
      }
    } else if (var_name === 'goalie_tier_delta') {
      ;[score, note] = scoreGoalieTierDelta(game, pick_side)
      const vsIdx = note.indexOf('vs')
      if (note.includes('TBD') && vsIdx !== -1 && note.slice(vsIdx).includes('TBD')) {
        available = false
      }
    } else if (var_name === 'special_teams_combined') {
      ;[score, note] = scoreSpecialTeamsCombined(game, pick_side)
      if (note.includes('no special')) {
        available = false
      }
    } else if (var_name === 'schedule_density') {
      ;[score, note] = scoreScheduleDensity(game, pick_side)
      if (note.includes('no schedule')) {
        available = false
      }
    } else if (var_name === 'league_position_gap') {
      ;[score, note] = scoreLeaguePositionGap(game, pick_side)
      if (note.includes('no standing')) {
        available = false
      }
    } else if (var_name === 'bullpen_k_dominance') {
      ;[score, note] = scoreBullpenKDominance(game, pick_side)
      if (note.includes('no bullpen K')) {
        available = false
      }
    } else if (var_name === 'k_rate_vs_barrel') {
      ;[score, note] = scoreKRateVsBarrel(game, pick_side)
      if (note.includes('no K vs barrel')) {
        available = false
      }
    } else if (var_name === 'run_differential_l5') {
      ;[score, note] = scoreRunDifferentialL5(game, pick_side)
      if (note.includes('no margin')) {
        available = false
      }
    } else if (var_name === 'record_strength') {
      ;[score, note] = scoreRecordStrength(game, pick_side)
      if (note.includes('no record') || note.includes('small sample')) {
        available = false
      }
    } else {
      score = 5
      note = `${var_name}: no data`
      available = false
    }

    const clamped = _clamp(score)
    variables[var_name] = {
      score: clamped,
      weight,
      weighted: round1(clamped * weight),
      note,
      available,
    }
  }

  // Composite — only from AVAILABLE variables.
  const active = Object.fromEntries(Object.entries(variables).filter(([, v]) => v.available))
  const total_weighted = Object.values(active).reduce((sum, v) => sum + v.weighted, 0)
  const max_possible = Object.values(active).reduce((sum, v) => sum + v.weight * 10, 0)
  let composite = max_possible > 0 ? round2(total_weighted / max_possible * 10) : 5.0
  composite = _apply_spread_amplifier(composite, variables as Record<string, { score: number; weight: number }>)

  // Chains.
  const v_scores = Object.fromEntries(Object.entries(variables).map(([k, v]) => [k, v.score]))
  const available_count = Object.values(variables).filter((v) => v.available).length
  const total_count = Object.keys(variables).length
  const data_coverage = total_count > 0 ? available_count / total_count : 0
  const chains_blocked = data_coverage < 0.5

  const chains_fired: string[] = []
  let chain_bonus = 0.0
  if (!chains_blocked) {
    for (const chain_name of Object.keys(CHAINS)) {
      const cfg = CHAINS[chain_name as keyof typeof CHAINS] as ChainDef
      if (cfg.sports && !(cfg.sports as readonly string[]).includes(sport)) {
        continue
      }
      if (checkChain(chain_name, v_scores)) {
        chain_bonus += cfg.bonus
        chains_fired.push(chain_name)
      }
    }
  }

  chain_bonus = Math.max(-CHAIN_CAP, Math.min(chain_bonus, CHAIN_CAP))
  const final = round2(Math.max(1.0, Math.min(10.0, composite + chain_bonus)))
  const grade = score_to_grade(final)

  // Build a concise thesis from the grade and the strongest available variable.
  const activeVars = Object.entries(variables).filter(([, v]) => v.available)
  const topVar = activeVars.length
    ? activeVars.sort((a, b) => b[1].weighted - a[1].weighted)[0]
    : null
  const thesis = topVar
    ? `${grade} ${round1(final)}/10 — driven by ${topVar[0].replace(/_/g, ' ')} (${topVar[1].score.toFixed(1)})`
    : `${grade} ${round1(final)}/10 — limited data coverage`

  return {
    grade,
    score: final,
    composite,
    chain_bonus,
    chains_fired,
    sizing: score_to_sizing(final),
    confidence: Math.min(95, Math.max(40, Math.floor(55 + (final - 5) * 8))),
    variables,
    pick_side,
    thesis,
  }
}

// ─── Grade over/under ─────────────────────────────────────────────────────────

export function grade_game_total(game: EnrichedGame): TotalGradeResult {
  const sport = (game.sport ?? 'NBA').toString().toUpperCase()
  const home = game.home_profile ?? {}
  const away = game.away_profile ?? {}
  const odds = game.odds ?? {}
  const total_line = odds.total ?? 0

  if (!total_line || total_line <= 0) {
    return { verdict: 'SKIP', score: 0, confidence: 0, factors: ['no total line'], total_line }
  }

  let lean = 0.0
  const factors: string[] = []

  // --- Universal signals ---

  const home_ppg = home.ppg_L5 ?? 0
  const away_ppg = away.ppg_L5 ?? 0
  const home_opp_ppg = home.opp_ppg_L5 ?? 0
  const away_opp_ppg = away.opp_ppg_L5 ?? 0

  if (home_ppg && away_ppg) {
    const avg_ppg = (home_ppg + away_ppg) / 2
    const scoring_avg: Record<string, number> = {
      NBA: 114,
      WNBA: 80,
      NCAAB: 72,
      NHL: 3.2,
      MLB: 4.5,
      NFL: 22,
      NCAAF: 27,
      SOCCER: 1.4,
    }
    const avg = scoring_avg[sport] ?? 114
    if (avg > 0) {
      const off_ratio = avg_ppg / avg
      if (off_ratio >= 1.08) {
        lean += 1.2
        factors.push(`Both offenses hot (avg PPG ${avg_ppg.toFixed(1)})`)
      } else if (off_ratio >= 1.03) {
        lean += 0.6
        factors.push(`Above-avg offenses (avg PPG ${avg_ppg.toFixed(1)})`)
      } else if (off_ratio <= 0.92) {
        lean -= 1.0
        factors.push(`Both offenses cold (avg PPG ${avg_ppg.toFixed(1)})`)
      } else if (off_ratio <= 0.97) {
        lean -= 0.4
        factors.push(`Below-avg offenses (avg PPG ${avg_ppg.toFixed(1)})`)
      }
    }
  }

  if (home_opp_ppg && away_opp_ppg) {
    const avg_def = (home_opp_ppg + away_opp_ppg) / 2
    const def_avg: Record<string, number> = {
      NBA: 114,
      WNBA: 80,
      NCAAB: 72,
      NHL: 3.2,
      MLB: 4.5,
      NFL: 22,
      NCAAF: 27,
      SOCCER: 1.4,
    }
    const d_avg = def_avg[sport] ?? 114
    if (d_avg > 0) {
      const def_ratio = avg_def / d_avg
      if (def_ratio >= 1.08) {
        lean += 1.0
        factors.push(`Both defenses porous (avg allow ${avg_def.toFixed(1)})`)
      } else if (def_ratio >= 1.03) {
        lean += 0.5
        factors.push(`Below-avg defenses (avg allow ${avg_def.toFixed(1)})`)
      } else if (def_ratio <= 0.92) {
        lean -= 1.2
        factors.push(`Both defenses elite (avg allow ${avg_def.toFixed(1)})`)
      } else if (def_ratio <= 0.97) {
        lean -= 0.5
        factors.push(`Above-avg defenses (avg allow ${avg_def.toFixed(1)})`)
      }
    }
  }

  const home_pace = home.pace_L5 ?? 0
  const away_pace = away.pace_L5 ?? 0
  if (home_pace && away_pace) {
    const avg_pace = (home_pace + away_pace) / 2
    const pace_avg: Record<string, number> = {
      NBA: 225,
      NCAAB: 70,
      NHL: 60,
      NFL: 63,
      NCAAF: 63,
    }
    const p_avg = pace_avg[sport] ?? 0
    if (p_avg > 0) {
      const pace_ratio = avg_pace / p_avg
      if (pace_ratio >= 1.06) {
        lean += 0.8
        factors.push(`Fast-paced matchup (avg pace ${avg_pace.toFixed(1)})`)
      } else if (pace_ratio >= 1.02) {
        lean += 0.3
        factors.push(`Above-avg pace (${avg_pace.toFixed(1)})`)
      } else if (pace_ratio <= 0.94) {
        lean -= 0.8
        factors.push(`Slow grind matchup (avg pace ${avg_pace.toFixed(1)})`)
      } else if (pace_ratio <= 0.98) {
        lean -= 0.3
        factors.push(`Below-avg pace (${avg_pace.toFixed(1)})`)
      }
    }
  }

  const home_l5 = home.L5 ?? ''
  const away_l5 = away.L5 ?? ''
  if (home_l5 && away_l5) {
    const [hw, hl] = _parse_record(home_l5)
    const [aw, al] = _parse_record(away_l5)
    const total_wins = hw + aw
    const total_games = hw + hl + aw + al
    if (total_games >= 6) {
      const win_rate = total_wins / total_games
      if (win_rate >= 0.7) {
        lean += 0.4
        factors.push(`Both teams in form (combined ${total_wins}W in L5)`)
      } else if (win_rate <= 0.3) {
        lean -= 0.3
        factors.push(`Both teams struggling (${total_wins}W in L5)`)
      }
    }
  }

  const home_rest = home.rest_days
  const away_rest = away.rest_days
  const home_b2b = home.is_b2b ?? false
  const away_b2b = away.is_b2b ?? false
  if (home_rest != null && away_rest != null) {
    if (home_rest >= 3 && away_rest >= 3) {
      lean += 0.3
      factors.push('Both teams well-rested')
    } else if (home_b2b && away_b2b) {
      lean -= 0.3
      factors.push('Both on B2B — fatigue depresses scoring')
    } else if (home_b2b || away_b2b) {
      // wash — one rested, one tired
    }
  }

  const shifts = game.shifts ?? {}
  const total_open = shifts.total_open
  if (total_open && total_line) {
    try {
      const t_delta = Number(total_line) - Number(total_open)
      if (t_delta >= 2.0) {
        lean += 0.5
        factors.push(`Total moved UP ${t_delta >= 0 ? '+' : ''}${t_delta.toFixed(1)} (public on OVER)`)
      } else if (t_delta >= 1.0) {
        lean += 0.25
        factors.push(`Total ticked up ${t_delta >= 0 ? '+' : ''}${t_delta.toFixed(1)}`)
      } else if (t_delta <= -2.0) {
        lean -= 0.5
        factors.push(`Total moved DOWN ${t_delta >= 0 ? '+' : ''}${t_delta.toFixed(1)} (sharp UNDER)`)
      } else if (t_delta <= -1.0) {
        lean -= 0.25
        factors.push(`Total ticked down ${t_delta >= 0 ? '+' : ''}${t_delta.toFixed(1)}`)
      }
    } catch {
      // ignore parsing errors
    }
  }

  // --- Sport-specific signals ---

  if (sport === 'MLB') {
    const home_sp = home.starting_pitcher ?? {}
    const away_sp = away.starting_pitcher ?? {}
    const home_era = home_sp.era ?? (home_sp as Record<string, unknown>).ERA
    const away_era = away_sp.era ?? (away_sp as Record<string, unknown>).ERA
    const home_tier = pitcherTierFromStats(home_sp)
    const away_tier = pitcherTierFromStats(away_sp)

    const tier_lean: Record<string, number> = { ace: -1.2, good: -0.6, mid: 0, bad: 0.7, unknown: 0 }
    const sp_lean = (tier_lean[home_tier] ?? 0) + (tier_lean[away_tier] ?? 0)
    if (Math.abs(sp_lean) >= 0.5) {
      lean += sp_lean
      factors.push(`SP matchup: ${home_tier} vs ${away_tier} (lean ${sp_lean >= 0 ? '+' : ''}${sp_lean.toFixed(1)})`)
    }

    if (home_era && away_era) {
      try {
        const avg_era = (Number(home_era) + Number(away_era)) / 2
        if (avg_era >= 5.0) {
          lean += 0.6
          factors.push(`High avg SP ERA (${avg_era.toFixed(2)})`)
        } else if (avg_era <= 2.75) {
          lean -= 0.6
          factors.push(`Low avg SP ERA (${avg_era.toFixed(2)})`)
        }
      } catch {
        // ignore
      }
    }

    const home_bp = home.bullpen ?? {}
    const away_bp = away.bullpen ?? {}
    const home_tired = Number(home_bp.bullpen_tired_arms ?? 0)
    const away_tired = Number(away_bp.bullpen_tired_arms ?? 0)
    const total_tired = home_tired + away_tired
    if (total_tired >= 5) {
      lean += 0.8
      factors.push(`Both bullpens fatigued (${total_tired} tired arms)`)
    } else if (total_tired >= 3) {
      lean += 0.4
      factors.push(`Some bullpen fatigue (${total_tired} tired arms)`)
    }

    const home_bp_era = home_bp.bullpen_era_L7 ?? 4.0
    const away_bp_era = away_bp.bullpen_era_L7 ?? 4.0
    if (home_bp_era && away_bp_era) {
      const avg_bp_era = (home_bp_era + away_bp_era) / 2
      if (avg_bp_era >= 5.0) {
        lean += 0.5
        factors.push(`Bullpens struggling (avg ERA L7 ${avg_bp_era.toFixed(2)})`)
      } else if (avg_bp_era <= 3.0) {
        lean -= 0.4
        factors.push(`Bullpens locked in (avg ERA L7 ${avg_bp_era.toFixed(2)})`)
      }
    }

    const home_team = game.homeTeam ?? game.home_team ?? ''
    const pf = PARK_FACTORS[home_team]
    if (pf != null) {
      if (pf >= 105) {
        lean += 1.0
        factors.push(`Hitter-friendly park (PF ${pf})`)
      } else if (pf >= 102) {
        lean += 0.4
        factors.push(`Mildly hitter-friendly park (PF ${pf})`)
      } else if (pf <= 94) {
        lean -= 0.8
        factors.push(`Pitcher-friendly park (PF ${pf})`)
      } else if (pf <= 97) {
        lean -= 0.3
        factors.push(`Mildly pitcher-friendly park (PF ${pf})`)
      }
    }

    const wx = game.weather
    if (wx) {
      const temp_raw = wx.temp
      const wind_raw = String(wx.wind ?? '').toLowerCase()
      const condition = String(wx.condition ?? '').toLowerCase()
      const temp = temp_raw != null ? Number(temp_raw) : NaN
      const tempValid = !Number.isNaN(temp)

      const wind_out = wind_raw.includes('out')
      const wind_in = wind_raw.includes(' in') || wind_raw.startsWith('in ')
      let wind_mph = 0
      for (const part of wind_raw.replace(/,/g, ' ').split(/\s+/)) {
        if (/^-?\d+$/.test(part)) {
          wind_mph = parseInt(part, 10)
          break
        }
      }

      if (!condition.includes('dome') && !condition.includes('roof closed')) {
        if (tempValid) {
          if (temp >= 85) {
            lean += 0.5
            factors.push(`Hot weather (${temp}F)`)
          } else if (temp <= 45) {
            lean -= 0.5
            factors.push(`Cold weather (${temp}F)`)
          }
        }
        if (wind_out && wind_mph >= 10) {
          lean += 0.8
          factors.push(`Wind blowing out ${wind_mph}mph`)
        } else if (wind_out && wind_mph >= 5) {
          lean += 0.4
          factors.push(`Wind blowing out ${wind_mph}mph (moderate)`)
        } else if (wind_in && wind_mph >= 10) {
          lean -= 0.8
          factors.push(`Wind blowing in ${wind_mph}mph`)
        } else if (wind_in && wind_mph >= 5) {
          lean -= 0.4
          factors.push(`Wind blowing in ${wind_mph}mph (moderate)`)
        }
      }
    }

    const ump = game.umpire ?? {}
    const ump_name = ump.name ?? ''
    if (ump_name) {
      const tend = UMPIRE_TENDENCIES[ump_name]
      if (tend) {
        const k_delta = tend.k_pct - LEAGUE_AVG_K_PCT
        if (k_delta >= 0.8) {
          lean -= 0.5
          factors.push(`Tight-zone ump ${ump_name} (K% ${tend.k_pct})`)
        } else if (k_delta <= -0.5) {
          lean += 0.4
          factors.push(`Loose-zone ump ${ump_name} (K% ${tend.k_pct})`)
        }
      }
    }
  } else if (sport === 'NBA' || sport === 'WNBA' || sport === 'NCAAB') {
    if (home_ppg && away_ppg) {
      if (sport === 'NBA') {
        if (home_ppg >= 118 && away_ppg >= 118) {
          lean += 0.7
          factors.push('Both teams elite offense (NBA 118+ PPG)')
        } else if (home_ppg >= 112 && away_ppg >= 112) {
          lean += 0.3
          factors.push('Both above-avg scorers')
        }
      } else if (sport === 'NCAAB') {
        if (home_ppg >= 78 && away_ppg >= 78) {
          lean += 0.6
          factors.push('Both teams high-scoring (NCAAB 78+ PPG)')
        }
      }
    }

    if (home_b2b && away_b2b) {
      lean -= 0.2
      factors.push('Both on B2B — overall scoring depressed')
    } else if (home_b2b || away_b2b) {
      lean -= 0.15
      factors.push('One team on B2B — slight scoring dip')
    }

    if (home_opp_ppg && away_opp_ppg) {
      if (sport === 'NBA') {
        if (home_opp_ppg <= 108 && away_opp_ppg <= 108) {
          lean -= 0.7
          factors.push('Both elite defenses (allow <108)')
        } else if (home_opp_ppg >= 118 && away_opp_ppg >= 118) {
          lean += 0.7
          factors.push('Both porous defenses (allow 118+)')
        }
      }
    }
  } else if (sport === 'NHL') {
    const home_g = (typeof home.starting_goalie === 'object' ? home.starting_goalie : undefined) as Record<string, unknown> | undefined
    const away_g = (typeof away.starting_goalie === 'object' ? away.starting_goalie : undefined) as Record<string, unknown> | undefined
    const home_gname = goalieName(home.starting_goalie) || home.recent_starter || goalieName(home.goalie)
    const away_gname = goalieName(away.starting_goalie) || away.recent_starter || goalieName(away.goalie)

    if (home_gname && away_gname) {
      const home_tier = goalieTier(home_gname)
      const away_tier = goalieTier(away_gname)
      const tier_val: Record<string, number> = { ELITE: -1.0, GOOD: -0.4 }
      const g_lean = (tier_val[home_tier ?? ''] ?? 0) + (tier_val[away_tier ?? ''] ?? 0)
      if (Math.abs(g_lean) >= 0.5) {
        lean += g_lean
        const h_label = home_tier ?? 'UNKNOWN'
        const a_label = away_tier ?? 'UNKNOWN'
        factors.push(`Goalie matchup: ${h_label} vs ${a_label} (lean ${g_lean >= 0 ? '+' : ''}${g_lean.toFixed(1)})`)
      }
    }

    const home_sv = normalizeSvPct(home_g?.sv_pct ?? home_g?.['SV%'] ?? home_g?.svp)
    const away_sv = normalizeSvPct(away_g?.sv_pct ?? away_g?.['SV%'] ?? away_g?.svp)
    if (home_sv != null && away_sv != null) {
      const avg_sv = (home_sv + away_sv) / 2
      if (avg_sv < 0.9) {
        lean += 0.6
        factors.push(`Both goalies struggling (avg SV% ${avg_sv.toFixed(3)})`)
      } else if (avg_sv > 0.925) {
        lean -= 0.5
        factors.push(`Both goalies elite (avg SV% ${avg_sv.toFixed(3)})`)
      }
    }

    const home_pp = home.pp_pct
    const away_pp = away.pp_pct
    const home_pk = home.pk_pct
    const away_pk = away.pk_pct
    if (home_pp != null && away_pp != null) {
      const avg_pp = (home_pp + away_pp) / 2
      if (avg_pp >= 24) {
        lean += 0.4
        factors.push(`Strong power plays (avg PP% ${avg_pp.toFixed(1)})`)
      } else if (avg_pp <= 17) {
        lean -= 0.3
        factors.push(`Weak power plays (avg PP% ${avg_pp.toFixed(1)})`)
      }
    }
    if (home_pk != null && away_pk != null) {
      const avg_pk = (home_pk + away_pk) / 2
      if (avg_pk <= 76) {
        lean += 0.4
        factors.push(`Weak penalty kills (avg PK% ${avg_pk.toFixed(1)})`)
      } else if (avg_pk >= 84) {
        lean -= 0.3
        factors.push(`Strong penalty kills (avg PK% ${avg_pk.toFixed(1)})`)
      }
    }

    const home_nhl = home.nhl_pace ?? {}
    const away_nhl = away.nhl_pace ?? {}
    const home_sf = home_nhl.shots_for_per_game
    const away_sf = away_nhl.shots_for_per_game
    if (home_sf && away_sf) {
      const avg_sf = (home_sf + away_sf) / 2
      if (avg_sf >= 34) {
        lean += 0.4
        factors.push(`High shot volume (avg ${avg_sf.toFixed(1)} SF/g)`)
      } else if (avg_sf <= 28) {
        lean -= 0.3
        factors.push(`Low shot volume (avg ${avg_sf.toFixed(1)} SF/g)`)
      }
    }
  } else if (sport === 'SOCCER') {
    for (const side_name of ['home', 'away'] as const) {
      const prof = side_name === 'home' ? home : away
      const gk = prof.goalkeeper ? (prof.goalkeeper as unknown as Record<string, unknown>) : undefined
      const sv_pct = gk?.save_pct != null ? Number(gk.save_pct) : NaN
      if (!Number.isNaN(sv_pct)) {
        if (sv_pct >= 0.75) {
          lean -= 0.3
          factors.push(`${side_name.charAt(0).toUpperCase() + side_name.slice(1)} GK elite (SV% ${sv_pct.toFixed(2)})`)
        } else if (sv_pct <= 0.6) {
          lean += 0.3
          factors.push(`${side_name.charAt(0).toUpperCase() + side_name.slice(1)} GK poor (SV% ${sv_pct.toFixed(2)})`)
        }
      }
    }

    if (home_opp_ppg && away_opp_ppg) {
      const avg_concede = (home_opp_ppg + away_opp_ppg) / 2
      if (avg_concede <= 0.8) {
        lean -= 0.6
        factors.push(`Both tight defenses (avg concede ${avg_concede.toFixed(2)})`)
      } else if (avg_concede >= 1.8) {
        lean += 0.6
        factors.push(`Both leaky defenses (avg concede ${avg_concede.toFixed(2)})`)
      }
    }
  } else if (sport === 'NFL' || sport === 'NCAAF') {
    const wx = game.weather
    if (wx) {
      const condition = String(wx.condition ?? '').toLowerCase()
      const temp_raw = wx.temp
      const wind_raw = String(wx.wind ?? '').toLowerCase()
      const temp = temp_raw != null ? Number(temp_raw) : NaN
      let wind_mph = 0
      for (const part of wind_raw.replace(/,/g, ' ').split(/\s+/)) {
        if (/^-?\d+$/.test(part)) {
          wind_mph = parseInt(part, 10)
          break
        }
      }
      if (!condition.includes('dome') && !condition.includes('roof closed')) {
        if (!Number.isNaN(temp) && temp <= 32) {
          lean -= 0.5
          factors.push(`Freezing conditions (${temp}F)`)
        }
        if (wind_mph >= 15) {
          lean -= 0.4
          factors.push(`Strong wind (${wind_mph}mph) — suppresses passing`)
        }
        if (condition.includes('rain') || condition.includes('snow')) {
          lean -= 0.3
          factors.push(`Precipitation (${condition})`)
        }
      }
    }
  }

  // Clamp lean to -5..+5
  lean = Math.max(-5.0, Math.min(5.0, lean))

  let confidence = Math.min(95, Math.floor(Math.abs(lean) * 15 + 30))
  let verdict: 'OVER' | 'UNDER' | 'SKIP'
  if (Math.abs(lean) < 0.5) {
    verdict = 'SKIP'
    confidence = Math.max(20, confidence - 20)
  } else if (lean > 0) {
    verdict = 'OVER'
  } else {
    verdict = 'UNDER'
  }

  return {
    verdict,
    score: round2(lean),
    confidence,
    factors,
    total_line,
  }
}

// ─── Grader Profiles (Sintonia, Edge, Renzo) ──────────────────────────────────

// Each profile re-weights the same variables differently.
export const PROFILE_WEIGHTS: Record<string, Record<string, number>> = {
  sintonia: {
    off_ranking: 1.2,
    def_ranking: 1.2,
    form: 1.0,
    home_away: 1.0,
    star_player: 1.1,
    rest: 1.0,
    ats: 0.9,
    h2h: 0.8,
    motivation: 0.8,
    depth: 0.7,
    line_movement: 0.6,
    pace: 0.7,
    road_trip: 0.6,
    starting_pitcher: 0.9,
    starter_depth: 1.2,
    bullpen: 1.25,
    lineup_vs_hand: 1.15,
    pitcher_hitter_archetype: 1.15,
    congestion: 1.2,
    goalie: 1.3,
  },
  edge: {
    rest: 1.5,
    road_trip: 1.4,
    motivation: 1.3,
    home_away: 1.2,
    form: 1.0,
    depth: 1.0,
    line_movement: 0.9,
    off_ranking: 0.7,
    def_ranking: 0.7,
    star_player: 0.8,
    ats: 0.8,
    h2h: 0.7,
    pace: 0.5,
    starting_pitcher: 0.7,
    starter_depth: 1.1,
    bullpen: 1.35,
    lineup_vs_hand: 1.1,
    pitcher_hitter_archetype: 1.1,
    congestion: 1.4,
    goalie: 1.0,
  },
  renzo: {
    off_ranking: 1.3,
    def_ranking: 1.3,
    ats: 1.2,
    form: 1.1,
    line_movement: 1.0,
    h2h: 1.0,
    home_away: 0.8,
    rest: 0.7,
    star_player: 0.7,
    motivation: 0.5,
    depth: 0.5,
    road_trip: 0.5,
    pace: 0.4,
    starting_pitcher: 0.85,
    starter_depth: 1.2,
    bullpen: 1.3,
    lineup_vs_hand: 1.2,
    pitcher_hitter_archetype: 1.2,
    congestion: 0.8,
    goalie: 1.3,
  },
}

// MLB-only new-age matrices distilled from the strongest round-table responses.
export const MLB_NEW_AGE_PROFILE_WEIGHTS: Record<string, Record<string, number>> = {
  runvalue: {
    off_ranking: 1.35,
    lineup_vs_hand: 1.35,
    def_ranking: 1.15,
    bullpen: 1.35,
    starter_depth: 1.2,
    starting_pitcher: 0.75,
    pitcher_hitter_archetype: 1.1,
    park_factor: 1.0,
    umpire: 0.8,
    form: 0.95,
    line_movement: 0.95,
    ats: 0.85,
  },
  statcast: {
    lineup_vs_hand: 1.45,
    pitcher_hitter_archetype: 1.35,
    off_ranking: 1.2,
    bullpen: 1.2,
    starter_depth: 1.1,
    starting_pitcher: 0.7,
    park_factor: 1.1,
    umpire: 0.9,
    form: 0.9,
    line_movement: 0.85,
    ats: 0.75,
  },
  pitchlab: {
    bullpen: 1.45,
    starter_depth: 1.3,
    pitcher_hitter_archetype: 1.25,
    starting_pitcher: 0.8,
    def_ranking: 1.1,
    lineup_vs_hand: 1.1,
    off_ranking: 0.95,
    park_factor: 0.95,
    umpire: 1.0,
    form: 0.85,
    line_movement: 0.8,
    ats: 0.7,
  },
}

export async function grade_profiles(
  game: EnrichedGame,
  pick_side: Side,
): Promise<Record<string, ProfileResult>> {
  const base = await grade_game(game, pick_side)
  const base_vars = base.variables
  const profiles: Record<string, ProfileResult> = {}
  const sport = (game.sport ?? '').toString().toUpperCase()

  const profiles_to_use: Record<string, Record<string, number>> = { ...PROFILE_WEIGHTS }
  if (sport === 'MLB') {
    Object.assign(profiles_to_use, MLB_NEW_AGE_PROFILE_WEIGHTS)
  }

  for (const [profile_name, multipliers] of Object.entries(profiles_to_use)) {
    let total_w = 0
    let total_s = 0
    for (const [var_name, var_data] of Object.entries(base_vars)) {
      if (!var_data.available) continue
      const mult = multipliers[var_name] ?? 1.0
      const adjusted_weight = var_data.weight * mult
      total_w += adjusted_weight * 10
      total_s += var_data.score * adjusted_weight
    }

    const composite = total_w > 0 ? round2((total_s / total_w) * 10) : 5.0

    // Apply chain bonus from base.
    let chain_bonus = base.chain_bonus
    if (profile_name === 'renzo') {
      chain_bonus *= 0.5
    } else if (profile_name === 'edge') {
      chain_bonus *= 1.2
    }

    // DISABLED: chains zeroed until system is dialed in.
    void chain_bonus
    const final = round2(Math.max(1.0, Math.min(10.0, composite + 0.0)))
    const grade = score_to_grade(final)

    profiles[profile_name] = {
      grade,
      final,
      composite,
      sizing: score_to_sizing(final),
      chains_fired: base.chains_fired,
      pick_side,
    }
  }

  // Also grade the OTHER side so each profile can show who they pick.
  const other_side: Side = pick_side === 'home' ? 'away' : 'home'
  const other_base = await grade_game(game, other_side)
  const other_vars = other_base.variables

  for (const [profile_name, multipliers] of Object.entries(profiles_to_use)) {
    let total_w = 0
    let total_s = 0
    for (const [var_name, var_data] of Object.entries(other_vars)) {
      if (!var_data.available) continue
      const mult = multipliers[var_name] ?? 1.0
      const adjusted_weight = var_data.weight * mult
      total_w += adjusted_weight * 10
      total_s += var_data.score * adjusted_weight
    }
    const other_composite = total_w > 0 ? round2((total_s / total_w) * 10) : 5.0
    // DISABLED: chains zeroed until system is dialed in.
    const other_final = round2(Math.max(1.0, Math.min(10.0, other_composite + 0.0)))

    if (profiles[profile_name].final >= other_final) {
      profiles[profile_name].picks = pick_side
    } else {
      profiles[profile_name].picks = other_side
    }
    profiles[profile_name].margin = round2(profiles[profile_name].final - other_final)
  }

  // Add "crew" — random-weighted blend of all profiles.
  const profile_names = Object.keys(profiles)
  if (profile_names.length >= 3) {
    const blend_weights: Record<string, number> = {}
    for (const name of profile_names) {
      blend_weights[name] = 0.2 + Math.random() * 0.3 // uniform 0.2..0.5
    }
    const total_w = Object.values(blend_weights).reduce((a, b) => a + b, 0)
    for (const name of Object.keys(blend_weights)) {
      blend_weights[name] /= total_w
    }

    let crew_final = 0
    for (const name of profile_names) {
      crew_final += profiles[name].final * blend_weights[name]
    }
    crew_final = round2(Math.max(1.0, Math.min(10.0, crew_final)))
    const crew_grade = score_to_grade(crew_final)

    // Crew picks whichever side the majority of profiles pick.
    const side_votes: Record<string, number> = {}
    for (const name of profile_names) {
      const side = profiles[name].picks ?? pick_side
      side_votes[side] = (side_votes[side] ?? 0) + 1
    }
    const crew_pick = Object.entries(side_votes).sort((a, b) => b[1] - a[1])[0][0] as Side

    const normalized_blend: Record<string, number> = {}
    for (const [k, v] of Object.entries(blend_weights)) {
      normalized_blend[k] = round2(v)
    }

    profiles.crew = {
      grade: crew_grade,
      final: crew_final,
      composite: crew_final,
      sizing: score_to_sizing(crew_final),
      chains_fired: [],
      picks: crew_pick,
      margin: round2(crew_final - 5.0),
      blend: normalized_blend,
      pick_side,
    }
  }

  return profiles
}

// ─── Grade both sides and pick the better one ─────────────────────────────────

function _withThesis(result: {
  grade: GradeLetter
  score: number
  composite: number
  chain_bonus: number
  chains_fired: string[]
  sizing: string
  confidence: number
  variables: Record<string, { score: number; weight: number; weighted: number; note: string; available: boolean }>
  pick_side: Side
}): GradeGameResult {
  const activeVars = Object.entries(result.variables).filter(([, v]) => v.available)
  const topVar = activeVars.length
    ? activeVars.sort((a, b) => b[1].weighted - a[1].weighted)[0]
    : null
  const thesis = topVar
    ? `${result.grade} ${round1(result.score)}/10 — driven by ${topVar[0].replace(/_/g, ' ')} (${topVar[1].score.toFixed(1)})`
    : `${result.grade} ${round1(result.score)}/10 — limited data coverage`
  return {
    ...result,
    thesis,
  } as GradeGameResult
}

export async function grade_both_sides(game: EnrichedGame): Promise<BothSidesResult> {
  const sport = (game.sport ?? 'NBA').toString().toUpperCase()

  // Combat sports use a dedicated fight grader that returns the same outer shape.
  if (sport === 'MMA' || sport === 'BOXING') {
    const fight = grade_mma_fight(game)
    return {
      home: _withThesis(fight.home),
      away: _withThesis(fight.away),
      best: _withThesis(fight.best) as GradeGameResult & { pick_team?: string },
      profiles: fight.profiles as Record<string, ProfileResult>,
    }
  }

  const [home, away] = await Promise.all([grade_game(game, 'home'), grade_game(game, 'away')])

  let best: GradeGameResult & { pick_team?: string }
  let pick_side: Side
  if (home.score >= away.score) {
    best = { ...home }
    best.pick_team = game.home ?? game.home_team ?? 'Home'
    pick_side = 'home'
  } else {
    best = { ...away }
    best.pick_team = game.away ?? game.away_team ?? 'Away'
    pick_side = 'away'
  }

  const profiles = await grade_profiles(game, pick_side)

  return {
    home,
    away,
    best,
    profiles,
  }
}
