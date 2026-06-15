# Edge Crew v3.0 — Phase 2 API Endpoints

## Supabase Edge Function: `api`

Path prefix: `https://<project>.supabase.co/functions/v1/api`

Authenticated via `Authorization: Bearer <supabase-jwt>`.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/user/bankroll` | GET | Current user's bankroll summary |
| `/user/picks` | GET | Current user's pick history |
| `/user/pick` | POST | Lock a new pick |
| `/user/pick/:id/result` | POST | Grade a pick (W/L/P) and update bankroll |
| `/profile/adjust` | POST | Adjust bankroll by delta |
| `/locks` | GET | Current user's locked game IDs |
| `/locks` | POST | Add/remove a locked game |
| `/gut-pick` | GET | Current user's gut picks |
| `/gut-pick` | POST | Submit a gut pick |

### Example

```bash
curl -X POST https://<project>.supabase.co/functions/v1/api/user/pick \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": "abc123",
    "sport": "nba",
    "team": "home",
    "type": "spread",
    "line": -3.5,
    "amount": 100,
    "odds": -110
  }'
```

## Vercel API Routes

Path prefix: `https://<vercel-domain>/api`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/games?sport=` | GET | Active games (with mock fallback) |
| `/top-picks` | GET | Top pending picks |
| `/parlay` | GET | User's locked games + picks |
| `/betslip` | POST | Generate bet slip from game IDs |
| `/calibration` | GET | Latest calibration snapshot |

## Deploy

```bash
# Supabase Edge Functions
supabase functions deploy grade
supabase functions deploy api

# Vercel
vercel --prod web/
```

## Required Environment Variables

### Supabase Edge Functions
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### Vercel
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
