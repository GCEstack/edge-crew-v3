-- ============================================================================
-- Use PL/pgSQL variable_conflict to make record_worker_heartbeat unambiguous.
-- This lets the parameter names stay worker-friendly (worker_name, status, ...)
-- without colliding with table columns.
-- ============================================================================

DROP FUNCTION IF EXISTS public.record_worker_heartbeat(TEXT, TEXT, UUID, JSONB);

CREATE OR REPLACE FUNCTION public.record_worker_heartbeat(
    worker_name TEXT,
    status TEXT,
    last_job_id UUID DEFAULT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
#variable_conflict use_variable
BEGIN
    INSERT INTO worker_heartbeats (worker_name, status, last_job_id, metadata, beat_at)
    VALUES (worker_name, status, last_job_id, metadata, NOW())
    ON CONFLICT (worker_name)
    DO UPDATE SET
        status = EXCLUDED.status,
        last_job_id = EXCLUDED.last_job_id,
        metadata = EXCLUDED.metadata,
        beat_at = EXCLUDED.beat_at,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
