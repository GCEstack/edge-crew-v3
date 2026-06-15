-- ============================================================================
-- Worker monitoring & alerting
-- The AI worker writes heartbeats while polling. A pg_cron job checks whether
-- the heartbeat is stale and logs an alert to sync_logs (and an optional
-- webhook if WORKER_ALERT_WEBHOOK is configured).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Heartbeat table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worker_heartbeats (
    worker_name TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'idle',
    last_job_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}',
    beat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_heartbeats_beat_at ON worker_heartbeats(beat_at DESC);

-- ---------------------------------------------------------------------------
-- 2. Upsert heartbeat (called by the worker)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_worker_heartbeat(
    p_worker_name TEXT,
    p_status TEXT,
    p_last_job_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO worker_heartbeats (worker_name, status, last_job_id, metadata, beat_at)
    VALUES (p_worker_name, p_status, p_last_job_id, p_metadata, NOW())
    ON CONFLICT (worker_name)
    DO UPDATE SET
        status = EXCLUDED.status,
        last_job_id = EXCLUDED.last_job_id,
        metadata = EXCLUDED.metadata,
        beat_at = EXCLUDED.beat_at,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 3. Health check (called by pg_cron every few minutes)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_worker_health(
    p_max_age_minutes INTEGER DEFAULT 5
)
RETURNS JSONB AS $$
DECLARE
    latest_beat TIMESTAMPTZ;
    latest_status TEXT;
    stale_minutes INTEGER;
    alert_payload JSONB;
    webhook_url TEXT;
BEGIN
    SELECT beat_at, status
    INTO latest_beat, latest_status
    FROM worker_heartbeats
    ORDER BY beat_at DESC
    LIMIT 1;

    -- No heartbeat ever seen
    IF latest_beat IS NULL THEN
        alert_payload := jsonb_build_object(
            'alert', 'no_heartbeat',
            'message', 'No worker heartbeat has been recorded',
            'checked_at', NOW()
        );
        INSERT INTO sync_logs (sports, status, metadata)
        VALUES (ARRAY[]::TEXT[], 'worker_no_heartbeat', alert_payload);
        RETURN alert_payload;
    END IF;

    stale_minutes := EXTRACT(EPOCH FROM (NOW() - latest_beat)) / 60;

    IF stale_minutes > p_max_age_minutes THEN
        alert_payload := jsonb_build_object(
            'alert', 'worker_stale',
            'message', 'Worker heartbeat is stale',
            'latest_status', latest_status,
            'latest_beat', latest_beat,
            'stale_minutes', stale_minutes,
            'checked_at', NOW()
        );

        INSERT INTO sync_logs (sports, status, metadata)
        VALUES (ARRAY[]::TEXT[], 'worker_stale_alert', alert_payload);

        -- Optional external webhook (set via Supabase Vault or config)
        BEGIN
            SELECT current_setting('app.worker_alert_webhook', true) INTO webhook_url;
            IF webhook_url IS NOT NULL AND webhook_url <> '' THEN
                PERFORM net.http_post(
                    url := webhook_url,
                    headers := '{"Content-Type": "application/json"}'::jsonb,
                    body := alert_payload
                );
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Webhook failure should not break the health check
            RAISE WARNING 'Worker alert webhook failed: %', SQLERRM;
        END;

        RETURN alert_payload;
    END IF;

    RETURN jsonb_build_object(
        'alert', NULL,
        'latest_status', latest_status,
        'latest_beat', latest_beat,
        'stale_minutes', stale_minutes,
        'checked_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 4. Schedule the monitor cron job
-- ---------------------------------------------------------------------------
SELECT cron.unschedule('edgecrew-monitor-worker')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'edgecrew-monitor-worker');

SELECT cron.schedule(
    'edgecrew-monitor-worker',
    '*/5 * * * *',
    'SELECT public.check_worker_health();'
);
