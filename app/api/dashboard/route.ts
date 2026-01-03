import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureProfileExists } from '@/lib/supabase/queries'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Ensure profile exists
    await ensureProfileExists(user.id, user.email)

    // Get all source audiences
    const { data: sourceAudiences, error: sourceError } = await supabase
      .from('source_audiences')
      .select('urls')

    // Get all shared audiences
    const { data: sharedAudiences, error: sharedError } = await supabase
      .from('shared_audiences')
      .select('contacts, uploaded_to_meta')

    // Calculate total URLs
    const totalUrls = sourceAudiences?.reduce((sum, sa) => sum + (sa.urls?.length || 0), 0) || 0

    // Calculate total contacts
    const totalContacts = sharedAudiences?.reduce((sum, sa) => sum + (sa.contacts?.length || 0), 0) || 0

    // Calculate uploaded contacts
    const uploadedContacts = sharedAudiences?.filter((sa) => sa.uploaded_to_meta).length || 0

    // Get costs by service
    const { data: costs } = await supabase
      .from('cost_tracking')
      .select('service, cost')
      .eq('user_id', user.id)

    const totalCost = costs?.reduce((sum, c) => sum + Number(c.cost), 0) || 0

    const costsByService: Record<string, number> = {}
    costs?.forEach((c) => {
      const service = c.service
      costsByService[service] = (costsByService[service] || 0) + Number(c.cost)
    })

    const costBreakdown = Object.entries(costsByService).map(([service, cost]) => ({
      service,
      cost,
    }))

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentCosts } = await supabase
      .from('cost_tracking')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())

    const recentActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dateStr = date.toISOString().split('T')[0]

      const dayCosts = recentCosts?.filter((c) => {
        const costDate = new Date(c.created_at).toISOString().split('T')[0]
        return costDate === dateStr
      })

      return {
        date: dateStr,
        operations: dayCosts?.length || 0,
      }
    })

    return NextResponse.json({
      totalSourceAudiences: sourceAudiences?.length || 0,
      totalUrls,
      totalContacts,
      uploadedContacts,
      totalCost,
      costBreakdown,
      recentActivity,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
