-- ============================================================================
-- Edge Crew v3.0 - Database Functions & Triggers
-- ============================================================================

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- Helper update_updated_at_column() is defined in 000_helpers.sql.
-- Helper is_admin() is defined in 001_schema.sql after profiles table.
-- Triggers for games/profiles are created in 001_schema.sql.
-- ============================================================================

-- ============================================================================
-- PICK RESULT CALCULATOR
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_pick_result(
    p_game_id TEXT,
    p_side pick_side_enum,
    p_line DECIMAL(6,1)
) RETURNS pick_result_enum AS $$
DECLARE
    v_game games%ROWTYPE;
    v_total INTEGER;
    v_spread_diff DECIMAL(8,2);
BEGIN
    SELECT * INTO v_game FROM games WHERE id = p_game_id;

    IF NOT FOUND OR v_game.status != 'completed' THEN
        RETURN 'pending';
    END IF;

    -- Spread side
    IF p_side IN ('home', 'away') THEN
        IF p_side = 'home' THEN
            v_spread_diff := (v_game.home_score - v_game.away_score) + COALESCE(p_line, 0);
        ELSE
            v_spread_diff := (v_game.away_score - v_game.home_score) + COALESCE(p_line, 0);
        END IF;

        IF v_spread_diff > 0 THEN
            RETURN 'win';
        ELSIF v_spread_diff < 0 THEN
            RETURN 'loss';
        ELSE
            RETURN 'push';
        END IF;
    END IF;

    -- Total side
    IF p_side IN ('over', 'under') THEN
        v_total := COALESCE(v_game.home_score, 0) + COALESCE(v_game.away_score, 0);
        IF p_line IS NULL THEN
            RETURN 'pending';
        END IF;

        IF (p_side = 'over' AND v_total > p_line) OR (p_side = 'under' AND v_total < p_line) THEN
            RETURN 'win';
        ELSIF v_total = p_line THEN
            RETURN 'push';
        ELSE
            RETURN 'loss';
        END IF;
    END IF;

    RETURN 'pending';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- LINE MOVEMENT DETECTION
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_line_movement()
RETURNS TRIGGER AS $$
DECLARE
    v_prev odds_history%ROWTYPE;
    v_threshold DECIMAL(8,2) := 0.5;
BEGIN
    -- Find the most recent prior odds snapshot for this game/bookmaker
    SELECT * INTO v_prev
    FROM odds_history
    WHERE game_id = NEW.game_id
      AND bookmaker = NEW.bookmaker
      AND time < NEW.time
    ORDER BY time DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Spread movement
    IF NEW.spread IS NOT NULL AND v_prev.spread IS NOT NULL AND ABS(NEW.spread - v_prev.spread) >= v_threshold THEN
        INSERT INTO line_movements (
            time, game_id, bookmaker, movement_type,
            old_value, new_value, delta, percent_change, triggered_alert
        ) VALUES (
            NEW.time, NEW.game_id, NEW.bookmaker, 'spread',
            v_prev.spread, NEW.spread, NEW.spread - v_prev.spread,
            CASE WHEN v_prev.spread = 0 THEN NULL ELSE ROUND((NEW.spread - v_prev.spread) / v_prev.spread * 100, 2) END,
            ABS(NEW.spread - v_prev.spread) >= 1.0
        );
    END IF;

    -- Total movement
    IF NEW.total IS NOT NULL AND v_prev.total IS NOT NULL AND ABS(NEW.total - v_prev.total) >= v_threshold THEN
        INSERT INTO line_movements (
            time, game_id, bookmaker, movement_type,
            old_value, new_value, delta, percent_change, triggered_alert
        ) VALUES (
            NEW.time, NEW.game_id, NEW.bookmaker, 'total',
            v_prev.total, NEW.total, NEW.total - v_prev.total,
            CASE WHEN v_prev.total = 0 THEN NULL ELSE ROUND((NEW.total - v_prev.total) / v_prev.total * 100, 2) END,
            ABS(NEW.total - v_prev.total) >= 1.0
        );
    END IF;

    -- ML home movement
    IF NEW.ml_home IS NOT NULL AND v_prev.ml_home IS NOT NULL AND ABS(NEW.ml_home - v_prev.ml_home) >= 50 THEN
        INSERT INTO line_movements (
            time, game_id, bookmaker, movement_type,
            old_value, new_value, delta, percent_change, triggered_alert
        ) VALUES (
            NEW.time, NEW.game_id, NEW.bookmaker, 'ml_home',
            v_prev.ml_home, NEW.ml_home, NEW.ml_home - v_prev.ml_home,
            NULL,
            ABS(NEW.ml_home - v_prev.ml_home) >= 100
        );
    END IF;

    -- ML away movement
    IF NEW.ml_away IS NOT NULL AND v_prev.ml_away IS NOT NULL AND ABS(NEW.ml_away - v_prev.ml_away) >= 50 THEN
        INSERT INTO line_movements (
            time, game_id, bookmaker, movement_type,
            old_value, new_value, delta, percent_change, triggered_alert
        ) VALUES (
            NEW.time, NEW.game_id, NEW.bookmaker, 'ml_away',
            v_prev.ml_away, NEW.ml_away, NEW.ml_away - v_prev.ml_away,
            NULL,
            ABS(NEW.ml_away - v_prev.ml_away) >= 100
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER detect_line_movement_trigger
    AFTER INSERT ON odds_history
    FOR EACH ROW
    EXECUTE FUNCTION detect_line_movement();
