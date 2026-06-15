# Edge Crew v3.0 — Secrets & Environment Checklist

This doc lists every secret/environment variable required to run the full stack in production.

## Supabase

| Variable | Location | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | Vercel (server), AI worker, migration scripts | Service-role Postgres/Auth/Realtime client |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (server), AI worker, migration scripts | Bypasses RLS for API routes and worker |
| `SUPABASE_ANON_KEY` | Vercel (server) | Optional; only if server calls anon endpoints |
| `VITE_SUPABASE_URL` | Vercel (client) | Browser Supabase client URL |
| `VITE_SUPABASE_ANON_KEY` | Vercel (client) | Browser Supabase client anon key |

## Vercel / Web

| Variable | Location | Purpose |
|----------|----------|---------|
| `VITE_API_URL` | Vercel (client build) | Dev proxy target; use production API origin for prod builds if needed |
| `API_BASE_URL` | Flutter build (`--dart-define`) | Mobile API origin |

## AI / Model Providers (AI worker + monolith)

At least one key is required. The worker builds a roster from the keys that are set and falls back automatically.

| Variable | Required | Purpose |
|----------|----------|---------|
| `GROQ_API_KEY` | Recommended | Groq fast inference host |
| `PERPLEXITY_API_KEY` | No | Perplexity real-time web research |
| `OPENROUTER_API_KEY` | No | OpenRouter model aggregator |
| `DEEPSEEK_API_KEY` | No | DeepSeek models |
| `MOONSHOT_API_KEY` | No | Moonshot / Kimi models |
| `GROK_API_KEY` | No | xAI Grok models |
| `GEMINI_API_KEY` | No | Google Gemini models |
| `AZURE_SWEDEN_ENDPOINT` / `AZURE_SWEDEN_KEY` | No | Azure Sweden Central host |
| `AZURE_GCE_ENDPOINT` / `AZURE_GCE_KEY` | No | Azure GCE / OpenAI host |
| `ANTHROPIC_API_KEY` | No | Anthropic Claude (legacy monolith) |

## Sports Data

| Variable | Required | Purpose |
|----------|----------|---------|
| `ODDS_API_KEY_PAID` / `ODDS_API_KEY` | No | Disabled — ESPN scoreboard is used instead |
| `SPORTSDATA_API_KEY` | No | SportsData.io enrichment |
| `ESPN_API_KEY` | No | Direct ESPN access (currently unused) |

## Observability (optional)

| Variable | Purpose |
|----------|---------|
| `SENTRY_DSN` | Error tracking |
| `SENTRY_ENV` | Environment tag |
| `SENTRY_TRACES` | Traces sample rate |
| `STRUCTLOG=1` | JSON structured logs |
| `WORKER_ALERT_WEBHOOK` | Webhook called when worker heartbeat goes stale |

## AI Worker Tuning

| Variable | Default | Purpose |
|----------|---------|---------|
| `AI_WORKER_POLL_INTERVAL` | 5 | Seconds between polls for pending jobs |
| `AI_WORKER_JOB_TIMEOUT` | 600 | Per-job hard timeout in seconds |
| `AI_WORKER_NAME` | `edge-crew-ai-worker` | Worker identity for heartbeats |
| `AI_WORKER_HEARTBEAT_INTERVAL` | 60 | Seconds between heartbeat writes |
| `AI_WORKER_KALSHI_SYNC_INTERVAL` | 3600 | Seconds between Kalshi market syncs (0 = off) |

## Where to set them

- **Supabase**: Project Settings → API → `service_role_key`, `anon_key`
- **Vercel**: Project Settings → Environment Variables
- **AI Worker**: Container runtime env (Docker/Kubernetes/Render/etc.)
- **Flutter**: Passed at build time via `--dart-define=KEY=VALUE`
- **Local dev**: Copy `.env.example` → `.env` and fill values

## Rotation Notes

1. Rotate `SUPABASE_SERVICE_ROLE_KEY` immediately if leaked.
2. After rotation, redeploy Vercel and restart the AI worker.
3. `VITE_SUPABASE_ANON_KEY` is safe to expose in the browser; do **not** expose the service role key client-side.
