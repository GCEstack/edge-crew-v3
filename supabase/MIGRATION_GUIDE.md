# Edge Crew v3.0 — Phase 0 Supabase Migration Guide

This directory contains the Supabase schema, RLS policies, and data migration scripts for moving Edge Crew from JSON file persistence to Supabase.

## Files

| File | Purpose |
|------|---------|
| `migrations/000_helpers.sql` | Helper functions (`update_updated_at_column`) |
| `migrations/001_schema.sql` | Full schema: enums, tables, partitions, indexes, views, triggers |
| `migrations/002_rls_policies.sql` | Row Level Security policies |
| `migrations/003_functions.sql` | `is_admin`, `calculate_pick_result`, line-movement trigger |
| `migrations/004_seed_reference.sql` | Sports config and bookmaker seed data |
| `config.toml` | Supabase CLI configuration |
| `functions/_shared/types.ts` | Shared TypeScript types for Edge Functions |

## Prerequisites

1. A Supabase project **dedicated to Edge Crew v3.0**.
   - Update `supabase/config.toml` with your project ref:
     ```bash
     supabase link --project-ref <your-project-ref>
     ```
   - The previous `config.toml` pointed to a different project; it has been reset to a placeholder.
2. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables.
3. Python dependencies installed: `pip install -r requirements.txt` (includes `supabase==2.3.1`).
   - If you are on Python 3.14 locally, install inside a Python 3.11 container/venv because some pinned packages (e.g. `pydantic-core==2.14.6`, `asyncpg==0.30.0`) do not have 3.14 wheels.
4. For local development: [Supabase CLI](https://supabase.com/docs/guides/cli) installed.

## Deploy Schema

### Option A: Via Supabase Dashboard

1. Open your Supabase project SQL Editor.
2. Run the migration files in order:
   - `000_helpers.sql`
   - `001_schema.sql`
   - `002_rls_policies.sql`
   - `003_functions.sql`
   - `004_seed_reference.sql`

### Option B: Via Supabase CLI

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## Migrate Data

Run the scripts in this order:

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# Optional: export PERSIST_DIR=/data   # defaults to /data or /tmp/ec8

python scripts/migrate_users.py
python scripts/migrate_picks.py
python scripts/migrate_locked_and_gut.py
```

### What each script does

- **`migrate_users.py`** — Creates Supabase Auth users for `peter`, `chinny`, `jimmy` and inserts corresponding `profiles` rows. `peter` gets `role = admin`.
- **`migrate_picks.py`** — Creates placeholder `games` rows for every `game_id` referenced in `picks.json`, then inserts all picks into the `picks` table.
- **`migrate_locked_and_gut.py`** — Migrates `locked_picks.json` and `gut_picks.json`, creating additional placeholder `games` rows as needed.

### Placeholder games

Because the legacy app did not persist a `games` table, the migration scripts create minimal `games` rows (`home_team = 'TBD'`, `away_team = 'TBD'`) to satisfy foreign keys. These will be backfilled by the data ingestion pipeline in later phases.

## Verify

```sql
-- Should show 3 profiles
SELECT username, role, current_bankroll FROM profiles;

-- Should show picks per user
SELECT p.username, COUNT(*) as picks
FROM profiles p
JOIN picks pk ON pk.user_id = p.id
GROUP BY p.username;

-- RLS check: run as anon key, should only see own data
SELECT * FROM picks;
```

## Next Steps

- Phase 1: Transpile the grade engine to `supabase/functions/grade`.
- Phase 2: Migrate user/pick/bankroll endpoints to Edge Functions.
- Phase 5: Wire the web client to Supabase Auth and replace PIN login.

## Rollback

If needed, reset the database:

```bash
supabase db reset
```

Or delete migrated data:

```sql
TRUNCATE picks, locked_games, gut_picks, games CASCADE;
DELETE FROM auth.users WHERE email LIKE '%@edgecrew.local';
```
