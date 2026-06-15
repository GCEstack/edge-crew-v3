# NBA — National Basketball Association

## Data Source

- **ESPN scoreboard**: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard`
- **Enrichment**: Team profiles, injuries, rest, H2H, line movement from ESPN.

## Markets Analyzed

- Moneyline (home/away)
- Spread
- Total (over/under)

## Prompt Specialization

The NBA block in `app/main.py` adds:

- **Quarter splits L10**: Q1/Q4 scoring, leads blown, comebacks (collapse-prone vs strong closer labels).
- **Bench scoring L5**: bench PPG to identify teams that blow leads or close poorly.

These are surfaced right after the form block so the model sees late-game context before evaluating the spread/total.

## Grade Engine Variables (`grade_engine.py`)

Top-weighted variables from `SPORT_VARIABLES["NBA"]`:

| Variable | Weight | Why it matters |
|----------|--------|----------------|
| `star_player` | 9 | Injury/availability swings lines |
| `rest` | 9 | B2B and schedule density |
| `off_ranking` | 8 | Offensive efficiency |
| `def_ranking` | 8 | Defensive efficiency |
| `three_pt_rate` | 8 | Modern NBA variance driver |
| `b2b_fatigue` | 8 | Back-to-back penalty |
| `pace` | 7 | Pace matchup drives totals |
| `late_game_strength` | 7 | Closing/clutch performance |
| `travel_distance` | 6 | West/East coast trips |
| `referee_pace` | 5 | Crew tempo bias |

## Total Grading

`grade_game_total()` uses NBA baseline **114 points/game**. It factors:

- Both teams' L5 offensive/defensive efficiency vs league average.
- Pace matchup.
- Rest and back-to-back fatigue.
- Three-point rate and turnover rate.

## Key Code References

- `grade_engine.py`: `score_late_game_strength`, `score_quarter_pace`, `score_bench_diff`, `score_three_pt_rate`, `score_b2b_fatigue`, `score_referee_pace`
- `app/main.py`: NBA prompt block (`nba_block`)
