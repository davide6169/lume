// ============================================
// Hunter.io Email Finder API Stub Service for Demo Mode
// Simulates real Hunter.io responses with accurate data structure
// ============================================

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
}

/**
 * Simulates realistic Hunter.io Email Finder API responses for demo mode
 * Uses the same data structure as the real Hunter.io API
 *
 * Real API Endpoint: GET https://api.hunter.io/v2/email-finder?domain={domain}&first_name={first_name}&last_name={last_name}&api_key={key}
 * Documentation: https://hunter.io/api-documentation/v2#email-finder
 */
export class HunterIoFinderStubService {
  private baseUrl = 'https://api.hunter.io/v2/email-finder'

  // Simulate network delay
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Find email address from name and domain (stub)
   *
   * Real API Request Example:
   * ```bash
   * curl --request GET \
   *   --url 'https://api.hunter.io/v2/email-finder?domain=google.com&first_name=john&last_name=doe&api_key=YOUR_API_KEY'
   * ```
   */
  async findEmail(request: HunterEmailFinderRequest): Promise<HunterEmailFinderResponse | null> {
    await this.delay(600 + Math.random() * 800)

    const { first_name, last_name, domain } = request

    // Validate inputs
    if (!first_name || !last_name || !domain) {
      console.error('[Hunter Finder] Missing required parameters')
      return null
    }

    // 20% chance of not finding the email
    if (Math.random() < 0.2) {
      console.log(`[Hunter Finder] Email not found for ${first_name} ${last_name} @ ${domain}`)
      return null
    }

    // Generate realistic email pattern
    const email = this.generateEmailPattern(first_name, last_name, domain)

    // Generate realistic result
    const score = 70 + Math.floor(Math.random() * 30)

    return {
      data: {
        email,
        score,
        domain,
        status: score >= 80 ? 'valid' : 'accept_all'
      },
      meta: {
        params: {
          first_name,
          last_name,
          domain
        }
      }
    }
  }

  // ============================================
  // Private helpers
  // ============================================

  private generateEmailPattern(firstName: string, lastName: string, domain: string): string {
    const patterns = [
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
      `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}`,
      `${firstName.toLowerCase()}${lastName.charAt(0).toLowerCase()}`,
      `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
      `${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      `${firstName.toLowerCase()}.${lastName.charAt(0).toLowerCase()}`
    ]

    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)]
    return `${selectedPattern}@${domain.toLowerCase()}`
  }
}
