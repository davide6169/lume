import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { publicEnv, serverEnv, hasRealApiKeys } from '@/lib/config/env'
import { getDatabaseCredentialsFromCookie } from '@/lib/utils/db-credentials-cookie'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  // First, try to get user-configured database credentials from cookie
  const userCredentials = await getDatabaseCredentialsFromCookie()

  // Use user credentials if available, otherwise fall back to environment variables
  // This allows demo users to configure their own database and use it for auth
  const supabaseUrl = userCredentials?.url || publicEnv.supabaseUrl
  const supabaseAnonKey = userCredentials?.anonKey || publicEnv.supabaseAnonKey

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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

  // Service client also uses user credentials if available
  // This is needed for admin operations on the user's database
  const userCredentials = await getDatabaseCredentialsFromCookie()

  // For service client, we need service role key
  // Since we can't derive service role key from user credentials,
  // we fall back to env variables for service client
  // This is acceptable because service client is only used for admin operations
  const supabaseUrl = userCredentials?.url || publicEnv.supabaseUrl

  return createServerClient(
    supabaseUrl,
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
