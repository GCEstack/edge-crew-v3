-- ============================================================================
-- Fix ambiguity in adjust_bankroll() between PL/pgSQL parameters and table columns.
-- PostgreSQL 15 treats unqualified column references in SET clauses as ambiguous
-- when parameter names match column names.
-- ============================================================================

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
        current_bankroll = profiles.current_bankroll + delta,
        total_profit = profiles.total_profit + delta,
        wins = profiles.wins + adjust_bankroll.wins,
        losses = profiles.losses + adjust_bankroll.losses,
        pushes = profiles.pushes + adjust_bankroll.pushes,
        updated_at = NOW()
    WHERE profiles.id = adjust_bankroll.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
