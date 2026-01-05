import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureProfileExists } from '@/lib/supabase/queries'
import { NextResponse } from 'next/server'
import { getTestScenario } from '@/lib/services/api-test-definitions'

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
    const { serviceKey, scenarioId, apiKey, isDemoMode: clientDemoMode } = body

    if (!serviceKey || !scenarioId) {
      return NextResponse.json({ error: 'Missing serviceKey or scenarioId' }, { status: 400 })
    }

    const scenario = getTestScenario(serviceKey, scenarioId)
    if (!scenario) {
      return NextResponse.json({ error: 'Invalid test scenario' }, { status: 400 })
    }

    // Use demo mode from client if provided, otherwise check database
    let isDemoMode = clientDemoMode

    if (isDemoMode === undefined || isDemoMode === null) {
      // Fallback to database check
      const { data: settings } = await supabase
        .from('user_settings')
        .select('demo_mode')
        .eq('user_id', user.id)
        .single()

      isDemoMode = settings?.demo_mode ?? true
    }

    console.log(`[API Test] Service: ${serviceKey}, Scenario: ${scenarioId}, Demo Mode: ${isDemoMode}`)

    let testResult: any

    if (isDemoMode) {
      // Demo mode: simulate successful test
      await new Promise(resolve => setTimeout(resolve, 1000))

      testResult = {
        success: true,
        simulated: true,
        scenario: {
          id: scenario.id,
          name: scenario.name,
          description: scenario.description,
        },
        request: {
          endpoint: scenario.endpoint,
          method: scenario.method,
          headers: scenario.headers,
          body: scenario.body,
        },
        response: {
          status: 200,
          data: {
            message: 'Demo mode - simulated successful response',
            timestamp: new Date().toISOString(),
          },
        },
        outcome: 'PASS',
        details: 'Test simulated successfully in demo mode',
      }

      console.log('[API Test] Demo mode test completed:', testResult)
    } else {
      // Production mode: actual API call
      if (!apiKey) {
        return NextResponse.json({ error: 'API key is required in production mode' }, { status: 400 })
      }

      const requestId = crypto.randomUUID()
      const startTime = Date.now()

      try {
        // Prepare request options
        const url = new URL(scenario.endpoint)
        const options: RequestInit = {
          method: scenario.method,
          headers: {
            ...scenario.headers,
          },
        }

        // Add authentication headers based on service
        if (serviceKey === 'apollo') {
          // Apollo uses X-Api-Key header
          options.headers = {
            ...options.headers,
            'X-Api-Key': apiKey,
          }
        } else {
          // Other services use Authorization Bearer
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${apiKey}`,
          }
        }

        // Add query parameters from scenario
        if (scenario.queryParams) {
          Object.entries(scenario.queryParams).forEach(([key, value]) => {
            url.searchParams.set(key, value)
          })
        }

        // Add body if present
        if (scenario.body) {
          options.body = JSON.stringify(scenario.body)
        }

        // Add API key as query parameter for Hunter.io and Meta
        if (serviceKey === 'hunter') {
          url.searchParams.set('api_key', apiKey)
        } else if (serviceKey === 'meta') {
          url.searchParams.set('access_token', apiKey)
        }

        console.log(`[API Test] Request ${requestId}:`, {
          endpoint: url.toString(),
          method: scenario.method,
          scenario: scenario.name,
        })

        // Make the actual API call
        const response = await fetch(url.toString(), options)
        const responseTime = Date.now() - startTime

        let responseData: any
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json()
        } else {
          responseData = await response.text()
        }

        // Validate outcome
        const statusCode = response.status
        const expectedStatusCodes = scenario.expectedOutcome.statusCodes || [200]
        const statusMatch = expectedStatusCodes.includes(statusCode)

        let containsMatch = true
        let notContainsMatch = true

        if (statusMatch && typeof responseData === 'object') {
          const responseText = JSON.stringify(responseData)

          if (scenario.expectedOutcome.contains) {
            containsMatch = scenario.expectedOutcome.contains.some((term) =>
              responseText.includes(term)
            )
          }

          if (scenario.expectedOutcome.notContains) {
            notContainsMatch = !scenario.expectedOutcome.notContains.some((term) =>
              responseText.includes(term)
            )
          }
        }

        const outcome = statusMatch && containsMatch && notContainsMatch ? 'PASS' : 'FAIL'

        // Special handling for Apollo API_INACCESSIBLE error
        let details = outcome === 'PASS'
          ? 'All validation checks passed'
          : `Validation failed: ${!statusMatch ? `Status ${statusCode} not in expected range` : ''}${
              !containsMatch ? ' - Missing expected content' : ''
            }${!notContainsMatch ? ' - Found unexpected content' : ''}`

        // Check for Apollo API_INACCESSIBLE error
        if (serviceKey === 'apollo' && responseData?.error_code === 'API_INACCESSIBLE') {
          details = '⚠️ Apollo.io People Enrichment API requires a paid plan. Free plans cannot access this endpoint. Please upgrade your plan at https://app.apollo.io/ to use Apollo enrichment features.'
        }

        testResult = {
          success: outcome === 'PASS',
          simulated: false,
          scenario: {
            id: scenario.id,
            name: scenario.name,
            description: scenario.description,
          },
          request: {
            endpoint: url.toString(),
            method: scenario.method,
            headers: scenario.headers,
            body: scenario.body,
          },
          response: {
            status: statusCode,
            data: responseData,
            responseTime,
          },
          outcome,
          details,
        }

        console.log(`[API Test] Request ${requestId} completed:`, testResult)
      } catch (error) {
        const responseTime = Date.now() - startTime

        testResult = {
          success: false,
          simulated: false,
          scenario: {
            id: scenario.id,
            name: scenario.name,
            description: scenario.description,
          },
          request: {
            endpoint: scenario.endpoint,
            method: scenario.method,
            headers: scenario.headers,
            body: scenario.body,
          },
          response: {
            error: error instanceof Error ? error.message : 'Unknown error',
            responseTime,
          },
          outcome: 'FAIL',
          details: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }

        console.error(`[API Test] Request ${requestId} failed:`, error)
      }
    }

    // Create log entry
    const logEntry = {
      user_id: user.id,
      level: testResult.success ? 'info' : 'error',
      message: `API Test ${testResult.outcome} - ${testResult.scenario.name} (${serviceKey})`,
      created_at: new Date().toISOString(), // Add explicit timestamp
      metadata: {
        testType: 'api_test',
        service: serviceKey,
        scenario: testResult.scenario,
        request: testResult.request,
        response: testResult.response,
        outcome: testResult.outcome,
        details: testResult.details,
        isDemoMode,
        timestamp: new Date().toISOString(),
      },
    }

    // Save log to database
    await supabase.from('logs').insert(logEntry)

    return NextResponse.json(testResult)
  } catch (error) {
    console.error('[API Test] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
