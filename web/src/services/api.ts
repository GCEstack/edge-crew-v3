import axios from 'axios';
import type { Game, ConvergenceResult, Pick, User, Bankroll, LockedPick, BetSlip, GutPickEntry } from '@/types';
import { supabase, getAuthToken, fetchProfile, mapSupabaseToUser } from '@/lib/supabase';

const API_BASE = '';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const EDGE_BASE = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/api` : '';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

const edgeApi = axios.create({
  baseURL: EDGE_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the current Supabase JWT to every outbound request.
async function attachAuthHeader(config: any) {
  const token = await getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

api.interceptors.request.use(attachAuthHeader);
edgeApi.interceptors.request.use(attachAuthHeader);

// ─── Vercel API routes ───────────────────────────────────────────────────────

// Health
export const checkHealth = () => api.get('/api/health').then(r => r.data);

// Games
export const getGames = (sport: string, mode?: string, league?: string) =>
  api.get<Game[]>('/api/games', { params: { sport, ...(mode ? { mode } : {}), ...(league ? { league } : {}) } }).then(r => r.data);

export const getGame = async (id: string) => {
  try {
    const r = await api.get<Game>(`/api/games/${encodeURIComponent(id)}`);
    return r.data;
  } catch (e: any) {
    // Fallback for legacy/local backends without the single-game route
    if (e?.response?.status === 404) return null;
    const games = await getGames('', undefined, undefined);
    return games.find((g) => g.id === id) ?? null;
  }
};

export const getTopPicks = () =>
  api.get<Game[]>('/api/top-picks').then(r => r.data);

// Calibration
export const getCalibration = () =>
  api.get('/api/calibration').then(r => r.data);

// Parlay
export const getParlay = () =>
  api.get('/api/parlay').then(r => r.data);

// Bet Slip
export const generateBetSlip = (username: string, gameIds: string[] = []) =>
  api.post<BetSlip>('/api/betslip', { username, game_ids: gameIds }).then(r => r.data);

// ─── Supabase Edge Function routes (auth required) ────────────────────────────

function mapDbPickToLockedPick(row: any): LockedPick {
  const resultMap: Record<string, LockedPick['result']> = {
    pending: 'pending',
    win: 'W',
    loss: 'L',
    push: 'P',
  };
  return {
    id: row.id,
    game_id: row.game_id,
    sport: row.sport,
    team: row.team ?? row.side,
    type: row.pick_type ?? row.type ?? 'spread',
    line: row.line ?? 0,
    amount: row.amount ?? 0,
    odds: row.odds ?? -110,
    result: resultMap[row.result] ?? 'pending',
    profit: row.profit ?? 0,
    locked_at: row.created_at ?? row.locked_at ?? new Date().toISOString(),
  };
}

// User / Auth
export const login = async (username: string, pin: string): Promise<User> => {
  const email = `${username.toLowerCase()}@edgecrew.local`;
  // The auth backend enforces a 6-character minimum password, so pad short PINs.
  const password = pin.padEnd(6, '0');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user || !data.session) {
    throw error ?? new Error('Login failed');
  }
  const profile = await fetchProfile(data.user.id);
  return mapSupabaseToUser(data.user, profile);
};

export const getBankroll = async (_username?: string): Promise<Bankroll> => {
  const { data } = await edgeApi.get('/user/bankroll');
  const b = data?.bankroll ?? {};
  const current = b.current_bankroll ?? 0;
  return {
    starting: b.starting_bankroll ?? current,
    current,
    wagered: b.total_wagered ?? 0,
    profit: b.total_profit ?? 0,
    wins: b.wins ?? 0,
    losses: b.losses ?? 0,
    pushes: b.pushes ?? 0,
  };
};

export const getUserPicks = async (_username?: string) =>
  edgeApi.get('/user/picks').then(r => (r.data || []).map(mapDbPickToLockedPick));

export const lockPick = async (_username: string, data: {
  game_id: string; sport: string; team: string; type: string;
  line?: number; amount?: number; odds?: number;
}) => {
  const { data: row } = await edgeApi.post('/user/pick', data);
  return mapDbPickToLockedPick(row);
};

export const adjustBankroll = async (_username: string, delta: number): Promise<Bankroll> => {
  const { data } = await edgeApi.post('/profile/adjust', { delta });
  const b = data?.bankroll ?? {};
  const current = b.current_bankroll ?? 0;
  return {
    starting: b.starting_bankroll ?? current,
    current,
    wagered: b.total_wagered ?? 0,
    profit: b.total_profit ?? 0,
    wins: b.wins ?? 0,
    losses: b.losses ?? 0,
    pushes: b.pushes ?? 0,
  };
};

export const gradePick = async (_username: string, pickId: string, result: string) => {
  const { data } = await edgeApi.post(`/user/pick/${pickId}/result`, { result });
  return {
    pick: mapDbPickToLockedPick(data?.pick ?? {}),
    bankroll: data?.bankroll ?? null,
  };
};

// User-driven slip locks
export const toggleSlipLock = (_username: string, gameId: string, action: 'add' | 'remove') =>
  edgeApi.post<{ username: string; game_ids: string[] }>('/locks', { game_id: gameId, action }).then(r => r.data);

export const getSlipLocks = (_username: string) =>
  edgeApi.get<{ username: string; game_ids: string[] }>('/locks').then(r => r.data);

// Peter's Rules — Gut picks
function mapDbGutPick(row: any, fallbackUsername = ''): GutPickEntry {
  return {
    username: row.username ?? fallbackUsername,
    game_id: row.game_id,
    sport: row.sport,
    pick_side: row.pick_side,
    engine_pick_side: row.engine_pick_side,
    date: row.pick_date ?? row.date,
    timestamp: row.created_at ?? row.timestamp,
  };
}

export const submitGutPick = (data: {
  username: string;
  game_id: string;
  sport: string;
  pick_side: string;
  engine_pick_side?: string;
}) =>
  edgeApi.post<{ ok: boolean; gut_pick: GutPickEntry }>('/gut-pick', data).then(r => ({
    ...r.data,
    gut_pick: mapDbGutPick(r.data.gut_pick, data.username),
  }));

export const getGutPicks = (username: string) =>
  edgeApi.get<{ username: string; gut_picks: GutPickEntry[] }>('/gut-pick').then(r => ({
    username: r.data.username ?? username,
    gut_picks: (r.data.gut_picks || []).map((p: any) => mapDbGutPick(p, username)),
  }));

// ─── Legacy / un-migrated endpoints ───────────────────────────────────────────
// These still point at the original backend routes and may be removed once
// equivalent Vercel/Edge Function routes are added.

// Grading
export interface GradeRequest {
  game_id: string;
  sport: string;
  home_team: string;
  away_team: string;
  context?: Record<string, unknown>;
}

export const gradeGame = (data: GradeRequest) =>
  api.post<ConvergenceResult>('/api/grade', data).then(r => r.data);

export interface AnalysisJob {
  job_id: string;
  status_url: string;
  status: string;
}

// Deep AI analysis (crowdsource + gatekeeper)
export const analyzeGames = (sport: string, opts?: { league?: string; fast?: boolean }) =>
  api.post<AnalysisJob>('/api/analyze', { sport, ...(opts?.league ? { league: opts.league } : {}), ...(typeof opts?.fast === 'boolean' ? { fast: opts.fast } : {}) }).then(r => r.data);

// Single-game deep analysis — same backend, filtered to one game by id.
export const analyzeGame = (sport: string, game_id: string) =>
  api.post<AnalysisJob>('/api/analyze', { sport, game_id }).then(r => r.data);

export const getAnalysisJob = (jobId: string) =>
  api.get<AnalysisJob & { result?: any; error_message?: string | null }>(`/api/jobs/${jobId}`).then(r => r.data);

// Picks
export const getPicks = () =>
  api.get<Pick[]>('/api/picks').then(r => r.data);

export const createPick = (data: Partial<Pick>) =>
  api.post<Pick>('/api/picks', data).then(r => r.data);

// Legacy user profile
export const getUser = () =>
  api.get<User>('/api/user').then(r => r.data);

export const updateUser = (data: Partial<User>) =>
  api.put<User>('/api/user', data).then(r => r.data);

// Stats
export const getStats = () =>
  api.get('/api/stats').then(r => r.data);

export default api;
