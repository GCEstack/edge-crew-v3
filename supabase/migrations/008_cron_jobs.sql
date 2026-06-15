-- ============================================================================
-- Phase 3 — pg_cron scheduling
-- Replaces the legacy Python scheduler for daily prewarm, settlement, and
-- periodic odds sync. The cron jobs invoke SQL wrappers that can delegate to
-- Edge Functions or the containerized AI worker as the migration matures.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enable extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- pg_net is useful for cron jobs that need to call external HTTP endpoints.
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ----------------------------------------------------------------------------
-- 2. SQL wrapper functions
-- ----------------------------------------------------------------------------

-- Prewarm: enqueue analysis jobs for the upcoming slate.
-- In production this can be expanded to insert rows into model_jobs for each
-- scheduled game, or to call an external prewarm endpoint via pg_net.
CREATE OR REPLACE FUNCTION public.prewarm_slate()
RETURNS TEXT AS $$
BEGIN
    INSERT INTO sync_logs (sports, status, metadata)
    VALUES (
        ARRAY['nba', 'nhl', 'mlb', 'nfl', 'ncaab', 'ncaaf', 'soccer'],
        'prewarm_started',
        jsonb_build_object('trigger', 'pg_cron', 'started_at', NOW())
    );
    RETURN 'prewarm_started';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Settlement: grade pending picks against final scores.
-- The full implementation should fetch Odds API scores (via pg_net or an
-- external worker) and call adjust_bankroll for each resolved pick.
CREATE OR REPLACE FUNCTION public.settle_picks()
RETURNS TEXT AS $$
DECLARE
    pending_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO pending_count FROM picks WHERE result = 'pending';

    INSERT INTO sync_logs (sports, status, metadata)
    VALUES (
        ARRAY[]::TEXT[],
        'settle_started',
        jsonb_build_object(
            'trigger', 'pg_cron',
            'pending_picks', pending_count,
            'started_at', NOW()
        )
    );
    RETURN 'settle_started';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Odds sync: snapshot current odds into odds_history.
-- The full implementation should fetch odds from the data provider and upsert
-- rows into odds_history for each tracked game.
CREATE OR REPLACE FUNCTION public.sync_odds()
RETURNS TEXT AS $$
BEGIN
    INSERT INTO sync_logs (sports, status, metadata)
    VALUES (
        ARRAY[]::TEXT[],
        'sync_odds_started',
        jsonb_build_object('trigger', 'pg_cron', 'started_at', NOW())
    );
    RETURN 'sync_odds_started';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3. Schedule cron jobs
-- ----------------------------------------------------------------------------
-- Unschedule first to avoid duplicates when the migration is rerun.
SELECT cron.unschedule('edgecrew-prewarm-slate') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'edgecrew-prewarm-slate');
SELECT cron.unschedule('edgecrew-settle-picks') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'edgecrew-settle-picks');
SELECT cron.unschedule('edgecrew-sync-odds') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'edgecrew-sync-odds');

-- 06:00 UTC daily — prewarm the day's slate before users wake up (US time).
SELECT cron.schedule('edgecrew-prewarm-slate', '0 6 * * *', 'SELECT public.prewarm_slate();');

-- 00:00 UTC daily — settle yesterday's picks.
SELECT cron.schedule('edgecrew-settle-picks', '0 0 * * *', 'SELECT public.settle_picks();');

-- Every 4 hours — sync odds snapshots.
SELECT cron.schedule('edgecrew-sync-odds', '0 */4 * * *', 'SELECT public.sync_odds();');
