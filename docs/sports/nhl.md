# NHL — National Hockey League

## Data Source

- **ESPN scoreboard**: `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard`
- **Enrichment**: Starting goalies from ESPN/StatsAPI, special teams, injuries.

## Markets Analyzed

- Moneyline (home/away)
- Puck line (spread)
- Total (over/under)

## Prompt Specialization

The NHL block in `app/main.py` adds:

- **Starting goalies** with tier label and save percentage.
- Goalie workload and fatigue context.

The model is told that goaltending is the dominant variable in hockey grading.

## Grade Engine Variables (`grade_engine.py`)

Top-weighted variables from `SPORT_VARIABLES["NHL"]`:

| Variable | Weight | Why it matters |
|----------|--------|----------------|
| `goalie` | 10.8 | Starting goalie quality is king |
| `goalie_workload` | 9.7 | Fatigue degrades performance |
| `goalie_tier_delta` | 9.2 | Matchup edge between goalies |
| `off_ranking` | 8.9 | Offensive strength |
| `def_ranking` | 8.6 | Defensive strength |
| `scoring_margin_diff` | 8.3 | Goal differential edge |
| `star_player` | 8.1 | Top skaters |
| `pp_pct` / `pk_pct` | 7.9 / 7.5 | Power play / penalty kill |
| `special_teams_combined` | 7.3 | Combined special-teams edge |
| `rest` / `b2b_flag` | 7.7 / 7.1 | Schedule effects |

## Total Grading

`grade_game_total()` uses NHL baseline **3.2 goals/game**. It weights:

- Offensive/defensive efficiency.
- Pace (shots/game).
- Goalie quality.
- Special teams and rest.

## Key Code References

- `grade_engine.py`: `score_starting_goalie`, `score_goalie_workload`, `score_goalie_tier_delta`, `score_pp_pct`, `score_pk_pct`, `score_special_teams_combined`, `score_shot_quality`
- `app/main.py`: NHL goalie block (`goalie_block`)
