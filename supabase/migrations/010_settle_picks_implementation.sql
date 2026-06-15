-- ============================================================================
-- Phase 3 (cont.) — Real pick settlement for pg_cron
-- Replaces the stub settle_picks() with logic that grades pending picks
-- against completed game scores and updates bankrolls.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.settle_picks()
RETURNS TEXT AS $$
DECLARE
    rec RECORD;
    v_result pick_result_enum;
    v_profit DECIMAL(10,2);
    v_wins INTEGER := 0;
    v_losses INTEGER := 0;
    v_pushes INTEGER := 0;
    v_settled_count INTEGER := 0;
BEGIN
    FOR rec IN
        SELECT
            p.id AS pick_id,
            p.user_id,
            p.side,
            p.pick_type,
            p.line,
            p.amount,
            p.odds,
            g.home_score,
            g.away_score,
            g.status
        FROM picks p
        JOIN games g ON g.id = p.game_id
        WHERE p.result = 'pending'
          AND g.status IN ('completed', 'cancelled', 'postponed')
    LOOP
        -- Void picks for cancelled/postponed games
        IF rec.status IN ('cancelled', 'postponed') THEN
            v_result := 'void';
            v_profit := 0;

        -- Moneyline
        ELSIF rec.pick_type = 'ml' THEN
            IF rec.side = 'home' THEN
                IF rec.home_score > rec.away_score THEN v_result := 'win';
                ELSIF rec.home_score < rec.away_score THEN v_result := 'loss';
                ELSE v_result := 'push';
                END IF;
            ELSIF rec.side = 'away' THEN
                IF rec.away_score > rec.home_score THEN v_result := 'win';
                ELSIF rec.away_score < rec.home_score THEN v_result := 'loss';
                ELSE v_result := 'push';
                END IF;
            ELSIF rec.side = 'draw' THEN
                IF rec.home_score = rec.away_score THEN v_result := 'win';
                ELSE v_result := 'loss';
                END IF;
            ELSE
                v_result := 'void';
            END IF;

        -- Spread
        ELSIF rec.pick_type = 'spread' THEN
            IF rec.side = 'home' THEN
                IF rec.home_score + COALESCE(rec.line, 0) > rec.away_score THEN v_result := 'win';
                ELSIF rec.home_score + COALESCE(rec.line, 0) < rec.away_score THEN v_result := 'loss';
                ELSE v_result := 'push';
                END IF;
            ELSIF rec.side = 'away' THEN
                IF rec.away_score + COALESCE(rec.line, 0) > rec.home_score THEN v_result := 'win';
                ELSIF rec.away_score + COALESCE(rec.line, 0) < rec.home_score THEN v_result := 'loss';
                ELSE v_result := 'push';
                END IF;
            ELSE
                v_result := 'void';
            END IF;

        -- Total / over-under
        ELSIF rec.pick_type = 'total' THEN
            IF rec.line IS NULL THEN
                v_result := 'void';
            ELSIF rec.side = 'over' THEN
                IF (rec.home_score + rec.away_score) > rec.line THEN v_result := 'win';
                ELSIF (rec.home_score + rec.away_score) < rec.line THEN v_result := 'loss';
                ELSE v_result := 'push';
                END IF;
            ELSIF rec.side = 'under' THEN
                IF (rec.home_score + rec.away_score) < rec.line THEN v_result := 'win';
                ELSIF (rec.home_score + rec.away_score) > rec.line THEN v_result := 'loss';
                ELSE v_result := 'push';
                END IF;
            ELSE
                v_result := 'void';
            END IF;

        -- Both teams to score (soccer)
        ELSIF rec.pick_type = 'btts' THEN
            IF rec.side = 'btts_yes' THEN
                IF rec.home_score > 0 AND rec.away_score > 0 THEN v_result := 'win';
                ELSE v_result := 'loss';
                END IF;
            ELSIF rec.side = 'btts_no' THEN
                IF rec.home_score = 0 OR rec.away_score = 0 THEN v_result := 'win';
                ELSE v_result := 'loss';
                END IF;
            ELSE
                v_result := 'void';
            END IF;

        ELSE
            v_result := 'void';
        END IF;

        -- Compute profit (win/loss only; push/void stay 0)
        IF v_result = 'win' THEN
            IF rec.odds > 0 THEN
                v_profit := ROUND(rec.amount * rec.odds / 100, 2);
            ELSIF rec.odds < 0 THEN
                v_profit := ROUND(rec.amount * 100 / ABS(rec.odds), 2);
            ELSE
                v_profit := rec.amount; -- even money
            END IF;
        ELSIF v_result = 'loss' THEN
            v_profit := -rec.amount;
        ELSE
            v_profit := 0;
        END IF;

        -- Update the pick
        UPDATE picks
        SET result = v_result,
            profit = v_profit,
            settled_at = NOW()
        WHERE id = rec.pick_id;

        -- Update bankroll for resolved picks
        IF v_result = 'win' THEN
            v_wins := 1; v_losses := 0; v_pushes := 0;
        ELSIF v_result = 'loss' THEN
            v_wins := 0; v_losses := 1; v_pushes := 0;
        ELSIF v_result = 'push' THEN
            v_wins := 0; v_losses := 0; v_pushes := 1;
        ELSE
            v_wins := 0; v_losses := 0; v_pushes := 0;
        END IF;

        IF v_result IN ('win', 'loss', 'push') THEN
            PERFORM adjust_bankroll(rec.user_id, v_profit, v_wins, v_losses, v_pushes);
        END IF;

        v_settled_count := v_settled_count + 1;
    END LOOP;

    INSERT INTO sync_logs (sports, status, metadata)
    VALUES (
        ARRAY[]::TEXT[],
        'settle_completed',
        jsonb_build_object(
            'trigger', 'pg_cron',
            'settled_picks', v_settled_count,
            'finished_at', NOW()
        )
    );

    RETURN 'settled_' || v_settled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
