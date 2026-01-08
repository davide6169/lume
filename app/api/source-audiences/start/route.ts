import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureProfileExists } from '@/lib/supabase/queries'
import { jobProcessor } from '@/lib/services/job-processor'
import { getAPIUsageStubService, API_PRICING } from '@/lib/services/api-usage-stub'
import { createApolloEnrichmentService } from '@/lib/services/apollo-enrichment'
import { ApolloEnrichmentStubService } from '@/lib/services/apollo-enrichment-stub'
import { createHunterIoService } from '@/lib/services/hunter-io'
import { createOpenRouterService } from '@/lib/services/openrouter'
import { createMixedbreadService } from '@/lib/services/mixedbread'
import { ApifyScraperService } from '@/lib/services/apify-scraper'
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
    const { sourceAudienceIds, mode = 'production', sourceAudiences: clientSourceAudiences, apiKeys: clientApiKeys, scrapingLimits } = body

    console.log('[Search Job Start] Parsed values:', {
      sourceAudienceIds,
      mode,
      clientSourceAudiences: clientSourceAudiences ? `Found ${clientSourceAudiences.length} audiences` : 'NOT FOUND',
      scrapingLimits: scrapingLimits ? `Facebook: ${scrapingLimits.facebook}, Instagram: ${scrapingLimits.instagram}` : 'NOT PROVIDED'
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
      initialApify
    ] = await Promise.all([
      usageService.getOpenRouterUsage(),
      usageService.getMixedbreadUsage(),
      usageService.getApolloUsage(),
      usageService.getHunterUsage(),
      usageService.getApifyUsage()
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
      apiKeys: clientApiKeys, // Pass API keys for production mode
      scrapingLimits, // Pass scraping limits for production mode
      initialUsage: {
        openrouter: initialOpenRouter.data.usage,
        mixedbread: initialMixedbread.data.usage,
        apollo: initialApollo.data,
        hunter: initialHunter.data,
        apify: initialApify.data.usage
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
 * Save log entry to database
 */
async function saveLogToDatabase(supabase: any, userId: string, level: string, message: string, metadata: any) {
  try {
    const { error } = await supabase
      .from('logs')
      .insert({
        user_id: userId,
        level,
        message,
        metadata
      })

    if (error) {
      console.error('[JobProcessor] Error saving log to database:', error)
    } else {
      console.log(`[JobProcessor] Log saved to database: [${level.toUpperCase()}] ${message}`)

      // Clean up old logs after saving a new one
      try {
        // Get user's profile to check if admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()

        // Only admins can clean up logs
        if (profile?.role === 'admin') {
          // Get user's settings to check retention days
          // Note: We can't access the settings store directly from server-side
          // So we'll use a default of 3 days for cleanup
          const retentionDays = 3 // Default, could be enhanced to fetch from user settings

          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

          const { data: deletedLogs, error: deleteError } = await supabase
            .from('logs')
            .delete()
            .lt('created_at', cutoffDate.toISOString())

          if (deleteError) {
            console.error('[JobProcessor] Error cleaning up old logs:', deleteError)
          } else {
            const deletedCount = Array.isArray(deletedLogs) ? deletedLogs.length : 0
            if (deletedCount > 0) {
              console.log(`[JobProcessor] Cleaned up ${deletedCount} old logs (older than ${retentionDays} days)`)
            }
          }
        }
      } catch (cleanupError) {
        // Don't fail the log save if cleanup fails
        console.error('[JobProcessor] Error during log cleanup:', cleanupError)
      }
    }
  } catch (error) {
    console.error('[JobProcessor] Exception saving log to database:', error)
  }
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

          // Simulate Apify web scraping for each URL
          let totalFetchedResults = 0
          for (let j = 0; j < audience.urls.length; j++) {
            await new Promise(resolve => setTimeout(resolve, 300))

            // Simulate Apify scraping results
            const resultsPerUrl = 20 + Math.floor(Math.random() * 30) // 20-50 results per URL
            usageService.simulateApifyCall(resultsPerUrl)
            totalFetchedResults += resultsPerUrl

            update(audienceProgress - 5 + (j / audience.urls.length) * 1, {
              timestamp: new Date().toISOString(),
              event: 'APIFY_FETCH_COMPLETED',
              details: {
                url: audience.urls[j],
                urlIndex: j + 1,
                provider: 'Apify',
                platform: audience.type === 'facebook' ? 'Facebook' : 'Instagram',
                resultsFetched: resultsPerUrl
              }
            })
          }

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
        const [finalOpenRouter, finalMixedbread, finalApollo, finalHunter, finalApify] = await Promise.all([
          usageService.getOpenRouterUsage(),
          usageService.getMixedbreadUsage(),
          usageService.getApolloUsage(),
          usageService.getHunterUsage(),
          usageService.getApifyUsage()
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

          // Apify cost (Facebook/Instagram scraping)
          if (currentJob.payload.initialUsage?.apify && finalApify.data) {
            const initialResults = currentJob.payload.initialUsage.apify.results_fetched || 0
            const finalResults = finalApify.data.usage.results_fetched || 0
            const resultsFetched = finalResults - initialResults
            if (resultsFetched > 0) {
              // Use average pricing (mix of Facebook and Instagram)
              // Instagram: $1.50/1000 results, Facebook: $5.00/100 results
              // Average: ~$0.003 per result for estimation
              const cost = resultsFetched * 0.003
              costs.push({
                service: 'apify',
                operation: 'Web Scraping',
                cost,
                units: resultsFetched,
                unitType: 'results'
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

        // Save job log to database (demo mode)
        const currentJob = jobProcessor.getJob(jobId)
        if (currentJob) {
          await saveLogToDatabase(
            supabase,
            userId,
            'info',
            `Search job completed - Found ${currentJob.result?.data?.totalContacts || 0} contacts from ${currentJob.result?.data?.sharedAudiences?.length || 0} audience(s)`,
            {
              jobId: currentJob.id,
              jobType: currentJob.type,
              status: currentJob.status,
              progress: currentJob.progress,
              timeline: currentJob.timeline,
              result: {
                totalContacts: currentJob.result?.data?.totalContacts,
                sharedAudiencesCreated: currentJob.result?.data?.sharedAudiences?.length || 0,
                totalCost: currentJob.result?.data?.totalCost
              }
            }
          )
        }
      } else {
        // Production processing - call real APIs
        console.log(`[JobProcessor] Production mode - starting real API processing`)

        const apiKeys = job.payload.apiKeys
        const scrapingLimits = job.payload.scrapingLimits || { facebook: 100, instagram: 100 }

        console.log('[JobProcessor] Using scraping limits:', scrapingLimits)

        // Initialize Apify production service if API key available
        if (apiKeys?.apify) {
          const apifyService = new ApifyScraperService(apiKeys.apify)
          console.log('[JobProcessor] Apify production service initialized')

          // Validate token
          update(10, {
            timestamp: new Date().toISOString(),
            event: 'APIFY_TOKEN_VALIDATION_STARTED',
            details: {
              provider: 'Apify',
              task: 'Validate API token'
            }
          })

          try {
            const tokenValidation = await apifyService.validateToken()

            if (tokenValidation.valid) {
              console.log('[JobProcessor] Apify token valid:', tokenValidation.appName)

              update(15, {
                timestamp: new Date().toISOString(),
                event: 'APIFY_TOKEN_VALIDATED',
                details: {
                  provider: 'Apify',
                  appName: tokenValidation.appName || 'Apify',
                  status: 'valid'
                }
              })
            } else {
              console.error('[JobProcessor] Apify token invalid:', tokenValidation.error)

              update(15, {
                timestamp: new Date().toISOString(),
                event: 'APIFY_TOKEN_INVALID',
                details: {
                  provider: 'Apify',
                  error: tokenValidation.error
                }
              })

              throw new Error(`Apify token validation failed: ${tokenValidation.error}`)
            }
          } catch (error) {
            console.error('[JobProcessor] Exception during Apify token validation:', error)
            throw error
          }

          // Initialize OpenRouter production service if API key available
          let openrouterService = null
          if (apiKeys?.openrouter) {
            openrouterService = createOpenRouterService(apiKeys.openrouter)
            console.log('[JobProcessor] OpenRouter production service initialized')
          }

          // Process each Source Audience
          let allFetchedComments: any[] = []

          for (let i = 0; i < sourceAudiences.length; i++) {
            const audience: any = sourceAudiences[i]
            const audienceProgress = 10 + ((i / sourceAudiences.length) * 40)

            console.log(`[JobProcessor] Processing audience: ${audience.name} (${audience.type})`)

            update(audienceProgress, {
              timestamp: new Date().toISOString(),
              event: 'AUDIENCE_PROCESSING_STARTED',
              details: {
                audienceName: audience.name,
                audienceId: audience.id,
                urlCount: audience.urls.length,
                platform: audience.type
              }
            })

            // Process each URL in the audience
            for (let j = 0; j < audience.urls.length; j++) {
              const url = audience.urls[j]
              const urlProgress = audienceProgress + ((j / audience.urls.length) * 5)

              console.log(`[JobProcessor] Processing URL ${j + 1}/${audience.urls.length}: ${url}`)

              try {
                // Parse URL to determine platform and type
                const parsedUrl = apifyService.parseUrl(url)
                console.log('[JobProcessor] Parsed URL:', { url, parsed: parsedUrl })

                update(urlProgress, {
                  timestamp: new Date().toISOString(),
                  event: 'APIFY_FETCH_STARTED',
                  details: {
                    provider: 'Apify',
                    platform: parsedUrl.platform,
                    url: url,
                    urlIndex: j + 1
                  }
                })

                // Fetch comments based on platform
                let comments: any[] = []
                if (parsedUrl.platform === 'facebook') {
                  comments = await apifyService.fetchFacebookComments(url, {
                    limit: scrapingLimits.facebook
                  })
                } else if (parsedUrl.platform === 'instagram') {
                  comments = await apifyService.fetchInstagramComments(url, {
                    limit: scrapingLimits.instagram
                  })
                }

                console.log(`[JobProcessor] Fetched ${comments.length} comments from ${url}`)
                allFetchedComments.push(...comments)

                update(urlProgress + 2, {
                  timestamp: new Date().toISOString(),
                  event: 'APIFY_FETCH_COMPLETED',
                  details: {
                    provider: 'Apify',
                    platform: parsedUrl.platform,
                    url: url,
                    commentsFetched: comments.length,
                    totalComments: allFetchedComments.length
                  }
                })
              } catch (error) {
                console.error(`[JobProcessor] Failed to fetch from ${url}:`, error)
                update(urlProgress, {
                  timestamp: new Date().toISOString(),
                  event: 'APIFY_FETCH_FAILED',
                  details: {
                    provider: 'Apify',
                    url: url,
                    error: error instanceof Error ? error.message : 'Unknown error'
                  }
                })
              }
            }

            update(audienceProgress + 5, {
              timestamp: new Date().toISOString(),
              event: 'AUDIENCE_PROCESSING_COMPLETED',
              details: {
                audienceName: audience.name,
                totalCommentsFetched: allFetchedComments.length
              }
            })
          }

          console.log(`[JobProcessor] Total comments fetched: ${allFetchedComments.length}`)

          // Validate that we successfully fetched comments
          if (allFetchedComments.length === 0) {
            console.error('[JobProcessor] No comments fetched from any URL in production mode')
            throw new Error('No comments were fetched from the Source Audience URLs. Please verify:\n' +
              '1. The URLs are correct and publicly accessible\n' +
              '2. The posts have comments (not all posts do)\n' +
              '3. The accounts are public (not private)\n' +
              'Try with a more active account like https://www.instagram.com/garyvee')
          }

          // Extract contacts from comments using LLM
          if (!openrouterService) {
            console.error('[JobProcessor] No OpenRouter API key provided for LLM extraction')
            throw new Error('OpenRouter API key is required for production mode. Please configure it in Settings.')
          }

          console.log('[JobProcessor] Starting LLM extraction from comments')

          update(55, {
              timestamp: new Date().toISOString(),
              event: 'LLM_EXTRACTION_STARTED',
              details: {
                provider: 'OpenRouter',
                model: 'mistralai/mistral-7b-instruct:free',
                commentsCount: allFetchedComments.length
              }
            })

            // Prepare comments text for LLM
            const commentsText = allFetchedComments
              .slice(0, 100) // Limit to 100 comments for LLM
              .map((c: any, idx: number) => {
                const text = c.text || c.message || ''
                const author = c.from?.name || c.ownerUsername || c.username || `User${idx}`
                return `${author}: ${text}`
              })
              .join('\n\n')

            const extractionPrompt = `Extract contact information from these social media comments. Look for:
- Email addresses
- Phone numbers
- Names
- Companies mentioned
- Locations

Comments:
${commentsText}

Return a JSON array of contacts with this exact structure:
[
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "city": "Milan",
    "country": "Italy",
    "interests": ["tech", "marketing"]
  }
]

Only include contacts that have at least an email OR phone number. Return ONLY the JSON array, no other text.`

            try {
              const llmResult = await openrouterService.chatCompletion({
                model: 'mistralai/mistral-7b-instruct:free',
                messages: [
                  {
                    role: 'system',
                    content: 'You are a data extraction expert. Extract contact information from social media comments and return ONLY valid JSON arrays.'
                  },
                  {
                    role: 'user',
                    content: extractionPrompt
                  }
                ]
              })

              console.log('[JobProcessor] LLM extraction completed')

              update(65, {
                timestamp: new Date().toISOString(),
                event: 'LLM_EXTRACTION_COMPLETED',
                details: {
                  provider: 'OpenRouter',
                  model: 'mistralai/mistral-7b-instruct:free',
                  contactsExtracted: llmResult.choices[0].message.content
                }
              })
            } catch (error) {
              console.error('[JobProcessor] LLM extraction failed:', error)
              update(65, {
                timestamp: new Date().toISOString(),
                event: 'LLM_EXTRACTION_FAILED',
                details: {
                  provider: 'OpenRouter',
                  error: error instanceof Error ? error.message : 'Unknown error'
                }
              })
            }
          }
        } else {
          console.log('[JobProcessor] No Apify API key provided, skipping Apify integration')
          throw new Error('Apify API key is required for production mode. Please configure it in Settings.')
        }

        // Continue with other services...
        // Note: extractedContacts will be populated from the LLM extraction above

        // Initialize Apollo production service if API key available
        let apolloService = null
        if (apiKeys?.apollo) {
          apolloService = createApolloEnrichmentService(apiKeys.apollo)
          console.log('[JobProcessor] Apollo production service initialized')
        }

        // Track enrichment stats
        let totalContactsEnriched = 0
        let successfulEnrichments = 0
        let failedEnrichments = 0

        // Store contacts that will be enriched and saved to database
        let finalContacts: any[] = []

        // Enrich extracted contacts using Apollo if available (optional step)
        if (apolloService && extractedContacts.length > 0) {
          console.log(`[JobProcessor] Enriching ${extractedContacts.length} extracted contacts with Apollo`)

          update(85, {
            timestamp: new Date().toISOString(),
            event: 'APOLLO_ENRICHMENT_STARTED',
            details: {
              provider: 'Apollo.io',
              totalContacts: extractedContacts.length
            }
          })

          for (let i = 0; i < extractedContacts.length; i++) {
            const contact = extractedContacts[i]

            try {
              const enrichmentRequest = apolloService.contactToEnrichmentRequest(contact)
              const result = await apolloService.enrichPerson(enrichmentRequest)

              if (result.error) {
                console.error(`[JobProcessor] Apollo enrichment failed for ${contact.email}:`, result.error)
                failedEnrichments++
                // Keep original contact even if enrichment fails
                finalContacts.push(contact)
              } else if (result.person) {
                console.log(`[JobProcessor] Apollo enrichment successful for ${contact.email}`)
                // Merge original contact with enriched data
                const enrichedContact = {
                  ...contact,
                  title: result.person.title,
                  company: result.person.employment_history?.[0]?.organization_name,
                  linkedin_url: result.person.linkedin_url,
                  phone: result.person.contact?.phone_numbers?.[0]?.number || contact.phone
                }
                finalContacts.push(enrichedContact)
                successfulEnrichments++
                totalContactsEnriched++
              }
            } catch (error) {
              console.error(`[JobProcessor] Exception during Apollo enrichment for ${contact.email}:`, error)
              failedEnrichments++
              // Keep original contact even if enrichment fails
              finalContacts.push(contact)
            }
          }

          console.log(`[JobProcessor] Apollo enrichment completed: ${successfulEnrichments} successful, ${failedEnrichments} failed`)
        } else {
          // No Apollo API key, use extracted contacts as-is
          console.log('[JobProcessor] No Apollo API key, using extracted contacts without enrichment')
          finalContacts = extractedContacts
        }

        // Final completion
        update(100, {
          timestamp: new Date().toISOString(),
          event: 'SEARCH_COMPLETED',
          details: {
            totalContactsProcessed: totalContactsEnriched,
            successfulEnrichments,
            failedEnrichments,
            successRate: successfulEnrichments > 0 ? `${Math.round((successfulEnrichments / (successfulEnrichments + failedEnrichments)) * 100)}%` : '0%',
            providers: {
              enrichment: 'Apollo.io',
              enrichmentEndpoint: '/api/v1/people/match',
              mode: 'production'
            }
          }
        })

        console.log(`[JobProcessor] Production processing completed: ${successfulEnrichments} successful, ${failedEnrichments} failed`)

        // Initialize Hunter.io production service if API key available
        if (apiKeys?.hunter) {
          const hunterService = createHunterIoService(apiKeys.hunter)
          console.log('[JobProcessor] Hunter.io production service initialized')

          // Demonstrate email verification with a sample contact
          const sampleEmail = 'mario.rossi@example.com'

          update(50, {
            timestamp: new Date().toISOString(),
            event: 'EMAIL_VERIFICATION_STARTED',
            details: {
              provider: 'Hunter.io',
              endpoint: '/v2/email-verifier',
              email: sampleEmail
            }
          })

          try {
            const verificationResult = await hunterService.verifyEmail({ email: sampleEmail })

            if (verificationResult.errors && verificationResult.errors.length > 0) {
              console.error('[JobProcessor] Hunter.io verification error:', verificationResult.errors)
              update(55, {
                timestamp: new Date().toISOString(),
                event: 'EMAIL_VERIFICATION_FAILED',
                details: {
                  provider: 'Hunter.io',
                  email: sampleEmail,
                  error: verificationResult.errors[0].details
                }
              })
            } else {
              console.log('[JobProcessor] Hunter.io verification successful:', verificationResult.data)
              update(55, {
                timestamp: new Date().toISOString(),
                event: 'EMAIL_VERIFICATION_COMPLETED',
                details: {
                  provider: 'Hunter.io',
                  endpoint: '/v2/email-verifier',
                  email: sampleEmail,
                  status: verificationResult.data.status,
                  score: verificationResult.data.score,
                  result: {
                    isValid: verificationResult.data.status === 'valid' || verificationResult.data.status === 'accept_all',
                    score: verificationResult.data.score,
                    webmail: verificationResult.data.webmail,
                    disposable: verificationResult.data.disposable,
                    sourcesCount: verificationResult.data.sources?.length || 0
                  }
                }
              })
            }
          } catch (error) {
            console.error('[JobProcessor] Exception during Hunter.io verification:', error)
          }

          // Demonstrate email finder with a sample contact
          const sampleContact = {
            first_name: 'Giulia',
            last_name: 'Bianchi',
            domain: 'techcompany.it'
          }

          update(60, {
            timestamp: new Date().toISOString(),
            event: 'EMAIL_FINDER_STARTED',
            details: {
              provider: 'Hunter.io',
              endpoint: '/v2/email-finder',
              contact: `${sampleContact.first_name} ${sampleContact.last_name} @ ${sampleContact.domain}`
            }
          })

          try {
            const finderResult = await hunterService.findEmail(sampleContact)

            if (finderResult && finderResult.data) {
              console.log('[JobProcessor] Hunter.io email found:', finderResult.data.email)
              update(65, {
                timestamp: new Date().toISOString(),
                event: 'EMAIL_FINDER_COMPLETED',
                details: {
                  provider: 'Hunter.io',
                  endpoint: '/v2/email-finder',
                  emailFound: finderResult.data.email,
                  score: finderResult.data.score,
                  status: finderResult.data.status,
                  sourcesCount: finderResult.data.sources?.length || 0
                }
              })
            } else {
              console.log('[JobProcessor] Hunter.io email not found')
              update(65, {
                timestamp: new Date().toISOString(),
                event: 'EMAIL_FINDER_NOT_FOUND',
                details: {
                  provider: 'Hunter.io',
                  contact: `${sampleContact.first_name} ${sampleContact.last_name} @ ${sampleContact.domain}`,
                  message: 'Email address not found in database'
                }
              })
            }
          } catch (error) {
            console.error('[JobProcessor] Exception during Hunter.io email finder:', error)
          }

          // Get account info to show remaining credits
          try {
            const accountInfo = await hunterService.getAccountInfo()
            if (accountInfo.calls) {
              console.log('[JobProcessor] Hunter.io account info:', accountInfo.calls)
              update(70, {
                timestamp: new Date().toISOString(),
                event: 'HUNTER_ACCOUNT_INFO',
                details: {
                  provider: 'Hunter.io',
                  credits: {
                    available: accountInfo.calls.available,
                    used: accountInfo.calls.used,
                    total: accountInfo.calls.total,
                    resetDate: accountInfo.calls.reset_date
                  }
                }
              })
            }
          } catch (error) {
            console.error('[JobProcessor] Exception getting Hunter.io account info:', error)
          }
        } else {
          console.log('[JobProcessor] No Hunter.io API key provided, skipping Hunter.io integration')
        }

        // Initialize OpenRouter production service if API key available
        if (apiKeys?.openrouter) {
          const openrouterService = createOpenRouterService(apiKeys.openrouter)
          console.log('[JobProcessor] OpenRouter production service initialized')

          // Demonstrate LLM contact extraction
          const samplePost = `Check out our amazing team!

Mario Rossi - CEO at TechCorp
Email: mario.rossi@techcorp.com
Phone: +39 333 1234567

Giulia Bianchi - Marketing Director
Email: giulia.bianchi@techcorp.com

Luca Verdi - Senior Developer
Email: luca.verdi@techcorp.com`

          update(75, {
            timestamp: new Date().toISOString(),
            event: 'LLM_EXTRACTION_STARTED',
            details: {
              provider: 'OpenRouter',
              model: 'mistralai/mistral-7b-instruct:free',
              task: 'Contact extraction from social media post'
            }
          })

          try {
            const extractedContacts = await openrouterService.extractContacts(
              samplePost,
              'mistralai/mistral-7b-instruct:free'
            )

            console.log('[JobProcessor] OpenRouter extraction successful:', extractedContacts.length, 'contacts')

            update(80, {
              timestamp: new Date().toISOString(),
              event: 'LLM_EXTRACTION_COMPLETED',
              details: {
                provider: 'OpenRouter',
                model: 'mistralai/mistral-7b-instruct:free',
                contactsExtracted: extractedContacts.length,
                contacts: extractedContacts.slice(0, 3), // Show first 3
                sampleContact: extractedContacts[0] || null
              }
            })
          } catch (error) {
            console.error('[JobProcessor] Exception during OpenRouter extraction:', error)
            update(80, {
              timestamp: new Date().toISOString(),
              event: 'LLM_EXTRACTION_FAILED',
              details: {
                provider: 'OpenRouter',
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            })
          }
        } else {
          console.log('[JobProcessor] No OpenRouter API key provided, skipping OpenRouter integration')
        }

        // Initialize Mixedbread production service if API key available
        if (apiKeys?.mixedbread) {
          const mixedbreadService = createMixedbreadService(apiKeys.mixedbread)
          console.log('[JobProcessor] Mixedbread production service initialized')

          // Demonstrate embedding generation for contacts
          const sampleContacts = [
            { firstName: 'Mario', lastName: 'Rossi', email: 'mario.rossi@example.com', company: 'TechCorp' },
            { firstName: 'Giulia', lastName: 'Bianchi', email: 'giulia.bianchi@example.com', company: 'TechCorp' },
          ]

          update(85, {
            timestamp: new Date().toISOString(),
            event: 'EMBEDDINGS_STARTED',
            details: {
              provider: 'Mixedbread',
              model: 'mixedbread-ai/mxbai-embed-large-v1',
              contactsToEmbed: sampleContacts.length
            }
          })

          try {
            // Generate embeddings for each contact
            const embeddings: Array<{ contact: any; embedding: number[] }> = []

            for (const contact of sampleContacts) {
              const embedding = await mixedbreadService.embedContact(contact)
              embeddings.push({ contact, embedding })
              console.log('[JobProcessor] Generated embedding for:', contact.firstName, contact.lastName)
            }

            // Calculate similarity between contacts
            if (embeddings.length >= 2) {
              const similarity = mixedbreadService.cosineSimilarity(
                embeddings[0].embedding,
                embeddings[1].embedding
              )

              console.log('[JobProcessor] Similarity calculated:', similarity)

              update(90, {
                timestamp: new Date().toISOString(),
                event: 'EMBEDDINGS_COMPLETED',
                details: {
                  provider: 'Mixedbread',
                  model: 'mixedbread-ai/mxbai-embed-large-v1',
                  embeddingDimensions: embeddings[0]?.embedding.length || 0,
                  embeddingsGenerated: embeddings.length,
                  sampleSimilarity: {
                    contact1: `${embeddings[0].contact.firstName} ${embeddings[0].contact.lastName}`,
                    contact2: `${embeddings[1].contact.firstName} ${embeddings[1].contact.lastName}`,
                    score: similarity
                  }
                }
              })
            } else {
              update(90, {
                timestamp: new Date().toISOString(),
                event: 'EMBEDDINGS_COMPLETED',
                details: {
                  provider: 'Mixedbread',
                  embeddingsGenerated: embeddings.length,
                  embeddingDimensions: embeddings[0]?.embedding.length || 0
                }
              })
            }
          } catch (error) {
            console.error('[JobProcessor] Exception during Mixedbread embeddings:', error)
            update(90, {
              timestamp: new Date().toISOString(),
              event: 'EMBEDDINGS_FAILED',
              details: {
                provider: 'Mixedbread',
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            })
          }
        } else {
          console.log('[JobProcessor] No Mixedbread API key provided, skipping Mixedbread integration')
        }

        // Save job log to database (production mode)
        const currentJob = jobProcessor.getJob(jobId)
        if (currentJob) {
          await saveLogToDatabase(
            supabase,
            userId,
            'info',
            `Search job completed - Production mode`,
            {
              jobId: currentJob.id,
              jobType: currentJob.type,
              status: currentJob.status,
              progress: currentJob.progress,
              timeline: currentJob.timeline
            }
          )
        }
      }
    })

    // Job completed successfully
    console.log(`Job ${jobId} completed successfully`)
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error)

    // Save error log to database
    const failedJob = jobProcessor.getJob(jobId)
    const supabase = await createSupabaseServerClient()
    await saveLogToDatabase(
      supabase,
      userId,
      'error',
      `Search job failed - ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        jobId,
        jobType: 'SEARCH',
        error: error instanceof Error ? error.message : 'Unknown error',
        timeline: failedJob?.timeline || []
      }
    )

    throw error
  }
}
