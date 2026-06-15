import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import type { User } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // In development, warn once. In production build, this should fail loudly.
  if (import.meta.env.PROD) {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required')
  }
  console.warn(
    '[Supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set. Supabase features will be unavailable.'
  )
}

export const supabase = createClient<Database>(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    storageKey: 'edge-crew-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type SupabaseClient = typeof supabase

export interface SupabaseProfile {
  id?: string
  username?: string | null
  display_name?: string | null
  starting_bankroll?: number | null
  current_bankroll?: number | null
  total_wagered?: number | null
  total_profit?: number | null
  wins?: number | null
  losses?: number | null
  pushes?: number | null
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error('[Supabase] getSession error:', error.message)
    return null
  }
  return data.session
}

export async function getCurrentUser() {
  const session = await getCurrentSession()
  return session?.user ?? null
}

export async function getAuthToken() {
  const session = await getCurrentSession()
  return session?.access_token ?? null
}

export async function fetchProfile(userId?: string): Promise<SupabaseProfile | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null
  const targetId = userId ?? (await getCurrentUser())?.id
  if (!targetId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, username, display_name, starting_bankroll, current_bankroll, total_wagered, total_profit, wins, losses, pushes'
    )
    .eq('id', targetId)
    .single()

  if (error) {
    console.error('[Supabase] fetchProfile error:', error.message)
    return null
  }

  return (data as SupabaseProfile | null) ?? null
}

export function mapSupabaseToUser(authUser: { email?: string | null }, profile: SupabaseProfile | null): User {
  const username = profile?.username ?? authUser.email?.split('@')[0] ?? 'user'
  const name = profile?.display_name ?? profile?.username ?? authUser.email?.split('@')[0] ?? 'User'
  const current = profile?.current_bankroll ?? 0

  return {
    username,
    name,
    bankroll: {
      starting: profile?.starting_bankroll ?? current,
      current,
      wagered: profile?.total_wagered ?? 0,
      profit: profile?.total_profit ?? 0,
      wins: profile?.wins ?? 0,
      losses: profile?.losses ?? 0,
      pushes: profile?.pushes ?? 0,
    },
  }
}
