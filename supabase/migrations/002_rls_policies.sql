-- ============================================================================
-- Edge Crew v3.0 - Row Level Security Policies
-- ============================================================================

-- Enable RLS on user-scoped tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE locked_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE gut_picks ENABLE ROW LEVEL SECURITY;

-- Reference tables: public read, admin write
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_opportunities ENABLE ROW LEVEL SECURITY;

-- System/service tables: service role write, authenticated read
ALTER TABLE odds_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (bankroll, display name)
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (is_admin());

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (is_admin());

-- Service role can create profiles during signup/migration
CREATE POLICY "Service can create profiles"
    ON profiles FOR INSERT
    WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- ============================================================================
-- PICKS TABLE
-- ============================================================================

-- Users can view their own picks
CREATE POLICY "Users can view own picks"
    ON picks FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own picks
CREATE POLICY "Users can create own picks"
    ON picks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own picks
CREATE POLICY "Users can update own picks"
    ON picks FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own pending picks
CREATE POLICY "Users can delete own picks"
    ON picks FOR DELETE
    USING (auth.uid() = user_id AND result = 'pending');

-- Admins can view all picks
CREATE POLICY "Admins can view all picks"
    ON picks FOR SELECT
    USING (is_admin());

-- ============================================================================
-- LOCKED GAMES TABLE
-- ============================================================================

CREATE POLICY "Users can view own locked games"
    ON locked_games FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own locked games"
    ON locked_games FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all locked games"
    ON locked_games FOR SELECT
    USING (is_admin());

-- ============================================================================
-- GUT PICKS TABLE
-- ============================================================================

CREATE POLICY "Users can view own gut picks"
    ON gut_picks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own gut picks"
    ON gut_picks FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all gut picks"
    ON gut_picks FOR SELECT
    USING (is_admin());

-- ============================================================================
-- GAMES TABLE (Public Read)
-- ============================================================================

CREATE POLICY "Games are publicly readable"
    ON games FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage games"
    ON games FOR ALL
    USING (is_admin());

-- ============================================================================
-- REFERENCE TABLES
-- ============================================================================

CREATE POLICY "Teams are publicly readable"
    ON teams FOR SELECT USING (true);

CREATE POLICY "Bookmakers are publicly readable"
    ON bookmakers FOR SELECT USING (true);

CREATE POLICY "Sports config is publicly readable"
    ON sports_config FOR SELECT USING (true);

CREATE POLICY "Admins can manage reference data"
    ON teams FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage bookmakers"
    ON bookmakers FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage sports config"
    ON sports_config FOR ALL USING (is_admin());

-- ============================================================================
-- EDGE OPPORTUNITIES
-- ============================================================================

CREATE POLICY "Edge opportunities are publicly readable"
    ON edge_opportunities FOR SELECT USING (true);

CREATE POLICY "Admins can manage edge opportunities"
    ON edge_opportunities FOR ALL USING (is_admin());

-- ============================================================================
-- TIME-SERIES / SYSTEM TABLES
-- ============================================================================

-- Odds history
CREATE POLICY "Authenticated users can read odds history"
    ON odds_history FOR SELECT USING ((auth.jwt() ->> 'role') = 'authenticated');

CREATE POLICY "Service role can manage odds history"
    ON odds_history FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- Grades
CREATE POLICY "Authenticated users can read grades"
    ON grades FOR SELECT USING ((auth.jwt() ->> 'role') = 'authenticated');

CREATE POLICY "Service role can manage grades"
    ON grades FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- Model responses
CREATE POLICY "Authenticated users can read model responses"
    ON model_responses FOR SELECT USING ((auth.jwt() ->> 'role') = 'authenticated');

CREATE POLICY "Service role can manage model responses"
    ON model_responses FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- Model performance
CREATE POLICY "Authenticated users can read model performance"
    ON model_performance FOR SELECT USING ((auth.jwt() ->> 'role') = 'authenticated');

CREATE POLICY "Service role can manage model performance"
    ON model_performance FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- Line movements
CREATE POLICY "Authenticated users can read line movements"
    ON line_movements FOR SELECT USING ((auth.jwt() ->> 'role') = 'authenticated');

CREATE POLICY "Service role can manage line movements"
    ON line_movements FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- Calibration snapshots
CREATE POLICY "Authenticated users can read calibration"
    ON calibration_snapshots FOR SELECT USING ((auth.jwt() ->> 'role') = 'authenticated');

CREATE POLICY "Service role can manage calibration"
    ON calibration_snapshots FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- Dynamic weights
CREATE POLICY "Anyone can read dynamic weights"
    ON dynamic_weights FOR SELECT USING (true);

CREATE POLICY "Service role can manage dynamic weights"
    ON dynamic_weights FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- Sync logs
CREATE POLICY "Admins can read sync logs"
    ON sync_logs FOR SELECT USING (is_admin());

CREATE POLICY "Service role can manage sync logs"
    ON sync_logs FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');
