-- ============================================================================
-- Edge Crew v3.0 - Reference Data Seeds
-- ============================================================================

INSERT INTO sports_config (id, name, season_type, current_season, is_active, grading_weights, config)
VALUES
    ('nba', 'NBA', 'regular', 2025, true, '{}', '{"leagues": ["basketball_nba"]}'),
    ('nhl', 'NHL', 'regular', 2025, true, '{}', '{"leagues": ["icehockey_nhl"]}'),
    ('mlb', 'MLB', 'regular', 2025, true, '{}', '{"leagues": ["baseball_mlb"]}'),
    ('nfl', 'NFL', 'regular', 2025, true, '{}', '{"leagues": ["americanfootball_nfl"]}'),
    ('ncaab', 'NCAAB', 'regular', 2025, true, '{}', '{"leagues": ["basketball_ncaab"]}'),
    ('ncaaf', 'NCAAF', 'regular', 2025, true, '{}', '{"leagues": ["americanfootball_ncaaf"]}'),
    ('soccer', 'Soccer', 'regular', 2025, true, '{}', '{"leagues": ["soccer_usa_mls", "soccer_epl", "soccer_spain_la_liga", "soccer_italy_serie_a", "soccer_germany_bundesliga", "soccer_france_ligue_one", "soccer_uefa_champs_league", "soccer_uefa_europa_league", "soccer_brazil_campeonato", "soccer_mexico_ligamx"]}'),
    ('mma', 'MMA', 'regular', 2025, true, '{}', '{"leagues": ["mma_mixed_martial_arts"]}'),
    ('boxing', 'Boxing', 'regular', 2025, true, '{}', '{"leagues": ["boxing_boxing"]}'),
    ('golf', 'Golf', 'regular', 2025, true, '{}', '{"leagues": ["golf_masters_tournament_winner", "golf_pga_championship_winner", "golf_us_open_winner", "golf_the_open_championship_winner"]}'),
    ('wnba', 'WNBA', 'regular', 2025, true, '{}', '{"leagues": ["basketball_wnba"]}'),
    ('tennis', 'Tennis', 'regular', 2025, true, '{}', '{"leagues": []}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO bookmakers (id, name, region, priority, is_active, rate_limit)
VALUES
    ('draftkings', 'DraftKings', 'us', 10, true, 60),
    ('fanduel', 'FanDuel', 'us', 10, true, 60),
    ('betmgm', 'BetMGM', 'us', 20, true, 60),
    ('caesars', 'Caesars', 'us', 20, true, 60),
    ('pointsbetus', 'PointsBet', 'us', 30, true, 60),
    ('betrivers', 'BetRivers', 'us', 30, true, 60),
    ('wynnbet', 'WynnBET', 'us', 40, true, 60),
    ('bovada', 'Bovada', 'us', 40, true, 60),
    ('betonlineag', 'BetOnline', 'us', 50, true, 60),
    ('lowvig', 'LowVig', 'us', 50, true, 60)
ON CONFLICT (id) DO NOTHING;
