import CryptoJS from 'crypto-js'

/**
 * Encryption utility for sensitive data (API keys, tokens, etc.)
 * Uses AES-256 encryption with a key derived from environment variables
 */

// Get encryption key from environment or generate a fallback
// IMPORTANT: In production, always set LUME_ENCRYPTION_KEY in .env
const ENCRYPTION_KEY = process.env.LUME_ENCRYPTION_KEY || 'lume-default-fallback-key-please-change-in-production'

/**
 * Encrypt sensitive data using AES-256
 * @param plaintext - The data to encrypt
 * @returns Encrypted string (Base64 encoded)
 */
export function encrypt(plaintext: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY).toString()
    return encrypted
  } catch (error) {
    console.error('[Encryption] Failed to encrypt data:', error)
    throw new Error('Failed to encrypt sensitive data')
  }
}

/**
 * Decrypt encrypted data
 * @param ciphertext - The encrypted data (Base64 encoded)
 * @returns Decrypted plaintext string
 */
export function decrypt(ciphertext: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)

    if (!decrypted) {
      throw new Error('Decryption failed - invalid data or key')
    }

    return decrypted
  } catch (error) {
    console.error('[Encryption] Failed to decrypt data:', error)
    throw new Error('Failed to decrypt sensitive data')
  }
}

/**
 * Safe decrypt that returns the original data if decryption fails
 * This is for handling legacy non-encrypted data
 * @param data - The data to decrypt (may already be plain text)
 * @returns Decrypted plaintext or original data if not encrypted
 */
export function safeDecrypt(data: string): string {
  if (!data) return data

  // Quick checks for common non-encrypted patterns
  // If it looks like a URL or API key, it's definitely not encrypted
  if (data.includes('http://') || data.includes('https://')) {
    return data
  }
  if (data.startsWith('sk-') || data.startsWith('pk_') || data.startsWith('eyJ')) {
    return data
  }

  // Try to decrypt with full error handling
  try {
    const bytes = CryptoJS.AES.decrypt(data, ENCRYPTION_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)

    // If decryption succeeds but returns empty string, assume it wasn't encrypted
    if (!decrypted) {
      return data
    }

    return decrypted
  } catch (error) {
    // If ANY error occurs during decryption, assume data is plain text
    return data
  }
}

/**
 * Check if a string is encrypted (heuristic check)
 * Encrypted strings are typically longer and contain specific patterns
 */
export function isEncrypted(data: string): boolean {
  if (!data || data.length < 20) return false

  // Check for Base64 pattern with typical CryptoJS encrypted format
  // CryptoJS encrypted strings typically contain only valid Base64 chars
  // and are longer than plain text
  const base64Pattern = /^[A-Za-z0-9+/=]+$/
  if (!base64Pattern.test(data)) return false

  // Additional check: encrypted data from CryptoJS typically
  // doesn't contain common URL patterns or plain text indicators
  if (data.includes('http://') || data.includes('https://')) return false
  if (data.includes('sk-') || data.includes('pk_')) return false // API key patterns

  return true
}

/**
 * Encrypt API keys object
 */
export function encryptApiKeys(apiKeys: Record<string, string>): Record<string, string> {
  const encrypted: Record<string, string> = {}

  for (const [key, value] of Object.entries(apiKeys)) {
    if (value && value.length > 0) {
      encrypted[key] = encrypt(value)
    } else {
      encrypted[key] = value
    }
  }

  return encrypted
}

/**
 * Decrypt API keys object
 */
export function decryptApiKeys(apiKeys: Record<string, string>): Record<string, string> {
  const decrypted: Record<string, string> = {}

  for (const [key, value] of Object.entries(apiKeys)) {
    if (value && value.length > 0) {
      decrypted[key] = safeDecrypt(value)
    } else {
      decrypted[key] = value
    }
  }

  return decrypted
}

/**
 * Encrypt Supabase configuration
 */
export function encryptSupabaseConfig(config: { url: string; anonKey: string }): {
  url: string
  anonKey: string
} {
  return {
    url: config.url ? encrypt(config.url) : '',
    anonKey: config.anonKey ? encrypt(config.anonKey) : '',
  }
}

/**
 * Decrypt Supabase configuration
 */
export function decryptSupabaseConfig(config: { url: string; anonKey: string }): {
  url: string
  anonKey: string
} {
  return {
    url: config.url ? safeDecrypt(config.url) : config.url,
    anonKey: config.anonKey ? safeDecrypt(config.anonKey) : config.anonKey,
  }
}
