import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { publicEnv, serverEnv, hasRealApiKeys } from '@/lib/config/env'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  // NOTE: Server-side client always uses environment variables
  // This is intentional - user-configured credentials are only used client-side
  // Server-side auth (login/signup) needs a shared Supabase instance
  return createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

// Create a Supabase client with service role key (bypasses RLS)
export async function createSupabaseServiceClient() {
  const cookieStore = await cookies()

  // NOTE: Service client always uses environment variables
  // Used for admin operations that need to bypass RLS
  return createServerClient(
    publicEnv.supabaseUrl,
    serverEnv.supabaseServiceKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return hasRealApiKeys()
}
