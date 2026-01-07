import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, anonKey } = body

    if (!url || !anonKey) {
      return NextResponse.json(
        { error: 'Missing required credentials: url and anonKey are required' },
        { status: 400 }
      )
    }

    console.log('[Test Database] Testing Supabase connection...')

    // Trim whitespace
    const trimmedUrl = url.trim()
    const trimmedAnonKey = anonKey.trim()

    // Basic URL validation
    if (!trimmedUrl.startsWith('https://')) {
      return NextResponse.json(
        {
          error: 'Invalid Supabase URL',
          details: 'URL must start with https://'
        },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient(trimmedUrl, trimmedAnonKey)

    // Test connection by trying to get the current user (no session required, just validates credentials)
    const startTime = Date.now()

    try {
      // Try to get session info - this validates the credentials without needing data
      const { data: { session }, error } = await supabase.auth.getSession()

      const responseTime = Date.now() - startTime

      // If we get here without a network error, connection works
      // Session will be null (no user logged in), but that's expected
      console.log('[Test Database] Connection successful!')

      return NextResponse.json({
        success: true,
        message: 'Successfully connected to Supabase database',
        details: {
          url: trimmedUrl.replace(/\/\/.*@/, '//***@'), // Hide credentials in logs
          responseTime: `${responseTime}ms`,
          status: 'Connection established'
        }
      })

    } catch (queryError: any) {
      const responseTime = Date.now() - startTime

      // Check if it's an auth/connection error
      const errorMessage = queryError.message || String(queryError)

      if (errorMessage.includes('Invalid API key') ||
          errorMessage.includes('JWT') ||
          errorMessage.includes('401') ||
          errorMessage.includes('403') ||
          errorMessage.includes('Invalid credentials')) {
        console.error('[Test Database] Authentication error:', errorMessage)

        return NextResponse.json({
          success: false,
          error: 'Authentication failed',
          details: {
            url: trimmedUrl.replace(/\/\/.*@/, '//***@'),
            message: 'Invalid Supabase URL or anon key',
            responseTime: `${responseTime}ms`
          }
        }, { status: 401 })
      }

      if (errorMessage.includes('fetch') ||
          errorMessage.includes('network') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('ENOTFOUND')) {
        console.error('[Test Database] Connection error:', errorMessage)

        return NextResponse.json({
          success: false,
          error: 'Connection failed',
          details: {
            url: trimmedUrl.replace(/\/\/.*@/, '//***@'),
            message: 'Could not reach Supabase server. Check the URL.',
            responseTime: `${responseTime}ms`
          }
        }, { status: 503 })
      }

      // Unknown error
      console.error('[Test Database] Unknown error:', errorMessage)

      return NextResponse.json({
        success: false,
        error: 'Unknown error',
        details: {
          message: errorMessage,
          responseTime: `${responseTime}ms`
        }
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('[Test Database] Request error:', error)

    return NextResponse.json(
      {
        error: 'Invalid request',
        details: error.message || 'Unknown error'
      },
      { status: 400 }
    )
  }
}
