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
      .from('calibration_snapshots')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    return jsonResponse(data || { message: 'No calibration data available' });
  } catch (err) {
    console.error('[api/calibration] error:', err);
    return jsonResponse({ error: 'Failed to load calibration' }, 500);
  }
}
