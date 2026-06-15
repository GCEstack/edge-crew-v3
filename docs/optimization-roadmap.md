# Edge Crew v3.0 — Optimization Roadmap

> **Companion to:** `deep-research-audit.md`  
> **Purpose:** Actionable fixes with code/config examples for every finding  
> **Date:** 2026-06-14

---

## How to Read This Document

- **Good Things** — Preserve them. Each section explains WHY it's good and how to protect it.
- **Bad Things** — Fix them. Each section provides:
  - Severity (Critical / High / Medium / Low)
  - Impact on users/developers
  - Specific fix with code example or config change
  - Effort estimate (hours/days)
  - File path and line number reference

---

# Part 1: Good Things — Preserve & Protect

## 1.1 Security Middleware Stack (Ordered)

**What it is:** FastAPI middleware applied in this order:  
1. `SecurityHeadersMiddleware` → 2. `RateLimitMiddleware` → 3. `CORSMiddleware` → 4. Auth dependencies

**Why it's good:** Defense in depth. Each layer protects against a different attack class. The order matters: headers apply to ALL responses (including errors), rate limiting runs before CORS to prevent abuse, and CORS runs before auth so preflight requests aren't blocked by JWT validation.

**How to preserve:**
- Document the ordering rationale in `app/main.py` comments
- Add a CI lint rule that checks middleware order hasn't changed
- Extract into a reusable FastAPI plugin package if the pattern is reused elsewhere

**Reference:** `app/main.py` lines 98–110

---

## 1.2 Pydantic Input Validation with Auto-Sanitization

**What it is:** `ValidatedRequest` base model automatically checks ALL string fields for SQL injection and XSS before any endpoint code runs.

**Why it's good:** Zero-effort security. Developers cannot forget to sanitize because it's built into the base class. Every new endpoint that inherits `ValidatedRequest` gets protection for free.

**How to preserve:**
- Add to project onboarding: "All request models MUST inherit `ValidatedRequest`"
- Add an ESLint-style CI check that verifies all Pydantic models in `app/core/validation.py` inherit from `ValidatedRequest`
- Keep the regex patterns updated (add new SQL injection vectors as they're discovered)

**Reference:** `app/core/validation.py` lines 135–153

---

## 1.3 Redis-Based Distributed Cache

**What it is:** `RedisCache` class with async/sync dual support, TTL management, compression for large values, connection pooling, and graceful fallback when Redis is down.

**Why it's good:** Survives container restarts. Works across multiple instances. The graceful fallback (`return None` on Redis error) means the app never crashes due to cache unavailability — it just becomes slower.

**How to preserve:**
- Add cache warming scripts for hot data (team profiles, today's slate)
- Add cache hit/miss metrics to the health check endpoint
- Document the TTL rationale: `TEAM_PROFILE=10min`, `GAME_DATA=5min`, `ODDS_DATA=1min`, `GRADE_DATA=30min`

**Reference:** `app/cache.py`

---

## 1.4 Three-Tier Health Checks

**What it is:** `/health` (full dependency check), `/health/live` (liveness), `/health/ready` (readiness)

**Why it's good:** Standard Kubernetes pattern. The liveness probe tells the orchestrator whether to restart the container. The readiness probe tells the load balancer whether to send traffic. The comprehensive health check gives operators full visibility.

**How to preserve:**
- Add liveness/readiness probes to all deployment configs (Fly.io, Render, etc.)
- Monitor the health check response time — if it degrades, investigate
- Add health check metrics to the dashboard

**Reference:** `app/core/health.py`

---

## 1.5 AI Panel with Persona Differentiation

**What it is:** Each of the 30+ models has a distinct analytical personality ("sharp contrarian", "data-driven heavy reasoner", "scout profiler", etc.)

**Why it's good:** Fights groupthink. If all models were prompted the same way, they'd produce correlated outputs. Persona differentiation forces genuine disagreement, which improves the ensemble's signal-to-noise ratio.

**How to preserve:**
- Document the persona design philosophy in `docs/model-personas.md`
- Add A/B testing: test new personas against a holdout set of games
- Track per-persona accuracy over time to identify which personas are most predictive

**Reference:** `ai_models.py` lines 63–113, `app/main.py` lines 749–820

---

## 1.6 Bayesian Precision Weighting

**What it is:** Ensemble weight = `confidence²` rather than a flat average.

**Why it's good:** A model at 95% confidence gets ~2.5× the weight of a model at 60% confidence. This prevents low-confidence models from dragging down the consensus. It also penalizes models that are uncertain but still participate.

**How to preserve:**
- Document the math in comments: `weight = confidence² / Σ(confidence²)`
- Make the exponent configurable via `ENSEMBLE_WEIGHT_EXPONENT` env var for experimentation
- Log the weight distribution per game to validate the math

**Reference:** `app/main.py` line 291

---

## 1.7 Convergence Status Taxonomy

**What it is:** Six statuses: `LOCK`, `ALIGNED`, `CLOSE`, `DIVERGENT`, `CONFLICT`, `SPLIT`

**Why it's good:** Structured signal for downstream layers. The frontend can show different UI treatments (gold badge for LOCK, warning for CONFLICT). The pick engine can apply different sizing logic. The gatekeeper can focus on resolving conflicts.

**How to preserve:**
- Add status-specific UI treatments in the frontend
- Log status distribution over time (e.g., "15% LOCK, 35% ALIGNED, 20% CONFLICT")
- Use status as a feature in model performance tracking

**Reference:** `app/main.py` lines 299–303

---

## 1.8 Worker Heartbeat + Cron Monitoring

**What it is:** The AI worker writes to `worker_heartbeats` every 60 seconds. A `pg_cron` job checks every 5 minutes and calls a webhook if the heartbeat is stale.

**Why it's good:** Detects silent worker failures (crashes, hangs, network partitions). The cron job can trigger auto-restart or alert the team.

**How to preserve:**
- Add heartbeat monitoring to the admin dashboard (last beat time, status, job throughput)
- Add a "restart worker" button that triggers a Fly.io redeploy
- Document the heartbeat timeout: `stale = last_beat > 5 minutes`

**Reference:** `app/ai_worker.py` lines 94–102, `supabase/migrations/012_worker_monitoring.sql`

---

## 1.9 PWA with Service Worker Caching

**What it is:** `vite-plugin-pwa` generates a service worker that pre-caches static assets and caches API responses with a `NetworkFirst` strategy.

**Why it's good:** The app works offline. API responses are cached for 4 hours, reducing backend load. The service worker updates automatically when a new version is deployed.

**How to preserve:**
- Test offline mode regularly (Chrome DevTools → Network → Offline)
- Add cache invalidation on deploy (e.g., version hash in cache key)
- Monitor service worker registration rate (should be >90% of returning users)

**Reference:** `web/vite.config.ts` lines 28–48

---

## 1.10 Zustand with Selective Persistence

**What it is:** App state is persisted to `localStorage` with only essential fields: `selectedSport`, `picks`, `user`, `slipLocks`.

**Why it's good:** User preferences survive reload. No data loss on accidental refresh. The `partialize` config prevents large objects (like the full games list) from bloating localStorage.

**How to preserve:**
- Add state schema versioning: `localStorage.setItem('edge-crew-version', '3')`
- Add migration logic for schema changes
- Monitor localStorage size per user

**Reference:** `web/src/store/useAppStore.ts` lines 100–108

---

# Part 2: Bad Things — Fix with Code

---

## 🔴 CRITICAL: Split `app/main.py` (4,252 lines)

**Severity:** CRITICAL  
**Impact:** Developer velocity, bug density, code reviewability, onboarding time  
**Effort:** 2–3 days  
**Reference:** `app/main.py` (entire file)

### Current State
A single file contains:
- Imports and config (lines 1–100)
- Observability setup (Sentry, structlog) (lines 40–87)
- FastAPI app initialization (lines 90–110)
- Disk persistence helpers (lines 114–146)
- Odds API constants and maps (lines 148–180)
- NHL goalie tiers (lines 191–216)
- User profiles (lines 226–246)
- Cache TTL (lines 220–224)
- Grade thresholds (lines 249–252)
- Odds grading helper (lines 255–285)
- Convergence logic (lines 288–312)
- Conflict downgrade logic (lines 329–408)
- Kill override logic (lines 411–427)
- Pick computation (lines 429–482)
- Arbitrage detection (lines 494–540)
- Event parsing (lines 553–664)
- AI model registry (lines 749–820)
- Azure host definitions (lines 683–743)
- Batch prompt building (lines 820–900)
- Single-shot prompt building (lines 900–1000)
- AI API calling logic (lines 1000–1200)
- Response parsing and error handling (lines 1200–1500)
- FastAPI routes (lines 1800–2100)
- Admin endpoints (lines 2100–2400)
- Legacy helpers (lines 2400–4252)

### Fix: Modular Structure

Create this directory structure:

```
app/
├── main.py                  # FastAPI app + middleware only (~200 lines)
├── config.py                # Centralized settings (extract from main.py lines 1–100)
├── routes/
│   ├── __init__.py
│   ├── health.py            # /health, /health/live, /health/ready
│   ├── games.py             # /api/games, /api/games/:id
│   ├── grade.py             # /api/v1/grade
│   ├── admin.py             # /api/v1/admin/stats
│   ├── analyze.py           # /api/analyze (legacy)
│   ├── picks.py             # /api/picks, /api/betslip
│   ├── calibration.py       # /api/calibration
│   └── top_picks.py         # /api/top-picks
├── services/
│   ├── __init__.py
│   ├── game_parser.py       # _parse_event, _normalize_team_name, TEAM_NAME_OVERRIDES
│   ├── pick_engine.py       # _compute_pick, _apply_kill_override, _apply_conflict_downgrade
│   ├── arbitrage.py         # _detect_arbitrage, _ml_to_decimal
│   ├── odds_fetcher.py      # Odds API integration (currently mostly disabled)
│   └── user_manager.py      # USERS, _user_picks, _save_users, _save_picks
├── ai/
│   ├── __init__.py
│   ├── registry.py          # REAL_AI_MODELS, AZURE_HOSTS, AI_MODELS
│   ├── prompts.py           # _build_game_prompt, _build_batch_prompt, _build_profile_block
│   ├── caller.py            # _call_model, _call_azure, retry logic, timeout handling
│   ├── convergence.py       # _convergence, _map_convergence_status
│   └── gatekeeper.py        # kimi_gatekeeper, _call_kimi
├── models/
│   ├── __init__.py
│   ├── requests.py          # Pydantic request models (from validation.py + main.py)
│   └── responses.py         # Pydantic response models
└── static/                  # Pre-built Vite app (unchanged)
```

### Implementation Steps

**Step 1: Create directories**
```bash
mkdir -p app/routes app/services app/ai app/models
```

**Step 2: Extract config**
```python
# app/config.py
import os
from pydantic_settings import BaseSettings
from pydantic import SecretStr

class AppSettings(BaseSettings):
    jwt_secret_key: SecretStr = SecretStr(os.getenv("JWT_SECRET_KEY", ""))
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_access_token_expire_minutes: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    jwt_refresh_token_expire_days: int = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    redis_url: str = os.getenv("REDIS_URL", "redis://redis:6379")
    database_url: str = os.getenv("DATABASE_URL", "")
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    environment: str = os.getenv("ENVIRONMENT", "production")
    # ... all other env vars

settings = AppSettings()
```

**Step 3: Extract routes**
```python
# app/routes/health.py
from fastapi import APIRouter
from app.core.health import run_health_checks, get_liveness_check, get_readiness_check

router = APIRouter()

@router.get("/health")
async def health():
    return await run_health_checks()

@router.get("/health/live")
async def liveness():
    return get_liveness_check()

@router.get("/health/ready")
async def readiness():
    return get_readiness_check()
```

**Step 4: Extract AI registry**
```python
# app/ai/registry.py
from typing import List, Dict, Any

AZURE_HOSTS = {
    "gce": {
        "url_template": "https://gce-personal-resource.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=2024-12-01-preview",
        "key": "...",
        "format": "aoai_classic",
    },
    # ... all other hosts
}

REAL_AI_MODELS: List[Dict[str, Any]] = [
    {"display": "DeepSeek R1", "deployment": "DeepSeek-R1-0528", "host": "gce", ...},
    # ... all models
]
```

**Step 5: Update main.py**
```python
# app/main.py (new, ~200 lines)
from fastapi import FastAPI
from app.config import settings
from app.middleware.security import setup_cors
from app.middleware.headers import SecurityHeadersMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.routes import health, games, grade, admin, analyze, picks, calibration, top_picks

app = FastAPI(
    title="Edge Crew v3.0",
    version="3.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, requests=settings.rate_limit_requests, window=settings.rate_limit_window)
setup_cors(app)

app.include_router(health.router)
app.include_router(games.router, prefix="/api")
app.include_router(grade.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(analyze.router, prefix="/api")
app.include_router(picks.router, prefix="/api")
app.include_router(calibration.router, prefix="/api")
app.include_router(top_picks.router, prefix="/api")
```

**Step 6: Update imports in all files**
Use IDE refactoring (PyCharm/VS Code) to move functions while preserving imports. Run the test suite after each move to catch regressions.

---

## 🔴 CRITICAL: Split `grade_engine.py` (4,326 lines)

**Severity:** CRITICAL  
**Impact:** Same as above — unmanageable at 4,300+ lines  
**Effort:** 2–3 days  
**Reference:** `grade_engine.py` (entire file)

### Fix: Sport-Module Structure

```
grade_engine/
├── __init__.py              # Public API: grade_both_sides, grade_game_total, score_to_grade
├── core.py                  # GRADE_THRESHOLDS, SIZING_MAP, score_to_grade, _clamp
├── scoring/
│   ├── __init__.py
│   ├── offense.py           # score_off_ranking
│   ├── defense.py           # score_def_ranking
│   ├── form.py              # score_recent_form
│   ├── home_away.py         # score_home_away
│   ├── rest.py              # score_rest_advantage
│   ├── h2h.py               # score_h2h
│   ├── injuries.py          # score_star_player, score_depth_injuries
│   ├── line_movement.py     # score_line_movement
│   ├── ats.py               # score_ats_trend
│   └── sport_specific/
│       ├── nba.py           # NBA-specific (pace, three_pt_rate)
│       ├── nfl.py           # NFL-specific (weather, bye week)
│       ├── mlb.py           # MLB-specific (pitcher, park factor, bullpen)
│       ├── nhl.py           # NHL-specific (goalie tiers, special teams)
│       ├── soccer.py        # Soccer-specific (league position, BTTS)
│       └── mma.py           # MMA-specific (fighter profiles)
├── grading/
│   ├── __init__.py
│   ├── sides.py             # grade_both_sides
│   ├── total.py             # grade_game_total
│   ├── ev.py                # calculate_ev
│   └── peter_rules.py       # peter_rules, filter flags, KILL logic
└── profiles/
    ├── __init__.py
    ├── edge.py              # Edge profile (quantitative, math-driven)
    ├── sintonia.py          # Sintonia profile (narrative, situational)
    └── renzo.py             # Renzo profile (contrarian, value-focused)
```

### Implementation

```python
# grade_engine/__init__.py
from grade_engine.core import score_to_grade, score_to_sizing, GRADE_THRESHOLDS, SIZING_MAP
from grade_engine.grading.sides import grade_both_sides
from grade_engine.grading.total import grade_game_total
from grade_engine.grading.ev import calculate_ev
from grade_engine.grading.peter_rules import peter_rules

__all__ = [
    "score_to_grade",
    "score_to_sizing",
    "grade_both_sides",
    "grade_game_total",
    "calculate_ev",
    "peter_rules",
    "GRADE_THRESHOLDS",
    "SIZING_MAP",
]
```

```python
# grade_engine/core.py
GRADE_THRESHOLDS = [
    (8.0, "A+"), (7.3, "A"), (6.5, "A-"),
    (6.0, "B+"), (5.5, "B"), (5.0, "B-"),
    (4.5, "C+"), (3.5, "C"), (2.5, "D"), (0.0, "F"),
]

SIZING_MAP = {
    "A+": "2u", "A": "1.5u", "A-": "1u", "B+": "1u",
    "B": "PASS", "B-": "PASS", "C+": "PASS", "C": "PASS",
    "D": "PASS", "F": "PASS",
}

def score_to_grade(score: float) -> str:
    for threshold, grade in GRADE_THRESHOLDS:
        if score >= threshold:
            return grade
    return "F"

def score_to_sizing(score: float) -> str:
    return SIZING_MAP.get(score_to_grade(score), "PASS")

def _clamp(val, lo=1, hi=10) -> float:
    return max(lo, min(hi, round(float(val), 1)))
```

---

## 🔴 CRITICAL: Scale AI Worker Horizontally

**Severity:** CRITICAL  
**Impact:** Single point of failure. Queue backlog grows unbounded.  
**Effort:** 3–5 days  
**Reference:** `app/ai_worker.py`, `fly.toml`, `supabase/migrations/006_realtime_and_ai_jobs.sql`

### Current State
```python
# app/ai_worker.py (current polling logic)
response = supabase.table("model_jobs").select("*").eq("status", "pending").order("created_at").limit(1).execute()
```

This means ALL workers (if there were multiple) would race for the same job. Only one can win, and the others waste time.

### Fix: Job Partitioning with `FOR UPDATE SKIP LOCKED`

**Step 1: Add a `worker_id` column to `model_jobs`**
```sql
-- supabase/migrations/019_worker_partitioning.sql
ALTER TABLE model_jobs ADD COLUMN worker_id TEXT;
ALTER TABLE model_jobs ADD COLUMN started_at TIMESTAMPTZ;

CREATE INDEX idx_model_jobs_status_worker ON model_jobs(status, worker_id);
```

**Step 2: Create a claim function**
```sql
CREATE OR REPLACE FUNCTION claim_job_for_worker(worker_index INT, total_workers INT)
RETURNS TABLE(id UUID, sport TEXT, game_id TEXT, fast BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  UPDATE model_jobs
  SET status = 'processing', worker_id = worker_index::text, started_at = NOW()
  WHERE id IN (
    SELECT id FROM model_jobs
    WHERE status = 'pending'
    AND MOD(id::bigint, total_workers) = worker_index
    ORDER BY created_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING model_jobs.id, model_jobs.sport, model_jobs.game_id, model_jobs.fast;
END;
$$ LANGUAGE plpgsql;
```

**Step 3: Update worker to use claim function**
```python
# app/ai_worker.py (modified)
import os

WORKER_INDEX = int(os.environ.get("WORKER_INDEX", "0"))
TOTAL_WORKERS = int(os.environ.get("TOTAL_WORKERS", "1"))

def _claim_job(supabase: Client) -> Optional[Dict]:
    response = supabase.rpc(
        "claim_job_for_worker",
        {"worker_index": WORKER_INDEX, "total_workers": TOTAL_WORKERS}
    ).execute()
    return response.data[0] if response.data else None

async def run():
    while True:
        job = _claim_job(supabase)
        if job:
            await _process_job(job)
        else:
            await asyncio.sleep(POLL_INTERVAL_SECONDS)
```

**Step 4: Scale on Fly.io**
```bash
# Scale to 3 workers
flyctl scale count 3 --app edge-crew-ai-worker

# Set environment variables for each worker
# Fly.io sets FLY_ALLOC_ID automatically; parse it to get worker index
```

**Step 5: Add auto-scaling based on queue depth**
```python
# Optional: auto-scaling script (runs as a separate cron)
def scale_workers():
    pending_count = supabase.table("model_jobs").select("count", count="exact").eq("status", "pending").execute().count
    
    # Scale to 1 worker per 10 pending jobs, max 5 workers
    desired_workers = min(5, max(1, pending_count // 10))
    
    # Call Fly.io API to scale
    os.system(f"flyctl scale count {desired_workers} --app edge-crew-ai-worker")
```

---

## 🔴 CRITICAL: Fix Duplicate Grade Thresholds

**Severity:** CRITICAL  
**Impact:** Grade letters may differ between FastAPI and Supabase Edge Function  
**Effort:** 2 hours  
**Reference:** `app/main.py` line 249, `grade_engine.py` line 11

### Current Discrepancy
Both `GRADE_MAP` and `GRADE_THRESHOLDS` appear identical but are maintained separately. After any refactor, one could drift.

### Fix: Single Source of Truth

After splitting `grade_engine.py`, import the thresholds from the shared module:

```python
# app/main.py
from grade_engine.core import GRADE_THRESHOLDS as GRADE_MAP

# grade_engine.py (remove the local GRADE_THRESHOLDS definition)
from grade_engine.core import GRADE_THRESHOLDS
```

Add a CI test to verify they match:
```python
# tests/test_grade_consistency.py
def test_grade_map_matches_grade_thresholds():
    from app.main import GRADE_MAP
    from grade_engine.core import GRADE_THRESHOLDS
    assert GRADE_MAP == GRADE_THRESHOLDS
```

---

## 🔴 HIGH: Fix CORS `*` in Vercel Edge Routes

**Severity:** HIGH  
**Impact:** Edge API routes exposed to any domain. CSRF risk.  
**Effort:** 4 hours  
**Reference:** `web/api/_shared.ts` line 7, `supabase/functions/grade/index.ts` line 8

### Current State
```typescript
// web/api/_shared.ts
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',  // ❌ DANGEROUS
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

### Fix: Strict Origin Whitelist

```typescript
// web/api/_shared.ts
const ALLOWED_ORIGINS = [
  'https://edge-crew-v3.vercel.app',
  'https://edge-crew-v3.onrender.com',
  'https://www.edge-crew-v3.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
];

function getAllowedOrigin(requestOrigin: string | null): string {
  if (!requestOrigin) return ALLOWED_ORIGINS[0];
  return ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0];
}

export const corsHeaders = (requestOrigin: string | null): Record<string, string> => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(requestOrigin),
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Vary': 'Origin',
});

export function handleOptions(request: Request): Response {
  const origin = request.headers.get('Origin');
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export function jsonResponse(data: unknown, status = 200, requestOrigin?: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(requestOrigin),
    },
  });
}
```

Update all handlers to pass the origin:
```typescript
// web/api/analyze.ts
export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return handleOptions(request);
  const origin = request.headers.get('Origin');
  // ... later ...
  return jsonResponse({ job_id: data.id, ... }, 202, origin);
}
```

---

## 🔴 HIGH: Add Rate Limiting to Vercel Edge Routes

**Severity:** HIGH  
**Impact:** `/api/analyze` can be spammed. `/api/jobs/:id` can be polled aggressively.  
**Effort:** 1 day  
**Reference:** `web/api/analyze.ts`, `web/api/jobs.ts`

### Fix: Vercel KV Rate Limiting

```bash
npm install @vercel/kv
```

```typescript
// web/api/_shared.ts
import { kv } from '@vercel/kv';

export async function rateLimit(
  request: Request,
  maxRequests: number = 30,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const path = new URL(request.url).pathname;
  const key = `rate_limit:${ip}:${path}`;
  
  const current = await kv.incr(key);
  if (current === 1) {
    await kv.expire(key, windowSeconds);
  }
  
  const ttl = await kv.ttl(key);
  const reset = Math.floor(Date.now() / 1000) + ttl;
  
  return {
    allowed: current <= maxRequests,
    remaining: Math.max(0, maxRequests - current),
    reset,
  };
}
```

```typescript
// web/api/analyze.ts
import { rateLimit, jsonResponse, handleOptions } from './_shared';

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return handleOptions(request);
  
  const { allowed, remaining } = await rateLimit(request, 10, 60); // 10 requests per minute
  if (!allowed) {
    return jsonResponse({ error: 'Rate limit exceeded. Please try again later.' }, 429);
  }
  
  // ... rest of handler
}
```

---

## 🔴 HIGH: Add Comprehensive Tests

**Severity:** HIGH  
**Impact:** No regression protection. Cannot safely refactor.  
**Effort:** 1 week (initial), ongoing  
**Reference:** `tests/` (only 3 files, 8 functions)

### Fix: Multi-Layer Test Suite

**Install dependencies:**
```bash
# Frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Python
pip install pytest-asyncio pytest-mock aioresponses factory-boy freezegun coverage
```

**Backend API tests:**
```python
# tests/test_api_games.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestGamesEndpoint:
    def test_games_returns_list(self):
        response = client.get("/api/games?sport=nba")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_games_invalid_sport_returns_400(self):
        response = client.get("/api/games?sport=invalid")
        assert response.status_code == 400
    
    def test_games_cors_headers(self):
        response = client.get("/api/games?sport=nba", headers={"Origin": "http://localhost:3000"})
        assert "Access-Control-Allow-Origin" in response.headers
```

**Grade engine tests:**
```python
# tests/grading/test_score_off_ranking.py
from grade_engine.scoring.offense import score_off_ranking

class TestScoreOffRanking:
    def test_nba_high_ppg(self):
        profile = {"ppg_L5": 125}
        opp = {"opp_ppg_L5": 110}
        score, note = score_off_ranking(profile, opp, "NBA")
        assert score >= 8.0
    
    def test_nba_low_ppg(self):
        profile = {"ppg_L5": 100}
        opp = {"opp_ppg_L5": 120}
        score, note = score_off_ranking(profile, opp, "NBA")
        assert score <= 5.0
```

**React component tests:**
```typescript
// web/src/components/__tests__/TwoLaneCard.test.tsx
import { render, screen } from '@testing-library/react';
import { TwoLaneCard } from '../TwoLaneCard';
import { describe, it, expect, vi } from 'vitest';

const mockGame = {
  id: 'test-1',
  homeTeam: 'Boston Celtics',
  awayTeam: 'Los Angeles Lakers',
  ourGrade: { grade: 'A+', score: 9.2 },
  convergence: { status: 'LOCK' },
};

describe('TwoLaneCard', () => {
  it('renders team names', () => {
    render(<TwoLaneCard game={mockGame} onAnalyze={vi.fn()} />);
    expect(screen.getByText('Boston Celtics')).toBeInTheDocument();
    expect(screen.getByText('Los Angeles Lakers')).toBeInTheDocument();
  });
  
  it('displays grade', () => {
    render(<TwoLaneCard game={mockGame} onAnalyze={vi.fn()} />);
    expect(screen.getByText('A+')).toBeInTheDocument();
  });
  
  it('calls onAnalyze when button clicked', () => {
    const onAnalyze = vi.fn();
    render(<TwoLaneCard game={mockGame} onAnalyze={onAnalyze} />);
    screen.getByRole('button', { name: /analyze/i }).click();
    expect(onAnalyze).toHaveBeenCalledWith('test-1');
  });
});
```

**E2E tests (Playwright):**
```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can login and view slate', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Login');
  await page.fill('input[name="username"]', 'peter');
  await page.fill('input[name="pin"]', '0000');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/');
  await expect(page.locator('text=NBA')).toBeVisible();
});
```

---

## 🔴 HIGH: Add Request Logging Middleware

**Severity:** HIGH  
**Impact:** Cannot debug production issues. No audit trail.  
**Effort:** 4 hours  
**Reference:** `app/main.py` (no logging middleware)

### Fix

```python
# app/middleware/logging.py
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response
from app.middleware.headers import get_request_id, get_client_ip

logger = logging.getLogger("edge-crew-v3.access")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start = time.time()
        request_id = getattr(request.state, 'request_id', 'unknown')
        
        response = await call_next(request)
        
        duration = time.time() - start
        
        log_data = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "query_params": str(request.query_params),
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2),
            "client_ip": get_client_ip(request),
            "user_id": getattr(request.state, 'user_id', None),
            "user_role": getattr(request.state, 'user_role', None),
        }
        
        if response.status_code >= 500:
            logger.error("request_error", extra=log_data)
        elif response.status_code >= 400:
            logger.warning("request_warning", extra=log_data)
        else:
            logger.info("request", extra=log_data)
        
        response.headers["X-Response-Time"] = f"{duration:.3f}s"
        return response
```

Register in `app/main.py`:
```python
from app.middleware.logging import RequestLoggingMiddleware

app.add_middleware(RequestLoggingMiddleware)  # After SecurityHeaders, before RateLimit
```

---

## 🔴 HIGH: Add Frontend Sentry

**Severity:** HIGH  
**Impact:** JavaScript errors in production are invisible.  
**Effort:** 2 hours  
**Reference:** `web/src/main.tsx`

### Fix

```bash
npm install @sentry/react @sentry/browser
```

```typescript
// web/src/main.tsx
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/browser';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  integrations: [
    new BrowserTracing(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 0.1,  // 10% of transactions
  replaysSessionSampleRate: 0.01,  // 1% of sessions
  replaysOnErrorSampleRate: 1.0,  // 100% of error sessions
  beforeSend(event) {
    // Don't send auth tokens in error reports
    if (event.request?.headers?.Authorization) {
      delete event.request.headers.Authorization;
    }
    return event;
  },
});

// ... existing ReactDOM.createRoot code
```

---

## 🔴 MEDIUM: Fix Stuck Jobs on Worker Crash

**Severity:** MEDIUM  
**Impact:** Jobs remain in `processing` if worker crashes mid-job  
**Effort:** 4 hours  
**Reference:** `app/ai_worker.py`

### Fix

```sql
-- supabase/migrations/019_job_timeout_recovery.sql
CREATE OR REPLACE FUNCTION recover_stalled_jobs(timeout_seconds INT DEFAULT 600)
RETURNS INT AS $$
DECLARE
  recovered_count INT;
BEGIN
  UPDATE model_jobs
  SET status = 'pending', worker_id = NULL, started_at = NULL, error_message = 'Recovered after timeout'
  WHERE status = 'processing'
    AND (started_at IS NULL OR started_at < NOW() - (timeout_seconds || ' seconds')::interval);
  
  GET DIAGNOSTICS recovered_count = ROW_COUNT;
  RETURN recovered_count;
END;
$$ LANGUAGE plpgsql;

-- Run every 10 minutes
SELECT cron.schedule('recover-stalled-jobs', '*/10 * * * *', 'SELECT recover_stalled_jobs(600);');
```

---

## 🔴 MEDIUM: Add Stale Odds Refresh

**Severity:** MEDIUM  
**Impact:** Odds are static after slate load. Lines move.  
**Effort:** 1 day  
**Reference:** `data_fetch.py`, `app/ai_worker.py`

### Fix

```sql
-- supabase/migrations/020_odds_refresh.sql
CREATE OR REPLACE FUNCTION refresh_upcoming_odds()
RETURNS void AS $$
BEGIN
  -- Mark games starting within 4 hours for odds refresh
  UPDATE games
  SET status = 'odds_refresh_needed'
  WHERE scheduled_at BETWEEN NOW() AND NOW() + INTERVAL '4 hours'
    AND status = 'scheduled';
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule('refresh-odds', '*/15 * * * *', 'SELECT refresh_upcoming_odds();');
```

```python
# app/ai_worker.py (add to the main loop)
async def _refresh_odds_if_needed(supabase: Client):
    """Refresh odds for games marked as needing refresh."""
    response = supabase.table("games").select("*").eq("status", "odds_refresh_needed").execute()
    games = response.data or []
    
    for game in games:
        try:
            # Fetch fresh odds from ESPN or a paid feed
            fresh_odds = await fetch_latest_odds(game["id"])
            if fresh_odds:
                supabase.table("games").update({
                    "odds": fresh_odds,
                    "status": "scheduled",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }).eq("id", game["id"]).execute()
        except Exception as e:
            logger.warning(f"Failed to refresh odds for {game['id']}: {e}")
```

---

## 🔴 MEDIUM: Add Data Retention Policy

**Severity:** MEDIUM  
**Impact:** Database bloat. Compliance risk.  
**Effort:** 4 hours  
**Reference:** `supabase/migrations/` (no retention policy)

### Fix

```sql
-- supabase/migrations/021_data_retention.sql
-- Retain kalshi market snapshots for 30 days
DELETE FROM kalshi_markets WHERE created_at < NOW() - INTERVAL '30 days';

-- Retain raw model responses for 90 days
DELETE FROM model_responses WHERE created_at < NOW() - INTERVAL '90 days';

-- Retain odds history for 180 days
DELETE FROM odds_history WHERE created_at < NOW() - INTERVAL '180 days';

-- Retain old worker heartbeats for 7 days
DELETE FROM worker_heartbeats WHERE beat_at < NOW() - INTERVAL '7 days';

-- Compress grades older than 30 days (TimescaleDB)
SELECT compress_chunk(i) FROM show_chunks('grades', older_than => INTERVAL '30 days') i;

-- Schedule retention job
SELECT cron.schedule('data-retention', '0 3 * * *', '
  DELETE FROM kalshi_markets WHERE created_at < NOW() - INTERVAL ''30 days'';
  DELETE FROM model_responses WHERE created_at < NOW() - INTERVAL ''90 days'';
  DELETE FROM odds_history WHERE created_at < NOW() - INTERVAL ''180 days'';
  DELETE FROM worker_heartbeats WHERE beat_at < NOW() - INTERVAL ''7 days'';
');
```

---

## 🔴 MEDIUM: Add WCAG 2.1 AA Accessibility

**Severity:** MEDIUM  
**Impact:** Excludes users with disabilities. Potential legal liability.  
**Effort:** 3 days  
**Reference:** `web/src/pages/*.tsx`, `web/src/components/*.tsx`

### Fix

**Add ESLint plugin:**
```bash
npm install -D eslint-plugin-jsx-a11y
```

```json
// .eslintrc.json
{
  "plugins": ["jsx-a11y"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/anchor-is-valid": "error",
    "jsx-a11y/click-events-have-key-events": "error",
    "jsx-a11y/no-static-element-interactions": "warn"
  }
}
```

**Add ARIA to components:**
```tsx
// web/src/components/TwoLaneCard.tsx (example)
<div 
  role="article" 
  aria-label={`${game.awayTeam} at ${game.homeTeam} game card`}
  tabIndex={0}
>
  <h2 aria-label="Matchup">
    {game.awayTeam} <span aria-label="at">@</span> {game.homeTeam}
  </h2>
  
  <div role="group" aria-label="Grade information">
    <span aria-label={`Grade: ${game.ourGrade.grade}`}>
      {game.ourGrade.grade}
    </span>
    <span aria-label={`Convergence: ${game.convergence.status}`}>
      {game.convergence.status}
    </span>
  </div>
  
  <button 
    aria-label={`Analyze ${game.awayTeam} at ${game.homeTeam}`}
    onClick={() => onAnalyze(game.id)}
  >
    Analyze
  </button>
</div>
```

**Add keyboard navigation:**
```tsx
// web/src/components/Layout.tsx
import { useEffect } from 'react';

export function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close any open modals or drawers
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        // Focus search
        document.getElementById('search-input')?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

---

## 🔴 MEDIUM: Add Reduced Motion Support

**Severity:** MEDIUM  
**Impact:** Users with vestibular disorders may experience discomfort  
**Effort:** 2 hours  
**Reference:** `web/src/main.tsx`

### Fix

```tsx
// web/src/main.tsx
import { MotionConfig } from 'framer-motion';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "user"}>
      <App />
    </MotionConfig>
  </React.StrictMode>
);
```

Also add CSS fallback:
```css
/* web/src/index.css */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🔴 LOW: Remove Next.js Artifacts

**Severity:** LOW  
**Impact:** Confusion for new developers  
**Effort:** 30 minutes  
**Reference:** `web/next.config.js`, `web/.gitignore`

### Fix

```bash
rm web/next.config.js
```

Update `web/.gitignore`:
```gitignore
# Remove these lines (Next.js artifacts, not needed for Vite):
# .next/
# out/
# next-env.d.ts
```

---

## 🔴 LOW: Consolidate Tailwind Configs

**Severity:** LOW  
**Impact:** Unpredictable which config is active  
**Effort:** 1 hour  
**Reference:** `web/tailwind.config.ts`, `web/tailwind.config.js`

### Fix

**Option A: Keep `.js` (Vite standard)**
```bash
rm web/tailwind.config.ts
```

**Option B: Migrate to `.ts` and update PostCSS**
```bash
mv web/tailwind.config.js web/tailwind.config.js.bak
# Update web/postcss.config.js to point to tailwind.config.ts
# Update tsconfig.json to include tailwind.config.ts
```

Recommended: **Option A** (Vite projects conventionally use `.js`).

---

## 🔴 LOW: Add `INTERNAL_API_KEY` Validation

**Severity:** LOW  
**Impact:** Service-to-service key exists but is never checked  
**Effort:** 2 hours  
**Reference:** `.env.example` line 27, `app/middleware/auth.py`

### Fix

```python
# app/middleware/auth.py
import os
from fastapi import HTTPException, Request

async def require_internal_api_key(request: Request):
    """Validate X-API-Key header for service-to-service calls."""
    api_key = request.headers.get("X-API-Key")
    expected = os.environ.get("INTERNAL_API_KEY")
    
    if not expected:
        return  # No key configured, skip check
    
    if not api_key or api_key != expected:
        raise HTTPException(
            status_code=403,
            detail="Invalid internal API key",
            headers={"WWW-Authenticate": "X-API-Key"},
        )
```

Use it on internal-only endpoints:
```python
from fastapi import APIRouter, Depends
from app.middleware.auth import require_internal_api_key

router = APIRouter()

@router.post("/internal/refresh-odds")
async def refresh_odds(_=Depends(require_internal_api_key)):
    # ... internal logic
    pass
```

---

# Part 3: Quick Wins (Under 2 Hours Each)

| Task | File | Effort | Code Snippet |
|------|------|--------|-------------|
| **Enable Sentry** | `app/main.py` | 30 min | Uncomment `sentry-sdk[fastapi]` in `requirements.txt`, set `SENTRY_DSN` |
| **Enable structlog** | `app/main.py` | 30 min | Uncomment `structlog` in `requirements.txt`, set `STRUCTLOG=1` |
| **Add request size limit** | `app/main.py` | 30 min | `app = FastAPI(max_request_size=1024*1024)` |
| **Fix CSP to use nonces** | `app/middleware/headers.py` | 1 hour | Replace `'unsafe-inline'` with `nonce-{random}` for scripts |
| **Add HSTS to Vercel routes** | `web/api/_shared.ts` | 30 min | Add `Strict-Transport-Security: max-age=31536000` to `corsHeaders` |
| **Add API docs in dev** | `app/main.py` | 15 min | Already enabled with `debug=True` — document this for developers |
| **Add `nosniff` to Vercel** | `vercel.json` | 15 min | Add `"headers": [{"source": "/(.*)", "headers": [{"key": "X-Content-Type-Options", "value": "nosniff"}]}]` |
| **Fix `.env.example` JWT** | `.env.example` | 15 min | Change to `JWT_SECRET=change-me-to-32-chars-or-more-in-production` |
| **Add `noindex` to dev** | `web/index.html` | 15 min | Add `<meta name="robots" content="noindex">` when `ENVIRONMENT !== production` |
| **Add CORS Vary header** | `app/middleware/security.py` | 15 min | Add `vary="Origin"` to CORS response headers |

---

*End of Optimization Roadmap — Edge Crew v3.0*
