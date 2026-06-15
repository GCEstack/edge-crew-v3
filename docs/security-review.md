# Edge Crew v3.0 — Security Review

Date: 2026-06-13
Scope: Vercel frontend, Supabase (Postgres / Auth / Edge Functions / Realtime), Fly.io AI worker, Kalshi public API integration.

## Findings Summary

| Area | Status | Notes |
|------|--------|-------|
| Secrets in source | ✅ Clean | `.env` and `web/.env` are gitignored; no live keys in committed code. |
| `.env.example` keys | ⚠️ Example values | The example files contain placeholder/example JWTs. Rotate if they were ever real. |
| Supabase RLS | ✅ Enforced | Profiles/picks/locked_games are user-scoped; games/Kalshi markets are public read. |
| Service role usage | ✅ Server-side only | Used by Vercel Edge routes, AI worker, and migration scripts only. |
| Auth passwords | ⚠️ Weak default | All crew accounts reset to PIN `0000` (stored as `000000` due to Supabase min-length). Change after handoff if desired. |
| Kalshi API | ✅ Read-only public | No credentials required for market snapshots. |
| Worker heartbeat | ✅ Monitored | `worker_heartbeats` + `check_worker_health()` cron detect stale/crashed workers. |
| Settlement cron | ✅ Real implementation | `settle_picks()` now resolves picks and adjusts bankrolls atomically. |

## Detailed Notes

### Authentication

- The frontend no longer gates the entire app behind login. Games and top picks are public; picks, parlay, and profile require login.
- Crew auth users (`peter`, `chinny`, `jimmy`) exist in Supabase Auth with email `<name>@edgecrew.local`.
- The PIN login pads a 4-digit entry to 6 characters because Supabase Auth enforces a 6-character minimum password. The effective PIN is `0000`.

### Row Level Security

- `profiles`, `picks`, `locked_games`, `gut_picks`: user-scoped SELECT/UPDATE.
- `games`, `teams`, `bookmakers`, `sports_config`, `edge_opportunities`, `kalshi_markets`: public read.
- `odds_history`, `grades`, `model_responses`, `model_performance`, `line_movements`, `calibration_snapshots`, `dynamic_weights`, `sync_logs`: service-role or authenticated read.

### Environment Variables

Required in production:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- At least one AI provider key (currently `GROQ_API_KEY` is primary; `MOONSHOT_API_KEY` and `GROK_API_KEY` are also live)
- `GEMINI_API_KEY` is saved but currently denied/quota-limited

Recommended:

- `AI_WORKER_HEARTBEAT_INTERVAL=60`
- `AI_WORKER_KALSHI_SYNC_INTERVAL=3600`
- `WORKER_ALERT_WEBHOOK` for stale-worker notifications

### Recommendations

1. Rotate `SUPABASE_SERVICE_ROLE_KEY` and all AI provider keys if the `.env.example` values were ever live.
2. Change crew PINs from the default `0000` once all users have logged in successfully.
3. Enable Supabase MFA for admin accounts if the project grows beyond the core crew.
4. Review `kalshi_markets.raw_payload` retention; it stores the full API response and may grow over time.
5. Consider enabling Sentry (`SENTRY_DSN`) for frontend and worker error tracking.

## Verification Commands

```bash
# Confirm no unignored .env files are staged
git status --short

# List active cron jobs
supabase db query --linked "SELECT jobname, schedule, active FROM cron.job;"

# Check latest worker heartbeat
supabase db query --linked "SELECT worker_name, status, beat_at FROM worker_heartbeats ORDER BY beat_at DESC LIMIT 1;"

# Count unsettled pending picks
supabase db query --linked "SELECT COUNT(*) FROM picks WHERE result = 'pending';"
```
