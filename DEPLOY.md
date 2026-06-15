# Edge Crew v3.0 — Deployment Guide

Architecture: **Vercel** (frontend + API routes) + **Supabase** (Postgres, Auth, Edge Functions, Realtime, pg_cron) + **Render/Railway** (containerized AI worker).

## 1. Supabase

### Create / link project
```bash
supabase login
supabase projects create edge-crew-v3 --org-id <your-org> --region us-east-1
supabase link --project-ref <your-project-ref>
```

### Deploy schema
```bash
supabase db push
```

### Create users
```bash
python scripts/migrate_users.py
```

Or create them manually in Supabase Auth, then insert matching rows into `profiles` (`peter` = admin).

### Get keys
```bash
supabase projects api-keys --project-ref <your-project-ref>
```

Set these in Vercel and the AI worker:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 2. Vercel (Frontend + API Routes)

### Deploy
```bash
cd web
vercel --prod
```

### Required environment variables
| Variable | Environment | Purpose |
|----------|-------------|---------|
| `SUPABASE_URL` | Production | Server-side Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | Server-side Supabase client |
| `VITE_SUPABASE_URL` | Production | Browser Supabase client |
| `VITE_SUPABASE_ANON_KEY` | Production | Browser Supabase client |

Optional:
- `VITE_API_URL` — dev proxy target only; not used in production.

### What gets deployed
- Vite SPA static files
- Vercel Edge API routes in `web/api/` (health, games, analyze, jobs, parlay, betslip, calibration, top-picks)
- PWA service worker

## 3. Supabase Edge Functions

Deploy the grade engine and auth-required API:
```bash
supabase functions deploy grade
supabase functions deploy api
```

Secrets are read from the linked project's env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).

## 4. AI Worker (Fly.io / Render / Railway)

The AI worker is the only long-running container. It polls `model_jobs`, runs the crowdsource AI pipeline, writes heartbeats, and syncs Kalshi sports markets.

### Build
```bash
docker build -f Dockerfile.worker -t edge-crew-ai-worker .
```

### Run locally
```bash
docker run -e SUPABASE_URL=https://... \
           -e SUPABASE_SERVICE_ROLE_KEY=... \
           -e GROQ_API_KEY=... \
           -e PERPLEXITY_API_KEY=... \
           -e OPENROUTER_API_KEY=... \
           -e DEEPSEEK_API_KEY=... \
           -e MOONSHOT_API_KEY=... \
           -e GROK_API_KEY=... \
           -e GEMINI_API_KEY=... \
           -e AI_WORKER_KALSHI_SYNC_INTERVAL=3600 \
           edge-crew-ai-worker
```

### Deploy on Fly.io
```bash
flyctl deploy
```

`fly.toml` in this repo configures the app (`edge-crew-ai-worker`), VM size, and environment variables.

### Deploy on Render / Railway
See previous versions of this guide; `render.yaml` and `railway.json` are still included for compatibility.

### Verify
Watch the worker logs. Submit an analysis job:
```bash
curl -X POST https://<your-vercel-domain>/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"sport":"nba","game_id":"<real-game-id>"}'
```

The worker should pick it up within `AI_WORKER_POLL_INTERVAL` seconds (default 5). A fresh heartbeat should appear in `worker_heartbeats` every `AI_WORKER_HEARTBEAT_INTERVAL` seconds.

## 5. Cron Jobs

Supabase `pg_cron` handles the daily/periodic jobs:
- `prewarm_slate()` at 06:00 UTC
- `settle_picks()` at 00:00 UTC — now fully resolves pending picks and updates bankrolls
- `sync_odds()` every 4 hours
- `check_worker_health()` every 5 minutes — alerts if the worker heartbeat goes stale

These are created by migrations `008_cron_jobs.sql`, `010_settle_picks_implementation.sql`, and `012_worker_monitoring.sql`.

## 6. DNS Cutover

When ready:
1. Point your domain's A/AAAA or CNAME records to Vercel.
2. Add the custom domain in Vercel project settings.
3. Update `API_BASE_URL` for Flutter builds to the production domain.

## 7. Smoke Tests

- `GET /api/health` → `{"status":"ok"}`
- `GET /api/games?sport=nba` → games list
- `POST /api/analyze` → `{ job_id, status_url, status }`
- Edge Function `POST /functions/v1/grade` → grade result

## Cost Estimate (Monthly)

| Component | Service | Est. Cost |
|-----------|---------|-----------|
| Frontend + API | Vercel Pro | $20 |
| Database + Auth + Functions | Supabase Pro | $25 |
| AI Worker | Render Standard / Railway | $25–$85 |
| AI model APIs | Azure/OpenRouter/etc. | usage-based |
| **Total** | | **~$70–$130 + AI usage** |

Much lower than the previous GKE stack (~$433/month).
