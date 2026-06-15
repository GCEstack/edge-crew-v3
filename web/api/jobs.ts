import { createServerClient, jsonResponse, handleOptions } from './_shared';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return jsonResponse({ error: 'Missing job id' }, 400);
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await (supabase as any)
      .from('model_jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return jsonResponse({ error: 'Job not found' }, 404);
    }

    return jsonResponse({
      job_id: data.id,
      status: data.status,
      sport: data.sport,
      game_id: data.game_id,
      league: data.league,
      fast: data.fast,
      result: data.result,
      error_message: data.error_message,
      started_at: data.started_at,
      completed_at: data.completed_at,
      created_at: data.created_at,
    });
  } catch (err) {
    console.error('[api/jobs] error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}
