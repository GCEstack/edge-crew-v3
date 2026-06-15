# MMA — Mixed Martial Arts

## Data Source

- **ESPN scoreboard**: `https://site.api.espn.com/apis/site/v2/sports/mma/mixed_martial_arts/scoreboard`
- **Enrichment**: Fighter profiles (reach, stance, record, finish rate, camp quality) when available.

## Markets Analyzed

- Moneyline (home/away fighter)
- No totals or spreads — fight outcomes are binary (winner / method / round props are not graded)

## Grading Approach

MMA uses a dedicated function `grade_engine.grade_mma_fight()`. It runs three internal profiles:

1. **odds_sharp** — line-movement and market efficiency.
2. **tape** — physical and stylistic matchup (reach, stance, ground game, finish rate).
3. **situation** — rest, activity, motivation, camp quality.

The final grade blends the three profile scores.

## Prompt Specialization

The MMA/combat block in `app/main.py` (lines ~1124 and ~1994+) handles fighters as `home_fighter` / `away_fighter`. The AI panel is asked to evaluate:

- Striking vs grappling matchup
- Reach and stance advantage
- Recent form and activity level
- Finish rate (KO/TKO vs decision)
- Cardio and camp quality
- Public line value

## Grade Engine Variables (`grade_engine.py`)

Top-weighted variables from `SPORT_VARIABLES["MMA"]`:

| Variable | Weight | Why it matters |
|----------|--------|----------------|
| `form` | 9 | Recent fight results |
| `reach_advantage` | 8 | Striking range edge |
| `star_player` | 7 | Name value / market bias |
| `motivation` | 7 | Fight stakes |
| `finish_rate` | 7 | KO/sub vs decision tendency |
| `stance_matchup` | 6 | Southpaw vs orthodox dynamic |
| `ground_game` | 7 | Wrestling/grappling edge |
| `camp_quality` | 6 | Training camp quality |
| `rest` | 5 | Layoff length |
| `line_movement` | 5 | Sharp money signal |

## Key Code References

- `grade_engine.py`: `grade_mma_fight`, `score_reach_advantage`, `score_finish_rate`, `score_ground_game`, `score_camp_quality`, `score_stance_matchup`, `score_activity`
- `app/main.py`: combat-sport branch in `_analyze_games_impl` and prompt assembly
