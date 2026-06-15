# Edge Crew — Backend & AI Worker

This directory covers the Python backend for Edge Crew v3.0. The production runtime is a containerized, long-running AI worker that polls Supabase for analysis jobs and runs the full grading pipeline.

> **Note:** The legacy FastAPI monolith code is still present in `app/main.py`; today it is imported and driven by `app/ai_worker.py` rather than serving HTTP traffic directly.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AI Worker                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  main_loop   │  │ heartbeat    │  │ Kalshi sync loop     │  │
│  │  (model_jobs)│  │ (60s)        │  │ (AI_WORKER_KALSHI_   │  │
│  └──────┬───────┘  │              │  │  SYNC_INTERVAL)      │  │
│         │          └──────────────┘  └──────────────────────┘  │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  _analyze_games_impl()                                  │   │
│  │  - fetch ESPN slate (today + tomorrow, ≤24h window)     │   │
│  │  - enrich games (team profiles, injuries, weather)      │   │
│  │  - run deterministic grade engine                       │   │
│  │  - run AI panel (Groq, Grok, Perplexity, etc.)          │   │
│  │  - Moonshot Kimi gatekeeper (skipped in fast mode)      │   │
│  │  - write grades + model_responses                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Files

| File | Responsibility |
|------|----------------|
| `app/ai_worker.py` | Worker entrypoint, polling loops, heartbeat, Kalshi sync |
| `app/main.py` | Analysis pipeline, model roster, ESPN/Kalshi fetch, grade orchestration |
| `ai_models.py` | Provider clients, retry logic, Kimi gatekeeper |
| `grade_engine.py` | Deterministic grading, EV calculation, sport-specific rules |
| `data_fetch.py` | ESPN scoreboard mapping, team-profile enrichment, soccer league lookups |
| `data_fetch_mlb.py` | MLB-specific data (pitchers, park factors, bullpen) |
| `app/kalshi_client.py` | Kalshi open-market sync for sports props |
| `dynamic_weights.py` | Model weighting / confidence blending |
| `forecaster_scoring.py` | Forecaster evaluation utilities |
| `filter_mastermind.py` | Pick filtering / mastermind logic |

---

## Data Flow

1. **Job picked up** — `app/ai_worker.py` polls `model_jobs` where `status = 'pending'`.
2. **Slate fetched** — `_fetch_games_from_espn()` requests ESPN scoreboards for today and tomorrow, keeping only games in the next 24 hours.
3. **Enrichment** — `data_fetch.py` / `data_fetch_mlb.py` add team profiles, injuries, weather, and betting context.
4. **Engine grade** — `grade_engine.py` produces a deterministic grade for each side/total.
5. **AI panel** — each model in `REAL_AI_MODELS` is called in parallel batches; results land in `model_responses`.
6. **Convergence** — engine + AI scores are blended into a consensus grade and pick.
7. **Gatekeeper** — `kimi_gatekeeper()` (Moonshot Kimi) validates or challenges the consensus on non-fast runs.
8. **Persistence** — final grade, pick, model breakdown, and gatekeeper verdict are written to `grades`.

---

## AI Model Roster

| Provider | Model ID | Role | Status |
|----------|----------|------|--------|
| **Groq** | `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`, `qwen/qwen3-32b`, `openai/gpt-oss-120b` | Fast primary panel | ✅ Live |
| **xAI** | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`, `grok-4.3`, `grok-build-0.1` | Grok roster | ✅ Live |
| **Perplexity** | `sonar` | Web-aware reasoning | ✅ Live |
| **Moonshot** | `kimi-k2.6` | Gatekeeper + roster | ✅ Live |
| **OpenRouter** | `qwen/qwen3.6-plus`, `anthropic/claude-sonnet-4-6` | Fallback roster | ⚠️ Needs credits |
| **DeepSeek** | `deepseek-chat` | Fallback roster | ⚠️ Needs balance |
| **Gemini** | `gemini-2.5-flash` | Fallback roster | ⚠️ Key saved but quota/denied |

---

## Environment Variables

Required secrets are set as Fly.io secrets for the worker:

```bash
flyctl secrets set \
  SUPABASE_URL=<...> \
  SUPABASE_SERVICE_ROLE_KEY=<...> \
  GROQ_API_KEY=<...> \
  PERPLEXITY_API_KEY=<...> \
  OPENROUTER_API_KEY=<...> \
  DEEPSEEK_API_KEY=<...> \
  MOONSHOT_API_KEY=<...> \
  GROK_API_KEY=<...> \
  GEMINI_API_KEY=<...> \
  AI_WORKER_KALSHI_SYNC_INTERVAL=3600 \
  --app edge-crew-ai-worker
```

Optional:

- `AI_WORKER_NAME` — worker identity for heartbeats
- `AI_WORKER_HEARTBEAT_INTERVAL` — seconds between heartbeats (default 60)
- `WORKER_ALERT_WEBHOOK` — webhook URL for stale-worker alerts

---

## Local Development

Build and run the worker container locally:

```bash
docker build -f Dockerfile.worker -t edge-crew-ai-worker .
docker run \
  -e SUPABASE_URL=$SUPABASE_URL \
  -e SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
  -e GROQ_API_KEY=$GROQ_API_KEY \
  -e MOONSHOT_API_KEY=$MOONSHOT_API_KEY \
  -e GROK_API_KEY=$GROK_API_KEY \
  edge-crew-ai-worker
```

Or run directly:

```bash
python -m pip install -r requirements.txt
python app/ai_worker.py
```

---

## Deployment

```bash
flyctl deploy --app edge-crew-ai-worker --ha=false
```

Check status and logs:

```bash
flyctl status --app edge-crew-ai-worker
flyctl logs --app edge-crew-ai-worker
```

---

## Monitoring

- **Heartbeat** — worker writes to `worker_heartbeats` every `AI_WORKER_HEARTBEAT_INTERVAL` seconds.
- **Cron alert** — `edgecrew-monitor-worker` runs via pg_cron and calls `WORKER_ALERT_WEBHOOK` if the heartbeat goes stale.
- **Kalshi sync** — worker syncs open sports markets to `kalshi_markets` every `AI_WORKER_KALSHI_SYNC_INTERVAL` seconds.

---

## Testing

```bash
# Python smoke tests
python -m pytest tests -v
```

---

## License

MIT
