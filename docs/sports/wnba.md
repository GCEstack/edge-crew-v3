# WNBA — Women's National Basketball Association

## Data Source

- **ESPN scoreboard**: `https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard`
- **Enrichment**: Team profiles, injuries, rest, H2H, line movement from ESPN.

## Markets Analyzed

- Moneyline (home/away)
- Spread
- Total (over/under)

## Prompt Specialization

WNBA reuses the same prompt builder as NBA. The NBA-specific quarter-split and bench-scoring block is applied when `sport == "NBA"`, so WNBA currently does **not** receive the quarter-collapse/bench-scoring context. It relies on the universal form, injury, rest, and line-movement blocks.

To add WNBA-specific context in the future, mirror the `nba_block` with WNBA keys.

## Grade Engine Variables (`grade_engine.py`)

Top-weighted variables from `SPORT_VARIABLES["WNBA"]`:

| Variable | Weight | Why it matters |
|----------|--------|----------------|
| `star_player` | 10 | WNBA stars drive outcomes |
| `off_ranking` | 9 | Offensive efficiency |
| `def_ranking` | 9 | Defensive efficiency |
| `form` | 8 | Last 5 performance |
| `depth` | 8 | Bench/rotation quality |
| `line_movement` | 7 | Sharp line shifts |
| `ats` | 7 | Against-the-spread trend |
| `h2h` | 6 | Season series |
| `bench_diff` | 7 | Rotation advantage |
| `travel_distance` | 7 | Cross-country trips |
| `turnover_rate` | 6 | Possession efficiency |

## Total Grading

`grade_game_total()` uses WNBA baseline **80 points/game**. It factors:

- Offensive/defensive efficiency vs league average.
- Pace matchup.
- Rest and travel.
- Star-player and depth contributions.

## Key Code References

- `grade_engine.py`: shares NBA scoring functions; `SPORT_VARIABLES["WNBA"]` overrides weights
- `app/main.py`: WNBA added to `_ESPN_MAP`; no dedicated prompt block yet
