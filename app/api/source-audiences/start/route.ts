import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureProfileExists } from '@/lib/supabase/queries'
import { jobProcessor } from '@/lib/services/job-processor'
import { getAPIUsageStubService, API_PRICING } from '@/lib/services/api-usage-stub'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('[Search Job Start] Request received')

    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[Search Job Start] Authentication failed:', userError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('[Search Job Start] User authenticated:', user.id)

    // Ensure profile exists
    await ensureProfileExists(user.id, user.email)

    const body = await request.json()
    console.log('[Search Job Start] Request body:', JSON.stringify(body, null, 2))
    const { sourceAudienceIds, mode = 'production', sourceAudiences: clientSourceAudiences } = body

    console.log('[Search Job Start] Parsed values:', {
      sourceAudienceIds,
      mode,
      clientSourceAudiences: clientSourceAudiences ? `Found ${clientSourceAudiences.length} audiences` : 'NOT FOUND'
    })

    if (!sourceAudienceIds || !Array.isArray(sourceAudienceIds) || sourceAudienceIds.length === 0) {
      console.error('[Search Job Start] Invalid sourceAudienceIds')
      return NextResponse.json(
        { error: 'sourceAudienceIds is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    let sourceAudiences: any[] = []

    // In demo mode, use client-provided audiences directly (they're in the store, not DB)
    if (mode === 'demo' && clientSourceAudiences && Array.isArray(clientSourceAudiences)) {
      console.log('[Search Job Start] Demo mode - using client audiences:', clientSourceAudiences.length)
      sourceAudiences = clientSourceAudiences
    } else {
      // Production mode - fetch from database
      const { data: dbSourceAudiences, error: fetchError } = await supabase
        .from('source_audiences')
        .select('*')
        .in('id', sourceAudienceIds)

      if (fetchError) {
        console.error('[Search Job Start] Error fetching source audiences:', fetchError)
        return NextResponse.json({ error: 'Failed to fetch source audiences' }, { status: 500 })
      }

      if (!dbSourceAudiences || dbSourceAudiences.length === 0) {
        console.error('[Search Job Start] No source audiences found')
        return NextResponse.json({ error: 'No source audiences found' }, { status: 404 })
      }

      sourceAudiences = dbSourceAudiences
    }

    console.log('[Search Job Start] Source audiences:', sourceAudiences.length)

    // Get initial API usage before starting job
    const usageService = getAPIUsageStubService()
    const [
      initialOpenRouter,
      initialMixedbread,
      initialApollo,
      initialHunter,
      initialMeta
    ] = await Promise.all([
      usageService.getOpenRouterUsage(),
      usageService.getMixedbreadUsage(),
      usageService.getApolloUsage(),
      usageService.getHunterUsage(),
      usageService.getMetaUsage()
    ])

    console.log('[Search Job Start] Initial API usage captured')

    // Create job with initial usage
    const job = jobProcessor.createJob(user.id, 'SEARCH', {
      sourceAudienceIds,
      sourceAudiences: sourceAudiences.map(sa => ({
        id: sa.id,
        name: sa.name,
        type: sa.type,
        urls: sa.urls
      })),
      mode,
      initialUsage: {
        openrouter: initialOpenRouter.data.usage,
        mixedbread: initialMixedbread.data.usage,
        apollo: initialApollo.data,
        hunter: initialHunter.data,
        meta: initialMeta.data.usage
      }
    })

    console.log('[Search Job Start] Job created:', job.id)

    // Start processing asynchronously (don't await)
    processSearchJob(job.id, user.id).catch(error => {
      console.error(`[Search Job Start] Job ${job.id} failed:`, error)
    })

    const response = {
      jobId: job.id,
      status: 'pending',
      message: 'Search job started'
    }

    console.log('[Search Job Start] Sending response:', response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Search Job Start] Error starting search job:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Generate CSV of partial contacts that were discarded
 */
function generatePartialContactsCSV(count: number, audienceName: string): string {
  const missingFields = ['email', 'first_name', 'last_name', 'phone']
  const csvLines = [
    '# PARTIAL CONTACTS DISCARDED - Meta Ads requires email + first_name + last_name',
    `# Source Audience: ${audienceName}`,
    '# Format: email,first_name,last_name,phone,missing_fields',
    ''
  ]

  for (let i = 0; i < count; i++) {
    const numMissing = Math.floor(Math.random() * 2) + 1 // 1-2 missing fields
    const missing = shuffleArray([...missingFields]).slice(0, numMissing)

    const email = missing.includes('email') ? '' : `contact${i}@example.com`
    const firstName = missing.includes('first_name') ? '' : `FirstName${i}`
    const lastName = missing.includes('last_name') ? '' : `LastName${i}`
    const phone = missing.includes('phone') ? '' : `+39 ${Math.floor(Math.random() * 1000000000)}`

    csvLines.push(`${email},${firstName},${lastName},${phone},"${missing.join(',')}"`)
  }

  return csvLines.join('\n')
}

/**
 * Shuffle array randomly
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Process search job in background
 */
async function processSearchJob(jobId: string, userId: string) {
  const job = jobProcessor.getJob(jobId)
  if (!job) {
    throw new Error(`Job ${jobId} not found`)
  }

  // Create supabase client for this job
  const supabase = await createSupabaseServerClient()

  console.log(`[JobProcessor] Starting job ${jobId} for user ${userId}`)
  console.log(`[JobProcessor] Payload:`, job.payload)

  const updateProgress = (progress: number, event?: any) => {
    console.log(`[JobProcessor] Updating job ${jobId} progress to ${progress}%`)
    if (event) {
      console.log(`[JobProcessor] Event: ${event.event}`)
    }
    jobProcessor.updateJobProgress(jobId, progress, event)
  }

  try {
    // Start processing
    await jobProcessor.startJob(jobId, async (job, update) => {
      console.log(`[JobProcessor] Job ${jobId} started processing`)
      const { sourceAudiences, mode } = job.payload
      const totalAudiences = sourceAudiences.length
      let progress = 0

      console.log(`[JobProcessor] Processing ${totalAudiences} audiences in ${mode} mode`)

      // Initialize usage service for tracking
      const usageService = getAPIUsageStubService()

      // Initialize counters for final summary
      let grandTotalDraftContacts = 0
      let grandTotalCompleteContacts = 0
      let grandTotalPartialContacts = 0

      // Initialize timeline
      update(0, {
        timestamp: new Date().toISOString(),
        event: 'SEARCH_STARTED',
        details: {
          audiencesCount: totalAudiences,
          totalUrls: sourceAudiences.reduce((sum: number, sa: any) => sum + sa.urls.length, 0)
        }
      })

      // Check if demo mode
      if (mode === 'demo') {
        console.log(`[JobProcessor] Demo mode - simulating processing`)
        // Demo processing - simulate delays
        await new Promise(resolve => setTimeout(resolve, 2000))
        update(10)

        // Process each audience
        for (let i = 0; i < sourceAudiences.length; i++) {
          const audience: any = sourceAudiences[i]
          const audienceProgress = 10 + ((i + 1) / totalAudiences) * 80

          // Simulate fetching URLs
          update(audienceProgress - 5, {
            timestamp: new Date().toISOString(),
            event: 'AUDIENCE_PROCESSING_STARTED',
            details: {
              audienceName: audience.name,
              audienceId: audience.id,
              urlCount: audience.urls.length,
              platform: audience.type
            }
          })

          await new Promise(resolve => setTimeout(resolve, 1500))

          // Simulate LLM extraction for each URL
          let totalDraftContacts = 0
          for (let j = 0; j < audience.urls.length; j++) {
            await new Promise(resolve => setTimeout(resolve, 500))

            // Simulate realistic token usage for LLM extraction
            const promptTokens = 300 + Math.floor(Math.random() * 200)
            const completionTokens = 100 + Math.floor(Math.random() * 100)
            usageService.simulateOpenRouterCall(promptTokens, completionTokens)

            update(audienceProgress - 4 + (j / audience.urls.length) * 1, {
              timestamp: new Date().toISOString(),
              event: 'LLM_EXTRACTION_COMPLETED',
              details: {
                url: audience.urls[j],
                urlIndex: j + 1,
                provider: 'OpenRouter',
                model: 'anthropic/claude-3.5-sonnet',
                contactsExtracted: 3,
                tokensUsed: promptTokens + completionTokens
              }
            })

            totalDraftContacts += 3
          }

          // Simulate contact filtering and enrichment
          await new Promise(resolve => setTimeout(resolve, 700))

          // Generate some partial contacts to demonstrate filtering
          const completeContacts = Math.floor(totalDraftContacts * 0.75) // 75% complete
          const partialContacts = totalDraftContacts - completeContacts // 25% partial

          // Generate CSV of partial contacts that were discarded
          const discardedContactsCSV = generatePartialContactsCSV(partialContacts, audience.name)

          update(audienceProgress - 3, {
            timestamp: new Date().toISOString(),
            event: 'CONTACTS_FILTERED',
            details: {
              totalDraftContacts,
              completeContacts,
              partialContacts,
              partialContactsDiscarded: partialContacts,
              partialContactsCSV: discardedContactsCSV,
              reason: 'Meta Ads requires email + first_name + last_name triplet'
            }
          })

          // Simulate Hunter.io email finder for partial contacts
          const emailFoundCount = Math.floor(partialContacts * 0.6) // 60% of partials get email found
          await new Promise(resolve => setTimeout(resolve, 500))

          // Simulate email finder API calls
          usageService.simulateHunterFinderCall(partialContacts)

          update(audienceProgress - 2, {
            timestamp: new Date().toISOString(),
            event: 'EMAIL_FINDER_COMPLETED',
            details: {
              provider: 'Hunter.io',
              endpoint: '/v2/email-finder',
              contactsProcessed: partialContacts,
              emailsFound: emailFoundCount,
              successRate: '60%'
            }
          })

          // Simulate Apollo.io enrichment to recover missing names
          const namesFoundCount = Math.floor((partialContacts - emailFoundCount) * 0.7) // 70% of remaining get names
          const apolloContacts = partialContacts - emailFoundCount
          await new Promise(resolve => setTimeout(resolve, 600))

          // Simulate Apollo enrichment API calls
          usageService.simulateApolloEnrichment(apolloContacts)

          update(audienceProgress - 1, {
            timestamp: new Date().toISOString(),
            event: 'APOLLO_ENRICHMENT_COMPLETED',
            details: {
              provider: 'Apollo.io',
              endpoint: '/api/v1/people/match',
              contactsProcessed: apolloContacts,
              namesFound: namesFoundCount,
              fieldsEnriched: ['title', 'company', 'linkedin', 'phone', 'location']
            }
          })

          // Simulate Hunter.io email verification for all complete contacts
          const finalCompleteCount = completeContacts + emailFoundCount + namesFoundCount
          await new Promise(resolve => setTimeout(resolve, 500))

          // Simulate email verification API calls
          usageService.simulateHunterVerifierCall(finalCompleteCount)

          update(audienceProgress - 0.5, {
            timestamp: new Date().toISOString(),
            event: 'EMAIL_VERIFICATION_COMPLETED',
            details: {
              provider: 'Hunter.io',
              endpoint: '/v2/email-verifier',
              emailsVerified: finalCompleteCount,
              averageScore: 82,
              statusBreakdown: {
                valid: Math.floor(finalCompleteCount * 0.7),
                accept_all: Math.floor(finalCompleteCount * 0.2),
                unknown: Math.floor(finalCompleteCount * 0.1),
                invalid: 0
              }
            }
          })

          // Simulate embeddings
          await new Promise(resolve => setTimeout(resolve, 800))

          // Simulate Mixedbread embedding API calls (~50 tokens per contact)
          const embeddingTokens = finalCompleteCount * 50
          usageService.simulateMixedbreadCall(embeddingTokens)

          update(audienceProgress - 1.5, {
            timestamp: new Date().toISOString(),
            event: 'EMBEDDINGS_GENERATED',
            details: {
              provider: 'Mixedbread',
              model: 'mxbai-embed-large-v1',
              embeddingDimension: 1024,
              totalEmbeddings: audience.urls.length * 3,
              tokensUsed: embeddingTokens
            }
          })

          // Complete audience
          update(audienceProgress, {
            timestamp: new Date().toISOString(),
            event: 'AUDIENCE_PROCESSING_COMPLETED',
            details: {
              audienceName: audience.name,
              totalDraftContacts,
              completeContacts: finalCompleteCount,
              partialContactsDiscarded: partialContacts - emailFoundCount - namesFoundCount
            }
          })

          // Update grand totals
          grandTotalDraftContacts += totalDraftContacts
          grandTotalCompleteContacts += finalCompleteCount
          grandTotalPartialContacts += (partialContacts - emailFoundCount - namesFoundCount)
        }

        // Generate shared audiences for each source audience
        const generatedSharedAudiences = sourceAudiences.map((audience: any) => {
          const contactCount = audience.urls.length * 3
          const contacts = Array.from({ length: contactCount }, (_, i) => ({
            firstName: `FirstName${i + 1}`,
            lastName: `LastName${i + 1}`,
            email: `contact${i + 1}@example.com`,
            phone: `+12345678${((i + 1) % 100).toString().padStart(2, '0')}`,
            city: ['Milan', 'Rome', 'Turin', 'Florence', 'Naples'][Math.floor(Math.random() * 5)],
            country: 'Italy',
            interests: ['technology', 'business', 'marketing', 'design', 'startup'].slice(0, Math.floor(Math.random() * 3) + 1)
          }))

          return {
            id: crypto.randomUUID(),
            userId: '',
            sourceAudienceId: audience.id,
            sourceAudienceType: audience.type,
            name: audience.name,
            contacts,
            selected: true,
            uploadedToMeta: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })

        // Final completion
        update(100, {
          timestamp: new Date().toISOString(),
          event: 'SEARCH_COMPLETED',
          details: {
            totalDraftContacts: grandTotalDraftContacts,
            totalCompleteContacts: grandTotalCompleteContacts,
            totalPartialContacts: grandTotalPartialContacts,
            completionRate: `${Math.round((grandTotalCompleteContacts / grandTotalDraftContacts) * 100)}%`,
            sharedAudiencesCreated: generatedSharedAudiences.length,
            providers: {
              llm: 'OpenRouter',
              llmModel: 'anthropic/claude-3.5-sonnet',
              embeddings: 'Mixedbread',
              embeddingModel: 'mxbai-embed-large-v1',
              emailFinder: 'Hunter.io',
              emailFinderEndpoint: '/v2/email-finder',
              enrichment: 'Apollo.io',
              enrichmentEndpoint: '/api/v1/people/match',
              emailVerification: 'Hunter.io',
              emailVerificationEndpoint: '/v2/email-verifier'
            },
            sharedAudiences: generatedSharedAudiences
          }
        })

        // Calculate API costs
        const [finalOpenRouter, finalMixedbread, finalApollo, finalHunter, finalMeta] = await Promise.all([
          usageService.getOpenRouterUsage(),
          usageService.getMixedbreadUsage(),
          usageService.getApolloUsage(),
          usageService.getHunterUsage(),
          usageService.getMetaUsage()
        ])

        // Calculate costs by comparing initial and final usage
        const calculateCosts = (currentJob: any) => {
          const costs = []

          // OpenRouter cost (LLM extraction)
          if (currentJob.payload.initialUsage?.openrouter && finalOpenRouter.data.usage) {
            const initial = currentJob.payload.initialUsage.openrouter.total_tokens || 0
            const final = finalOpenRouter.data.usage.total_tokens || 0
            const tokensUsed = final - initial
            if (tokensUsed > 0) {
              const cost = tokensUsed * API_PRICING.openrouter.per_token
              costs.push({
                service: 'openrouter',
                operation: 'LLM Contact Extraction',
                cost,
                units: tokensUsed,
                unitType: 'tokens'
              })
            }
          }

          // Mixedbread cost (Embeddings)
          if (currentJob.payload.initialUsage?.mixedbread && finalMixedbread.data.usage) {
            const initial = currentJob.payload.initialUsage.mixedbread.total_tokens || 0
            const final = finalMixedbread.data.usage.total_tokens || 0
            const tokensUsed = final - initial
            if (tokensUsed > 0) {
              const cost = tokensUsed * API_PRICING.mixedbread.per_token
              costs.push({
                service: 'mixedbread',
                operation: 'Embeddings Generation',
                cost,
                units: tokensUsed,
                unitType: 'tokens'
              })
            }
          }

          // Apollo cost (Enrichment)
          if (currentJob.payload.initialUsage?.apollo && finalApollo.data) {
            const initial = currentJob.payload.initialUsage.apollo.credits_used_this_month || 0
            const final = finalApollo.data.credits_used_this_month || 0
            const creditsUsed = final - initial
            if (creditsUsed > 0) {
              const cost = creditsUsed * API_PRICING.apollo.per_enrichment
              costs.push({
                service: 'apollo',
                operation: 'Contact Enrichment',
                cost,
                units: creditsUsed,
                unitType: 'enrichments'
              })
            }
          }

          // Hunter cost (Email Finder + Verifier)
          if (currentJob.payload.initialUsage?.hunter && finalHunter.data) {
            const initialFinder = currentJob.payload.initialUsage.hunter.api_calls.email_finder.calls_used || 0
            const finalFinder = finalHunter.data.api_calls.email_finder.calls_used || 0
            const finderCalls = finalFinder - initialFinder
            if (finderCalls > 0) {
              const cost = finderCalls * API_PRICING.hunter.email_finder
              costs.push({
                service: 'hunter',
                operation: 'Email Finder',
                cost,
                units: finderCalls,
                unitType: 'calls'
              })
            }

            const initialVerifier = currentJob.payload.initialUsage.hunter.api_calls.email_verifier.calls_used || 0
            const finalVerifier = finalHunter.data.api_calls.email_verifier.calls_used || 0
            const verifierCalls = finalVerifier - initialVerifier
            if (verifierCalls > 0) {
              const cost = verifierCalls * API_PRICING.hunter.email_verifier
              costs.push({
                service: 'hunter',
                operation: 'Email Verification',
                cost,
                units: verifierCalls,
                unitType: 'calls'
              })
            }
          }

          // Meta is free
          costs.push({
            service: 'meta',
            operation: 'GraphAPI Calls',
            cost: 0,
            units: grandTotalDraftContacts * 3, // Estimated calls
            unitType: 'calls'
          })

          return costs
        }

        // Get current job for cost calculation
        const job = jobProcessor.getJob(jobId)

        const costBreakdown = calculateCosts(job)
        const totalCost = costBreakdown.reduce((sum, item) => sum + item.cost, 0)

        console.log('[JobProcessor] Cost breakdown:', costBreakdown)

        // Store costs in database for production mode
        if (mode === 'production') {
          console.log('[JobProcessor] Saving costs to database')
          for (const costItem of costBreakdown) {
            try {
              await supabase.from('cost_tracking').insert({
                user_id: userId,
                service: costItem.service,
                operation: costItem.operation,
                cost: costItem.cost,
              })
              console.log(`[JobProcessor] Saved cost: ${costItem.service} - ${costItem.operation} - $${costItem.cost.toFixed(4)}`)
            } catch (error) {
              console.error(`[JobProcessor] Error saving cost to database:`, error)
              // Continue with other costs even if one fails
            }
          }
          console.log('[JobProcessor] All costs saved to database')
        }

        // Store shared audiences in job result for frontend to access
        if (job) {
          job.result = {
            success: true,
            data: {
              sharedAudiences: generatedSharedAudiences,
              totalContacts: generatedSharedAudiences.reduce((sum: number, sa: any) => sum + sa.contacts.length, 0),
              costBreakdown,
              totalCost
            }
          }
        }

        // Reset usage counters for next job
        usageService.resetUsage()
      } else {
        // Production processing - call real APIs
        // TODO: Implement real OpenRouter and Mixedbread API calls
        // For now, simulate the same flow
        for (let i = 0; i < sourceAudiences.length; i++) {
          const audience: any = sourceAudiences[i]
          const audienceProgress = 10 + ((i + 1) / totalAudiences) * 80

          update(audienceProgress, {
            timestamp: new Date().toISOString(),
            event: 'AUDIENCE_PROCESSING_COMPLETED',
            details: {
              audienceName: audience.name,
              contactsFound: audience.urls.length * 3
            }
          })

          await new Promise(resolve => setTimeout(resolve, 2000))
        }

        update(100, {
          timestamp: new Date().toISOString(),
          event: 'SEARCH_COMPLETED',
          details: {
            totalContacts: sourceAudiences.reduce((sum: number, sa: any) => sum + sa.urls.length * 3, 0)
          }
        })
      }
    })

    // Job completed successfully
    console.log(`Job ${jobId} completed successfully`)
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error)
    throw error
  }
}
