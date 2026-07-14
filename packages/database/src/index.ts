import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Creates and returns a typed Supabase client.
 * Call this once in each app and pass the client via context.
 *
 * @param supabaseUrl  - The project URL from Supabase dashboard
 * @param supabaseKey  - The anon public key
 */
export function createSupabaseClient(supabaseUrl: string, supabaseKey: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

/**
 * Singleton client factory for browser environments.
 * Uses VITE_ env vars. Import this in web/admin apps directly.
 */
let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client

  const url = (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL
  const key = (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.'
    )
  }

  _client = createSupabaseClient(url, key)
  return _client
}

export { createClient }
export type { SupabaseClient }
