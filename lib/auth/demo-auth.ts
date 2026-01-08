/**
 * Demo Authentication Utility
 *
 * This utility handles JWT-based authentication for the demo account.
 * The demo account allows first-time access without a configured database.
 *
 * IMPORTANT: These credentials are committed to GitHub for production demo access.
 * The JWT secret is also committed because it's only used for demo mode.
 */

import { JWTPayload, SignJWT, jwtVerify } from 'jose'

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || 'demo@lume.app'
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'Lume#Secure$2026!Pr0d@Acc3ss'
const DEMO_JWT_SECRET = new TextEncoder().encode(
  process.env.DEMO_JWT_SECRET || 'lume-demo-jwt-secret-commit-for-production-2026'
)

export interface DemoUser {
  email: string
  fullName: string
  role: 'admin' | 'user'
  status: 'pending' | 'approved'
  isDemo: true
}

interface DemoJWTPayload extends JWTPayload {
  user: DemoUser
}

/**
 * Verify if credentials match demo account
 */
export function verifyDemoCredentials(email: string, password: string): boolean {
  return email === DEMO_EMAIL && password === DEMO_PASSWORD
}

/**
 * Generate a JWT token for demo user
 */
export async function generateDemoToken(): Promise<string> {
  const demoUser: DemoUser = {
    email: DEMO_EMAIL,
    fullName: 'Demo Admin',
    role: 'admin',
    status: 'approved',
    isDemo: true,
  }

  const token = await new SignJWT({ user: demoUser })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token expires in 7 days
    .sign(DEMO_JWT_SECRET)

  return token
}

/**
 * Verify a demo JWT token
 */
export async function verifyDemoToken(token: string): Promise<DemoUser | null> {
  try {
    const { payload } = await jwtVerify<DemoJWTPayload>(token, DEMO_JWT_SECRET)

    if (payload.user && payload.user.isDemo) {
      return payload.user
    }

    return null
  } catch (error) {
    console.error('Demo token verification failed:', error)
    return null
  }
}

/**
 * Check if email is demo email
 */
export function isDemoEmail(email: string): boolean {
  return email === DEMO_EMAIL
}

/**
 * Get demo credentials (for testing purposes)
 */
export function getDemoCredentials() {
  return {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  }
}
