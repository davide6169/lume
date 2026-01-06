/**
 * Environment configuration with safe placeholders
 * This allows the app to run on Vercel without real API keys
 * Users can configure their own keys through the UI
 */

// Placeholder values for keys only (URLs use "your-" as indicator)
const PLACEHOLDERS = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  SUPABASE_SERVICE_KEY: 'your-service-role-key',
  META_APP_ID: 'your-meta-app-id',
  META_APP_SECRET: 'your-meta-app-secret',
  META_ACCESS_TOKEN: 'your-meta-access-token',
  OPENROUTER_API_KEY: 'your-openrouter-api-key',
  MIXEDBREAD_API_KEY: 'your-mixedbread-api-key',
  APOLLO_API_KEY: 'your-apollo-api-key',
  HUNTER_API_KEY: 'your-hunter-api-key',
  ENCRYPTION_KEY: 'your-encryption-key-32-chars-min',
}

/**
 * Get environment variable with fallback to placeholder
 */
function getEnvVar(key: string, placeholder?: string): string {
  const value = process.env[key]
  if (value && value !== '') {
    return value
  }
  return placeholder || PLACEHOLDERS[key as keyof typeof PLACEHOLDERS] || ''
}

/**
 * Check if a value is a placeholder key (not URL)
 */
function isPlaceholderValue(value: string): boolean {
  // URLs with "your-" are not considered placeholders (they're indicators)
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value.includes('your-project') || value.includes('your-domain')
  }
  // Keys starting with "your-" are placeholders
  return value.startsWith('your-')
}

/**
 * Check if real API keys are configured (not placeholders)
 */
export function hasRealApiKeys(): boolean {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  // Check if URL is real (not indicator)
  const isRealUrl = !supabaseUrl.includes('your-project') && !supabaseUrl.includes('your-domain')
  // Check if key is real (not placeholder)
  const isRealKey = !isPlaceholderValue(supabaseKey)

  return isRealUrl && isRealKey && supabaseUrl !== '' && supabaseKey !== ''
}

/**
 * Public environment variables (accessible in browser)
 */
export const publicEnv = {
  supabaseUrl: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', PLACEHOLDERS.SUPABASE_URL),
  supabaseAnonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', PLACEHOLDERS.SUPABASE_ANON_KEY),
  appUrl: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  metaAppId: getEnvVar('NEXT_PUBLIC_META_APP_ID', PLACEHOLDERS.META_APP_ID),
}

/**
 * Server-only environment variables
 */
export const serverEnv = {
  supabaseServiceKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY', PLACEHOLDERS.SUPABASE_SERVICE_KEY),
  metaAppSecret: getEnvVar('META_APP_SECRET', PLACEHOLDERS.META_APP_SECRET),
  metaAccessToken: getEnvVar('META_ACCESS_TOKEN', PLACEHOLDERS.META_ACCESS_TOKEN),
  openrouterApiKey: getEnvVar('OPENROUTER_API_KEY', PLACEHOLDERS.OPENROUTER_API_KEY),
  mixedbreadApiKey: getEnvVar('MIXEDBREAD_API_KEY', PLACEHOLDERS.MIXEDBREAD_API_KEY),
  apolloApiKey: getEnvVar('APOLLO_API_KEY', PLACEHOLDERS.APOLLO_API_KEY),
  hunterApiKey: getEnvVar('HUNTER_API_KEY', PLACEHOLDERS.HUNTER_API_KEY),
  encryptionKey: getEnvVar('ENCRYPTION_KEY', PLACEHOLDERS.ENCRYPTION_KEY),
  metaApiVersion: getEnvVar('META_API_VERSION', 'v24.0'),
}

/**
 * Check if we're using placeholder keys (for demo mode detection)
 */
export function isUsingPlaceholders(): boolean {
  return !hasRealApiKeys()
}

/**
 * Get a friendly message explaining the current state
 */
export function getEnvironmentMessage(): string {
  if (hasRealApiKeys()) {
    return 'Production mode - Using real API keys'
  }
  return 'Demo mode - Configure your API keys in settings to use production features'
}

/**
 * Check if demo mode should be forced based on environment
 * Returns true if placeholder keys are detected
 */
export function shouldForceDemoMode(): boolean {
  return !hasRealApiKeys()
}
