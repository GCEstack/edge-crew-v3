import { createServerClient, jsonResponse, handleOptions } from './_shared';

export const config = { runtime: 'edge' };

const mockGames = [
  {
    id: 'mock-nba-1',
    sport: 'nba',
    homeTeam: 'Boston Celtics',
    awayTeam: 'Los Angeles Lakers',
    scheduledAt: new Date(Date.now() + 3600 * 1000 * 2).toISOString(),
    status: 'scheduled',
    league: 'NBA',
    ourGrade: { grade: 'A+', score: 92, confidence: 0.88 },
    convergence: {
      status: 'LOCK',
      consensusScore: 91,
      consensusGrade: 'A+',
      delta: 0.05,
      variance: 0.02,
    },
  },
  {
    id: 'mock-nfl-1',
    sport: 'nfl',
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'San Francisco 49ers',
    scheduledAt: new Date(Date.now() + 3600 * 1000 * 5).toISOString(),
    status: 'scheduled',
    league: 'NFL',
    ourGrade: { grade: 'A', score: 87, confidence: 0.82 },
    convergence: {
      status: 'ALIGNED',
      consensusScore: 86,
      consensusGrade: 'A',
      delta: 0.12,
      variance: 0.04,
    },
  },
  {
    id: 'mock-mlb-1',
    sport: 'mlb',
    homeTeam: 'New York Yankees',
    awayTeam: 'Houston Astros',
    scheduledAt: new Date(Date.now() + 3600 * 1000 * 3).toISOString(),
    status: 'scheduled',
    league: 'MLB',
    ourGrade: { grade: 'B+', score: 79, confidence: 0.74 },
    convergence: {
      status: 'CLOSE',
      consensusScore: 78,
      consensusGrade: 'B+',
      delta: 0.22,
      variance: 0.08,
    },
  },
];

function toCamelCaseGame(row: any): any {
  if (!row) return row;

  const metadata = row.metadata || {};
  const modelBreakdown = Array.isArray(row.model_breakdown) ? row.model_breakdown : [];
  const consensusGrade = row.grade_letter || '-';
  const hasGrade = row.grade_letter != null;

  const convergenceStatus = row.convergence_status
    ? String(row.convergence_status).toUpperCase()
    : 'ALIGNED';

  const game: any = {
    id: row.id,
    sport: row.sport,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    scheduledAt: row.scheduled_at,
    status: row.status,
    league: row.league,
    odds: row.odds,
    homeScore: row.home_score,
    awayScore: row.away_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (hasGrade) {
    game.ourGrade = {
      grade: consensusGrade,
      score: row.our_score ?? 0,
      confidence: row.our_confidence ?? 0,
    };
    game.aiGrade = {
      grade: consensusGrade,
      score: row.ai_score ?? 0,
      confidence: row.ai_confidence ?? 0,
      model: 'AI Panel',
    };
    game.convergence = {
      status: convergenceStatus,
      consensusScore: row.consensus_score ?? 0,
      consensusGrade,
      delta: metadata.delta ?? 0,
      variance: metadata.variance ?? 0,
    };
    game.aiModels = modelBreakdown;
  }

  // Pull enriched objects stored in the grade metadata.
  if (metadata.pick) game.pick = metadata.pick;
  if (metadata.ev) game.ev = metadata.ev;
  if (metadata.gatekeeper) game.gatekeeper = metadata.gatekeeper;
  if (metadata.arbitrage) game.arbitrage = metadata.arbitrage;
  if (metadata.total_pick) {
    game.nrfi = {
      verdict: metadata.total_pick.verdict,
      confidence: metadata.total_pick.confidence,
      reason: Array.isArray(metadata.total_pick.factors)
        ? metadata.total_pick.factors.join('; ')
        : metadata.total_pick.reason,
    };
  }

  return game;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const url = new URL(request.url);
  const sport = url.searchParams.get('sport') || undefined;
  const mode = url.searchParams.get('mode') || undefined;
  const league = url.searchParams.get('league') || undefined;

  try {
    const supabase = createServerClient();

    const id = url.searchParams.get('id');

    if (id) {
      const { data, error } = await supabase
        .from('v_games_with_latest_grade')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (data) return jsonResponse(toCamelCaseGame(data));
      const fallback = mockGames.find((g: any) => g.id === id);
      if (fallback) return jsonResponse(fallback);
      return jsonResponse({ error: 'Game not found' }, 404);
    }

    const isActiveStatus = !mode || ['scheduled', 'live'].includes(mode);
    let query;

    if (isActiveStatus) {
      query = supabase.from('v_games_with_latest_grade').select('*');
    } else {
      query = supabase.from('games').select('*');
    }

    if (sport) query = query.eq('sport', sport.toLowerCase() as any);
    if (mode) query = query.eq('status', mode.toLowerCase() as any);
    if (league) query = query.eq('league', league.toUpperCase());

    const { data, error } = await query
      .order('scheduled_at', { ascending: true })
      .limit(100);

    if (error) throw error;

    const games = data && data.length > 0 ? data.map(toCamelCaseGame) : mockGames;
    return jsonResponse(games);
  } catch (err) {
    console.error('[api/games] error:', err);
    return jsonResponse(mockGames);
  }
}
