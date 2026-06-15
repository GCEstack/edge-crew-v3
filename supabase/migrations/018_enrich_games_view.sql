-- Enrich v_games_with_latest_grade so the frontend can display real engine / AI grades,
-- model breakdowns, picks, and gatekeeper verdicts without extra round-trips.
DROP VIEW IF EXISTS v_games_with_latest_grade;
CREATE VIEW v_games_with_latest_grade AS
SELECT
    g.*,
    gr.grade_letter,
    gr.our_score,
    gr.ai_score,
    gr.consensus_score,
    gr.our_confidence,
    gr.ai_confidence,
    gr.consensus_confidence,
    gr.convergence_status,
    gr.model_breakdown,
    gr.metadata,
    gr.time AS grade_time
FROM games g
LEFT JOIN LATERAL (
    SELECT *
    FROM grades
    WHERE game_id = g.id
    ORDER BY time DESC
    LIMIT 1
) gr ON TRUE
WHERE g.status IN ('scheduled', 'live');
