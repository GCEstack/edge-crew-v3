"""
Kalshi public API client for sports event contracts.

Fetches open sports markets from https://api.elections.kalshi.com/trade-api/v2
and upserts them into the `kalshi_markets` table. No authentication is required
for read-only market data.

Run as a module for a one-off sync:
    python app/kalshi_client.py

Or import `sync_kalshi_markets(supabase)` to call from the AI worker.
"""

import asyncio
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
from supabase import Client

logger = logging.getLogger("edge-crew-kalshi")

KALSHI_BASE_URL = "https://api.elections.kalshi.com/trade-api/v2"

# Series ticker -> our sport enum. Add more as Kalshi expands sports offerings.
SERIES_SPORT_MAP: Dict[str, str] = {
    "KXNBAGAME": "nba",
    "KXWCTOTAL": "wnba",
    "KXWCGAME": "wnba",
    "KXNHLGAME": "nhl",
    "KXNFLGAME": "nfl",
    "KXNCAAFB": "ncaaf",
    "KXMBL": "mlb",
    "KXSOCCER": "soccer",
    "KXUCL": "soccer",
    "KXEPL": "soccer",
    "KXWORLD": "soccer",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_event_teams(title: str, subtitle: Optional[str]) -> Dict[str, Optional[str]]:
    """Best-effort parse of home/away teams from event title/subtitle."""
    text = f"{title or ''} {subtitle or ''}"
    # Typical subtitle: "NYK at SAS (Jun 13)"
    match = re.search(r"([A-Za-z\s\.]+?)\s+at\s+([A-Za-z\s\.]+?)(\s+\(|\s*$)", text)
    if match:
        return {
            "away_team": match.group(1).strip(),
            "home_team": match.group(2).strip(),
        }
    return {"home_team": None, "away_team": None}


def _sport_for_series(series_ticker: str) -> Optional[str]:
    if series_ticker in SERIES_SPORT_MAP:
        return SERIES_SPORT_MAP[series_ticker]
    for prefix, sport in SERIES_SPORT_MAP.items():
        if series_ticker.startswith(prefix):
            return sport
    return None


def _market_row(event: Dict[str, Any], market: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    ticker = market.get("ticker")
    if not ticker:
        return None

    series_ticker = market.get("series_ticker") or event.get("series_ticker", "")
    sport = _sport_for_series(series_ticker)
    if not sport:
        # Skip non-sports series unless explicitly mapped.
        return None

    teams = _parse_event_teams(event.get("title", ""), market.get("subtitle") or market.get("yes_sub_title"))

    def _dec(v: Any) -> Optional[float]:
        if v is None or v == "":
            return None
        try:
            return float(v)
        except (TypeError, ValueError):
            return None

    def _ts(v: Any) -> Optional[str]:
        if not v:
            return None
        return str(v) if "T" in str(v) else None

    return {
        "ticker": ticker,
        "event_ticker": market.get("event_ticker") or event.get("event_ticker", ""),
        "series_ticker": series_ticker,
        "title": market.get("title", ""),
        "subtitle": market.get("subtitle") or market.get("yes_sub_title"),
        "market_type": market.get("market_type"),
        "status": market.get("status", "unknown"),
        "yes_bid": _dec(market.get("yes_bid_dollars")),
        "yes_ask": _dec(market.get("yes_ask_dollars")),
        "no_bid": _dec(market.get("no_bid_dollars")),
        "no_ask": _dec(market.get("no_ask_dollars")),
        "last_price": _dec(market.get("last_price_dollars")),
        "volume_24h": _dec(market.get("volume_24h_fp")),
        "open_interest": _dec(market.get("open_interest_fp")),
        "close_time": _ts(market.get("close_time")),
        "expiration_time": _ts(market.get("expiration_time")),
        "occurrence_time": _ts(market.get("occurrence_datetime")),
        "rules_primary": market.get("rules_primary"),
        "rules_secondary": market.get("rules_secondary"),
        "sport": sport,
        "home_team": teams.get("home_team"),
        "away_team": teams.get("away_team"),
        "raw_payload": market,
        "fetched_at": _now(),
    }


async def _kalshi_get(client: httpx.AsyncClient, url: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """GET with polite pacing and one retry on 429."""
    for attempt in range(2):
        try:
            resp = await client.get(url, params=params, timeout=30)
            if resp.status_code == 429:
                wait = 1.0 * (attempt + 1)
                logger.warning(f"[KALSHI] Rate limited, waiting {wait}s")
                await asyncio.sleep(wait)
                continue
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            logger.warning(f"[KALSHI] HTTP error {e.response.status_code} for {url}: {e}")
            return None
        except Exception as e:
            logger.warning(f"[KALSHI] Request failed for {url}: {e}")
            return None
    return None


async def _fetch_open_sports_events(client: httpx.AsyncClient) -> List[Dict[str, Any]]:
    """Fetch all open events with nested markets, then keep only sports series."""
    events: List[Dict[str, Any]] = []
    cursor: Optional[str] = ""
    params: Dict[str, Any] = {"status": "open", "with_nested_markets": "true", "limit": 100}

    while cursor is not None:
        if cursor:
            params["cursor"] = cursor
        data = await _kalshi_get(client, f"{KALSHI_BASE_URL}/events", params)
        if data is None:
            break

        for event in data.get("events") or []:
            series_ticker = event.get("series_ticker", "")
            if _sport_for_series(series_ticker):
                events.append(event)

        cursor = data.get("cursor") or None
        await asyncio.sleep(0.25)

    return events


async def _fetch_markets_for_event(client: httpx.AsyncClient, event_ticker: str) -> List[Dict[str, Any]]:
    """Fallback if an event does not include nested markets."""
    markets: List[Dict[str, Any]] = []
    cursor: Optional[str] = ""
    params: Dict[str, Any] = {"event_ticker": event_ticker, "status": "active", "limit": 100}
    while cursor is not None:
        if cursor:
            params["cursor"] = cursor
        data = await _kalshi_get(client, f"{KALSHI_BASE_URL}/markets", params)
        if data is None:
            break

        markets.extend(data.get("markets") or [])
        cursor = data.get("cursor") or None
        await asyncio.sleep(0.25)
    return markets


async def sync_kalshi_markets(supabase: Client, sport_series: Optional[List[str]] = None) -> Dict[str, int]:
    """Fetch open Kalshi sports markets and upsert them into kalshi_markets."""
    logger.info("[KALSHI] Starting market sync")
    rows: List[Dict[str, Any]] = []

    async with httpx.AsyncClient() as client:
        events = await _fetch_open_sports_events(client)
        logger.info(f"[KALSHI] Found {len(events)} open sports events")

        for event in events:
            markets = event.get("markets") or []
            if not markets:
                event_ticker = event.get("event_ticker")
                if event_ticker:
                    markets = await _fetch_markets_for_event(client, event_ticker)

            for market in markets:
                row = _market_row(event, market)
                if row:
                    rows.append(row)

    if rows:
        try:
            supabase.table("kalshi_markets").upsert(rows, on_conflict="ticker").execute()
            logger.info(f"[KALSHI] Upserted {len(rows)} markets")
        except Exception as e:
            logger.exception(f"[KALSHI] Failed to upsert markets: {e}")
            raise
    else:
        logger.info("[KALSHI] No markets to upsert")

    return {"events": len(events), "markets": len(rows)}


async def main() -> None:
    from dotenv import load_dotenv
    from supabase import create_client

    load_dotenv()

    supabase_url = os.environ.get("SUPABASE_URL", "").strip()
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not supabase_url or not supabase_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")

    supabase = create_client(supabase_url, supabase_key)
    result = await sync_kalshi_markets(supabase)
    print(result)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
