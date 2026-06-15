// Supabase Edge Function: unified user/pick/bankroll API
// Replaces legacy FastAPI user endpoints.

import { serve } from 'https://deno.land/std@0.200.0/http/server.ts'
import { getSupabaseClient } from '../_shared/supabase.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function error(message: string, status = 400) {
  return json({ error: message }, status)
}

// ─── Route handlers ───────────────────────────────────────────────────────────

async function getBankroll(req: Request) {
  const supabase = getSupabaseClient(req)
  const { data: profile, error: err } = await supabase
    .from('profiles')
    .select('current_bankroll, total_wagered, total_profit, wins, losses, pushes')
    .single()

  if (err || !profile) return error(err?.message || 'Profile not found', 404)
  return json({ bankroll: profile })
}

async function getPicks(req: Request) {
  const supabase = getSupabaseClient(req)
  const { data, error: err } = await supabase
    .from('picks')
    .select('*')
    .order('created_at', { ascending: false })

  if (err) return error(err.message, 500)
  return json(data)
}

async function createPick(req: Request) {
  const body = await req.json()
  const supabase = getSupabaseClient(req)

  const { data: profile } = await supabase.from('profiles').select('id').single()
  if (!profile) return error('Profile not found', 404)

  const { data, error: err } = await supabase
    .from('picks')
    .insert({
      user_id: profile.id,
      game_id: body.game_id,
      sport: body.sport?.toLowerCase(),
      team: body.team,
      side: body.side || body.team,
      pick_type: body.type || 'spread',
      line: body.line ?? 0,
      amount: body.amount ?? 0,
      odds: body.odds ?? -110,
      pick_data: body,
    })
    .select()
    .single()

  if (err) return error(err.message, 500)

  // Update bankroll wagered amount
  await supabase.rpc('increment_bankroll_field', {
    user_id: profile.id,
    field: 'total_wagered',
    delta: body.amount ?? 0,
  })

  return json(data, 201)
}

async function gradePick(req: Request, pickId: string) {
  const body = await req.json()
  const result = String(body.result).toUpperCase()
  if (!['W', 'L', 'P'].includes(result)) {
    return error("Result must be 'W', 'L', or 'P'", 400)
  }

  const supabase = getSupabaseClient(req)
  const { data: profile } = await supabase.from('profiles').select('id').single()
  if (!profile) return error('Profile not found', 404)

  const { data: pick } = await supabase
    .from('picks')
    .select('*')
    .eq('id', pickId)
    .eq('user_id', profile.id)
    .single()

  if (!pick) return error('Pick not found', 404)

  const amount = pick.amount ?? 0
  const odds = pick.odds ?? -110
  let profit = 0
  let bankrollDelta = 0
  let wins = 0
  let losses = 0
  let pushes = 0

  if (result === 'W') {
    profit = odds > 0 ? amount * (odds / 100) : amount * (100 / Math.abs(odds))
    profit = Math.round(profit * 100) / 100
    bankrollDelta = profit
    wins = 1
  } else if (result === 'L') {
    profit = -amount
    bankrollDelta = -amount
    losses = 1
  } else {
    profit = 0
    pushes = 1
  }

  const resultEnum = result === 'W' ? 'win' : result === 'L' ? 'loss' : 'push'

  const { error: updateErr } = await supabase
    .from('picks')
    .update({ result: resultEnum, profit, settled_at: new Date().toISOString() })
    .eq('id', pickId)

  if (updateErr) return error(updateErr.message, 500)

  // Atomic bankroll update
  await supabase.rpc('adjust_bankroll', {
    user_id: profile.id,
    delta: bankrollDelta,
    wins,
    losses,
    pushes,
  })

  const { data: updatedProfile } = await supabase
    .from('profiles')
    .select('current_bankroll, total_profit, wins, losses, pushes')
    .single()

  return json({ pick: { ...pick, result: resultEnum, profit }, bankroll: updatedProfile })
}

async function adjustBankroll(req: Request) {
  const body = await req.json()
  const delta = Number(body.delta)
  if (Number.isNaN(delta)) return error('delta must be a number', 400)

  const supabase = getSupabaseClient(req)
  const { data: profile } = await supabase.from('profiles').select('id').single()
  if (!profile) return error('Profile not found', 404)

  await supabase.rpc('adjust_bankroll', {
    user_id: profile.id,
    delta,
    wins: 0,
    losses: 0,
    pushes: 0,
  })

  const { data: updated } = await supabase
    .from('profiles')
    .select('current_bankroll, total_profit')
    .single()

  return json({ bankroll: updated })
}

async function getLocks(req: Request) {
  const supabase = getSupabaseClient(req)
  const { data, error: err } = await supabase.from('locked_games').select('game_id, sport')
  if (err) return error(err.message, 500)
  return json({ game_ids: data.map((d) => d.game_id) })
}

async function toggleLock(req: Request) {
  const body = await req.json()
  const gameId = body.game_id
  const action = body.action
  const sport = body.sport?.toLowerCase()

  if (!gameId || !['add', 'remove'].includes(action)) {
    return error("Requires game_id and action 'add' or 'remove'", 400)
  }

  const supabase = getSupabaseClient(req)
  const { data: profile } = await supabase.from('profiles').select('id').single()
  if (!profile) return error('Profile not found', 404)

  if (action === 'add') {
    const { error: err } = await supabase.from('locked_games').upsert(
      { user_id: profile.id, game_id: gameId, sport },
      { onConflict: 'user_id, game_id' }
    )
    if (err) return error(err.message, 500)
  } else {
    const { error: err } = await supabase
      .from('locked_games')
      .delete()
      .eq('user_id', profile.id)
      .eq('game_id', gameId)
    if (err) return error(err.message, 500)
  }

  return getLocks(req)
}

async function getGutPicks(req: Request) {
  const supabase = getSupabaseClient(req)
  const { data, error: err } = await supabase
    .from('gut_picks')
    .select('*')
    .order('pick_date', { ascending: false })
  if (err) return error(err.message, 500)
  return json({ gut_picks: data })
}

async function submitGutPick(req: Request) {
  const body = await req.json()
  const supabase = getSupabaseClient(req)
  const { data: profile } = await supabase.from('profiles').select('id').single()
  if (!profile) return error('Profile not found', 404)

  const sport = body.sport?.toLowerCase()
  const today = new Date().toISOString().slice(0, 10)

  const { data: existing } = await supabase
    .from('gut_picks')
    .select('id')
    .eq('user_id', profile.id)
    .eq('sport', sport)
    .eq('pick_date', today)
    .maybeSingle()

  if (existing) return error(`Already used your gut pick for ${sport} today`, 400)

  const { data, error: err } = await supabase
    .from('gut_picks')
    .insert({
      user_id: profile.id,
      game_id: body.game_id,
      sport,
      pick_side: body.pick_side,
      engine_pick_side: body.engine_pick_side,
      pick_date: today,
    })
    .select()
    .single()

  if (err) return error(err.message, 500)
  return json({ ok: true, gut_pick: data }, 201)
}

// ─── Router ───────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '')

  try {
    if (path === 'user/bankroll' && req.method === 'GET') return await getBankroll(req)
    if (path === 'user/picks' && req.method === 'GET') return await getPicks(req)
    if (path === 'user/pick' && req.method === 'POST') return await createPick(req)
    if (path === 'locks' && req.method === 'GET') return await getLocks(req)
    if (path === 'locks' && req.method === 'POST') return await toggleLock(req)
    if (path === 'gut-pick' && req.method === 'GET') return await getGutPicks(req)
    if (path === 'gut-pick' && req.method === 'POST') return await submitGutPick(req)
    if (path === 'profile/adjust' && req.method === 'POST') return await adjustBankroll(req)

    const pickResultMatch = path.match(/^user\/pick\/([^/]+)\/result$/)
    if (pickResultMatch && req.method === 'POST') {
      return await gradePick(req, pickResultMatch[1])
    }

    return error('Not found', 404)
  } catch (err) {
    console.error('API error:', err)
    return error(err instanceof Error ? err.message : 'Internal error', 500)
  }
})
