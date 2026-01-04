import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureProfileExists } from '@/lib/supabase/queries'
import { NextResponse } from 'next/server'
import { MetaGraphAPIService } from '@/lib/services/meta-graphapi'
import { MetaGraphAPIStubService } from '@/lib/services/meta-graphapi-stub'
import { ContactExtractorService } from '@/lib/services/contact-extractor'
import { Contact } from '@/types'

// Helper function to create log entry
async function createLogEntry(
  supabase: any,
  userId: string,
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  metadata?: Record<string, any>
) {
  try {
    // Check if logging is enabled before creating log entry
    const { data: settings } = await supabase
      .from('settings')
      .select('logs_enabled')
      .eq('user_id', userId)
      .single()

    // Only create log if logging is enabled
    if (!settings?.logs_enabled) {
      return
    }

    await supabase.from('logs').insert({
      user_id: userId,
      level,
      message,
      metadata: metadata || {},
    })
  } catch (error) {
    console.error('Failed to create log entry:', error)
  }
}

// GET - Fetch all source audiences for current user
export async function GET() {
  console.log('GET /api/source-audiences called')
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

    const { data, error } = await supabase
      .from('source_audiences')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Returning', data?.length || 0, 'audiences')
    return NextResponse.json({ sourceAudiences: data })
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new source audience OR search
export async function POST(request: Request) {
  console.log('POST /api/source-audiences called - START')

  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('User not authenticated')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    const body = await request.json()
    console.log('Request body keys:', Object.keys(body))

    // Check if this is a search request
    if (body.sourceAudienceIds) {
      console.log('Processing search request with IDs:', body.sourceAudienceIds)

      const { sourceAudienceIds } = body

      if (!Array.isArray(sourceAudienceIds) || sourceAudienceIds.length === 0) {
        console.log('No source audiences selected')
        return NextResponse.json({ error: 'No source audiences selected' }, { status: 400 })
      }

      console.log('Fetching audiences from database...')

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
        console.log('No valid audiences found')
        return NextResponse.json({ error: 'No valid audiences found' }, { status: 404 })
      }

      console.log('Found audiences:', audiences.length)

      // Process audiences
      const results = await processAudiences(audiences, user.id, supabase)

      console.log('Search completed, results:', results)

      return NextResponse.json({
        message: 'Search completed',
        results,
      })
    }

    console.log('Creating new source audience')
    // Create new source audience
    const { data, error } = await supabase
      .from('source_audiences')
      .insert({
        user_id: user.id,
        name: body.name,
        type: body.type,
        urls: body.urls,
        selected: true,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Created audience:', data.id)
    return NextResponse.json(data)
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete source audiences
export async function DELETE(request: Request) {
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
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
    }

    const { error } = await supabase
      .from('source_audiences')
      .delete()
      .in('id', ids)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update source audience
export async function PATCH(request: Request) {
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
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('source_audiences')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to process audiences
async function processAudiences(
  audiences: any[],
  userId: string,
  supabase: any
) {
  const results = []

  // Fetch settings to check demo mode
  const { data: settings } = await supabase
    .from('settings')
    .select('demo_mode, encrypted_keys')
    .eq('user_id', userId)
    .single()

  const isDemoMode = settings?.demo_mode ?? true
  const metaApiKey = settings?.encrypted_keys?.meta

  console.log(`Demo mode: ${isDemoMode}, Meta API key present: ${!!metaApiKey}`)

  // Log search start
  await createLogEntry(
    supabase,
    userId,
    'info',
    `Started processing ${audiences.length} audience(s)`,
    { audienceNames: audiences.map(a => a.name), demoMode: isDemoMode }
  )

  for (const audience of audiences) {
    try {
      console.log(`Processing audience: ${audience.name}`)

      // Log audience processing start
      await createLogEntry(
        supabase,
        userId,
        'info',
        `Processing audience: ${audience.name}`,
        { audienceId: audience.id, urlCount: audience.urls.length }
      )

      // Update status to processing
      await supabase
        .from('source_audiences')
        .update({ status: 'processing' })
        .eq('id', audience.id)

      let contacts: Contact[] = []

      if (isDemoMode || !metaApiKey) {
        // DEMO MODE: Use Meta GraphAPI Stub
        console.log('Using DEMO MODE (Meta GraphAPI Stub) for audience:', audience.name)

        await createLogEntry(
          supabase,
          userId,
          'info',
          `[DEMO MODE] Processing ${audience.urls.length} URL(s) for ${audience.name}`,
          { urls: audience.urls }
        )

        const stubService = new MetaGraphAPIStubService()
        const extractor = new ContactExtractorService()

        for (const url of audience.urls) {
          try {
            console.log(`Processing URL: ${url}`)
            const parsed = stubService.parseUrl(url)

            await createLogEntry(
              supabase,
              userId,
              'debug',
              `[DEMO] Processing ${parsed.platform} URL: ${url}`,
              { platform: parsed.platform, id: parsed.id }
            )

            if (parsed.platform === 'facebook') {
              console.log(`[DEMO] Fetching Facebook posts for ID: ${parsed.id}`)
              const posts = await stubService.fetchFacebookPosts(parsed.id)
              console.log(`[DEMO] Found ${posts.length} posts`)

              await createLogEntry(
                supabase,
                userId,
                'debug',
                `[DEMO] Found ${posts.length} Facebook posts`,
                { pageId: parsed.id, postCount: posts.length }
              )

              for (const post of posts) {
                const comments = await stubService.fetchFacebookComments(post.id)
                console.log(`[DEMO] Post ${post.id} has ${comments.length} comments`)
                contacts.push(...extractor.extractFromFacebook(comments))

                await createLogEntry(
                  supabase,
                  userId,
                  'debug',
                  `[DEMO] Extracted ${comments.length} comments from post`,
                  { postId: post.id, commentCount: comments.length }
                )
              }
            } else if (parsed.platform === 'instagram') {
              console.log(`[DEMO] Fetching Instagram business account for username: ${parsed.username}`)
              const businessAccountId = await stubService.getInstagramBusinessAccount(parsed.username!)
              console.log(`[DEMO] Business account ID: ${businessAccountId}`)

              const mediaItems = await stubService.fetchInstagramMedia(businessAccountId)
              console.log(`[DEMO] Found ${mediaItems.length} media items`)

              await createLogEntry(
                supabase,
                userId,
                'debug',
                `[DEMO] Found ${mediaItems.length} Instagram media items`,
                { businessAccountId, mediaCount: mediaItems.length }
              )

              for (const media of mediaItems) {
                const comments = await stubService.fetchInstagramComments(media.id)
                console.log(`[DEMO] Media ${media.id} has ${comments.length} comments`)
                contacts.push(...extractor.extractFromInstagram(comments))

                await createLogEntry(
                  supabase,
                  userId,
                  'debug',
                  `[DEMO] Extracted ${comments.length} comments from media`,
                  { mediaId: media.id, commentCount: comments.length }
                )
              }
            }
          } catch (urlError: any) {
            console.error(`[DEMO] Error processing URL ${url}:`, urlError)

            await createLogEntry(
              supabase,
              userId,
              'warn',
              `[DEMO] Error processing URL: ${url}`,
              { url, error: urlError.message }
            )

            // Continue with next URL (partial success)
          }
        }
      } else {
        // PRODUCTION: Use real GraphAPI
        console.log('Using PRODUCTION GraphAPI for audience:', audience.name)

        await createLogEntry(
          supabase,
          userId,
          'info',
          `[PRODUCTION] Processing ${audience.urls.length} URL(s) for ${audience.name}`,
          { urls: audience.urls }
        )

        const metaService = new MetaGraphAPIService(metaApiKey)
        const extractor = new ContactExtractorService()

        for (const url of audience.urls) {
          try {
            console.log(`Processing URL: ${url}`)
            const parsed = metaService.parseUrl(url)

            await createLogEntry(
              supabase,
              userId,
              'debug',
              `[PRODUCTION] Processing ${parsed.platform} URL: ${url}`,
              { platform: parsed.platform, id: parsed.id }
            )

            if (parsed.platform === 'facebook') {
              console.log(`Fetching Facebook posts for ID: ${parsed.id}`)
              const posts = await metaService.fetchFacebookPosts(parsed.id)
              console.log(`Found ${posts.length} posts`)

              await createLogEntry(
                supabase,
                userId,
                'debug',
                `[PRODUCTION] Found ${posts.length} Facebook posts`,
                { pageId: parsed.id, postCount: posts.length }
              )

              for (const post of posts) {
                const comments = await metaService.fetchFacebookComments(post.id)
                console.log(`Post ${post.id} has ${comments.length} comments`)
                contacts.push(...extractor.extractFromFacebook(comments))

                await createLogEntry(
                  supabase,
                  userId,
                  'debug',
                  `[PRODUCTION] Extracted ${comments.length} comments from post`,
                  { postId: post.id, commentCount: comments.length }
                )
              }
            } else if (parsed.platform === 'instagram') {
              console.log(`Fetching Instagram business account for username: ${parsed.username}`)
              const businessAccountId = await metaService.getInstagramBusinessAccount(parsed.username!)
              console.log(`Business account ID: ${businessAccountId}`)

              const mediaItems = await metaService.fetchInstagramMedia(businessAccountId)
              console.log(`Found ${mediaItems.length} media items`)

              await createLogEntry(
                supabase,
                userId,
                'debug',
                `[PRODUCTION] Found ${mediaItems.length} Instagram media items`,
                { businessAccountId, mediaCount: mediaItems.length }
              )

              for (const media of mediaItems) {
                const comments = await metaService.fetchInstagramComments(media.id)
                console.log(`Media ${media.id} has ${comments.length} comments`)
                contacts.push(...extractor.extractFromInstagram(comments))

                await createLogEntry(
                  supabase,
                  userId,
                  'debug',
                  `[PRODUCTION] Extracted ${comments.length} comments from media`,
                  { mediaId: media.id, commentCount: comments.length }
                )
              }
            }
          } catch (urlError: any) {
            console.error(`Error processing URL ${url}:`, urlError)

            await createLogEntry(
              supabase,
              userId,
              'warn',
              `[PRODUCTION] Error processing URL: ${url}`,
              { url, error: urlError.message }
            )

            // Continue with next URL (partial success)
          }
        }
      }

      // Validate contacts
      const validContacts = contacts.filter(
        (c: Contact) => c.firstName && c.lastName && c.email
      )

      // Deduplicate by email
      const uniqueContacts = deduplicateContacts(validContacts)
      console.log(`Total contacts: ${contacts.length}, Valid: ${validContacts.length}, Unique: ${uniqueContacts.length}`)

      // Log results
      await createLogEntry(
        supabase,
        userId,
        'info',
        `Audience "${audience.name}" completed: ${uniqueContacts.length} unique contacts found`,
        {
          audienceId: audience.id,
          totalContacts: contacts.length,
          validContacts: validContacts.length,
          uniqueContacts: uniqueContacts.length,
        }
      )

      if (uniqueContacts.length > 0) {
        // Check if a shared audience already exists for this source
        const { data: existingShared } = await supabase
          .from('shared_audiences')
          .select('id')
          .eq('source_audience_id', audience.id)
          .eq('user_id', userId)
          .single()

        let sharedAudienceId

        if (existingShared) {
          // Update existing shared audience with new contacts
          const { data: updatedShared } = await supabase
            .from('shared_audiences')
            .update({
              contacts: uniqueContacts,
              selected: false,
              uploaded_to_meta: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingShared.id)
            .select()
            .single()

          sharedAudienceId = updatedShared?.id
        } else {
          // Create new shared audience
          const { data: newSharedAudience } = await supabase
            .from('shared_audiences')
            .insert({
              user_id: userId,
              source_audience_id: audience.id,
              source_audience_type: audience.type,
              name: audience.name,
              contacts: uniqueContacts,
              selected: false,
              uploaded_to_meta: false,
            })
            .select()
            .single()

          sharedAudienceId = newSharedAudience?.id
        }

        results.push({
          audienceId: audience.id,
          audienceName: audience.name,
          contactsFound: uniqueContacts.length,
          sharedAudienceId: sharedAudienceId,
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

        await createLogEntry(
          supabase,
          userId,
          'warn',
          `Audience "${audience.name}" completed but no contacts found`,
          { audienceId: audience.id }
        )

        results.push({
          audienceId: audience.id,
          audienceName: audience.name,
          contactsFound: 0,
        })
      }
    } catch (error: any) {
      console.error(`Error processing audience ${audience.id}:`, error)

      await createLogEntry(
        supabase,
        userId,
        'error',
        `Failed to process audience: ${audience.name}`,
        { audienceId: audience.id, error: error.message || 'Unknown error' }
      )

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

  // Log completion
  await createLogEntry(
    supabase,
    userId,
    'info',
    `Search completed: ${results.length} audience(s) processed`,
    { results }
  )

  return results
}

function deduplicateContacts(contacts: Contact[]): Contact[] {
  const seen = new Set<string>()
  return contacts.filter((contact) => {
    const key = contact.email.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
