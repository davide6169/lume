import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get all source audiences for this user
    const { data: audiences } = await supabase
      .from('source_audiences')
      .select('*')
      .eq('user_id', user.id)

    console.log('Found source audiences:', audiences?.length || 0)

    // Get all shared audiences for this user
    const { data: sharedAudiences } = await supabase
      .from('shared_audiences')
      .select('*')
      .eq('user_id', user.id)

    console.log('Found shared audiences:', sharedAudiences?.length || 0)

    // Delete all source audiences (cascade will delete related shared audiences)
    const { error: deleteError } = await supabase
      .from('source_audiences')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deletedSourceAudiences: audiences?.length || 0,
      deletedSharedAudiences: sharedAudiences?.length || 0,
      message: `Deleted ${audiences?.length || 0} source audiences and ${sharedAudiences?.length || 0} shared audiences from database.`
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
