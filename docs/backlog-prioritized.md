# Edge Crew v3.0 — Prioritized Backlog

> **Date:** 2026-06-14  
> **Generated from:** Deep Research Audit + Optimization Roadmap  
> **Total Items:** 42  
> **Estimated Total Effort:** ~6 weeks (2 developers full-time)

---

## Legend

| Severity | Meaning | SLA |
|----------|---------|-----|
| **P0** | Fix immediately. Production blocker, security risk, or data loss. | Within 48 hours |
| **P1** | Fix this sprint. High user impact or significant technical debt. | Within 1 week |
| **P2** | Fix next sprint. Medium impact, good to have. | Within 2 weeks |
| **P3** | Fix when convenient. Low impact, polish. | Within 1 month |
| **P4** | Research / future. Nice to have, no immediate impact. | Next quarter |

---

## P0 — CRITICAL (Fix Immediately)

| # | Task | Category | Effort | Blockers | Owner | Why Critical |
|---|------|----------|--------|----------|-------|-------------|
| 1 | **Split `app/main.py` into modular router/service/AI structure** | RELIABILITY | 3 days | None | Backend Lead | 4,252-line monolith is unmanageable. Every refactor risks breakage. No single developer can review a PR touching this file. |
| 2 | **Split `grade_engine.py` into sport-specific modules** | RELIABILITY | 3 days | None | Backend Lead | 4,326-line monolith. Same problem. Divergent grade logic between edge function and FastAPI. |
| 3 | **Implement multi-worker AI job queue with `FOR UPDATE SKIP LOCKED`** | SCALABILITY | 5 days | DB migration `019` | Backend Lead | Single worker = single point of failure. Queue backlog grows unbounded. No horizontal scaling. |
| 4 | **Fix CORS `*` wildcard in Vercel Edge Routes** | SECURITY | 4 hours | None | Frontend Lead | `Access-Control-Allow-Origin: *` on `/api/analyze` and `/api/jobs` exposes CSRF surface to any domain. |
| 5 | **Fix weak default PIN passwords (`0000` → strong per-user)** | SECURITY | 2 hours | User comms | Backend Lead | 4-digit PIN padded to 6 is trivially brute-forced (10,000 attempts). All crew accounts vulnerable. |

### P0 Sub-tasks
- [ ] 1.1 Create `app/routes/`, `app/services/`, `app/ai/`, `app/models/` directories
- [ ] 1.2 Extract health routes → `app/routes/health.py`
- [ ] 1.3 Extract game routes → `app/routes/games.py`
- [ ] 1.4 Extract AI registry → `app/ai/registry.py`
- [ ] 1.5 Extract prompt builders → `app/ai/prompts.py`
- [ ] 1.6 Extract model caller → `app/ai/caller.py`
- [ ] 1.7 Extract convergence logic → `app/ai/convergence.py`
- [ ] 1.8 Extract pick engine → `app/services/pick_engine.py`
- [ ] 1.9 Extract game parser → `app/services/game_parser.py`
- [ ] 1.10 Update `app/main.py` to register routers only (~200 lines)
- [ ] 2.1 Create `grade_engine/scoring/`, `grade_engine/grading/`, `grade_engine/profiles/` directories
- [ ] 2.2 Extract core thresholds → `grade_engine/core.py`
- [ ] 2.3 Extract per-sport scorers → `grade_engine/scoring/sport_specific/`
- [ ] 2.4 Extract grading functions → `grade_engine/grading/`
- [ ] 2.5 Extract Peter's Rules → `grade_engine/profiles/peter_rules.py`
- [ ] 3.1 Add `worker_id` + `started_at` columns to `model_jobs`
- [ ] 3.2 Create `claim_job_for_worker()` PostgreSQL function with `FOR UPDATE SKIP LOCKED`
- [ ] 3.3 Update `app/ai_worker.py` to call `claim_job_for_worker()` with `WORKER_INDEX`/`TOTAL_WORKERS`
- [ ] 3.4 Set `fly.toml` to scale to 3 workers + configure `FLY_ALLOC_ID` parsing
- [ ] 3.5 Add auto-scaling script based on `model_jobs` pending count
- [ ] 4.1 Replace `corsHeaders` in `web/api/_shared.ts` with strict origin whitelist + `Vary: Origin`
- [ ] 4.2 Update all edge route handlers to pass `request.headers.get('Origin')` to `jsonResponse()`
- [ ] 4.3 Fix `supabase/functions/grade/index.ts` CORS to use strict origin
- [ ] 5.1 Generate unique strong passwords for `peter`, `chinny`, `jimmy` (or migrate to OAuth)
- [ ] 5.2 Add password strength validation to login flow
- [ ] 5.3 Force password reset on next login for all crew accounts

---

## P1 — HIGH (Fix This Sprint)

| # | Task | Category | Effort | Blockers | Owner | Why High |
|---|------|----------|--------|----------|-------|----------|
| 6 | **Add rate limiting to Vercel Edge Routes (`/api/analyze`, `/api/jobs`)** | SECURITY | 1 day | Vercel KV | Frontend Lead | `/api/analyze` can be spammed to flood the AI worker queue. No protection on Vercel edge. |
| 7 | **Add comprehensive test suite (pytest + vitest + Playwright)** | RELIABILITY | 1 week | None | QA / Dev | 8 tests for 8,000+ lines of code. Zero regression confidence. Cannot safely refactor. |
| 8 | **Add request logging middleware with structured JSON** | INFRA | 4 hours | None | Backend Lead | No production logs = no debugging. No audit trail. No performance visibility. |
| 9 | **Add Sentry to frontend (`web/src/main.tsx`)** | RELIABILITY | 2 hours | Sentry project | Frontend Lead | JavaScript errors in production are invisible. No crash reporting. |
| 10 | **Fix duplicate grade thresholds (`GRADE_MAP` vs `GRADE_THRESHOLDS`)** | RELIABILITY | 2 hours | P0 #1, #2 | Backend Lead | Risk of divergent grade letters between FastAPI and Supabase Edge Function. User confusion. |
| 11 | **Add worker job recovery cron (stuck `processing` jobs)** | RELIABILITY | 4 hours | P0 #3 | Backend Lead | If worker crashes mid-job, job stays `processing` forever. Requires manual cleanup. |
| 12 | **Add stale odds refresh loop (15-min cron for games <4h)** | PERFORMANCE | 1 day | None | Backend Lead | Odds are static after slate load. Lines move significantly. Users see stale data. |
| 13 | **Add Real User Monitoring (web-vitals + Core Web Vitals)** | PERFORMANCE | 2 hours | None | Frontend Lead | No performance data. Cannot optimize LCP, FID, CLS. Blind to real user experience. |
| 14 | **Add data retention policy (kalshi, model_responses, odds_history)** | RELIABILITY | 4 hours | None | Backend Lead | Database bloat. `kalshi_markets.raw_payload` grows unbounded. Compliance risk. |
| 15 | **Add `INTERNAL_API_KEY` validation to service-to-service calls** | SECURITY | 2 hours | None | Backend Lead | Key exists in `.env` but is never checked. Internal endpoints are unprotected. |
| 16 | **Add metrics dashboard + alerting (Grafana / Datadog / custom)** | INFRA | 2 days | Provider choice | DevOps | No visibility into system health, error rates, queue depth, model latency. |

### P1 Sub-tasks
- [ ] 6.1 Install `@vercel/kv` package
- [ ] 6.2 Implement `rateLimit()` helper in `web/api/_shared.ts` with IP-based sliding window
- [ ] 6.3 Add rate limiting to `/api/analyze` (10 req/min), `/api/jobs` (30 req/min), `/api/games` (60 req/min)
- [ ] 6.4 Add `429` response with `Retry-After` header
- [ ] 7.1 Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `playwright`
- [ ] 7.2 Install `pytest-asyncio`, `pytest-mock`, `aioresponses`, `factory-boy`
- [ ] 7.3 Write backend API tests (target: 80% coverage)
- [ ] 7.4 Write grade engine tests (target: 90% coverage)
- [ ] 7.5 Write React component tests (target: 60% coverage)
- [ ] 7.6 Write E2E Playwright tests for critical path: login → view slate → analyze → lock pick → view bankroll
- [ ] 7.7 Add test step to CI (`ci.yml`) before merge
- [ ] 8.1 Create `app/middleware/logging.py` with `RequestLoggingMiddleware`
- [ ] 8.2 Log: request_id, method, path, status_code, duration_ms, client_ip, user_id
- [ ] 8.3 Add `X-Response-Time` header to all responses
- [ ] 8.4 Configure `STRUCTLOG=1` for JSON output in production
- [ ] 9.1 Install `@sentry/react` + `@sentry/browser`
- [ ] 9.2 Initialize Sentry in `web/src/main.tsx` with `BrowserTracing` + `Replay`
- [ ] 9.3 Add `VITE_SENTRY_DSN` to Vercel env vars
- [ ] 9.4 Strip `Authorization` headers from error reports
- [ ] 10.1 After `grade_engine` split, import `GRADE_THRESHOLDS` from `grade_engine.core` in `app/main.py`
- [ ] 10.2 Add CI test `test_grade_map_matches_grade_thresholds` to prevent divergence
- [ ] 11.1 Create `recover_stalled_jobs()` PostgreSQL function
- [ ] 11.2 Schedule `recover_stalled_jobs(600)` via `pg_cron` every 10 minutes
- [ ] 11.3 Add `error_message = 'Recovered after timeout'` to recovered jobs
- [ ] 12.1 Create `refresh_upcoming_odds()` function that marks games <4h for refresh
- [ ] 12.2 Schedule `refresh_upcoming_odds()` via `pg_cron` every 15 minutes
- [ ] 12.3 Add odds refresh logic to AI worker main loop
- [ ] 13.1 Install `web-vitals` package
- [ ] 13.2 Add `onCLS`, `onFID`, `onFCP`, `onLCP`, `onTTFB` to `web/src/main.tsx`
- [ ] 13.3 Send metrics to `/api/metrics` endpoint or Google Analytics
- [ ] 14.1 Create `021_data_retention.sql` migration
- [ ] 14.2 Delete `kalshi_markets` > 30 days, `model_responses` > 90 days, `odds_history` > 180 days, `worker_heartbeats` > 7 days
- [ ] 14.3 Add TimescaleDB compression for `grades` > 30 days
- [ ] 14.4 Schedule retention job via `pg_cron` at 03:00 UTC daily
- [ ] 15.1 Add `require_internal_api_key()` dependency to `app/middleware/auth.py`
- [ ] 15.2 Protect internal endpoints (`/internal/*`) with `Depends(require_internal_api_key)`
- [ ] 16.1 Choose provider (Grafana Cloud / Datadog / New Relic / custom)
- [ ] 16.2 Instrument key metrics: request latency, error rate, queue depth, model latency, cache hit rate, DB connection pool usage
- [ ] 16.3 Add alert rules: worker stale > 5 min, error rate > 1%, DB connections > 20, queue depth > 50
- [ ] 16.4 Add PagerDuty / Slack webhook integration for alerts

---

## P2 — MEDIUM (Fix Next Sprint)

| # | Task | Category | Effort | Blockers | Owner | Why Medium |
|---|------|----------|--------|----------|-------|------------|
| 17 | **Add WCAG 2.1 AA accessibility (ARIA, keyboard nav, color contrast)** | UX | 3 days | None | Frontend Lead | Excludes users with disabilities. Legal liability in some jurisdictions. No screen reader support. |
| 18 | **Add `prefers-reduced-motion` guard for Framer Motion** | UX | 2 hours | None | Frontend Lead | Users with vestibular disorders may experience discomfort from animations. |
| 19 | **Add incident response playbook** | RELIABILITY | 4 hours | None | DevOps | No documented steps for "worker is down", "DB is degraded", "AI provider is down". Team scrambles during incidents. |
| 20 | **Add API documentation (OpenAPI or standalone)** | DX | 1 day | P0 #1 | Backend Lead | Swagger/ReDoc disabled in production. No standalone docs. Frontend devs have no reference. |
| 21 | **Add model onboarding guide (how to add new AI model)** | DX | 4 hours | None | Backend Lead | Adding a new model requires reading 800 lines of registry code. No documentation. |
| 22 | **Add load testing (k6 / Artillery) for critical paths** | PERFORMANCE | 2 days | None | QA | No verification of traffic handling. Cannot plan capacity. |
| 23 | **Add image optimization (WebP, compression) for PWA assets** | PERFORMANCE | 1 day | None | Frontend Lead | PWA install size larger than necessary. No WebP conversion. |
| 24 | **Add CDN for static assets in unified Docker image** | PERFORMANCE | 1 day | Cloudflare/CloudFront | DevOps | Static assets served from container, not CDN. Higher latency, higher bandwidth cost. |
| 25 | **Migrate `data_fetch.py` into ESPN client module** | RELIABILITY | 2 days | None | Backend Lead | 1,510-line monolith. All ESPN interaction in one file. Hard to test, hard to refactor. |
| 26 | **Add Flutter iOS build pipeline** | MOBILE | 2 days | Apple Dev Account | Mobile Lead | No iOS app. Missing 50% of mobile market. |
| 27 | **Add distributed tracing (OpenTelemetry) across services** | INFRA | 3 days | None | DevOps | Cannot trace a single request across Vercel → Supabase → AI Worker. No correlation IDs. |
| 28 | **Add Redis fail-closed option (disable requests when Redis is down)** | SECURITY | 2 hours | None | Backend Lead | Currently Redis outage disables rate limiting (open). Should optionally fail-closed (reject requests). |
| 29 | **Add request size limits to FastAPI** | SECURITY | 1 hour | None | Backend Lead | No `max_request_size` configured. Large payloads could exhaust 512MB Render memory. |
| 30 | **Add HSTS headers to Vercel Edge Routes** | SECURITY | 1 hour | None | Frontend Lead | HSTS set by FastAPI but NOT by Vercel edge functions. Inconsistent security posture. |

---

## P3 — LOW (Fix When Convenient)

| # | Task | Category | Effort | Blockers | Owner | Why Low |
|---|------|----------|--------|----------|-------|---------|
| 31 | **Remove Next.js artifacts (`next.config.js`, `.gitignore` entries)** | DX | 30 min | None | Frontend Lead | Confusion for new developers. `next.config.js` is a leftover from previous architecture. |
| 32 | **Consolidate conflicting Tailwind configs** | DX | 1 hour | None | Frontend Lead | Both `tailwind.config.ts` and `tailwind.config.js` exist with different paths. Unpredictable behavior. |
| 33 | **Add `noindex` meta tag to dev deployments** | SEO | 15 min | None | Frontend Lead | Dev/preview deployments may be indexed by search engines. |
| 34 | **Add CORS `Vary: Origin` header** | SECURITY | 15 min | None | Frontend Lead | Missing `Vary` header can cause CDN caching issues with CORS responses. |
| 35 | **Fix CSP to use nonces instead of `unsafe-inline`** | SECURITY | 2 hours | None | Frontend Lead | Current CSP allows inline scripts. Nonces are more secure but require build-time injection. |
| 36 | **Add API versioning systematically (`/api/v1/*`)** | DX | 2 days | P0 #1 | Backend Lead | Only `/api/v1/grade` is versioned. All other endpoints are unversioned. |
| 37 | **Add `nosniff` to `vercel.json` response headers** | SECURITY | 15 min | None | Frontend Lead | Missing `X-Content-Type-Options` on Vercel static asset responses. |
| 38 | **Add feature flag UI for non-technical users** | UX | 2 days | None | Frontend Lead | Feature flags are read from DB but only technical users can change them. No admin UI. |
| 39 | **Add contract tests (Pact) between frontend and API** | RELIABILITY | 2 days | None | QA | Frontend/API mismatches discovered in production instead of during CI. |
| 40 | **Add automated security scanning (Dependabot, Snyk)** | SECURITY | 1 day | None | DevOps | No automated vulnerability detection for npm/pip dependencies. |
| 41 | **Add `build-time` nonce generation for CSP** | SECURITY | 2 hours | P0 #1 | Frontend Lead | Generate CSP nonces at Vite build time and inject into `index.html`. |
| 42 | **Add database backup / restore runbook** | RELIABILITY | 4 hours | None | DevOps | No documented procedure for point-in-time recovery or cross-region restore. |

---

## P4 — RESEARCH / FUTURE (Next Quarter)

| # | Task | Category | Effort | Blockers | Owner | Notes |
|---|------|----------|--------|----------|-------|-------|
| 43 | **Add AI model performance dashboard (accuracy, latency, cost per model)** | PERFORMANCE | 3 days | P2 #16 | Data Lead | Track which models are actually predictive. Optimize roster. |
| 44 | **Add A/B testing framework for prompt variations** | PERFORMANCE | 2 days | P2 #16 | Data Lead | Test persona variations against holdout set. |
| 45 | **Add streaming AI responses (SSE / WebSocket)** | PERFORMANCE | 3 days | P0 #3 | Backend Lead | Show model results as they arrive instead of waiting for full panel. |
| 46 | **Add cost-aware model routing** | PERFORMANCE | 2 days | P4 #43 | Backend Lead | Route to cheaper models for low-stakes analysis. |
| 47 | **Add warm-keepalive for Azure AI endpoints** | PERFORMANCE | 1 day | None | Backend Lead | Ping Azure every 30s to avoid 500–800ms cold start. |
| 48 | **Add conversational memory / context** | UX | 5 days | None | Data Lead | Remember user's past picks and preferences across sessions. |
| 49 | **Add social features (leaderboards, sharing)** | UX | 2 weeks | None | Product | Community picks, leaderboards, sharing. |
| 50 | **Add live betting / in-game odds** | CONTENT | 2 weeks | Paid odds feed | Product | Real-time in-game prop markets. |
| 51 | **Add responsible gaming features (limits, cooldown)** | COMPLIANCE | 3 days | None | Product | Spending limits, cooldown timers, self-exclusion. Required for real-money jurisdictions. |
| 52 | **Add geo-blocking and age verification** | COMPLIANCE | 2 days | None | Product | KYC/age verification for regulated markets. |
| 53 | **Migrate from Vite SPA to Next.js App Router** | PERFORMANCE | 2 weeks | None | Frontend Lead | SSR for SEO, ISR for game pages, built-in image optimization. |
| 54 | **Add PostgreSQL read replicas for analytics queries** | SCALABILITY | 3 days | Supabase plan | DevOps | Offload heavy analytics from primary DB. |
| 55 | **Add message queue (Redis Streams / SQS / PubSub) for AI jobs** | SCALABILITY | 1 week | None | Backend Lead | Replace polling with push-based job distribution. |

---

## Summary by Category

| Category | P0 | P1 | P2 | P3 | P4 | Total Effort |
|----------|-----|-----|-----|-----|-----|-------------|
| **SECURITY** | 2 | 3 | 4 | 5 | 0 | ~2 days |
| **PERFORMANCE** | 0 | 3 | 2 | 0 | 5 | ~3 days |
| **RELIABILITY** | 2 | 4 | 3 | 2 | 1 | ~3 weeks |
| **SCALABILITY** | 1 | 1 | 0 | 0 | 2 | ~6 days |
| **DX (Dev Experience)** | 0 | 1 | 2 | 5 | 0 | ~1 week |
| **UX (User Experience)** | 0 | 0 | 2 | 1 | 3 | ~1 week |
| **INFRA** | 0 | 2 | 2 | 0 | 0 | ~4 days |
| **MOBILE** | 0 | 0 | 1 | 0 | 0 | ~2 days |
| **CONTENT** | 0 | 0 | 0 | 0 | 1 | ~2 weeks |
| **COMPLIANCE** | 0 | 0 | 0 | 0 | 2 | ~5 days |
| **Total** | **5** | **14** | **16** | **14** | **14** | **~6 weeks** |

---

## Sprint Planning Recommendation

### Sprint 1 (Week 1): Foundation
- **Goal:** Make the codebase refactorable and safe
- **Items:** P0 #1, #2, #5, P1 #7, #10
- **Team:** 1 Backend + 1 Frontend + 1 QA
- **Deliverable:** Modular backend + test suite passing + no weak passwords

### Sprint 2 (Week 2): Scale & Security
- **Goal:** Scale the AI pipeline and close security gaps
- **Items:** P0 #3, #4, P1 #6, #8, #11, #12
- **Team:** 1 Backend + 1 Frontend + 1 DevOps
- **Deliverable:** 3 AI workers + rate-limited edge routes + job recovery + stale odds refresh

### Sprint 3 (Week 3): Observability & Polish
- **Goal:** See what's happening and fix what's broken
- **Items:** P1 #9, #13, #14, #15, #16, P2 #17, #18, #19
- **Team:** 1 Frontend + 1 DevOps + 1 Backend
- **Deliverable:** Sentry + RUM + metrics dashboard + accessibility basics + incident playbook

### Sprint 4 (Week 4): Documentation & Mobile
- **Goal:** Document everything and ship iOS
- **Items:** P2 #20, #21, #26, P3 #31, #32, #39, #40
- **Team:** 1 Backend + 1 Mobile + 1 QA
- **Deliverable:** API docs + model onboarding guide + iOS build + dependency scanning

---

*End of Prioritized Backlog — Edge Crew v3.0*
