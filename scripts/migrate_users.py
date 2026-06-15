#!/usr/bin/env python3
"""
Migrate Edge Crew v3.0 users from JSON file to Supabase auth.users + profiles.

Environment variables:
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    PERSIST_DIR (optional, defaults to /data or /tmp/ec8)
"""

import json
import os
import sys
from typing import Any

from supabase import create_client

PERSIST_DIR = os.environ.get("PERSIST_DIR") or ("/data" if os.path.exists("/data") else "/tmp/ec8")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.", file=sys.stderr)
    sys.exit(1)


def load_users() -> dict[str, Any]:
    path = os.path.join(PERSIST_DIR, "users.json")
    default = {
        "peter": {"name": "Peter", "pin": "0000", "bankroll": {"starting": 490, "current": 490, "wagered": 0, "profit": 0, "wins": 0, "losses": 0, "pushes": 0}},
        "chinny": {"name": "Chinny", "pin": "0000", "bankroll": {"starting": 1000, "current": 1000, "wagered": 0, "profit": 0, "wins": 0, "losses": 0, "pushes": 0}},
        "jimmy": {"name": "Jimmy", "pin": "0000", "bankroll": {"starting": 1000, "current": 1000, "wagered": 0, "profit": 0, "wins": 0, "losses": 0, "pushes": 0}},
    }
    if not os.path.exists(path):
        print(f"Warning: {path} not found, using defaults.", file=sys.stderr)
        return default
    with open(path) as f:
        return json.load(f)


def main() -> None:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    users = load_users()

    created = 0
    skipped = 0
    failed = 0

    for username, data in users.items():
        email = f"{username}@edgecrew.local"
        display_name = data.get("name", username.title())
        role = "admin" if username.lower() == "peter" else "user"
        bankroll = data.get("bankroll", {})

        # Check if auth user already exists
        existing = (
            supabase.table("profiles")
            .select("id")
            .eq("username", username)
            .maybe_single()
            .execute()
        )
        if existing.data:
            print(f"Skipping existing user: {username}")
            skipped += 1
            continue

        user_id = None
        try:
            auth_resp = supabase.auth.admin.create_user(
                {
                    "email": email,
                    "email_confirm": True,
                    "user_metadata": {"username": username, "name": display_name},
                }
            )
            user_id = auth_resp.user.id

            supabase.table("profiles").insert(
                {
                    "id": user_id,
                    "username": username,
                    "display_name": display_name,
                    "role": role,
                    "starting_bankroll": bankroll.get("starting", 1000),
                    "current_bankroll": bankroll.get("current", 1000),
                    "total_wagered": bankroll.get("wagered", 0),
                    "total_profit": bankroll.get("profit", 0),
                    "wins": bankroll.get("wins", 0),
                    "losses": bankroll.get("losses", 0),
                    "pushes": bankroll.get("pushes", 0),
                }
            ).execute()

            print(f"Created user: {username} ({user_id})")
            created += 1
        except Exception as e:
            print(f"Failed to create user {username}: {e}", file=sys.stderr)
            if user_id:
                try:
                    supabase.auth.admin.delete_user(user_id)
                    print(f"  Rolled back auth user {user_id}")
                except Exception as rollback_err:
                    print(f"  Could not roll back auth user {user_id}: {rollback_err}", file=sys.stderr)
            failed += 1

    print(f"\nMigration complete: {created} created, {skipped} skipped, {failed} failed.")
    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
