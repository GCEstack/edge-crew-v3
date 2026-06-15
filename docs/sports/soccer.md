# Soccer / Football

## Data Sources

ESPN scoreboards are fetched per league via `data_fetch.SOCCER_LEAGUE_MAP`:

| League | ESPN slug | Odds key |
|--------|-----------|----------|
| MLS | `usa.1` | `soccer_usa_mls` |
| Premier League | `eng.1` | `soccer_epl` |
| La Liga | `esp.1` | `soccer_spain_la_liga` |
| Serie A | `ita.1` | `soccer_italy_serie_a` |
| Bundesliga | `ger.1` | `soccer_germany_bundesliga` |
| Ligue 1 | `fra.1` | `soccer_france_ligue_one` |
| Champions League | `uefa.champions` | `soccer_uefa_champs_league` |
| Europa League | `uefa.europa` | `soccer_uefa_europa_league` |
| Brasileirão | `bra.1` | `soccer_brazil_campeonato` |
| Liga MX | `mex.1` | `soccer_mexico_ligamx` |
| FIFA World Cup | `fifa.world` | `soccer_fifa_world_cup` |

## Markets Analyzed

- 1X2 moneyline (home / draw / away)
- Asian/total over-under
- Both Teams To Score (BTTS) when odds are present

## Prompt Specialization

The soccer block in `app/main.py` adds:

- **Key attackers out** — flagged against a hardcoded top-scorer list.
- **Fixture congestion** — matches played in the last 10 days.
- **Keeper tier** — if starting keeper data is populated.
- **Competition label** — so the model distinguishes cup from league form.
- **ML 3-way odds** and **BTTS odds** when available.

The AI panel is instructed to evaluate market edge across:

- 1X2 (home/away/draw)
- Totals (over/under)
- BTTS
- Clean-sheet probability

## Grade Engine Variables (`grade_engine.py`)

Top-weighted variables from `SPORT_VARIABLES["SOCCER"]`:

| Variable | Weight | Why it matters |
|----------|--------|----------------|
| `off_ranking` | 9 | xG / goal production |
| `def_ranking` | 9 | Defensive quality |
| `form` | 8 | Last 5 results |
| `star_player` | 8 | Top scorer availability |
| `goalkeeper` | 8 | Keeper quality swing |
| `home_away` | 7 | Home-field/boost |
| `h2h` | 6 | Historical matchup |
| `motivation` | 6 | Table position / stakes |
| `congestion` | 6 | Fixture load |
| `squad_rotation` | 6 | Lineup rotation risk |

## Total Grading

`grade_game_total()` uses soccer baseline **1.4 goals/game**. It weights:

- Offensive/defensive strength.
- Pace / expected goals.
- Fixture congestion.
- Keeper and star-player availability.

## Key Code References

- `grade_engine.py`: `score_soccer_key_player`, `score_fixture_congestion`, `score_motivation`, `score_goalkeeper`, `score_squad_rotation`, `score_league_home_boost`
- `data_fetch.py`: `SOCCER_LEAGUE_MAP`
- `app/main.py`: Soccer prompt block (`soccer_block`)
