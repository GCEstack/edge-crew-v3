# NFL — National Football League

## Data Source

- **ESPN scoreboard**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`
- **Enrichment**: Team profiles, injuries, weather, rest, divisional flags, red-zone data.

## Markets Analyzed

- Moneyline (home/away)
- Spread
- Total (over/under)

## Prompt Specialization

The NFL block in `app/main.py` (inside the universal form/injury blocks) adds:

- **Turnover differential**
- **Red-zone efficiency**
- **Divisional game flag**
- **Weather** (wind, temp, precipitation)
- **Coaching context**

The AI panel is asked to weigh situational edges (rest, weather, divisional familiarity, turnovers) alongside raw team quality.

## Grade Engine Variables (`grade_engine.py`)

Top-weighted variables from `SPORT_VARIABLES["NFL"]`:

| Variable | Weight | Why it matters |
|----------|--------|----------------|
| `off_ranking` | 9 | Offensive efficiency |
| `def_ranking` | 9 | Defensive efficiency |
| `star_player` | 8 | QB/injury impact |
| `form` | 8 | Recent performance |
| `home_away` | 7 | Home-field edge |
| `rest` | 7 | Short-week penalties |
| `pace` | 7 | Possessions per game |
| `weather` | 7 | Wind/precip affects total |
| `turnover_diff` | 7 | Turnover margin |
| `ats` | 7 | Against-the-spread trend |
| `red_zone` | 6 | Scoring efficiency |
| `divisional` | 6 | Familiarity/rivalry |

## Total Grading

`grade_game_total()` uses NFL baseline **22 points/game**. It weights:

- Offensive/defensive efficiency.
- Pace and play-calling tempo.
- Turnover differential.
- Weather (wind especially pushes totals down).
- Red-zone efficiency.

## Key Code References

- `grade_engine.py`: `score_turnover_diff`, `score_red_zone`, `score_divisional`, `score_coaching`, `score_weather`
- `app/main.py`: NFL context in the universal prompt builder
