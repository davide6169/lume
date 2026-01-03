import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getDemoModeService } from '@/lib/services/demo-mode'

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

    const body = await request.json()
    const { sharedAudienceIds } = body

    if (!Array.isArray(sharedAudienceIds) || sharedAudienceIds.length === 0) {
      return NextResponse.json({ error: 'No audiences selected' }, { status: 400 })
    }

    // Fetch the shared audiences
    const { data: audiences, error: fetchError } = await supabase
      .from('shared_audiences')
      .select('*')
      .in('id', sharedAudienceIds)
      .eq('user_id', user.id)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!audiences || audiences.length === 0) {
      return NextResponse.json({ error: 'No valid audiences found' }, { status: 404 })
    }

    // Get user settings to check demo mode
    const { data: settings } = await supabase
      .from('settings')
      .select('demo_mode')
      .eq('user_id', user.id)
      .single()

    const isDemoMode = settings?.demo_mode ?? true

    const results = []

    for (const audience of audiences) {
      try {
        let metaAudienceId: string | undefined

        if (isDemoMode) {
          // Demo mode - simulate upload
          await new Promise((resolve) => setTimeout(resolve, 1000))
          metaAudienceId = `demo_${crypto.randomUUID()}`
        } else {
          // Real implementation - Call Meta Marketing API
          // This is a placeholder for the actual Meta API call
          const metaApiResponse = await uploadToMetaAds(audience)
          metaAudienceId = metaApiResponse.audience_id
        }

        // Update shared audience
        await supabase
          .from('shared_audiences')
          .update({
            uploaded_to_meta: true,
            meta_audience_id: metaAudienceId,
          })
          .eq('id', audience.id)

        // Deselect the source audience
        if (audience.source_audience_id) {
          await supabase
            .from('source_audiences')
            .update({ selected: false })
            .eq('id', audience.source_audience_id)
        }

        results.push({
          audienceId: audience.id,
          audienceName: audience.name,
          contactsUploaded: audience.contacts.length,
          metaAudienceId,
          success: true,
        })
      } catch (error: any) {
        console.error(`Error uploading audience ${audience.id}:`, error)

        results.push({
          audienceId: audience.id,
          audienceName: audience.name,
          contactsUploaded: 0,
          error: error.message || 'Unknown error',
          success: false,
        })
      }
    }

    return NextResponse.json({
      message: 'Upload completed',
      results,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function uploadToMetaAds(audience: any): Promise<{ audience_id: string }> {
  // TODO: Implement actual Meta Marketing API call
  // This would use the Meta Ads API to create a custom audience
  // For now, we'll return a demo response

  const metaAppId = process.env.META_APP_ID
  const metaAppSecret = process.env.META_APP_SECRET
  const metaAccessToken = process.env.META_ACCESS_TOKEN

  if (!metaAccessToken) {
    throw new Error('Meta access token not configured')
  }

  // Placeholder: In real implementation, this would call:
  // POST https://graph.facebook.com/v18.0/ad_account_id/customaudiences
  // with the contacts data in Meta Ads compliant format

  // For now, simulate success
  return {
    audience_id: `meta_${crypto.randomUUID()}`,
  }
}
