/**
 * Database Credentials Cookie Management
 *
 * This utility handles saving and reading Supabase database credentials
 * from an httpOnly cookie so the server can access them for authentication.
 */

import { cookies } from 'next/headers'
import { encrypt, decrypt } from './encryption'

const DB_CREDENTIALS_COOKIE_NAME = 'user_db_credentials'

export interface DatabaseCredentials {
  url: string
  anonKey: string
}

/**
 * Save database credentials to an httpOnly cookie (encrypted)
 * This should be called when user configures their database in Settings
 */
export async function setDatabaseCredentialsCookie(url: string, anonKey: string) {
  const cookieStore = await cookies()

  const credentials: DatabaseCredentials = { url, anonKey }
  const encrypted = encrypt(JSON.stringify(credentials))

  cookieStore.set(DB_CREDENTIALS_COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
}

/**
 * Read and decrypt database credentials from cookie
 * Returns null if cookie doesn't exist or is invalid
 */
export async function getDatabaseCredentialsFromCookie(): Promise<DatabaseCredentials | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(DB_CREDENTIALS_COOKIE_NAME)

  if (!cookie || !cookie.value) {
    return null
  }

  try {
    const decrypted = decrypt(cookie.value)
    const credentials = JSON.parse(decrypted) as DatabaseCredentials

    // Validate credentials structure
    if (!credentials.url || !credentials.anonKey) {
      return null
    }

    return credentials
  } catch (error) {
    console.error('Failed to read database credentials from cookie:', error)
    return null
  }
}

/**
 * Remove database credentials cookie
 * Called when user logs out or resets settings
 */
export async function removeDatabaseCredentialsCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(DB_CREDENTIALS_COOKIE_NAME)
}

/**
 * Check if user has configured database credentials
 */
export async function hasDatabaseCredentialsInCookie(): Promise<boolean> {
  const credentials = await getDatabaseCredentialsFromCookie()
  return credentials !== null
}
