// Shared types for Edge Crew v3.0 Supabase Edge Functions

export type Sport =
  | 'nba'
  | 'nhl'
  | 'mlb'
  | 'nfl'
  | 'ncaab'
  | 'ncaaf'
  | 'soccer'
  | 'mma'
  | 'boxing'
  | 'golf'
  | 'wnba'
  | 'tennis'

export type GameStatus = 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled'

export type PickSide = 'home' | 'away' | 'over' | 'under' | 'draw' | 'btts_yes' | 'btts_no'

export type PickType = 'spread' | 'ml' | 'total' | 'btts'

export type PickResult = 'win' | 'loss' | 'push' | 'pending' | 'void'

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

export type ConvergenceStatus = 'aligned' | 'divergent' | 'uncertain' | 'pending'

export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  username: string
  display_name: string
  role: UserRole
  starting_bankroll: number
  current_bankroll: number
  total_wagered: number
  total_profit: number
  wins: number
  losses: number
  pushes: number
  created_at: string
  updated_at: string
}

export interface Game {
  id: string
  odds_api_id?: string
  sport: Sport
  home_team: string
  away_team: string
  scheduled_at: string
  status: GameStatus
  home_score?: number
  away_score?: number
  league?: string
  created_at: string
  updated_at: string
}

export interface Pick {
  id: string
  user_id: string
  game_id: string
  sport: Sport
  team: string
  side: PickSide
  pick_type: PickType
  line?: number
  amount: number
  odds: number
  grade?: GradeLetter
  result: PickResult
  profit: number
  notes?: string
  locked_at: string
  settled_at?: string
  engine_score?: number
  consensus_score?: number
  convergence_status?: ConvergenceStatus
  pick_data: Record<string, unknown>
  created_at: string
}

export interface LockedGame {
  id: string
  user_id: string
  game_id: string
  sport?: Sport
  created_at: string
}

export interface GutPick {
  id: string
  user_id: string
  game_id: string
  sport: Sport
  pick_side: string
  engine_pick_side?: string
  pick_date: string
  created_at: string
}

export interface GradeInput {
  game_id: string
  sport: Sport
  home_team: string
  away_team: string
  odds: {
    spread?: number
    total?: number
    mlHome?: number
    mlAway?: number
  }
  home_profile?: Record<string, unknown>
  away_profile?: Record<string, unknown>
  injuries?: Record<string, unknown>
  rest?: Record<string, unknown>
  weather?: Record<string, unknown>
  umpire?: Record<string, unknown>
}

export interface GradeOutput {
  game_id: string
  grade?: GradeLetter
  score: number
  confidence: number
  thesis: string
  variables?: Record<string, unknown>
  pick?: {
    side: PickSide
    type: PickType
    line?: number
    team: string
  }
}
