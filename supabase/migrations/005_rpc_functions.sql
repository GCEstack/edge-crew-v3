-- ============================================================================
-- Edge Crew v3.0 - RPC helper functions for Edge Functions
-- ============================================================================

-- Atomic bankroll adjustment (used by user-pick-result and profile-adjust)
CREATE OR REPLACE FUNCTION adjust_bankroll(
    user_id UUID,
    delta DECIMAL(10,2),
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    pushes INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET
        current_bankroll = current_bankroll + delta,
        total_profit = total_profit + delta,
        wins = wins + adjust_bankroll.wins,
        losses = losses + adjust_bankroll.losses,
        pushes = pushes + adjust_bankroll.pushes,
        updated_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment a single bankroll field atomically
CREATE OR REPLACE FUNCTION increment_bankroll_field(
    user_id UUID,
    field TEXT,
    delta DECIMAL(10,2)
)
RETURNS VOID AS $$
BEGIN
    IF field = 'total_wagered' THEN
        UPDATE profiles
        SET total_wagered = total_wagered + delta,
            updated_at = NOW()
        WHERE id = user_id;
    ELSIF field = 'current_bankroll' THEN
        UPDATE profiles
        SET current_bankroll = current_bankroll + delta,
            updated_at = NOW()
        WHERE id = user_id;
    ELSE
        RAISE EXCEPTION 'Unsupported bankroll field: %', field;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
