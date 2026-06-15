# MLB — Major League Baseball

## Data Source

- **ESPN scoreboard**: `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard`
- **Enrichment**: `data_fetch_mlb.py` + MLB StatsAPI for pitchers, bullpens, weather, umpires.

## Markets Analyzed

- Moneyline (home/away)
- Run line (spread)
- Total (over/under)
- NRFI / YRFI (first-inning) derived from total pick metadata

## Prompt Specialization

The MLB block in `app/main.py` adds:

- **Probable starting pitchers** with tier label, ERA, WHIP, K/9.
- **Park factor** from `grade_engine.PARK_FACTORS`.
- **Weather** (temp, wind, condition) from MLB StatsAPI.
- **Home-plate umpire** K% tendency.
- **Bullpen ERA L7** + tired-arm count.
- **Lineup vs SP handedness** OPS splits.

The grading philosophy sent to the AI panel is:

> Starters go 5 innings. The bullpen finishes the game. Bullpen is king; K-rate vs barrel-rate matchup is the core edge; starter depth (innings, K/9) matters more than starter name; park + weather + umpire adjust the total; starter narrative is last and least.

## Grade Engine Variables (`grade_engine.py`)

Top-weighted variables from `SPORT_VARIABLES["MLB"]`:

| Variable | Weight | Why it matters |
|----------|--------|----------------|
| `bullpen` | 10.9 | Pen quality is decisive late |
| `bullpen_k_dominance` | 10.4 | Strikeout arms suppress rallies |
| `k_rate_vs_barrel` | 9.8 | Power arm vs power lineup matchup |
| `bullpen_fatigue` | 9.5 | Tired pens get exposed |
| `lineup_vs_hand` | 9.2 | Platoon splits vs starter hand |
| `starter_depth` | 8.9 | Innings eaten saves the pen |
| `lineup_dna` | 8.6 | Contact/power/plate-discipline profile |
| `pitcher_hitter_archetype` | 8.3 | Ground-ball vs fly-ball fit |

MLB also uses three additional **new-age profiles** (`runvalue`, `statcast`, `pitchlab`) that re-weight the same variables toward run value, batted-ball quality, and pitching-lab edges.

## Total Grading

`grade_game_total()` compares L5 offense/defense to sport averages, adds pace/tempo signals, park/weather factors, bullpen fatigue, and umpire tendencies. Scoring averages used:

- MLB baseline: **4.5 runs/game**

## Key Code References

- `grade_engine.py`: `score_starting_pitcher`, `score_bullpen`, `score_lineup_vs_hand`, `score_park_factor`, `score_umpire`, `score_weather_factor`
- `data_fetch_mlb.py`: pitcher/bullpen lookups
- `app/main.py`: MLB prompt block (`mlb_priority_block`, `pitcher_block`)
