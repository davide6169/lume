import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST - Clean up old logs based on retention policy
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Get retention days from request body (default to 3)
    const body = await request.json()
    const retentionDays = body.retentionDays || 3

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    console.log(`[Logs Cleanup] Deleting logs older than ${retentionDays} days (before ${cutoffDate.toISOString()})`)

    // Delete old logs
    const { data: deletedLogs, error: deleteError } = await supabase
      .from('logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select()

    if (deleteError) {
      console.error('[Logs Cleanup] Error deleting logs:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    const deletedCount = deletedLogs?.length || 0
    console.log(`[Logs Cleanup] Successfully deleted ${deletedCount} old logs`)

    return NextResponse.json({
      success: true,
      deletedCount,
      retentionDays,
      cutoffDate: cutoffDate.toISOString()
    })
  } catch (error) {
    console.error('[Logs Cleanup] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
