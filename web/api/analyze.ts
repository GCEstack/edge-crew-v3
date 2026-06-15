import { createServerClient, jsonResponse, handleOptions, getUserIdFromRequest } from './_shared';

export const config = { runtime: 'edge' };

const VALID_SPORTS = [
  'nba', 'nhl', 'mlb', 'nfl', 'ncaab', 'ncaaf', 'soccer', 'mma', 'boxing',
  'golf', 'wnba', 'tennis', 'college_baseball',
];

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let payload: any = {};
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const sport = String(payload.sport || '').toLowerCase().trim();
  if (!sport || !VALID_SPORTS.includes(sport)) {
    return jsonResponse({ error: `Unsupported sport: ${payload.sport}` }, 400);
  }

  const gameId = payload.game_id ? String(payload.game_id) : null;
  const league = payload.league ? String(payload.league) : null;
  const fast = typeof payload.fast === 'boolean' ? payload.fast : false;

  try {
    const supabase = createServerClient();
    const userId = await getUserIdFromRequest(request, supabase);

    const { data, error } = await (supabase as any)
      .from('model_jobs')
      .insert({
        sport,
        game_id: gameId,
        league,
        fast,
        status: 'pending',
        created_by: userId,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('[api/analyze] insert error:', error);
      return jsonResponse({ error: 'Failed to enqueue analysis job' }, 500);
    }

    const statusUrl = `/api/jobs/${data.id}`;
    return jsonResponse({ job_id: data.id, status_url: statusUrl, status: 'pending' }, 202);
  } catch (err) {
    console.error('[api/analyze] error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}
