import { createServerClient, jsonResponse, handleOptions } from './_shared';

export const config = { runtime: 'edge' };

function parseAmount(amount: unknown): number {
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    return parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
  }
  return 0;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await request.json()) as {
      username?: string;
      game_ids?: string[];
    };
    const { username, game_ids } = body;

    if (!username || !Array.isArray(game_ids)) {
      return jsonResponse(
        { error: 'Missing username or game_ids', slip_id: null },
        400
      );
    }

    const supabase = createServerClient();

    const { data: profile, error: profileError } = (await supabase
      .from('profiles')
      .select('id, username, current_bankroll')
      .eq('username', username)
      .single()) as { data: any; error: any };

    if (profileError || !profile) {
      return jsonResponse({ error: 'User not found', slip_id: null }, 404);
    }

    const ids = game_ids.length > 0 ? game_ids : ['__none__'];

    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .in('id', ids);

    if (gamesError) throw gamesError;

    const { data: picks, error: picksError } = (await supabase
      .from('picks')
      .select('*')
      .eq('user_id', profile.id)
      .in('game_id', ids)
      .eq('result', 'pending')) as { data: any[]; error: any };

    if (picksError) throw picksError;

    const pickByGameId = new Map<string, any>();
    for (const pick of picks || []) {
      pickByGameId.set(pick.game_id, pick);
    }

    const slipPicks = (games || []).map((game: any) => {
      const pick = pickByGameId.get(game.id);
      const amount = parseAmount(pick?.amount);
      return {
        game_id: game.id,
        game: `${game.away_team} @ ${game.home_team}`,
        pick: pick ? `${pick.side} ${pick.line ?? ''}`.trim() : 'TBD',
        line: pick?.line != null ? String(pick.line) : undefined,
        type: pick?.pick_type || 'spread',
        amount: amount > 0 ? `$${amount.toFixed(2)}` : '$0.00',
        book: 'Best Line',
      };
    });

    const totalRisk = slipPicks.reduce(
      (sum: number, p: any) => sum + parseAmount(p.amount),
      0
    );

    const potentialPayout = totalRisk > 0 ? totalRisk * 2.6 : 0;

    const slip = {
      slip_id: `${username}-${Date.now()}`,
      generated: new Date().toISOString(),
      user: username,
      picks: slipPicks,
      total_risk: `$${totalRisk.toFixed(2)}`,
      potential_payout: `$${potentialPayout.toFixed(2)}`,
      notes: 'Generated from selected game IDs',
    };

    return jsonResponse(slip);
  } catch (err) {
    console.error('[api/betslip] error:', err);
    return jsonResponse(
      { error: 'Failed to generate betslip', slip_id: null },
      500
    );
  }
}
