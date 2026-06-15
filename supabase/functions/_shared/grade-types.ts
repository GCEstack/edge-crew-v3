// Type definitions for the Edge Crew grade engine (TypeScript port of grade_engine.py)

export type Sport =
  | 'NBA'
  | 'NHL'
  | 'MLB'
  | 'NFL'
  | 'NCAAB'
  | 'NCAAF'
  | 'SOCCER'
  | 'MMA'
  | 'BOXING'
  | 'WNBA'
  | 'TENNIS'
  | 'COLLEGE_BASEBALL'

export type Side = 'home' | 'away'

export type GradeLetter =
  | 'A+'
  | 'A'
  | 'A-'
  | 'B+'
  | 'B'
  | 'B-'
  | 'C+'
  | 'C'
  | 'C-'
  | 'D+'
  | 'D'
  | 'D-'
  | 'F'

export type ConvergenceStatus = 'ALIGNED' | 'DIVERGENT' | 'UNCERTAIN' | 'PENDING' | 'LOCK' | 'SPLIT' | 'CONFLICT' | 'CLOSE'

export type PickType = 'spread' | 'ml' | 'total'

export interface Injury {
  player?: string
  name?: string
  status?: string
  ppg?: number
  freshness?: 'FRESH' | 'ESTABLISHED' | 'SEASON'
}

export interface TeamProfile {
  // Generic / team
  record?: string
  home_record?: string
  away_record?: string
  L5?: string
  L5_margin?: number
  margin_L5?: number
  avg_margin_L10?: number
  rest_days?: number
  is_b2b?: boolean
  h2h_season?: string
  streak?: string
  road_trip_len?: number
  home_stand_len?: number
  league_position?: number
  matches_in_10d?: number
  congestion_10d?: number
  ppg_synthetic?: boolean

  // Offense / defense
  off_ranking?: number
  def_ranking?: number
  ppg_L5?: number
  opp_ppg_L5?: number
  pace_L5?: number

  // NBA
  nba_quarters?: Record<string, number>
  bench_ppg_l5?: number
  three_pt_rate_l5?: number
  turnover_rate_l5?: number
  referee_pace?: number

  // NHL
  pp_pct?: number
  pk_pct?: number
  starting_goalie?: string | GoalieProfile
  goalie?: string | GoalieProfile
  recent_starter?: string
  nhl_pace?: {
    shots_for_per_game?: number
    shots_against_per_game?: number
  }

  // MLB
  starting_pitcher?: PitcherProfile
  bullpen?: {
    bullpen_era_L7?: number
    bullpen_tired_arms?: boolean
    bullpen_ip_L7?: number
    team_era_season?: number
    k_rate?: number
    barrel_rate?: number
  }
  lineup_vs_hand?: {
    ops_vs_hand?: number
    avg_vs_hand?: number
    hr_vs_hand?: number
    vs_hand?: string
  }
  lineup_dna?: Record<string, unknown>
  gb_fb_ratio?: number
  plate_discipline?: number
  park_factor?: number
  umpire?: string

  // Soccer
  goalkeeper?: string
  keeper?: string
  xg_diff_l5?: number
  squad_rotation_index?: number
  set_piece_strength?: number
  league_home_boost?: number

  // NFL
  turnover_diff?: number
  red_zone_pct?: number
}

export interface PitcherProfile {
  name?: string
  era?: number
  IP?: number
  ip?: number
  k9?: number
  bb9?: number
  whip?: number
  hand?: 'L' | 'R'
  tier?: number
  note?: string
  stats?: Record<string, number>
}

export interface GoalieProfile {
  name?: string
  sv_pct?: number
  gaa?: number
  gs?: number
  recent_form?: string
  note?: string
}

export interface Odds {
  spread?: number
  total?: number
  mlHome?: number
  mlAway?: number
  spreadPriceHome?: number
  spreadPriceAway?: number
  overPrice?: number
  underPrice?: number
  home_spread?: number
  away_spread?: number
}

export interface Weather {
  temp?: number | string
  wind?: number | string
  condition?: string
}

export interface UmpireInfo {
  name?: string
}

export interface Fighter {
  name?: string
  record?: string
  reach?: number
  finish_rate?: number
  stance?: string
  activity_fights_per_year?: number
  ground_game_score?: number
  camp_quality?: number
}

export interface EnrichedGame {
  id?: string
  sport: Sport | string
  homeTeam?: string
  awayTeam?: string
  home_team?: string
  away_team?: string
  home?: string
  away?: string
  odds_key?: string
  league?: string
  home_profile: TeamProfile
  away_profile: TeamProfile
  odds: Odds
  injuries?: {
    home?: Injury[]
    away?: Injury[]
  }
  shifts?: {
    spread_delta?: number
    total_open?: number
  }
  weather?: Weather
  umpire?: UmpireInfo
  home_fighter?: Fighter
  away_fighter?: Fighter
}

export interface VariableResult {
  score: number
  name: string
  available: boolean
  weight?: number
  notes?: string
}

export interface VariableEntry {
  score: number
  weight: number
  weighted: number
  note: string
  available: boolean
}

export interface GradeResult {
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
  pick?: {
    side: Side
    type: PickType
    line?: number
    team: string
  }
  total_pick?: {
    side: 'over' | 'under'
    line?: number
    team: string
  }
}

export interface BothSidesResult {
  best: GradeResult & { pick_team?: string }
  profiles?: Record<string, unknown>
  home: GradeResult
  away: GradeResult
}

export interface EVResult {
  ev_pct: number | null
  ev_grade: string
  kelly_units: string
  true_prob: number | null
  implied_prob: number | null
  edge: number | null
  moneyline: number | null
}

export interface PeterFlag {
  rule: string
  action: 'BOOST' | 'DOWNGRADE' | 'KILL'
  severity: 'EDGE' | 'WARNING'
  note: string
}

export interface PeterRulesResult {
  flags: PeterFlag[]
  adjustment: number
  has_kill: boolean
}
