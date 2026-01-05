// ============================================
// Apollo.io Enrichment API Stub Service for Demo Mode
// Simulates real Apollo.io responses with accurate data structure
// ============================================

import type { Contact } from '@/types'

interface ApolloEnrichmentRequest {
  email?: string
  first_name?: string
  last_name?: string
  name?: string
  domain?: string
  reveal_personal_emails?: boolean
  reveal_phone_number?: boolean
}

interface ApolloEnrichmentResponse {
  person?: {
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
  error?: string
}

/**
 * Simulates realistic Apollo.io People Enrichment API responses for demo mode
 * Uses the same data structure as the real Apollo.io API
 *
 * Real API Endpoint: POST https://api.apollo.io/api/v1/people/match
 * Documentation: https://docs.apollo.io/reference/people-enrichment
 */
export class ApolloEnrichmentStubService {
  private baseUrl = 'https://api.apollo.io/api/v1/people/match'

  // Simulate network delay
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Enrich a single person's data using Apollo.io (stub)
   *
   * Real API Request Example:
   * ```bash
   * curl --request POST \
   *   --url 'https://api.apollo.io/api/v1/people/match?email=john@example.com&reveal_personal_emails=true&reveal_phone_number=true' \
   *   --header 'Content-Type: application/json' \
   *   --header 'X-Api-Key: YOUR_API_KEY'
   * ```
   */
  async enrichPerson(request: ApolloEnrichmentRequest): Promise<ApolloEnrichmentResponse> {
    await this.delay(500 + Math.random() * 700)

    // Check if we have enough information to match
    if (!request.email && !(request.first_name || request.name)) {
      return {
        error: 'Insufficient information to match person. Please provide email or name.'
      }
    }

    // Generate realistic enriched data
    const enrichedPerson = this.generateEnrichedPerson(request)

    return {
      person: enrichedPerson
    }
  }

  /**
   * Bulk enrich multiple people (up to 10) (stub)
   *
   * Real API Endpoint: POST https://api.apollo.io/api/v1/people/match_bulk
   */
  async enrichPeopleBulk(requests: ApolloEnrichmentRequest[]): Promise<ApolloEnrichmentResponse[]> {
    await this.delay(800 + Math.random() * 1000)

    const results: ApolloEnrichmentResponse[] = []

    for (const request of requests.slice(0, 10)) { // Apollo limits to 10
      const person = this.generateEnrichedPerson(request)
      results.push({ person })
    }

    return results
  }

  /**
   * Convert Lume Contact to Apollo enrichment request
   */
  contactToEnrichmentRequest(contact: Contact): ApolloEnrichmentRequest {
    return {
      email: contact.email,
      first_name: contact.firstName,
      last_name: contact.lastName,
      reveal_personal_emails: true,
      reveal_phone_number: true
    }
  }

  /**
   * Convert Apollo enrichment response to Lume Contact
   */
  enrichmentResponseToContact(response: ApolloEnrichmentResponse, sourceAudienceId: string): Contact | null {
    if (!response.person) return null

    const person = response.person

    // Extract phone number if available
    const phone = person.contact?.phone_numbers?.[0]?.sanitized_number || null

    return {
      id: crypto.randomUUID(),
      sourceAudienceId,
      firstName: person.first_name,
      lastName: person.last_name,
      email: person.email || '',
      phone: phone || undefined,
      company: this.extractCompanyName(person),
      title: person.title || undefined,
      linkedin: person.linkedin_url || undefined,
      location: this.formatLocation(person),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  // ============================================
  // Private generators for realistic demo data
  // ============================================

  private generateEnrichedPerson(request: ApolloEnrichmentRequest) {
    // Parse name from request
    let firstName = request.first_name || ''
    let lastName = request.last_name || ''

    if (request.name && !request.first_name) {
      const nameParts = request.name.split(' ')
      firstName = nameParts[0] || ''
      lastName = nameParts.slice(1).join(' ') || ''
    }

    // If still no name, extract from email
    if (!firstName && request.email) {
      const emailLocal = request.email.split('@')[0]
      const nameParts = emailLocal.split(/[._-]/)
      firstName = nameParts[0] || ''
      lastName = nameParts.slice(1).join(' ') || ''
    }

    // Get domain for organization
    const domain = request.domain || (request.email ? request.email.split('@')[1] : 'example.com')

    // Generate realistic enrichment data
    const demoProfiles = this.getDemoProfiles()
    const profile = demoProfiles[Math.floor(Math.random() * demoProfiles.length)]

    return {
      id: `person_${crypto.randomUUID()}`,
      first_name: firstName || profile.first_name,
      last_name: lastName || profile.last_name,
      name: `${firstName || profile.first_name} ${lastName || profile.last_name}`,
      linkedin_url: `https://www.linkedin.com/in/${this.generateLinkedInSlug(firstName, lastName)}`,
      title: profile.title,
      email_status: 'verified',
      photo_url: profile.photo_url,
      twitter_url: profile.twitter_url,
      github_url: profile.github_url,
      facebook_url: null,
      headline: profile.headline,
      email: request.email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      organization_id: `org_${crypto.randomUUID()}`,
      employment_history: [
        {
          _id: crypto.randomUUID(),
          current: true,
          organization_name: this.getCompanyNameFromDomain(domain),
          title: profile.title,
          start_date: this.getRandomStartDate()
        }
      ],
      state: profile.state,
      city: profile.city,
      country: profile.country,
      contact: {
        phone_numbers: request.reveal_phone_number ? [
          {
            raw_number: this.generateRandomPhoneNumber(),
            sanitized_number: this.generateRandomPhoneNumber(),
            type: 'mobile',
            status: 'valid_number'
          }
        ] : undefined
      }
    }
  }

  private getDemoProfiles() {
    return [
      {
        first_name: 'Marco',
        last_name: 'Rossi',
        title: 'CEO & Founder',
        headline: 'Building the future of tech | Entrepreneur | Angel Investor',
        photo_url: 'https://randomuser.me/api/portraits/men/32.jpg',
        twitter_url: 'https://twitter.com/marcorossi',
        github_url: 'https://github.com/marcorossi',
        state: 'Milano',
        city: 'Milano',
        country: 'Italy'
      },
      {
        first_name: 'Giulia',
        last_name: 'Bianchi',
        title: 'Marketing Director',
        headline: 'Digital Marketing Expert | Growth Hacker | Brand Strategy',
        photo_url: 'https://randomuser.me/api/portraits/women/44.jpg',
        twitter_url: 'https://twitter.com/giuliabianchi',
        github_url: null,
        state: 'Roma',
        city: 'Roma',
        country: 'Italy'
      },
      {
        first_name: 'Luca',
        last_name: 'Verdi',
        title: 'Senior Software Engineer',
        headline: 'Full-Stack Developer | Open Source Contributor | Tech Enthusiast',
        photo_url: 'https://randomuser.me/api/portraits/men/22.jpg',
        twitter_url: null,
        github_url: 'https://github.com/lucaverdi',
        state: 'Torino',
        city: 'Torino',
        country: 'Italy'
      },
      {
        first_name: 'Anna',
        last_name: 'Ferrari',
        title: 'Product Manager',
        headline: 'Product Management | Agile | User Experience',
        photo_url: 'https://randomuser.me/api/portraits/women/65.jpg',
        twitter_url: 'https://twitter.com/annaferrari',
        github_url: null,
        state: 'Bologna',
        city: 'Bologna',
        country: 'Italy'
      },
      {
        first_name: 'Paolo',
        last_name: 'Colombo',
        title: 'Sales Manager',
        headline: 'B2B Sales | Business Development | Revenue Growth',
        photo_url: 'https://randomuser.me/api/portraits/men/55.jpg',
        twitter_url: null,
        github_url: null,
        state: 'Milano',
        city: 'Milano',
        country: 'Italy'
      },
      {
        first_name: 'Sofia',
        last_name: 'Romano',
        title: 'UX/UI Designer',
        headline: 'Product Design | User Research | Design Systems',
        photo_url: 'https://randomuser.me/api/portraits/women/28.jpg',
        twitter_url: 'https://twitter.com/sofiaromano',
        github_url: null,
        state: 'Firenze',
        city: 'Firenze',
        country: 'Italy'
      },
      {
        first_name: 'Alessandro',
        last_name: 'Conti',
        title: 'CTO',
        headline: 'Technology Leadership | Cloud Architecture | DevOps',
        photo_url: 'https://randomuser.me/api/portraits/men/41.jpg',
        twitter_url: null,
        github_url: 'https://github.com/alessandroconti',
        state: 'Roma',
        city: 'Roma',
        country: 'Italy'
      },
      {
        first_name: 'Chiara',
        last_name: 'Marino',
        title: 'HR Manager',
        headline: 'Human Resources | Talent Acquisition | People Operations',
        photo_url: 'https://randomuser.me/api/portraits/women/38.jpg',
        twitter_url: 'https://twitter.com/chiaramarino',
        github_url: null,
        state: 'Milano',
        city: 'Milano',
        country: 'Italy'
      }
    ]
  }

  private getCompanyNameFromDomain(domain: string): string {
    const domainName = domain.replace(/\.(com|it|io|co\.uk)$/, '')

    // Convert domain to company name
    const companyNames: Record<string, string> = {
      'google': 'Google',
      'microsoft': 'Microsoft',
      'amazon': 'Amazon',
      'facebook': 'Meta',
      'apple': 'Apple',
      'netflix': 'Netflix',
      'example': 'Example Corp',
      'techstartup': 'TechStartup Inc',
      'innovationhub': 'Innovation Hub',
      'digitalbusiness': 'Digital Business Ltd'
    }

    return companyNames[domainName] || `${domainName.charAt(0).toUpperCase() + domainName.slice(1)} Corp`
  }

  private extractCompanyName(person: any): string | undefined {
    const currentJob = person.employment_history?.find((job: any) => job.current)
    return currentJob?.organization_name
  }

  private formatLocation(person: any): string | undefined {
    if (person.city && person.country) {
      return `${person.city}, ${person.country}`
    }
    return person.country || undefined
  }

  private generateLinkedInSlug(firstName: string, lastName: string): string {
    const normalized = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`
    const randomId = Math.floor(Math.random() * 1000)
    return `${normalized}-${randomId}`
  }

  private generateRandomPhoneNumber(): string {
    // Generate Italian mobile number format
    const prefix = '+39'
    const mobilePrefix = ['320', '328', '330', '333', '334', '335', '338', '339', '340', '345', '346', '347', '348', '349'][Math.floor(Math.random() * 14)]
    const suffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
    return `${prefix} ${mobilePrefix} ${suffix.slice(0, 3)} ${suffix.slice(3)}`
  }

  private getRandomStartDate(): string {
    const yearsAgo = Math.floor(Math.random() * 5) + 1
    const months = Math.floor(Math.random() * 12)
    return `${new Date().getFullYear() - yearsAgo}-${String(months + 1).padStart(2, '0')}-01`
  }
}
