// ============================================
// Apollo.io Enrichment API - Production Service
// Real API calls to Apollo.io for contact enrichment
// ============================================

import type { Contact } from '@/types'

interface ApolloEnrichmentRequest {
  email?: string
  first_name?: string
  last_name?: string
  name?: string
  domain?: string
  linkedin_url?: string
  title?: string
  organization_id?: string
  reveal_personal_emails?: boolean
  reveal_phone_number?: boolean
}

interface ApolloPerson {
  id: string
  first_name: string
  last_name: string
  name: string
  linkedin_url?: string
  title?: string
  email_status?: string | null
  photo_url?: string
  twitter_url?: string | null
  github_url?: string | null
  facebook_url?: string | null
  headline?: string
  email?: string
  organization_id?: string
  employment_history?: Array<{
    _id: string
    current: boolean
    organization_name: string
    title: string
    start_date?: string
  }>
  state?: string
  city?: string
  country?: string
  contact?: {
    phone_numbers?: Array<{
      raw_number: string
      sanitized_number: string
      type?: string
      status: string
    }>
  }
}

interface ApolloEnrichmentResponse {
  person?: ApolloPerson
  error?: string
}

interface ApolloBulkResponse {
  people?: Array<{
    request: ApolloEnrichmentRequest
    response: ApolloEnrichmentResponse
  }>
  errors?: string[]
}

interface ApolloError {
  error: string
  message?: string
  type?: string
}

/**
 * Production service for Apollo.io People Enrichment API
 *
 * Endpoints:
 * - Single Person: POST https://api.apollo.io/api/v1/people/match
 * - Bulk (up to 10): POST https://api.apollo.io/api/v1/people/match_bulk
 *
 * Documentation: https://docs.apollo.io/reference/people-enrichment
 *
 * Required headers:
 * - X-Api-Key: Your Apollo API key
 * - Content-Type: application/json
 *
 * Cost: $0.02 per enrichment (1 credit per person)
 */
export class ApolloEnrichmentService {
  private readonly baseUrl = 'https://api.apollo.io/api/v1'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Enrich a single person's data using Apollo.io
   *
   * POST https://api.apollo.io/api/v1/people/match
   *
   * Query parameters:
   * - email: Person's email address
   * - first_name: Person's first name
   * - last_name: Person's last name
   * - name: Full name (alternative to first_name + last_name)
   * - domain: Company domain (e.g., "google.com")
   * - linkedin_url: LinkedIn profile URL
   * - title: Job title
   * - organization_id: Apollo organization ID
   * - reveal_personal_emails: Set to true to return personal emails (default: false)
   * - reveal_phone_number: Set to true to return phone numbers (default: false)
   *
   * @param request - Person data to enrich
   * @returns Enriched person data or error
   */
  async enrichPerson(request: ApolloEnrichmentRequest): Promise<ApolloEnrichmentResponse> {
    try {
      // Build query string from request parameters
      const queryParams = new URLSearchParams()

      if (request.email) queryParams.append('email', request.email)
      if (request.first_name) queryParams.append('first_name', request.first_name)
      if (request.last_name) queryParams.append('last_name', request.last_name)
      if (request.name) queryParams.append('name', request.name)
      if (request.domain) queryParams.append('domain', request.domain)
      if (request.linkedin_url) queryParams.append('linkedin_url', request.linkedin_url)
      if (request.title) queryParams.append('title', request.title)
      if (request.organization_id) queryParams.append('organization_id', request.organization_id)
      if (request.reveal_personal_emails) queryParams.append('reveal_personal_emails', 'true')
      if (request.reveal_phone_number) queryParams.append('reveal_phone_number', 'true')

      const url = `${this.baseUrl}/people/match?${queryParams.toString()}`

      console.log('[Apollo] Calling single person enrichment:', url.replace(/email=[^&]*/, 'email=***'))

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
        },
      })

      if (!response.ok) {
        const errorData: ApolloError = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[Apollo] API error:', {
          status: response.status,
          error: errorData
        })
        return {
          error: errorData.error || `Apollo API error: ${response.status} ${response.statusText}`
        }
      }

      const data: ApolloEnrichmentResponse = await response.json()

      console.log('[Apollo] Enrichment successful for:', request.email || request.name)

      return data
    } catch (error) {
      console.error('[Apollo] Request failed:', error)
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Bulk enrich multiple people (up to 10) with a single API call
   *
   * POST https://api.apollo.io/api/v1/people/match_bulk
   *
   * Request body:
   * {
   *   "details": [
   *     { "email": "john@example.com" },
   *     { "first_name": "Jane", "last_name": "Smith", "domain": "acme.com" }
   *   ]
   * }
   *
   * @param requests - Array of person data to enrich (max 10)
   * @returns Array of enriched person data or errors
   */
  async enrichPeopleBulk(requests: ApolloEnrichmentRequest[]): Promise<ApolloBulkResponse> {
    if (requests.length === 0) {
      return { errors: ['No requests provided'] }
    }

    if (requests.length > 10) {
      return { errors: ['Maximum 10 requests allowed per bulk call'] }
    }

    try {
      const url = `${this.baseUrl}/people/match_bulk`

      console.log(`[Apollo] Calling bulk enrichment for ${requests.length} people`)

      const requestBody = {
        details: requests
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData: ApolloError = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[Apollo] Bulk API error:', {
          status: response.status,
          error: errorData
        })
        return {
          errors: [errorData.error || `Apollo API error: ${response.status} ${response.statusText}`]
        }
      }

      const data: ApolloBulkResponse = await response.json()

      console.log(`[Apollo] Bulk enrichment completed for ${requests.length} people`)

      return data
    } catch (error) {
      console.error('[Apollo] Bulk request failed:', error)
      return {
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      }
    }
  }

  /**
   * Convert Lume Contact to Apollo enrichment request
   */
  contactToEnrichmentRequest(contact: Contact): ApolloEnrichmentRequest {
    const request: ApolloEnrichmentRequest = {
      email: contact.email,
      first_name: contact.firstName,
      last_name: contact.lastName,
      reveal_personal_emails: true,
      reveal_phone_number: true
    }

    // Add optional fields if available
    if (contact.company) {
      // Try to extract domain from company email or use company name as domain hint
      const domainMatch = contact.email?.match(/@(.+)$/)
      if (domainMatch) {
        request.domain = domainMatch[1]
      }
    }

    return request
  }

  /**
   * Convert Apollo enrichment response to Lume Contact
   */
  enrichmentResponseToContact(response: ApolloEnrichmentResponse, sourceAudienceId: string): Contact | null {
    if (!response.person) return null

    const person = response.person

    // Extract phone number if available
    const phone = person.contact?.phone_numbers?.[0]?.sanitized_number || undefined

    return {
      firstName: person.first_name,
      lastName: person.last_name,
      email: person.email || '',
      phone,
      city: person.city,
      country: person.country,
      // Store additional enriched data in flexible properties
      title: person.title,
      linkedin: person.linkedin_url,
      company: this.extractCompanyName(person),
      photoUrl: person.photo_url,
      twitter: person.twitter_url,
      github: person.github_url,
      headline: person.headline,
      emailStatus: person.email_status
    }
  }

  /**
   * Extract company name from employment history
   */
  private extractCompanyName(person: ApolloPerson): string | undefined {
    const currentJob = person.employment_history?.find(job => job.current)
    return currentJob?.organization_name
  }

  /**
   * Check if the API key is valid by making a test call
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // Make a minimal request to check if API key works
      const result = await this.enrichPerson({
        email: 'test@example.com'
      })

      // If we get a response (even if no match), API key is valid
      // An invalid API key would return 401
      return !result.error || !result.error.includes('401')
    } catch (error) {
      console.error('[Apollo] API key validation failed:', error)
      return false
    }
  }
}

/**
 * Factory function to create Apollo enrichment service
 */
export function createApolloEnrichmentService(apiKey: string): ApolloEnrichmentService {
  return new ApolloEnrichmentService(apiKey)
}
