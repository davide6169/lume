// ============================================
// Hunter.io API - Production Service
// Real API calls to Hunter.io for email verification and finding
// ============================================

interface HunterEmailVerifierRequest {
  email: string
}

interface HunterEmailVerifierResponse {
  data: {
    email: string
    status: 'valid' | 'invalid' | 'accept_all' | 'unknown'
    score: number
    regexp: boolean
    gibberish: boolean
    disposable: boolean
    webmail: boolean
    mx_records: boolean
    smtp_server: boolean
    smtp_check: boolean
    accept_all: boolean
    free_provider: boolean
    sources?: Array<{
      domain: string
      uri: string
      extracted_on: string
      last_seen: string
      still_online: boolean
    }>
  }
  meta: {
    params: {
      email: string
    }
  }
  errors?: Array<{
    code: number
    details: string
  }>
}

interface HunterEmailFinderRequest {
  first_name: string
  last_name: string
  domain: string
}

interface HunterEmailFinderResponse {
  data: {
    email: string
    score: number
    domain: string
    status: 'valid' | 'invalid' | 'accept_all' | 'unknown'
    sources?: Array<{
      domain: string
      uri: string
      extracted_on: string
      last_seen: string
      still_online: boolean
    }>
  }
  meta: {
    params: {
      first_name: string
      last_name: string
      domain: string
    }
  }
  errors?: Array<{
    code: number
    details: string
  }>
}

/**
 * Production service for Hunter.io API
 *
 * Endpoints:
 * - Email Verifier: GET https://api.hunter.io/v2/email-verifier
 * - Email Finder: GET https://api.hunter.io/v2/email-finder
 *
 * Documentation: https://hunter.io/api-documentation/v2
 *
 * Required parameters:
 * - api_key: Your Hunter API key
 *
 * Costs:
 * - Email Verifier: 1 request per email
 * - Email Finder: 1 request per search
 * - Free tier: 1,000 requests/month
 * - Growth tier: 10,000 requests/month ($49/month)
 */
export class HunterIoService {
  private readonly baseUrl = 'https://api.hunter.io/v2'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  // ============================================
  // Email Verifier
  // ============================================

  /**
   * Verify a single email address
   *
   * GET https://api.hunter.io/v2/email-verifier?email={email}&api_key={key}
   *
   * Query parameters:
   * - email: Email address to verify
   *
   * @param request - Email verification request
   * @returns Email verification result
   */
  async verifyEmail(request: HunterEmailVerifierRequest): Promise<HunterEmailVerifierResponse> {
    try {
      const url = new URL(`${this.baseUrl}/email-verifier`)
      url.searchParams.set('email', request.email)
      url.searchParams.set('api_key', this.apiKey)

      console.log('[Hunter] Calling email verifier for:', request.email)

      const response = await fetch(url.toString(), {
        method: 'GET',
      })

      const data: HunterEmailVerifierResponse = await response.json()

      if (!response.ok) {
        console.error('[Hunter] Email verifier API error:', {
          status: response.status,
          errors: data.errors
        })
        return {
          ...data,
          errors: data.errors || [{
            code: response.status,
            details: `HTTP ${response.status}: ${response.statusText}`
          }]
        }
      }

      console.log('[Hunter] Email verification completed:', request.email, '→', data.data.status)

      return data
    } catch (error) {
      console.error('[Hunter] Email verifier request failed:', error)
      return {
        data: {
          email: request.email,
          status: 'unknown',
          score: 0,
          regexp: false,
          gibberish: false,
          disposable: false,
          webmail: false,
          mx_records: false,
          smtp_server: false,
          smtp_check: false,
          accept_all: false,
          free_provider: false,
        },
        meta: {
          params: { email: request.email }
        },
        errors: [{
          code: 0,
          details: error instanceof Error ? error.message : 'Unknown error'
        }]
      }
    }
  }

  /**
   * Bulk verify multiple emails (up to 20)
   *
   * Note: Hunter.io doesn't have a true bulk endpoint, so we make parallel requests
   *
   * @param emails - Array of email addresses to verify
   * @returns Array of verification results
   */
  async verifyEmailsBulk(emails: string[]): Promise<HunterEmailVerifierResponse[]> {
    if (emails.length === 0) {
      return []
    }

    // Hunter allows up to 20 emails per request
    const emailsToVerify = emails.slice(0, 20)

    console.log(`[Hunter] Bulk verifying ${emailsToVerify.length} emails`)

    // Make parallel requests for efficiency
    const results = await Promise.all(
      emailsToVerify.map(email => this.verifyEmail({ email }))
    )

    return results
  }

  // ============================================
  // Email Finder
  // ============================================

  /**
   * Find email address from name and domain
   *
   * GET https://api.hunter.io/v2/email-finder?domain={domain}&first_name={first_name}&last_name={last_name}&api_key={key}
   *
   * Query parameters:
   * - domain: Company domain
   * - first_name: Person's first name
   * - last_name: Person's last name
   *
   * @param request - Email finder request
   * @returns Found email address or null if not found
   */
  async findEmail(request: HunterEmailFinderRequest): Promise<HunterEmailFinderResponse | null> {
    try {
      const url = new URL(`${this.baseUrl}/email-finder`)
      url.searchParams.set('domain', request.domain)
      url.searchParams.set('first_name', request.first_name)
      url.searchParams.set('last_name', request.last_name)
      url.searchParams.set('api_key', this.apiKey)

      console.log('[Hunter] Calling email finder for:', `${request.first_name} ${request.last_name} @ ${request.domain}`)

      const response = await fetch(url.toString(), {
        method: 'GET',
      })

      const data: HunterEmailFinderResponse = await response.json()

      if (!response.ok) {
        console.error('[Hunter] Email finder API error:', {
          status: response.status,
          errors: data.errors
        })
        return null
      }

      // Hunter returns 404 when email not found
      if (response.status === 404 || data.errors?.some(e => e.code === 404)) {
        console.log('[Hunter] Email not found for:', `${request.first_name} ${request.last_name} @ ${request.domain}`)
        return null
      }

      console.log('[Hunter] Email found:', data.data.email)

      return data
    } catch (error) {
      console.error('[Hunter] Email finder request failed:', error)
      return null
    }
  }

  /**
   * Bulk find emails (up to 10)
   *
   * Note: Hunter.io doesn't have a true bulk endpoint, so we make parallel requests
   *
   * @param requests - Array of email finder requests
   * @returns Array of found emails or null for each request
   */
  async findEmailsBulk(requests: HunterEmailFinderRequest[]): Promise<Array<HunterEmailFinderResponse | null>> {
    if (requests.length === 0) {
      return []
    }

    // Limit to 10 concurrent requests
    const requestsToProcess = requests.slice(0, 10)

    console.log(`[Hunter] Bulk finding emails for ${requestsToProcess.length} people`)

    // Make parallel requests for efficiency
    const results = await Promise.all(
      requestsToProcess.map(request => this.findEmail(request))
    )

    return results
  }

  // ============================================
  // Utilities
  // ============================================

  /**
   * Check if the API key is valid by making a test call
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const result = await this.verifyEmail({ email: 'test@hunter.io' })

      // If we get a response (even if email is invalid), API key is valid
      // An invalid API key would return 401
      return !result.errors?.some(e => e.code === 401)
    } catch (error) {
      console.error('[Hunter] API key validation failed:', error)
      return false
    }
  }

  /**
   * Get remaining API credits for the current month
   *
   * GET https://api.hunter.io/v2/account?api_key={key}
   */
  async getAccountInfo(): Promise<{
    calls: {
      available: number
      used: number
      total: number
      reset_date: string
    } | null
  }> {
    try {
      const url = new URL(`${this.baseUrl}/account`)
      url.searchParams.set('api_key', this.apiKey)

      const response = await fetch(url.toString(), {
        method: 'GET',
      })

      if (!response.ok) {
        console.error('[Hunter] Account info API error:', response.status)
        return { calls: null }
      }

      const data = await response.json()

      return {
        calls: {
          available: data.data.calls?.available || 0,
          used: data.data.calls?.used || 0,
          total: data.data.calls?.total || 0,
          reset_date: data.data.calls?.reset_date || ''
        }
      }
    } catch (error) {
      console.error('[Hunter] Account info request failed:', error)
      return { calls: null }
    }
  }
}

/**
 * Factory function to create Hunter.io service
 */
export function createHunterIoService(apiKey: string): HunterIoService {
  return new HunterIoService(apiKey)
}
