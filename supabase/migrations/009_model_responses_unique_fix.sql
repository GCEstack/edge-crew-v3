-- Fix model_responses upsert target.
-- The previous partial unique index (WHERE odds_hash IS NOT NULL) cannot be
-- inferred by PostgREST's upsert on_conflict target, causing:
--   "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- Make the cache index unconditional so worker upserts work reliably.

DROP INDEX IF EXISTS idx_model_responses_cache;

CREATE UNIQUE INDEX IF NOT EXISTS idx_model_responses_cache
    ON public.model_responses (game_id, model_name, odds_hash);
