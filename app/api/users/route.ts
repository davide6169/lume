import { createNextResponse } from '@/lib/api-utils'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * GET /api/users
 * Get all users (admin only)
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return createNextResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return createNextResponse({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Fetch all users with their profiles
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[API] Error fetching users:', error)
      return createNextResponse({ error: 'Failed to fetch users' }, { status: 500 })
    }

    return createNextResponse({ users })
  } catch (error) {
    console.error('[API] Error in GET /api/users:', error)
    return createNextResponse({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/users
 * Update user role or status (admin only)
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return createNextResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if requester is admin
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (requesterProfile?.role !== 'admin') {
      return createNextResponse({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, role, status } = body

    // Validate input
    if (!userId) {
      return createNextResponse({ error: 'Invalid input' }, { status: 400 })
    }

    // Build update object based on what's provided
    const updateData: Record<string, string> = {}
    let updateType = ''

    if (role) {
      if (!['admin', 'user'].includes(role)) {
        return createNextResponse({ error: 'Invalid role' }, { status: 400 })
      }
      updateData.role = role
      updateType = 'role'
    }

    if (status) {
      if (!['pending', 'approved'].includes(status)) {
        return createNextResponse({ error: 'Invalid status' }, { status: 400 })
      }
      updateData.status = status
      updateType = updateType ? 'role and status' : 'status'
    }

    // Prevent removing own admin role
    if (userId === user.id && role && role !== 'admin') {
      return createNextResponse({ error: 'Cannot remove your own admin role' }, { status: 400 })
    }

    // Update user
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('[API] Error updating user:', error)
      return createNextResponse({ error: `Failed to update user ${updateType}` }, { status: 500 })
    }

    return createNextResponse({
      success: true,
      user: updatedProfile
    })
  } catch (error) {
    console.error('[API] Error in PATCH /api/users:', error)
    return createNextResponse({ error: 'Internal server error' }, { status: 500 })
  }
}
