-- ============================================================================
-- Phase 0 / Phase 4 — Schema completions
-- Adds tables required by the migration checklist and Phase 4 feature flags.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extend sport enum to include college_baseball (used by the analyzer)
-- ----------------------------------------------------------------------------
ALTER TYPE sport_enum ADD VALUE IF NOT EXISTS 'college_baseball';

-- ----------------------------------------------------------------------------
-- 2. Feature flags (Phase 4)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'feature_flags' AND policyname = 'Feature flags are publicly readable'
    ) THEN
        CREATE POLICY "Feature flags are publicly readable"
            ON feature_flags FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'feature_flags' AND policyname = 'Admins can manage feature flags'
    ) THEN
        CREATE POLICY "Admins can manage feature flags"
            ON feature_flags FOR ALL USING (is_admin());
    END IF;
END
$$;

-- Seed the flags expected by the AI worker and frontend.
INSERT INTO feature_flags (key, value, description)
VALUES
    ('USE_REAL_AI', true, 'Use live AI models instead of mock responses'),
    ('FAST_MODE', false, 'Run only the fast subset of models'),
    ('GATEKEEPER_ENABLED', true, 'Enable gatekeeper filtering on AI output'),
    ('STREAMING_RESULTS', true, 'Stream AI results via Supabase Realtime'),
    ('CACHE_AI_RESULTS', true, 'Cache AI responses by game_id + odds_hash')
ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. A/B tests (Phase 4)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    variant TEXT NOT NULL DEFAULT 'control',
    config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'ab_tests' AND policyname = 'Active A/B tests are publicly readable'
    ) THEN
        CREATE POLICY "Active A/B tests are publicly readable"
            ON ab_tests FOR SELECT USING (is_active = true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'ab_tests' AND policyname = 'Admins can manage A/B tests'
    ) THEN
        CREATE POLICY "Admins can manage A/B tests"
            ON ab_tests FOR ALL USING (is_admin());
    END IF;
END
$$;
