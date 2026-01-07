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

    // Test connection by querying a simple system table
    // We'll try to get the current user (will be null if not authenticated, but connection works)
    const startTime = Date.now()

    try {
      // Try a simple query to test connection
      const { data, error } = await supabase
        .from('_test_connection_')
        .select('*')
        .limit(1)

      const responseTime = Date.now() - startTime

      // If we get here, the connection worked (even if table doesn't exist)
      // A real connection error would happen before this
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = table not found (which is OK, we just wanted to test connection)
        // Other errors might be real issues
        throw error
      }

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
          errorMessage.includes('403')) {
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
          errorMessage.includes('ECONNREFUSED')) {
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

      // Table doesn't exist is actually OK - means connection works!
      if (errorMessage.includes('PGRST116') ||
          errorMessage.includes('does not exist')) {
        console.log('[Test Database] Connection successful (table check failed as expected)')

        return NextResponse.json({
          success: true,
          message: 'Successfully connected to Supabase database',
          details: {
            url: trimmedUrl.replace(/\/\/.*@/, '//***@'),
            responseTime: `${responseTime}ms`,
            status: 'Connection established'
          }
        })
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
