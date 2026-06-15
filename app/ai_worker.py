"""
Edge Crew AI Worker
-------------------
Containerized long-running worker that polls the Supabase `model_jobs` table,
calls the existing AI analysis pipeline from `app.main`, and persists per-model
responses + converged grades back to Postgres. Results stream to the frontend
via Supabase Realtime because `model_responses` and `model_jobs` are published.

Run inside the same Docker image as the monolith:
    python app/ai_worker.py

Required env vars:
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
"""

import asyncio
import hashlib
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

# Allow importing `app.main` when this script is executed directly.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client, Client

from app.main import _analyze_games_impl, AnalyzeRequest
from app.kalshi_client import sync_kalshi_markets

logger = logging.getLogger("edge-crew-ai-worker")
logging.basicConfig(level=logging.INFO)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
POLL_INTERVAL_SECONDS = float(os.environ.get("AI_WORKER_POLL_INTERVAL", "5"))
JOB_TIMEOUT_SECONDS = float(os.environ.get("AI_WORKER_JOB_TIMEOUT", "600"))

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _canonical_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, default=str, separators=(",", ":"))


def _json_safe(obj: Any) -> Any:
    """Return a JSON-serializable copy of obj (converts datetimes, sets, etc.)."""
    return json.loads(_canonical_json(obj))


def _compute_odds_hash(game: Dict[str, Any]) -> str:
    """Stable hash of the odds snapshot so identical lines can be cached."""
    odds = game.get("odds") or {}
    if not odds:
        # Fallback to a structural hash of the game identifiers
        payload = {
            "home": game.get("homeTeam") or game.get("home_team"),
            "away": game.get("awayTeam") or game.get("away_team"),
            "scheduled": game.get("scheduledAt") or game.get("scheduled_at"),
        }
    else:
        payload = odds
    return hashlib.md5(_canonical_json(payload).encode("utf-8")).hexdigest()


def _map_convergence_status(status: Optional[str]) -> str:
    if not status:
        return "uncertain"
    s = status.upper()
    if s in ("LOCK", "ALIGNED"):
        return "aligned"
    if s == "CLOSE":
        return "uncertain"
    if s in ("SPLIT", "CONFLICT"):
        return "divergent"
    return "uncertain"


VALID_GRADES = {"A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"}

# Feature flags cached in memory and refreshed each job cycle.
_feature_flags: Dict[str, bool] = {}

# Shared worker state for heartbeats.
_worker_state: Dict[str, Any] = {
    "status": "idle",
    "last_job_id": None,
    "last_error": None,
}

WORKER_NAME = os.environ.get("AI_WORKER_NAME", "edge-crew-ai-worker")
HEARTBEAT_INTERVAL_SECONDS = float(os.environ.get("AI_WORKER_HEARTBEAT_INTERVAL", "60"))
KALSHI_SYNC_INTERVAL_SECONDS = float(os.environ.get("AI_WORKER_KALSHI_SYNC_INTERVAL", "3600"))


def _refresh_feature_flags(supabase: Client) -> Dict[str, bool]:
    """Read feature_flags table into a simple dict. Fail open (default False)."""
    global _feature_flags
    try:
        response = supabase.table("feature_flags").select("key, value").execute()
        rows = response.data or []
        _feature_flags = {row["key"]: bool(row["value"]) for row in rows}
        logger.debug(f"[FLAGS] refreshed: {_feature_flags}")
    except Exception as e:
        logger.warning(f"[FLAGS] could not refresh feature flags: {e}")
    return _feature_flags


def _model_row(game_id: str, sport: str, odds_hash: str, model: Dict[str, Any]) -> Dict[str, Any]:
    grade = model.get("grade")
    if grade not in VALID_GRADES:
        grade = None
    return {
        "game_id": game_id,
        "sport": sport,
        "odds_hash": odds_hash,
        "model_name": model.get("model", "unknown"),
        "grade": grade,
        "score": model.get("score"),
        "confidence": model.get("confidence"),
        "pick": model.get("pick"),
        "thesis": model.get("thesis"),
        "reasoning": json.dumps(model.get("key_factors") or []),
        "source": model.get("source", "real"),
    }


def _grade_row(sport: str, game: Dict[str, Any], odds_hash: str) -> Optional[Dict[str, Any]]:
    our_grade = game.get("ourGrade") or {}
    ai_grade = game.get("aiGrade") or {}
    convergence = game.get("convergence") or {}

    our_score = our_grade.get("score")
    ai_score = ai_grade.get("score")
    consensus_score = convergence.get("consensusScore")

    if our_score is None and ai_score is None:
        return None

    def _conf(v: Any) -> Optional[float]:
        if v is None:
            return None
        try:
            return max(0.0, min(1.0, float(v) / 100.0))
        except (TypeError, ValueError):
            return None

    return {
        "time": _now(),
        "game_id": game.get("id"),
        "our_score": our_score,
        "ai_score": ai_score,
        "consensus_score": consensus_score,
        "our_confidence": _conf(our_grade.get("confidence")),
        "ai_confidence": _conf(ai_grade.get("confidence")),
        "consensus_confidence": _conf(convergence.get("consensusConfidence") or ai_grade.get("confidence")),
        "convergence_status": _map_convergence_status(convergence.get("status")),
        "grade_letter": convergence.get("consensusGrade") or ai_grade.get("grade"),
        "model_breakdown": game.get("aiModels") or [],
        "metadata": {
            "odds_hash": odds_hash,
            "gatekeeper": game.get("gatekeeper"),
            "pick": game.get("pick"),
            "total_pick": game.get("total_pick"),
            "sport": sport,
        },
    }


def _game_row(game: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Normalize an analyzed game dict into the games table schema."""
    game_id = game.get("id")
    if not game_id:
        return None
    sport = (game.get("sport") or "").lower()
    status = (game.get("status") or "scheduled").lower()
    if status not in ("scheduled", "live", "completed", "postponed", "cancelled"):
        status = "scheduled"
    scheduled = game.get("scheduledAt") or game.get("scheduled_at")
    if not scheduled:
        scheduled = datetime.now(timezone.utc).isoformat()
    return {
        "id": game_id,
        "odds_api_id": game.get("oddsApiId") or game.get("odds_api_id"),
        "sport": sport,
        "home_team": game.get("homeTeam") or game.get("home_team"),
        "away_team": game.get("awayTeam") or game.get("away_team"),
        "scheduled_at": scheduled,
        "status": status,
        "league": game.get("league"),
    }


def _persist_games(supabase: Client, sport: str, games: List[Dict[str, Any]]) -> None:
    """Write games, model_responses, and a grades snapshot for each analyzed game."""
    game_rows = [_game_row(g) for g in games]
    game_rows = [r for r in game_rows if r]

    if game_rows:
        supabase.table("games").upsert(game_rows, on_conflict="id").execute()
        logger.info(f"[PERSIST] {len(game_rows)} game rows")

    model_rows: List[Dict[str, Any]] = []
    grade_rows: List[Dict[str, Any]] = []

    for game in games:
        game_id = game.get("id")
        if not game_id:
            continue
        odds_hash = _compute_odds_hash(game)
        for model in game.get("aiModels") or []:
            if not model.get("model"):
                continue
            model_rows.append(_model_row(game_id, sport, odds_hash, model))
        grade = _grade_row(sport, game, odds_hash)
        if grade:
            grade_rows.append(grade)

    if model_rows:
        # Upsert on the cache index so repeated identical odds don't duplicate rows.
        # On conflict we keep the newest response.
        supabase.table("model_responses").upsert(
            model_rows,
            on_conflict="game_id,model_name,odds_hash",
        ).execute()
        logger.info(f"[PERSIST] {len(model_rows)} model response rows")

    if grade_rows:
        supabase.table("grades").insert(grade_rows).execute()
        logger.info(f"[PERSIST] {len(grade_rows)} grade rows")


async def _write_heartbeat(supabase: Client) -> None:
    """Persist the current worker state to Supabase."""
    try:
        payload = {
            "worker_name": WORKER_NAME,
            "status": _worker_state["status"],
            "last_job_id": _worker_state.get("last_job_id"),
            "metadata": _json_safe({
                "poll_interval": POLL_INTERVAL_SECONDS,
                "job_timeout": JOB_TIMEOUT_SECONDS,
                "last_error": _worker_state.get("last_error"),
            }),
        }
        supabase.rpc("record_worker_heartbeat", payload).execute()
    except Exception as e:
        logger.warning(f"[HEARTBEAT] Failed to write heartbeat: {e}")


async def _heartbeat_loop(supabase: Client) -> None:
    """Background task that writes a heartbeat every N seconds."""
    while True:
        await _write_heartbeat(supabase)
        await asyncio.sleep(HEARTBEAT_INTERVAL_SECONDS)


async def _run_job(supabase: Client, job: Dict[str, Any]) -> None:
    job_id = job["id"]
    sport = job["sport"]
    game_id = job.get("game_id")
    league = job.get("league")
    fast = bool(job.get("fast", False))

    _worker_state["status"] = "processing"
    _worker_state["last_job_id"] = job_id
    _worker_state["last_error"] = None
    await _write_heartbeat(supabase)

    flags = _refresh_feature_flags(supabase)
    if flags.get("FAST_MODE"):
        fast = True

    if not flags.get("USE_REAL_AI", True):
        raise RuntimeError("USE_REAL_AI flag is disabled; skipping real model calls")

    logger.info(f"[JOB {job_id}] Starting analysis sport={sport} game_id={game_id} fast={fast}")

    supabase.table("model_jobs").update({
        "status": "running",
        "started_at": _now(),
        "error_message": None,
    }).eq("id", job_id).execute()

    request = AnalyzeRequest(
        sport=sport,
        game_id=game_id,
        league=league,
        fast=fast,
    )

    try:
        result = await asyncio.wait_for(_analyze_games_impl(request), timeout=JOB_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        raise RuntimeError(f"Analysis timed out after {JOB_TIMEOUT_SECONDS}s")

    # `_analyze_games_impl` returns either a list of enriched games or an error dict.
    if isinstance(result, dict) and result.get("error"):
        raise RuntimeError(result.get("error"))

    games = result if isinstance(result, list) else []
    if not games:
        raise RuntimeError("No games returned from analysis")

    _persist_games(supabase, sport, games)

    supabase.table("model_jobs").update({
        "status": "completed",
        "result": _json_safe({"games": games, "count": len(games)}),
        "completed_at": _now(),
        "error_message": None,
    }).eq("id", job_id).execute()

    logger.info(f"[JOB {job_id}] Completed with {len(games)} games")


async def _process_pending_jobs(supabase: Client) -> None:
    # Lock-style claim: grab one pending job ordered by creation time.
    response = (
        supabase.table("model_jobs")
        .select("*")
        .eq("status", "pending")
        .order("created_at")
        .limit(1)
        .execute()
    )
    jobs = response.data or []
    if not jobs:
        _worker_state["status"] = "idle"
        return

    job = jobs[0]
    job_id = job["id"]

    # Best-effort claim to avoid multiple workers picking up the same job.
    try:
        claim = (
            supabase.table("model_jobs")
            .update({"status": "running", "started_at": _now()})
            .eq("id", job_id)
            .eq("status", "pending")
            .execute()
        )
        if not claim.data:
            logger.info(f"[JOB {job_id}] Already claimed by another worker")
            return
    except Exception as e:
        logger.warning(f"[JOB {job_id}] Claim failed: {e}")
        return

    try:
        await _run_job(supabase, job)
    except Exception as e:
        logger.exception(f"[JOB {job_id}] Failed")
        _worker_state["status"] = "error"
        _worker_state["last_error"] = str(e)[:500]
        try:
            supabase.table("model_jobs").update({
                "status": "failed",
                "error_message": str(e)[:500],
                "completed_at": _now(),
            }).eq("id", job_id).execute()
        except Exception as inner:
            logger.error(f"[JOB {job_id}] Could not record failure: {inner}")


async def _kalshi_sync_loop(supabase: Client) -> None:
    """Background task that periodically syncs Kalshi sports markets."""
    if KALSHI_SYNC_INTERVAL_SECONDS <= 0:
        logger.info("[KALSHI] Sync disabled")
        return

    # Wait a bit on startup so the worker can claim any immediate jobs first.
    await asyncio.sleep(30)

    while True:
        try:
            await sync_kalshi_markets(supabase)
        except Exception:
            logger.exception("[KALSHI] Sync failed")
        await asyncio.sleep(KALSHI_SYNC_INTERVAL_SECONDS)


async def main_loop() -> None:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    logger.info("AI worker started")

    # Start background tasks.
    heartbeat_task = asyncio.create_task(_heartbeat_loop(supabase))
    kalshi_task = asyncio.create_task(_kalshi_sync_loop(supabase))

    try:
        while True:
            try:
                await _process_pending_jobs(supabase)
            except Exception:
                logger.exception("Error processing jobs")
            await asyncio.sleep(POLL_INTERVAL_SECONDS)
    finally:
        heartbeat_task.cancel()
        kalshi_task.cancel()
        for task in (heartbeat_task, kalshi_task):
            try:
                await task
            except asyncio.CancelledError:
                pass


if __name__ == "__main__":
    asyncio.run(main_loop())
