#!/usr/bin/env python3
"""
Migrate Edge Crew v3.0 locked_picks.json and gut_picks.json to Supabase.

Environment variables:
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    PERSIST_DIR (optional, defaults to /data or /tmp/ec8)
"""

import json
import os
import sys
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
    aliases = {
        "basketball": "nba",
        "hockey": "nhl",
        "baseball": "mlb",
        "football": "nfl",
        "college_basketball": "ncaab",
        "college_football": "ncaaf",
    }
    return aliases.get(sport)


def ensure_games(supabase, game_ids: set[str], sport_lookup: dict[str, str]) -> None:
    """Create placeholder games rows for game_ids not already present."""
    if not game_ids:
        return

    existing_resp = supabase.table("games").select("id").in_("id", list(game_ids)).execute()
    existing_ids = {g["id"] for g in existing_resp.data or []}
    missing = game_ids - existing_ids

    if not missing:
        return

    games = []
    for game_id in missing:
        sport = sport_lookup.get(game_id)
        if not sport:
            continue
        games.append(
            {
                "id": game_id,
                "sport": sport,
                "home_team": "TBD",
                "away_team": "TBD",
                "scheduled_at": datetime.now(timezone.utc).isoformat(),
                "status": "scheduled",
            }
        )

    if not games:
        return

    try:
        supabase.table("games").upsert(games).execute()
        print(f"Ensured {len(games)} placeholder games for locked/gut.")
    except Exception as e:
        print(f"Warning: failed to ensure games: {e}", file=sys.stderr)


def main() -> None:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    profiles_resp = supabase.table("profiles").select("id, username").execute()
    username_to_id = {p["username"]: p["id"] for p in profiles_resp.data or []}

    # ------------------------------------------------------------------
    # Locked game IDs
    # ------------------------------------------------------------------
    locked_by_user = load_json("locked_picks.json", {})
    locked_batch: list[dict[str, Any]] = []
    locked_created = 0
    locked_failed = 0

    # Build a game_id -> sport lookup from existing picks to backfill sport.
    picks_resp = supabase.table("picks").select("game_id, sport").execute()
    game_sport_lookup = {p["game_id"]: p["sport"] for p in picks_resp.data or []}

    seen_locked = set()
    for username, game_ids in locked_by_user.items():
        user_id = username_to_id.get(username)
        if not user_id:
            print(f"Warning: no profile for {username}, skipping {len(game_ids)} locked games.", file=sys.stderr)
            continue
        for game_id in game_ids:
            key = (user_id, str(game_id))
            if key in seen_locked:
                continue
            seen_locked.add(key)
            sport = game_sport_lookup.get(game_id)
            locked_batch.append(
                {
                    "user_id": user_id,
                    "game_id": str(game_id),
                    "sport": sport,
                }
            )

    # ------------------------------------------------------------------
    # Gut picks
    # ------------------------------------------------------------------
    gut_entries = load_json("gut_picks.json", [])
    gut_batch: list[dict[str, Any]] = []
    gut_created = 0
    gut_failed = 0

    seen_gut = set()
    for entry in gut_entries:
        username = entry.get("username", "").lower()
        user_id = username_to_id.get(username)
        if not user_id:
            print(f"Warning: no profile for {username}, skipping gut pick.", file=sys.stderr)
            continue

        sport = normalize_sport(entry.get("sport"))
        if not sport:
            print(f"Skipping gut pick with unknown sport for {username}: {entry}", file=sys.stderr)
            continue

        pick_date = entry.get("date")
        if not pick_date:
            # Try to parse from timestamp
            ts = entry.get("timestamp")
            if ts:
                try:
                    pick_date = datetime.fromisoformat(ts).date().isoformat()
                except Exception:
                    pick_date = datetime.now(timezone.utc).date().isoformat()
            else:
                pick_date = datetime.now(timezone.utc).date().isoformat()

        game_id = str(entry["game_id"])

        key = (user_id, sport, pick_date)
        if key in seen_gut:
            continue
        seen_gut.add(key)

        gut_batch.append(
            {
                "user_id": user_id,
                "game_id": game_id,
                "sport": sport,
                "pick_side": str(entry.get("pick_side", "")),
                "engine_pick_side": str(entry.get("engine_pick_side", "")),
                "pick_date": pick_date,
            }
        )
        # Update sport lookup with gut game sports for placeholder game creation.
        if game_id not in game_sport_lookup:
            game_sport_lookup[game_id] = sport

    # Ensure all referenced games exist before inserting locked/gut rows (FK integrity).
    all_game_ids = {row["game_id"] for row in locked_batch + gut_batch}
    ensure_games(supabase, all_game_ids, game_sport_lookup)

    if locked_batch:
        try:
            supabase.table("locked_games").upsert(locked_batch).execute()
            locked_created = len(locked_batch)
            print(f"Upserted {locked_created} locked games.")
        except Exception as e:
            print(f"Failed to upsert locked games: {e}", file=sys.stderr)
            locked_failed = len(locked_batch)

    if gut_batch:
        try:
            supabase.table("gut_picks").upsert(gut_batch).execute()
            gut_created = len(gut_batch)
            print(f"Upserted {gut_created} gut picks.")
        except Exception as e:
            print(f"Failed to upsert gut picks: {e}", file=sys.stderr)
            gut_failed = len(gut_batch)

    print(
        f"\nMigration complete:\n"
        f"  Locked games: {locked_created} created, {locked_failed} failed\n"
        f"  Gut picks:    {gut_created} created, {gut_failed} failed"
    )
    if locked_failed or gut_failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
