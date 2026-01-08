'use server'

import { setDatabaseCredentialsCookie } from '@/lib/utils/db-credentials-cookie'
import { NextResponse } from 'next/server'

/**
 * API endpoint to save database credentials to httpOnly cookie
 * This is called from the client when user configures their database in Settings
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, anonKey } = body

    if (!url || !anonKey) {
      return NextResponse.json(
        { error: 'Missing required fields: url and anonKey' },
        { status: 400 }
      )
    }

    // Save encrypted credentials to httpOnly cookie
    await setDatabaseCredentialsCookie(url, anonKey)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save database credentials:', error)
    return NextResponse.json(
      { error: 'Failed to save database credentials' },
      { status: 500 }
    )
  }
}

/**
 * API endpoint to remove database credentials cookie
 */
export async function DELETE() {
  try {
    const { removeDatabaseCredentialsCookie } = await import('@/lib/utils/db-credentials-cookie')
    await removeDatabaseCredentialsCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove database credentials:', error)
    return NextResponse.json(
      { error: 'Failed to remove database credentials' },
      { status: 500 }
    )
  }
}
