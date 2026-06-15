#!/usr/bin/env python3
"""
Migrate Edge Crew v3.0 picks from JSON file to Supabase picks table.

Environment variables:
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    PERSIST_DIR (optional, defaults to /data or /tmp/ec8)
"""

import json
import os
import sys
import uuid
from datetime import datetime, timezone
from typing import Any

from supabase import create_client

PERSIST_DIR = os.environ.get("PERSIST_DIR") or ("/data" if os.path.exists("/data") else "/tmp/ec8")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

SPORTS = {
    "nba", "nhl", "mlb", "nfl", "ncaab", "ncaaf",
    "soccer", "mma", "boxing", "golf", "wnba", "tennis",
}

RESULT_MAP = {"W": "win", "L": "loss", "P": "push", "pending": "pending"}
CONVERGENCE_MAP = {
    "LOCK": "aligned",
    "ALIGNED": "aligned",
    "CLOSE": "uncertain",
    "SPLIT": "divergent",
    "CONFLICT": "divergent",
    "PENDING": "pending",
}
VALID_GRADES = {
    "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"
}

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.", file=sys.stderr)
    sys.exit(1)


def load_json(filename: str, default: Any) -> Any:
    path = os.path.join(PERSIST_DIR, filename)
    if not os.path.exists(path):
        print(f"Warning: {path} not found, using empty default.", file=sys.stderr)
        return default
    with open(path) as f:
        return json.load(f)


def normalize_sport(value: Any) -> str | None:
    if not value:
        return None
    sport = str(value).lower().strip()
    if sport in SPORTS:
        return sport
    # Common aliases
    aliases = {
        "basketball": "nba",
        "hockey": "nhl",
        "baseball": "mlb",
        "football": "nfl",
        "college_basketball": "ncaab",
        "college_football": "ncaaf",
    }
    return aliases.get(sport)


def map_side(team_value: Any, pick_type: str) -> str | None:
    """Map the legacy 'team' field (which is actually side) to pick_side_enum."""
    if not team_value:
        return None
    side = str(team_value).lower().strip()
    if side in {"home", "away", "over", "under", "draw", "btts_yes", "btts_no"}:
        return side
    # Fallback: infer from pick type
    if pick_type == "total":
        return "over"  # Best-effort default; audit in pick_data
    return "home"  # Best-effort default; audit in pick_data


def parse_iso(value: Any) -> str | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def transform_pick(username: str, user_id: str, pick: dict[str, Any]) -> dict[str, Any] | None:
    sport = normalize_sport(pick.get("sport"))
    if not sport:
        print(f"Skipping pick with unknown sport for {username}: {pick}", file=sys.stderr)
        return None

    pick_type = str(pick.get("type", "spread")).lower()
    if pick_type not in {"spread", "ml", "total", "btts"}:
        pick_type = "spread"

    side = map_side(pick.get("team"), pick_type)
    if not side:
        side = "home"

    result = RESULT_MAP.get(str(pick.get("result", "pending")).upper(), "pending")

    convergence = str(pick.get("convergence_status", "PENDING")).upper()
    convergence_status = CONVERGENCE_MAP.get(convergence, "pending")

    grade = pick.get("grade")
    if grade not in VALID_GRADES:
        grade = None

    # Preserve legacy pick id inside pick_data; assign a real UUID for the new schema.
    legacy_id = pick.get("id")
    if legacy_id and "legacy_id" not in pick:
        pick = {**pick, "legacy_id": legacy_id}

    return {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "game_id": str(pick["game_id"]),
        "sport": sport,
        "team": str(pick.get("team", side)),
        "side": side,
        "pick_type": pick_type,
        "line": pick.get("line"),
        "amount": pick.get("amount", 0),
        "odds": pick.get("odds", -110),
        "grade": grade,
        "result": result,
        "profit": pick.get("profit", 0),
        "notes": pick.get("notes"),
        "locked_at": parse_iso(pick.get("locked_at")) or datetime.now(timezone.utc).isoformat(),
        "settled_at": parse_iso(pick.get("settled_at")),
        "engine_score": pick.get("engine_score"),
        "consensus_score": pick.get("consensus_score"),
        "convergence_status": convergence_status,
        "pick_data": pick,
    }


def ensure_games(supabase, picks_by_user: dict[str, list]) -> dict[str, str]:
    """Create placeholder games rows for every game_id referenced in picks.
    Returns a mapping of game_id -> sport."""
    game_sports: dict[str, str] = {}
    for picks in picks_by_user.values():
        for pick in picks:
            sport = normalize_sport(pick.get("sport"))
            if sport:
                game_sports[str(pick["game_id"])] = sport

    if not game_sports:
        return game_sports

    games = [
        {
            "id": game_id,
            "sport": sport,
            "home_team": "TBD",
            "away_team": "TBD",
            "scheduled_at": datetime.now(timezone.utc).isoformat(),
            "status": "scheduled",
        }
        for game_id, sport in game_sports.items()
    ]

    try:
        # Upsert to avoid conflicts if games already exist.
        supabase.table("games").upsert(games).execute()
        print(f"Ensured {len(games)} placeholder games.")
    except Exception as e:
        print(f"Warning: failed to ensure games: {e}", file=sys.stderr)

    return game_sports


def main() -> None:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    picks_by_user = load_json("picks.json", {})

    # Load username -> user_id mapping
    profiles_resp = supabase.table("profiles").select("id, username").execute()
    username_to_id = {p["username"]: p["id"] for p in profiles_resp.data or []}

    # Ensure games rows exist for FK integrity
    ensure_games(supabase, picks_by_user)

    batch: list[dict[str, Any]] = []
    batch_size = 500
    created = 0
    skipped = 0
    failed = 0

    for username, picks in picks_by_user.items():
        user_id = username_to_id.get(username)
        if not user_id:
            print(f"Warning: no profile for {username}, skipping {len(picks)} picks.", file=sys.stderr)
            skipped += len(picks)
            continue

        for pick in picks:
            transformed = transform_pick(username, user_id, pick)
            if not transformed:
                skipped += 1
                continue
            batch.append(transformed)

            if len(batch) >= batch_size:
                try:
                    supabase.table("picks").insert(batch).execute()
                    created += len(batch)
                    print(f"Inserted {len(batch)} picks...")
                except Exception as e:
                    print(f"Failed to insert batch of {len(batch)} picks: {e}", file=sys.stderr)
                    failed += len(batch)
                batch = []

    if batch:
        try:
            supabase.table("picks").insert(batch).execute()
            created += len(batch)
            print(f"Inserted {len(batch)} picks...")
        except Exception as e:
            print(f"Failed to insert final batch of {len(batch)} picks: {e}", file=sys.stderr)
            failed += len(batch)

    print(f"\nMigration complete: {created} created, {skipped} skipped, {failed} failed.")
    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
