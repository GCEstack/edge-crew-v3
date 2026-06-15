-- ============================================================================
-- Phase 3 — Realtime + AI Streaming
-- Adds durable model jobs, realtime publication, and odds-hash caching for
-- model responses so the Vercel frontend can start analysis and stream results.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Helper used by RLS policies in this migration
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_setting('role', true) = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 1. Extend model_responses for sport filtering and odds-hash caching
-- ----------------------------------------------------------------------------
ALTER TABLE model_responses
    ADD COLUMN IF NOT EXISTS sport sport_enum,
    ADD COLUMN IF NOT EXISTS odds_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_model_responses_sport
    ON model_responses(sport);

CREATE INDEX IF NOT EXISTS idx_model_responses_odds_hash
    ON model_responses(odds_hash);

-- Cache hit index: one stored response per (game, model, odds_hash)
CREATE UNIQUE INDEX IF NOT EXISTS idx_model_responses_cache
    ON model_responses(game_id, model_name, odds_hash)
    WHERE odds_hash IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. Model job queue for async AI analysis
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport sport_enum NOT NULL,
    game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
    league TEXT,
    fast BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    result JSONB DEFAULT '{}',
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_model_jobs_status_created
    ON model_jobs(status, created_at);

CREATE INDEX IF NOT EXISTS idx_model_jobs_game
    ON model_jobs(game_id);

-- Allow authenticated users to read their own jobs; service role manages all.
ALTER TABLE model_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'model_jobs' AND policyname = 'Users can read own model jobs'
    ) THEN
        CREATE POLICY "Users can read own model jobs"
            ON model_jobs FOR SELECT
            USING (created_by = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'model_jobs' AND policyname = 'Service role can manage model jobs'
    ) THEN
        CREATE POLICY "Service role can manage model jobs"
            ON model_jobs FOR ALL
            USING (public.is_service_role())
            WITH CHECK (public.is_service_role());
    END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- 3. Realtime publication
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE model_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE model_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE games;
