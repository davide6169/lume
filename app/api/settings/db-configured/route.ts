import { NextResponse } from 'next/server'
import { hasDatabaseCredentialsInCookie } from '@/lib/utils/db-credentials-cookie'

/**
 * API endpoint to check if user has configured database credentials
 * Returns true if credentials cookie exists and is valid
 */
export async function GET() {
  const hasCredentials = await hasDatabaseCredentialsInCookie()

  return NextResponse.json({
    configured: hasCredentials
  })
}
