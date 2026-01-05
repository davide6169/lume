// ============================================
// Hunter.io Email Verifier API Stub Service for Demo Mode
// Simulates real Hunter.io responses with accurate data structure
// ============================================

import type { Contact } from '@/types'

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
}

/**
 * Simulates realistic Hunter.io Email Verifier API responses for demo mode
 * Uses the same data structure as the real Hunter.io API
 *
 * Real API Endpoint: GET https://api.hunter.io/v2/email-verifier?email={email}&api_key={key}
 * Documentation: https://hunter.io/api-documentation
 */
export class HunterIoStubService {
  private baseUrl = 'https://api.hunter.io/v2/email-verifier'

  // Simulate network delay
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Verify a single email address (stub)
   *
   * Real API Request Example:
   * ```bash
   * curl --request GET \
   *   --url 'https://api.hunter.io/v2/email-verifier?email=john.doe@example.com&api_key=YOUR_API_KEY'
   * ```
   */
  async verifyEmail(request: HunterEmailVerifierRequest): Promise<HunterEmailVerifierResponse> {
    await this.delay(400 + Math.random() * 600)

    const { email } = request

    // Validate email format
    if (!this.isValidEmailFormat(email)) {
      return {
        data: {
          email,
          status: 'invalid',
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
          params: { email }
        }
      }
    }

    // Generate realistic verification result
    const verificationResult = this.generateVerificationResult(email)

    return {
      data: {
        email,
        ...verificationResult
      },
      meta: {
        params: { email }
      }
    }
  }

  /**
   * Bulk verify multiple emails (up to 20) (stub)
   */
  async verifyEmailsBulk(emails: string[]): Promise<HunterEmailVerifierResponse[]> {
    await this.delay(600 + Math.random() * 800)

    const results: HunterEmailVerifierResponse[] = []

    for (const email of emails.slice(0, 20)) { // Hunter limits to 20
      const result = await this.verifyEmail({ email })
      results.push(result)
    }

    return results
  }

  /**
   * Convert Lume Contact to Hunter verification request
   */
  contactToVerificationRequest(contact: Contact): HunterEmailVerifierRequest {
    return {
      email: contact.email
    }
  }

  /**
   * Convert Hunter verification response to enhanced Contact
   */
  verificationResponseToContact(
    response: HunterEmailVerifierResponse,
    originalContact: Contact
  ): Contact {
    const { data } = response

    return {
      ...originalContact,
      // Mark as verified if status is valid or accept_all with good score
      emailVerified: data.status === 'valid' || (data.status === 'accept_all' && data.score >= 70)
    }
  }

  // ============================================
  // Private helpers
  // ============================================

  private isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private generateVerificationResult(email: string) {
    const domain = email.split('@')[1]?.toLowerCase() || ''

    // Determine if it's a webmail provider
    const webmailProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com']
    const isWebmail = webmailProviders.includes(domain)

    // Determine if it's a disposable email
    const disposableDomains = ['tempmail.com', 'guerrillamail.com', 'mailinator.com', '10minutemail.com']
    const isDisposable = disposableDomains.some(d => domain.includes(d))

    // Determine if it's a free provider
    const freeProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com']
    const isFreeProvider = freeProviders.includes(domain)

    // Random chance of accept_all (10%)
    const isAcceptAll = Math.random() < 0.1

    // Random chance of unknown (5%)
    const isUnknown = Math.random() < 0.05

    // Determine status and score
    let status: 'valid' | 'invalid' | 'accept_all' | 'unknown'
    let score: number

    if (isDisposable) {
      status = 'invalid'
      score = 10
    } else if (isUnknown) {
      status = 'unknown'
      score = 50
    } else if (isAcceptAll) {
      status = 'accept_all'
      score = 75
    } else {
      status = 'valid'
      // Score between 70-100 for valid emails
      score = 70 + Math.floor(Math.random() * 30)
    }

    // Generate sources for valid emails (50% chance)
    const sources = status === 'valid' && Math.random() > 0.5 ? this.generateSources(domain) : []

    return {
      status,
      score,
      regexp: true,
      gibberish: false,
      disposable: isDisposable,
      webmail: isWebmail,
      mx_records: status !== 'invalid',
      smtp_server: status !== 'invalid',
      smtp_check: status === 'valid' || status === 'accept_all',
      accept_all: isAcceptAll,
      free_provider: isFreeProvider,
      sources
    }
  }

  private generateSources(domain: string): Array<{
    domain: string
    uri: string
    extracted_on: string
    last_seen: string
    still_online: boolean
  }> {
    const numSources = Math.floor(Math.random() * 3) + 1 // 1-3 sources
    const sources = []

    for (let i = 0; i < numSources; i++) {
      const daysAgo = Math.floor(Math.random() * 30) + 1
      const extractedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

      sources.push({
        domain: domain,
        uri: `https://${domain}`,
        extracted_on: extractedDate.toISOString(),
        last_seen: extractedDate.toISOString(),
        still_online: Math.random() > 0.1 // 90% still online
      })
    }

    return sources
  }
}
