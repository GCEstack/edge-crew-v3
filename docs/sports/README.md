# Per-Sport Guides

These guides explain how Edge Crew fetches, enriches, grades, and renders each sport.

| Sport | Guide | ESPN Endpoint | Notes |
|-------|-------|---------------|-------|
| **MLB** | [mlb.md](mlb.md) | `baseball/mlb` | Bullpen-first grading; pitcher/batter archetypes |
| **NBA** | [nba.md](nba.md) | `basketball/nba` | Quarter splits, bench scoring, late-game strength |
| **NHL** | [nhl.md](nhl.md) | `hockey/nhl` | Goalie-centric model; special teams |
| **NFL** | [nfl.md](nfl.md) | `football/nfl` | Turnovers, red zone, weather, divisional |
| **Soccer** | [soccer.md](soccer.md) | Multiple (`soccer/<league>`) | 1X2, totals, BTTS, fixture congestion |
| **MMA** | [mma.md](mma.md) | `mma/mixed_martial_arts` | 3-profile fight grading, no totals |
| **WNBA** | [wnba.md](wnba.md) | `basketball/wnba` | Similar to NBA with WNBA-specific weights |

All sports share the same high-level pipeline:

1. ESPN scoreboard fetched for today + tomorrow (filtered to next 24h).
2. Team/fighter profiles enriched from ESPN APIs and reference data.
3. Deterministic grade engine scores each side/total.
4. AI panel receives a sport-specific prompt block.
5. Results are converged and written to `grades`.

See [`backend/README.md`](../../backend/README.md) for the shared backend architecture.
