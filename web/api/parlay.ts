import {
  createServerClient,
  jsonResponse,
  handleOptions,
  getUserIdFromRequest,
} from './_shared';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabase = createServerClient();
  const userId = await getUserIdFromRequest(request, supabase);

  if (!userId) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const { data: lockedGames, error: lockedError } = await supabase
      .from('locked_games')
      .select('*, games(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (lockedError) throw lockedError;

    const gameIds = (lockedGames || []).map((lg: any) => lg.game_id);

    const { data: picks, error: picksError } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', userId)
      .in('game_id', gameIds.length > 0 ? gameIds : ['__none__'])
      .eq('result', 'pending');

    if (picksError) throw picksError;

    return jsonResponse({
      lockedGames: lockedGames || [],
      picks: picks || [],
    });
  } catch (err) {
    console.error('[api/parlay] error:', err);
    return jsonResponse({ error: 'Failed to load parlay' }, 500);
  }
}
