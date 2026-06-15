// Shared grading utilities ported from grade_engine.py.
// Keep the math identical to the Python source.

import { GRADE_THRESHOLDS, SIZING_MAP } from './constants.ts'
import type { GradeLetter, Sport, VariableResult } from './grade-types.ts'

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function score_to_grade(score: number): GradeLetter {
  for (const [threshold, grade] of GRADE_THRESHOLDS) {
    if (score >= threshold) {
      return grade
    }
  }
  return 'F'
}

export function score_to_sizing(score: number): string {
  return SIZING_MAP[score_to_grade(score)] ?? 'PASS'
}

export function _clamp(val: number | string, lo = 1, hi = 10): number {
  return Math.max(lo, Math.min(hi, round1(Number(val))))
}

export const clamp = _clamp

export function _parse_record(rec: string | null | undefined): [number, number] {
  if (!rec) {
    return [0, 0]
  }
  const parts = rec.split('-')
  if (parts.length < 2) {
    return [0, 0]
  }
  const w = parseInt(parts[0], 10)
  const l = parseInt(parts[1], 10)
  if (Number.isNaN(w) || Number.isNaN(l)) {
    return [0, 0]
  }
  return [w, l]
}

export function _win_pct(rec: string | null | undefined): number {
  const [w, l] = _parse_record(rec)
  const total = w + l
  return total > 0 ? w / total : 0.5
}

export function _apply_spread_amplifier(
  composite: number,
  variables: Record<string, { score: number; weight: number }>,
): number {
  const scores: Array<[number, number]> = Object.values(variables)
    .map((v) => [v.score ?? 5, v.weight ?? 5] as [number, number])
    .sort((a, b) => b[0] * b[1] - a[0] * b[1])

  if (scores.length === 0) {
    return composite
  }

  const top3 = scores.slice(0, 3)
  const bot3 = scores.slice(-3)
  const top3_avg = top3.reduce((sum, [s]) => sum + s, 0) / top3.length
  const bot3_avg = bot3.reduce((sum, [s]) => sum + s, 0) / bot3.length

  if (top3_avg >= 8.5) {
    composite = composite * 0.8 + top3_avg * 0.2
  } else if (bot3_avg <= 2.5) {
    composite = composite * 0.8 + bot3_avg * 0.2
  }

  const all_scores = scores.map(([s]) => s)
  if (Math.min(...all_scores) <= 1.5 && composite > 4.0) {
    composite = Math.min(composite, 4.0)
  }

  return round2(composite)
}

const VALID_SPORTS = new Set<Sport>([
  'NBA',
  'NHL',
  'MLB',
  'NFL',
  'NCAAB',
  'NCAAF',
  'SOCCER',
  'MMA',
  'BOXING',
  'WNBA',
  'TENNIS',
  'COLLEGE_BASEBALL',
])

const SPORT_ALIASES: Record<string, Sport> = {
  BASKETBALL: 'NBA',
  HOOPS: 'NBA',
  HOCKEY: 'NHL',
  ICE_HOCKEY: 'NHL',
  BASEBALL: 'MLB',
  FOOTBALL: 'NFL',
  AMERICAN_FOOTBALL: 'NFL',
  COLLEGE_BASKETBALL: 'NCAAB',
  NCAAM: 'NCAAB',
  'NCAA BASKETBALL': 'NCAAB',
  CBB: 'NCAAB',
  COLLEGE_FOOTBALL: 'NCAAF',
  'NCAA FOOTBALL': 'NCAAF',
  CFB: 'NCAAF',
  'FOOTBALL (SOCCER)': 'SOCCER',
  FUTBOL: 'SOCCER',
  FÚTBOL: 'SOCCER',
  UFC: 'MMA',
  NCB: 'COLLEGE_BASEBALL',
  'NCAA BASEBALL': 'COLLEGE_BASEBALL',
}

export function normalizeSport(input: string | null | undefined): Sport | undefined {
  if (!input) {
    return undefined
  }
  const raw = String(input).trim().toUpperCase()
  if (VALID_SPORTS.has(raw as Sport)) {
    return raw as Sport
  }
  return SPORT_ALIASES[raw]
}
