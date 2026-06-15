# Edge Crew Grade Engine — Supabase Edge Function

TypeScript/Deno port of `grade_engine.py`.

## Structure

```
functions/
├── grade/index.ts              # Supabase Edge Function entry point
├── _shared/
│   ├── index.ts                # Public barrel (matches Python imports)
│   ├── grade-types.ts          # Domain types
│   ├── constants.ts            # GRADE_THRESHOLDS, SIZING_MAP, SPORT_VARIABLES, CHAINS
│   ├── utils.ts                # score_to_grade, _clamp, _parse_record, check_chain
│   ├── engine.ts               # grade_game, grade_both_sides, grade_game_total
│   ├── betting.ts              # calculate_ev, peter_rules
│   └── scorers/
│       ├── team.ts             # Universal scorers
│       ├── nba.ts              # NBA-specific
│       ├── nhl.ts              # NHL-specific
│       ├── mlb.ts              # MLB-specific
│       ├── soccer.ts           # Soccer-specific
│       └── combat.ts           # MMA/Boxing
```

## Public API

Matches the Python surface used by `app/main.py`:

```ts
import { grade_both_sides, score_to_grade, calculate_ev, peter_rules, grade_game_total } from '../_shared/index.ts'
```

## Deploy

```bash
supabase functions deploy grade
```

## Invoke

```bash
curl -X POST https://<project>.supabase.co/functions/v1/grade \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "sport": "NBA",
    "homeTeam": "Lakers",
    "awayTeam": "Warriors",
    "home_profile": { "off_ranking": 8, "def_ranking": 6, ... },
    "away_profile": { "off_ranking": 7, "def_ranking": 7, ... },
    "odds": { "spread": -3.5, "total": 232.5, "mlHome": -160, "mlAway": 140 }
  }'
```

## Type Checking

```bash
# Install Deno, then:
deno check _shared/engine.ts _shared/index.ts grade/index.ts
```

## Notes

- Dynamic weight learning (`dynamic_weights.py`) and optional MLB matchup depth imports are stubbed; the engine uses hardcoded `SPORT_VARIABLES`.
- Profile chain bonuses are disabled (matching current Python behavior).
- The "crew" blend in `grade_profiles` uses fixed weights for determinism.
