-- ============================================================================
-- Kalshi / props integration
-- Stores Kalshi event-contract market snapshots for sports props, spreads,
-- totals, and moneylines. Data is fetched from Kalshi's public read-only API
-- (https://api.elections.kalshi.com/trade-api/v2).
-- ============================================================================

CREATE TABLE IF NOT EXISTS kalshi_markets (
    ticker TEXT PRIMARY KEY,
    event_ticker TEXT NOT NULL,
    series_ticker TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    market_type TEXT,
    status TEXT NOT NULL,
    yes_bid DECIMAL(6,4),
    yes_ask DECIMAL(6,4),
    no_bid DECIMAL(6,4),
    no_ask DECIMAL(6,4),
    last_price DECIMAL(6,4),
    volume_24h DECIMAL(20,2),
    open_interest DECIMAL(20,2),
    close_time TIMESTAMPTZ,
    expiration_time TIMESTAMPTZ,
    occurrence_time TIMESTAMPTZ,
    rules_primary TEXT,
    rules_secondary TEXT,
    sport sport_enum,
    home_team TEXT,
    away_team TEXT,
    raw_payload JSONB NOT NULL DEFAULT '{}',
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kalshi_markets_event ON kalshi_markets(event_ticker);
CREATE INDEX IF NOT EXISTS idx_kalshi_markets_series ON kalshi_markets(series_ticker);
CREATE INDEX IF NOT EXISTS idx_kalshi_markets_sport ON kalshi_markets(sport);
CREATE INDEX IF NOT EXISTS idx_kalshi_markets_status ON kalshi_markets(status);
CREATE INDEX IF NOT EXISTS idx_kalshi_markets_fetched ON kalshi_markets(fetched_at DESC);

-- Public read access; service/admin write via Supabase client
ALTER TABLE kalshi_markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kalshi markets are publicly readable"
    ON kalshi_markets FOR SELECT USING (true);

CREATE POLICY "Service role can manage Kalshi markets"
    ON kalshi_markets FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- Trigger to refresh updated_at
CREATE OR REPLACE FUNCTION update_kalshi_markets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_kalshi_markets_updated_at ON kalshi_markets;
CREATE TRIGGER update_kalshi_markets_updated_at
    BEFORE UPDATE ON kalshi_markets
    FOR EACH ROW
    EXECUTE FUNCTION update_kalshi_markets_updated_at();
