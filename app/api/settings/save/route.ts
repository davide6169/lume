import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureProfileExists } from '@/lib/supabase/queries'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await ensureProfileExists(user.id, user.email)

    const body = await request.json()
    const { demoMode, logsEnabled } = body

    // Update user settings in database
    const { error: updateError } = await supabase
      .from('settings')
      .upsert({
        user_id: user.id,
        demo_mode: demoMode,
        logs_enabled: logsEnabled,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (updateError) {
      console.error('[Settings Save] Error updating settings:', updateError)
      return NextResponse.json(
        { error: 'Failed to save settings', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('[Settings Save] Settings updated successfully:', {
      userId: user.id,
      demoMode,
      logsEnabled,
    })

    return NextResponse.json({
      success: true,
      demoMode,
      logsEnabled,
    })
  } catch (error) {
    console.error('[Settings Save] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await ensureProfileExists(user.id, user.email)

    const { data: settings, error } = await supabase
      .from('settings')
      .select('demo_mode, logs_enabled')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('[Settings Get] Error fetching settings:', error)
      // Return 404 if settings don't exist yet - don't force defaults
      return NextResponse.json(
        { error: 'Settings not found', demoMode: null, logsEnabled: null },
        { status: 404 }
      )
    }

    return NextResponse.json({
      demoMode: settings.demo_mode ?? true,
      logsEnabled: settings.logs_enabled ?? true,
    })
  } catch (error) {
    console.error('[Settings Get] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
