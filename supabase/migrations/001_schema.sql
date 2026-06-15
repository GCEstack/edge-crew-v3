-- ============================================================================
-- Edge Crew v3.0 - Supabase Migration Schema
-- Standard PostgreSQL (no TimescaleDB dependencies)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE sport_enum AS ENUM (
    'nba', 'nhl', 'mlb', 'nfl', 'ncaab', 'ncaaf',
    'soccer', 'mma', 'boxing', 'golf', 'wnba', 'tennis'
);

CREATE TYPE game_status_enum AS ENUM ('scheduled', 'live', 'completed', 'postponed', 'cancelled');

CREATE TYPE pick_side_enum AS ENUM ('home', 'away', 'over', 'under', 'draw', 'btts_yes', 'btts_no');

CREATE TYPE pick_type_enum AS ENUM ('spread', 'ml', 'total', 'btts');

CREATE TYPE pick_result_enum AS ENUM ('win', 'loss', 'push', 'pending', 'void');

CREATE TYPE grade_letter_enum AS ENUM (
    'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'
);

CREATE TYPE convergence_status_enum AS ENUM ('aligned', 'divergent', 'uncertain', 'pending');

CREATE TYPE edge_signal_enum AS ENUM (
    'reverse_line', 'injury_lag', 'sharp_money', 'public_fade',
    'line_stall', 'opening_value', 'grading_divergence', 'consensus_edge'
);

CREATE TYPE edge_status_enum AS ENUM ('active', 'exploited', 'expired', 'voided');

CREATE TYPE user_role_enum AS ENUM ('user', 'admin');

CREATE TYPE movement_type_enum AS ENUM ('spread', 'total', 'ml_home', 'ml_away');

-- ============================================================================
-- PROFILES TABLE (extends auth.users)
-- Replaces: users.json
-- ============================================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'user',
    starting_bankroll DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    current_bankroll DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    total_wagered DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_profit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    pushes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================================
-- ADMIN HELPER (used by RLS policies in 002_rls_policies.sql)
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GAMES TABLE
-- ============================================================================

CREATE TABLE games (
    id TEXT PRIMARY KEY,
    odds_api_id TEXT,
    sport sport_enum NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status game_status_enum NOT NULL DEFAULT 'scheduled',
    home_score INTEGER,
    away_score INTEGER,
    league TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_games_scheduled ON games(scheduled_at DESC);
CREATE INDEX idx_games_sport_status ON games(sport, status);
CREATE INDEX idx_games_teams ON games(home_team, away_team);
CREATE INDEX idx_games_scheduled_sport ON games(scheduled_at, sport)
    WHERE status IN ('scheduled', 'live');

-- ============================================================================
-- PICKS TABLE (replaces picks.json)
-- ============================================================================

CREATE TABLE picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    sport sport_enum NOT NULL,
    team TEXT NOT NULL,
    side pick_side_enum NOT NULL,
    pick_type pick_type_enum NOT NULL DEFAULT 'spread',
    line DECIMAL(6,1),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    odds INTEGER NOT NULL DEFAULT -110,
    grade grade_letter_enum,
    result pick_result_enum NOT NULL DEFAULT 'pending',
    profit DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ,
    engine_score DECIMAL(3,1),
    consensus_score DECIMAL(3,1),
    convergence_status convergence_status_enum,
    pick_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_picks_user ON picks(user_id, created_at DESC);
CREATE INDEX idx_picks_game ON picks(game_id);
CREATE INDEX idx_picks_result ON picks(result) WHERE result IS NOT NULL;
CREATE INDEX idx_picks_pending ON picks(user_id, created_at) WHERE result = 'pending';
CREATE INDEX idx_picks_sport ON picks(sport, created_at DESC);

-- ============================================================================
-- LOCKED GAME IDs (replaces locked_picks.json)
-- ============================================================================

CREATE TABLE locked_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    sport sport_enum,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, game_id)
);

CREATE INDEX idx_locked_games_user ON locked_games(user_id);
CREATE INDEX idx_locked_games_game ON locked_games(game_id);

-- ============================================================================
-- GUT PICKS TABLE (replaces gut_picks.json)
-- ============================================================================

CREATE TABLE gut_picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    sport sport_enum NOT NULL,
    pick_side TEXT NOT NULL,
    engine_pick_side TEXT,
    pick_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, sport, pick_date)
);

CREATE INDEX idx_gut_picks_user ON gut_picks(user_id, pick_date DESC);
CREATE INDEX idx_gut_picks_user_sport ON gut_picks(user_id, sport, pick_date);

-- ============================================================================
-- ODDS HISTORY (replaces odds_history.json)
-- Uses standard Postgres native partitioning instead of TimescaleDB
-- ============================================================================

CREATE TABLE odds_history (
    time TIMESTAMPTZ NOT NULL,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    bookmaker TEXT NOT NULL,
    spread DECIMAL(6,1),
    total DECIMAL(6,1),
    ml_home INTEGER,
    ml_away INTEGER,
    spread_home_odds INTEGER,
    spread_away_odds INTEGER,
    over_odds INTEGER,
    under_odds INTEGER,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (time, game_id, bookmaker)
) PARTITION BY RANGE (time);

-- Monthly partitions for 2025-2026
CREATE TABLE odds_history_2025_01 PARTITION OF odds_history FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE odds_history_2025_02 PARTITION OF odds_history FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE odds_history_2025_03 PARTITION OF odds_history FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE odds_history_2025_04 PARTITION OF odds_history FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE odds_history_2025_05 PARTITION OF odds_history FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE odds_history_2025_06 PARTITION OF odds_history FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE odds_history_2025_07 PARTITION OF odds_history FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE odds_history_2025_08 PARTITION OF odds_history FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE odds_history_2025_09 PARTITION OF odds_history FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE odds_history_2025_10 PARTITION OF odds_history FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE odds_history_2025_11 PARTITION OF odds_history FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE odds_history_2025_12 PARTITION OF odds_history FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
CREATE TABLE odds_history_2026_01 PARTITION OF odds_history FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE odds_history_2026_02 PARTITION OF odds_history FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE odds_history_2026_03 PARTITION OF odds_history FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE odds_history_2026_04 PARTITION OF odds_history FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE odds_history_2026_05 PARTITION OF odds_history FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE odds_history_2026_06 PARTITION OF odds_history FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE odds_history_2026_07 PARTITION OF odds_history FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE odds_history_2026_08 PARTITION OF odds_history FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE odds_history_2026_09 PARTITION OF odds_history FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE odds_history_2026_10 PARTITION OF odds_history FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE odds_history_2026_11 PARTITION OF odds_history FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE odds_history_2026_12 PARTITION OF odds_history FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE odds_history_default PARTITION OF odds_history DEFAULT;

CREATE INDEX idx_odds_game_time ON odds_history(game_id, time DESC);
CREATE INDEX idx_odds_bookmaker ON odds_history(bookmaker, time DESC);

-- ============================================================================
-- GRADES TABLE (time-series of AI grades)
-- ============================================================================

CREATE TABLE grades (
    time TIMESTAMPTZ NOT NULL,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    our_score DECIMAL(4,2),
    ai_score DECIMAL(4,2),
    consensus_score DECIMAL(4,2),
    our_confidence DECIMAL(4,2) CHECK (our_confidence >= 0 AND our_confidence <= 1),
    ai_confidence DECIMAL(4,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    consensus_confidence DECIMAL(4,2) CHECK (consensus_confidence >= 0 AND consensus_confidence <= 1),
    convergence_status convergence_status_enum,
    grade_letter grade_letter_enum,
    model_breakdown JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    PRIMARY KEY (time, game_id)
) PARTITION BY RANGE (time);

CREATE TABLE grades_2025_01 PARTITION OF grades FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE grades_2025_02 PARTITION OF grades FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE grades_2025_03 PARTITION OF grades FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE grades_2025_04 PARTITION OF grades FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE grades_2025_05 PARTITION OF grades FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE grades_2025_06 PARTITION OF grades FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE grades_2025_07 PARTITION OF grades FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE grades_2025_08 PARTITION OF grades FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE grades_2025_09 PARTITION OF grades FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE grades_2025_10 PARTITION OF grades FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE grades_2025_11 PARTITION OF grades FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE grades_2025_12 PARTITION OF grades FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
CREATE TABLE grades_2026_01 PARTITION OF grades FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE grades_2026_02 PARTITION OF grades FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE grades_2026_03 PARTITION OF grades FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE grades_2026_04 PARTITION OF grades FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE grades_2026_05 PARTITION OF grades FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE grades_2026_06 PARTITION OF grades FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE grades_2026_07 PARTITION OF grades FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE grades_2026_08 PARTITION OF grades FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE grades_2026_09 PARTITION OF grades FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE grades_2026_10 PARTITION OF grades FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE grades_2026_11 PARTITION OF grades FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE grades_2026_12 PARTITION OF grades FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE grades_default PARTITION OF grades DEFAULT;

CREATE INDEX idx_grades_game ON grades(game_id, time DESC);
CREATE INDEX idx_grades_confidence ON grades(consensus_confidence DESC)
    WHERE consensus_confidence IS NOT NULL;
CREATE INDEX idx_grades_convergence ON grades(game_id, convergence_status, time DESC);

-- ============================================================================
-- MODEL RESPONSES TABLE (replaces forecaster_scores.json predictions)
-- ============================================================================

CREATE TABLE model_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    grade grade_letter_enum,
    score DECIMAL(4,2),
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    pick TEXT,
    thesis TEXT,
    reasoning TEXT,
    raw_response TEXT,
    source TEXT NOT NULL DEFAULT 'real',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_model_responses_game ON model_responses(game_id);
CREATE INDEX idx_model_responses_model ON model_responses(model_name, created_at DESC);
CREATE INDEX idx_model_responses_created ON model_responses(created_at DESC);

-- ============================================================================
-- MODEL PERFORMANCE TABLE (replaces forecaster_scores.json outcomes)
-- ============================================================================

CREATE TABLE model_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    sport sport_enum NOT NULL,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    predicted_grade grade_letter_enum,
    predicted_pick TEXT,
    actual_result pick_result_enum,
    actual_margin DECIMAL(6,2),
    pick_correct BOOLEAN,
    grade_accuracy DECIMAL(4,3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_model_perf_model ON model_performance(model_name, created_at DESC);
CREATE INDEX idx_model_perf_sport ON model_performance(sport, model_name);
CREATE INDEX idx_model_perf_game ON model_performance(game_id);

-- ============================================================================
-- LINE MOVEMENTS TABLE (replaces odds_history.json line movement tracking)
-- ============================================================================

CREATE TABLE line_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    bookmaker TEXT NOT NULL,
    movement_type movement_type_enum NOT NULL,
    old_value DECIMAL(8,2) NOT NULL,
    new_value DECIMAL(8,2) NOT NULL,
    delta DECIMAL(8,2) NOT NULL,
    percent_change DECIMAL(6,2),
    triggered_alert BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_movements_game ON line_movements(game_id, time DESC);
CREATE INDEX idx_movements_significant ON line_movements(time DESC) WHERE ABS(delta) >= 1.0;
CREATE INDEX idx_movements_alert ON line_movements(time DESC) WHERE triggered_alert = TRUE;

-- ============================================================================
-- CALIBRATION SNAPSHOTS TABLE (replaces calibration.json)
-- ============================================================================

CREATE TABLE calibration_snapshots (
    id BIGSERIAL PRIMARY KEY,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sport sport_enum,
    by_grade JSONB NOT NULL DEFAULT '{}',
    by_sport JSONB NOT NULL DEFAULT '{}',
    overall_hit_rate DECIMAL(5,4),
    total_picks INTEGER,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_calibration_generated ON calibration_snapshots(generated_at DESC);
CREATE INDEX idx_calibration_sport ON calibration_snapshots(sport, generated_at DESC);

-- ============================================================================
-- DYNAMIC WEIGHTS TABLE (replaces weight_learning.json)
-- ============================================================================

CREATE TABLE dynamic_weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport sport_enum NOT NULL,
    variable_name TEXT NOT NULL,
    default_weight DECIMAL(6,2) NOT NULL,
    adjusted_weight DECIMAL(6,2) NOT NULL,
    correlation DECIMAL(5,4),
    games_sampled INTEGER NOT NULL DEFAULT 0,
    last_recalc_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sport, variable_name)
);

CREATE INDEX idx_dynamic_weights_sport ON dynamic_weights(sport);

-- ============================================================================
-- SYNC LOGS TABLE (replaces sync_log.json)
-- ============================================================================

CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    games_snapped INTEGER NOT NULL DEFAULT 0,
    sports TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'ok',
    duration_ms INTEGER,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_sync_logs_time ON sync_logs(synced_at DESC);

-- ============================================================================
-- TEAMS & BOOKMAKERS (reference data from seeds)
-- ============================================================================

CREATE TABLE teams (
    id TEXT PRIMARY KEY,
    sport sport_enum NOT NULL,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    city TEXT,
    conference TEXT,
    division TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sport, abbreviation)
);

CREATE TABLE bookmakers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT,
    priority INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    api_endpoint TEXT,
    rate_limit INTEGER DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sports_config (
    id sport_enum PRIMARY KEY,
    name TEXT NOT NULL,
    season_type TEXT,
    current_season INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    grading_weights JSONB DEFAULT '{}',
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- EDGE OPPORTUNITIES TABLE
-- ============================================================================

CREATE TABLE edge_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    signal_type edge_signal_enum NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    confidence DECIMAL(4,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    expected_value DECIMAL(6,4),
    recommended_sizing DECIMAL(4,2),
    status edge_status_enum NOT NULL DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_edge_active ON edge_opportunities(detected_at DESC) WHERE status = 'active';
CREATE INDEX idx_edge_game ON edge_opportunities(game_id, detected_at DESC);

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW v_games_with_latest_grade AS
SELECT
    g.*,
    gr.grade_letter,
    gr.consensus_score,
    gr.consensus_confidence,
    gr.convergence_status,
    gr.time AS grade_time
FROM games g
LEFT JOIN LATERAL (
    SELECT *
    FROM grades
    WHERE game_id = g.id
    ORDER BY time DESC
    LIMIT 1
) gr ON TRUE
WHERE g.status IN ('scheduled', 'live');

CREATE OR REPLACE VIEW v_pick_performance AS
SELECT
    p.sport,
    p.grade,
    COUNT(*) as total_picks,
    SUM(CASE WHEN p.result = 'win' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN p.result = 'loss' THEN 1 ELSE 0 END) as losses,
    SUM(CASE WHEN p.result = 'push' THEN 1 ELSE 0 END) as pushes,
    SUM(p.profit) as total_profit,
    AVG(p.consensus_score) as avg_consensus_score,
    AVG(CASE WHEN p.result = 'win' THEN p.consensus_score END) as avg_consensus_score_on_wins
FROM picks p
JOIN games g ON p.game_id = g.id
WHERE p.result IS NOT NULL
GROUP BY p.sport, p.grade;

-- ============================================================================
-- TRIGGERS: Auto-update updated_at (helper defined in 000_helpers.sql)
-- ============================================================================

CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
