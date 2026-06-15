// Supabase Edge Function: POST /functions/v1/grade
// TypeScript port of Edge Crew grade engine.

import { grade_both_sides, grade_game_total } from '../_shared/engine.ts'
import type { EnrichedGame } from '../_shared/grade-types.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = (await req.json()) as EnrichedGame & { grade_total?: boolean }

    if (!body.sport || !body.home_profile || !body.away_profile || !body.odds) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: sport, home_profile, away_profile, odds' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const { grade_total, ...rest } = body
    const game: EnrichedGame = {
      ...rest,
      sport: body.sport.toString().toUpperCase(),
    }

    if (grade_total) {
      const total = grade_game_total(game)
      return new Response(JSON.stringify({ total }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const result = await grade_both_sides(game)
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Grade engine error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
