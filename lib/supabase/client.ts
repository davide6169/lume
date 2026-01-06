import { createBrowserClient } from '@supabase/ssr'
import { publicEnv, hasRealApiKeys } from '@/lib/config/env'
import { useSettingsStore } from '@/lib/stores/useSettingsStore'
import { decryptSupabaseConfig } from '@/lib/utils/encryption'

export function createSupabaseClient() {
  // Try to use user-configured credentials first (for multi-tenant setup)
  const userConfig = useSettingsStore.getState().supabaseConfig

  // Check if user has configured their own Supabase
  if (userConfig.url && userConfig.anonKey) {
    // Decrypt config before using (handles both encrypted and plain text)
    const decryptedConfig = decryptSupabaseConfig(userConfig)

    const hasValidUserConfig =
      decryptedConfig.url !== '' &&
      decryptedConfig.anonKey !== '' &&
      !decryptedConfig.url.includes('your-project') &&
      !decryptedConfig.anonKey.includes('your-anon-key')

    if (hasValidUserConfig) {
      return createBrowserClient(decryptedConfig.url, decryptedConfig.anonKey)
    }
  }

  // Fallback to environment variables (for deployment with shared DB)
  const url = publicEnv.supabaseUrl
  const key = publicEnv.supabaseAnonKey

  return createBrowserClient(url, key)
}

/**
 * Check if Supabase is properly configured
 * Checks both user config and environment variables
 */
export function isSupabaseConfigured(): boolean {
  // Check if user has configured their own Supabase
  const hasUserConfig = useSettingsStore.getState().hasUserSupabaseConfig()

  // Check if environment has real keys
  const hasEnvKeys = hasRealApiKeys()

  return hasUserConfig || hasEnvKeys
}

/**
 * Get the Supabase configuration source
 */
export function getSupabaseConfigSource(): 'user' | 'env' | 'none' {
  const hasUserConfig = useSettingsStore.getState().hasUserSupabaseConfig()
  if (hasUserConfig) return 'user'

  const hasEnvKeys = hasRealApiKeys()
  if (hasEnvKeys) return 'env'

  return 'none'
}
