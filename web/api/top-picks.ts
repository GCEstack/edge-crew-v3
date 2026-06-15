import { createServerClient, jsonResponse, handleOptions } from './_shared';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('picks')
      .select('*, games(*)')
      .eq('result', 'pending')
      .not('grade', 'is', null)
      .order('grade', { ascending: true })
      .limit(20);

    if (error) throw error;

    return jsonResponse(data || []);
  } catch (err) {
    console.error('[api/top-picks] error:', err);
    return jsonResponse([]);
  }
}
