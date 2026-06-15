// Expected-value and Peter-rule helpers ported from grade_engine.py.
// Keep the math identical to the Python source.

import type { EnrichedGame, PickType, Side } from './grade-types.ts'
import { _parse_record } from './utils.ts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function firstTruthyNumber(...values: unknown[]): number | null {
  for (const v of values) {
    if (v == null) continue
    const n = Number(v)
    if (n !== 0 && Number.isFinite(n)) return n
  }
  return null
}

// ─── Implied Probability ──────────────────────────────────────────────────────

export function ml_to_implied_prob(ml: number | null | undefined): number | null {
  if (ml == null) {
    return null
  }
  if (ml > 0) {
    return 100 / (ml + 100)
  } else if (ml < 0) {
    return Math.abs(ml) / (Math.abs(ml) + 100)
  }
  return 0.5
}

// ─── Grade → True Probability ─────────────────────────────────────────────────

export function grade_to_true_prob(
  final_score: number,
  implied_prob: number | null | undefined = undefined,
): number {
  if (implied_prob == null) {
    const prob = 0.30 + (final_score / 10) * 0.45
    return Math.max(0.25, Math.min(0.80, prob))
  }
  const deviation = final_score - 5.0
  const edge = deviation * 0.03
  const true_prob = implied_prob + edge
  return Math.max(0.15, Math.min(0.90, true_prob))
}

// ─── Expected Value Calculator ────────────────────────────────────────────────

export interface CalculateEVResult {
  ev_pct: number | null
  ev_grade: string
  kelly_units: string
  true_prob: number | null
  implied_prob: number | null
  edge: number | null
  moneyline: number | null
}

export function calculate_ev(
  game: EnrichedGame,
  pick_side: Side | 'over' | 'under' | string,
  consensus_final: number,
  pick: { type?: PickType | string } | null = null,
): CalculateEVResult {
  const odds = game.odds ?? {}
  const rawOdds = odds as Record<string, unknown>
  const pick_type = pick?.type ?? 'ml'

  let ml: number | null = null

  if (pick_type === 'total') {
    if (pick_side === 'over' || pick_side === 'OVER') {
      ml = odds.overPrice || -110
    } else {
      ml = odds.underPrice || -110
    }
  } else if (pick_type === 'spread') {
    if (pick_side === 'home') {
      ml = odds.spreadPriceHome || -110
    } else {
      ml = odds.spreadPriceAway || -110
    }
  } else {
    if (pick_side === 'home') {
      ml = firstTruthyNumber(
        odds.mlHome,
        rawOdds.home_ml_current,
        rawOdds.ml_home,
      )
    } else {
      ml = firstTruthyNumber(
        odds.mlAway,
        rawOdds.away_ml_current,
        rawOdds.ml_away,
      )
    }
  }

  const implied_prob = ml_to_implied_prob(ml)
  const true_prob = grade_to_true_prob(consensus_final, implied_prob)

  if (implied_prob == null || ml == null || ml === 0) {
    return {
      ev_pct: null,
      ev_grade: 'N/A',
      kelly_units: 'N/A',
      true_prob: null,
      implied_prob: null,
      edge: null,
      moneyline: null,
    }
  }

  // Decimal odds
  let decimal_odds: number
  if (ml > 0) {
    decimal_odds = 1 + ml / 100
  } else {
    decimal_odds = 1 + 100 / Math.abs(ml)
  }

  const b = decimal_odds - 1
  const p = true_prob
  const q = 1 - p

  // EV calculation
  const ev = p * b - q
  const ev_pct = Math.round(ev * 100 * 100) / 100

  // Kelly criterion (quarter Kelly)
  const kelly_full = b > 0 ? (b * p - q) / b : 0
  const kelly_quarter = Math.max(0, kelly_full * 0.25)

  // Kelly to units
  let kelly_units: string
  if (kelly_quarter >= 0.06) {
    kelly_units = '2u'
  } else if (kelly_quarter >= 0.04) {
    kelly_units = '1.5u'
  } else if (kelly_quarter >= 0.02) {
    kelly_units = '1u'
  } else if (kelly_quarter > 0) {
    kelly_units = '0.5u'
  } else {
    kelly_units = 'PASS'
  }

  // EV grade
  let ev_grade: string
  if (ev_pct >= 10) {
    ev_grade = 'A+'
  } else if (ev_pct >= 7) {
    ev_grade = 'A'
  } else if (ev_pct >= 5) {
    ev_grade = 'B+'
  } else if (ev_pct >= 3) {
    ev_grade = 'B'
  } else if (ev_pct >= 0) {
    ev_grade = 'C'
  } else {
    ev_grade = 'F'
  }

  return {
    ev_pct,
    ev_grade,
    kelly_units,
    true_prob: Math.round(true_prob * 10000) / 10000,
    implied_prob: Math.round(implied_prob * 10000) / 10000,
    edge: Math.round((true_prob - implied_prob) * 10000) / 10000,
    moneyline: ml,
  }
}

// ─── Peter's Rules ────────────────────────────────────────────────────────────

export interface PeterFlag {
  rule: string
  action: 'BOOST' | 'DOWNGRADE' | 'KILL'
  severity: 'EDGE' | 'WARNING'
  note: string
}

export interface PeterRulesResult {
  flags: PeterFlag[]
  adjustment: number
  has_kill: boolean
}

export function peter_rules(
  game: EnrichedGame,
  pick_side: Side,
): PeterRulesResult {
  const sport = (game.sport ?? '').toString().toUpperCase()
  const odds = game.odds ?? {}
  const opp_side: Side = pick_side === 'home' ? 'away' : 'home'
  const opp_profile = game[`${opp_side}_profile`] ?? {}
  const opp_injuries = game.injuries?.[opp_side] ?? []

  const flags: PeterFlag[] = []
  let adjustment = 0.0

  const rawOdds = odds as Record<string, unknown>
  const spread = firstTruthyNumber(rawOdds.spread, rawOdds.spread_home) ?? 0
  const _abs_spread = Math.abs(spread)

  // Sport-specific thresholds. Rules 1 and 4 that used spread size are removed,
  // but the star-PPG threshold is still active for injury flags.
  const star_ppg_map: Record<string, number> = {
    NBA: 15, WNBA: 15, NCAAB: 12, NCAAF: 0,
    NHL: 0.8, MLB: 0, NFL: 0, SOCCER: 0.3,
  }
  const star_ppg_threshold = star_ppg_map[sport] ?? 15

  const opp_record = opp_profile.record ?? '0-0'
  const [opp_w, opp_l] = _parse_record(opp_record)
  const _opp_pct = opp_w / Math.max(opp_w + opp_l, 1)

  // Rule 2: Fresh injury boost — star OUT < 3 days, books may not have adjusted
  for (const inj of opp_injuries) {
    if (
      inj.status === 'OUT' &&
      inj.freshness === 'FRESH' &&
      star_ppg_threshold > 0 &&
      (inj.ppg ?? 0) >= star_ppg_threshold
    ) {
      flags.push({
        rule: 'Fresh Injury Boost',
        action: 'BOOST',
        severity: 'EDGE',
        note: `FRESH: ${inj.player ?? inj.name ?? '?'} (${inj.ppg} PPG) OUT — books may lag`,
      })
      adjustment += 1.0
    }
  }

  // Rule 3: Established injury = already priced in
  for (const inj of opp_injuries) {
    if (
      inj.status === 'OUT' &&
      (inj.freshness === 'ESTABLISHED' || inj.freshness === 'SEASON') &&
      star_ppg_threshold > 0 &&
      (inj.ppg ?? 0) >= star_ppg_threshold
    ) {
      flags.push({
        rule: 'Injury Already Priced',
        action: 'DOWNGRADE',
        severity: 'WARNING',
        note: `PRICED: ${inj.player ?? inj.name ?? '?'} (${inj.ppg} PPG) out long — team adapted`,
      })
      adjustment -= 0.5
    }
  }

  const has_kill = flags.some((f) => f.action === 'KILL')

  return {
    flags,
    adjustment: Math.round(adjustment * 10) / 10,
    has_kill,
  }
}
