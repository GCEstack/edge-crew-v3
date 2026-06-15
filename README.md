# Edge Crew v3.0

> Real-time sports analytics and betting intelligence platform

Edge Crew v3.0 is a hybrid, serverless-first stack that ingests upcoming sports slates, grades them with a multi-model AI panel, and exposes picks through a React SPA.

---

## Overall Architecture

```
┌─────────────────┐      ┌──────────────────────┐      ┌─────────────────────┐
│   Vite React    │◄────►│  Vercel Edge Routes  │◄────►│   Supabase Postgres │
│   (web/src)     │      │  /api/games          │      │   Auth / RLS        │
└─────────────────┘      │  /api/analyze        │      │   Realtime          │
                         │  /api/jobs/:id       │      └─────────────────────┘
                         └──────────────────────┘                ▲
                                                                  │
                                                   ┌──────────────┘
                                                   │  model_jobs / model_responses
                                         ┌─────────▼─────────┐
                                         │  AI Worker        │
                                         │  app/ai_worker.py │
                                         └───────────────────┘
```

### Layers

| Layer | Tech | Role |
|-------|------|------|
| **Frontend** | Vite + React + TypeScript + Tailwind | User interface, picks, parlays, profile |
| **Edge API** | Vercel Edge Functions (`web/api/*`) | Thin auth/data layer that talks to Supabase |
| **Database** | Supabase Postgres | Games, grades, picks, bankroll, jobs, heartbeats, Kalshi markets |
| **AI Worker** | Python 3.11 container on Fly.io | Polls `model_jobs`, runs the AI grading pipeline, writes results |
| **External data** | ESPN scoreboard, Kalshi | Free sports slate + props market feeds |

### Data Flow

1. **Slate fetch** — the AI worker calls ESPN scoreboards for today + tomorrow and stores games in `games`.
2. **Analysis job** — a user taps *Analyze* in the web app, which inserts a row into `model_jobs`.
3. **AI panel** — the worker runs a roster of models (Groq, xAI Grok, Perplexity, Moonshot Kimi, etc.) and a deterministic grade engine.
4. **Gatekeeper** — Moonshot Kimi acts as a final validation layer on non-fast runs.
5. **Results** — grades, model breakdowns, picks, and convergence are written to `grades` and `model_responses`.
6. **Display** — the frontend reads from Vercel edge routes and renders the slate.

---

## Repository Layout

```
edge-crew-v3/
├── app/                    # Python backend / worker modules
├── web/                    # Vite React frontend + Vercel Edge API routes
├── supabase/migrations/    # Postgres schema & cron jobs
├── docs/                   # Architecture notes, security review, secrets checklist
├── app/main.py             # Legacy monolith analysis pipeline (used by the worker)
├── app/ai_worker.py        # Long-running AI worker entrypoint
├── ai_models.py            # Model callers + Kimi gatekeeper
├── grade_engine.py         # Deterministic grading engine
├── data_fetch.py           # ESPN/team enrichment helpers
├── Dockerfile.worker       # AI worker container
├── fly.toml                # Fly.io worker config
└── vercel.json             # Vercel SPA + API route rules
```

---

## Quick Start

### 1. Environment

```bash
cp .env.example .env
# Edit .env with your Supabase URL, anon key, and service role key.
```

See [`.env.example`](.env.example) and [`docs/secrets-checklist.md`](docs/secrets-checklist.md) for the full list.

### 2. Database

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

Migrations live in `supabase/migrations/` and must be applied in order.

### 3. Web App

```bash
cd web
npm install
npm run build
```

See [`web/README.md`](web/README.md) for frontend details.

### 4. AI Worker

```bash
flyctl deploy --app edge-crew-ai-worker
```

See [`backend/README.md`](backend/README.md) for local dev, model roster, and monitoring.

---

## Key Capabilities

- **24-hour slate fetch** from ESPN scoreboards (today + tomorrow, filtered to next 24h).
- **Multi-provider AI panel** with Groq, xAI Grok, Perplexity, Moonshot Kimi, OpenRouter, DeepSeek, and Gemini.
- **Kimi gatekeeper** final-validation pass on full analysis runs.
- **Deterministic grade engine** combined with AI panel scores for convergence.
- **Picks, bankroll, gut picks, and bet-slip generation** via Supabase Edge Functions.
- **Worker monitoring** via `worker_heartbeats` + `edgecrew-monitor-worker` cron.
- **Kalshi props integration** that syncs open sports markets hourly.

---

## Deployment Checklist

- [ ] Create Supabase project and run `supabase db push`
- [ ] Set all required secrets in `.env` and in Vercel / Fly.io
- [ ] Deploy the web app to Vercel
- [ ] Deploy the AI worker to Fly.io with at least one model-provider key
- [ ] Verify worker heartbeat and Kalshi sync in `worker_heartbeats`
- [ ] Optionally set `WORKER_ALERT_WEBHOOK` for stale-worker alerts

---

## License

MIT
