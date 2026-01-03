import { createSupabaseServerClient } from '@/lib/supabase/server'
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

    const body = await request.json()
    const { sourceAudienceIds } = body

    if (!Array.isArray(sourceAudienceIds) || sourceAudienceIds.length === 0) {
      return NextResponse.json({ error: 'No source audiences selected' }, { status: 400 })
    }

    // Fetch the source audiences
    const { data: audiences, error: fetchError } = await supabase
      .from('source_audiences')
      .select('*')
      .in('id', sourceAudienceIds)
      .eq('user_id', user.id)

    if (fetchError) {
      console.error('Fetch audiences error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!audiences || audiences.length === 0) {
      return NextResponse.json({ error: 'No valid audiences found' }, { status: 404 })
    }

    // Process audiences
    const results = await processAudiences(audiences, user.id, supabase)

    return NextResponse.json({
      message: 'Search completed',
      results,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function processAudiences(
  audiences: any[],
  userId: string,
  supabase: any
) {
  const results = []

  for (const audience of audiences) {
    try {
      console.log(`Processing audience: ${audience.name}`)

      // Update status to processing
      await supabase
        .from('source_audiences')
        .update({ status: 'processing' })
        .eq('id', audience.id)

      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate demo contacts
      const contacts = generateDemoContacts(audience.urls.length)

      // Validate contacts
      const validContacts = contacts.filter(
        (c: any) => c.firstName && c.lastName && c.email
      )

      if (validContacts.length > 0) {
        // Create shared audience
        const { data: sharedAudience } = await supabase
          .from('shared_audiences')
          .insert({
            user_id: userId,
            source_audience_id: audience.id,
            name: audience.name,
            contacts: validContacts,
            selected: false,
            uploaded_to_meta: false,
          })
          .select()
          .single()

        results.push({
          audienceId: audience.id,
          audienceName: audience.name,
          contactsFound: validContacts.length,
          sharedAudienceId: sharedAudience?.id,
        })

        // Update source audience status
        await supabase
          .from('source_audiences')
          .update({ status: 'completed' })
          .eq('id', audience.id)
      } else {
        await supabase
          .from('source_audiences')
          .update({ status: 'completed' })
          .eq('id', audience.id)

        results.push({
          audienceId: audience.id,
          audienceName: audience.name,
          contactsFound: 0,
        })
      }
    } catch (error: any) {
      console.error(`Error processing audience ${audience.id}:`, error)

      await supabase
        .from('source_audiences')
        .update({
          status: 'failed',
          error_message: error.message || 'Unknown error',
        })
        .eq('id', audience.id)

      results.push({
        audienceId: audience.id,
        audienceName: audience.name,
        contactsFound: 0,
        error: error.message || 'Unknown error',
      })
    }
  }

  return results
}

function generateDemoContacts(urlCount: number) {
  const contacts = []
  const countPerUrl = 3

  for (let i = 0; i < urlCount * countPerUrl; i++) {
    const id = i + 1
    contacts.push({
      firstName: `FirstName${id}`,
      lastName: `LastName${id}`,
      email: `contact${id}@example.com`,
      phone: `+12345678${id.toString().padStart(2, '0')}`,
      city: 'Milan',
      country: 'Italy',
      interests: ['technology', 'business', 'marketing'].slice(0, Math.floor(Math.random() * 3) + 1),
    })
  }

  return contacts
}
