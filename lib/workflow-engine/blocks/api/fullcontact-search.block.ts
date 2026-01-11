/**
 * FullContact Search Block
 *
 * Enriches contacts using FullContact API.
 * Finds social profiles (Instagram, Twitter, LinkedIn), interests, and demographics.
 *
 * Input: Array of contacts with name/email
 * Output: Array of contacts with FullContact enrichment data
 *
 * Cost: ~$0.01-0.05 per lookup
 * Focus: B2C consumer data
 *
 * IMPORTANT NOTES:
 * - FullContact provides personal interests and social profiles
 * - Best for consumer (B2C) data
 * - Cache TTL: 7 days (consumer data changes moderately)
 * - In mock mode, returns realistic B2C sample data
 */

import { BaseBlockExecutor } from '../../registry'
import { Caches, generateCacheKey } from '../../utils/cache'
import type { ExecutionContext } from '../../types'
import { writeFile } from 'fs/promises'

// Types
export interface FullContactSearchConfig {
  apiToken: string // {{secrets.fullcontact}}
  mode?: 'live' | 'mock' // Force mock mode
  enabled?: boolean // Enable/disable block (default: true)
  timeout?: number // Request timeout in ms (default: 30000)
  retryMax?: number // Max retries (default: 3)
}

export interface FullContactSearchInput {
  contacts: Array<{
    original: Record<string, any>
    email?: string
    nome?: string
    country?: string
  }>
}

export interface FullContactProfileData {
  found: boolean
  profiles?: {
    instagram?: string
    twitter?: string
    linkedin?: string
    facebook?: string
  }
  demographics?: {
    age?: string
    gender?: string
    location?: string
    country?: string
  }
  interests?: string[]
  error?: string
}

export interface FullContactSearchOutput {
  contacts: Array<{
    original: Record<string, any>
    fullcontact?: FullContactProfileData
    enrichmentMetadata?: {
      cost: number
      sources: string[]
      timestamp: string
      fullcontactFailed?: boolean // NEW: Flag for fallback trigger
      fullcontactError?: string
    }
  }>
  metadata: {
    totalInput: number
    totalProcessed: number
    profilesFound: number
    profilesNotFound: number
    totalCost: number
    avgCostPerContact: number
  }
}

/**
 * FullContact Search Block
 */
export class FullContactSearchBlock extends BaseBlockExecutor {
  // DECLARE MOCK SUPPORT
  static supportsMock: boolean = true

  private cache = Caches.fullcontact()
  private costPerLookup = 0.03

  constructor() {
    super('api.fullcontactSearch')
  }

  async execute(
    config: FullContactSearchConfig,
    input: FullContactSearchInput,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      // Check for mock mode
      const shouldMock = config.mode === 'mock' || context.mode === 'demo' || context.mode === 'test'

      if (shouldMock) {
        this.log(context, 'info', '🎭 MOCK MODE: Simulating FullContact search')
        return await this.executeMock(config, input, context, startTime)
      }

      this.log(context, 'info', 'Enriching contacts with FullContact', {
        contactsCount: input.contacts.length
      })

      // Validate input
      if (!input.contacts || !Array.isArray(input.contacts)) {
        throw new Error('Input must have contacts array')
      }

      // Validate API token
      if (!config.apiToken) {
        throw new Error('FullContact API token is required in config.apiToken or secrets.fullcontact')
      }

      // Process contacts
      const results = await this.processContacts(config, input.contacts, context)

      const executionTime = Date.now() - startTime

      this.log(context, 'info', 'FullContact enrichment completed', {
        totalProcessed: results.metadata.totalProcessed,
        profilesFound: results.metadata.profilesFound,
        totalCost: results.metadata.totalCost.toFixed(4)
      })

      return {
        status: 'completed',
        output: results,
        executionTime,
        error: undefined,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: results.metadata,
        logs: []
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'FullContact enrichment failed', {
        error: (error as Error).message
      })

      return {
        status: 'failed',
        output: null,
        executionTime,
        error: error as Error,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {},
        logs: []
      }
    }
  }

  /**
   * Process all contacts and search FullContact profiles
   */
  private async processContacts(
    config: FullContactSearchConfig,
    contacts: Array<any>,
    context: ExecutionContext
  ): Promise<FullContactSearchOutput> {
    const results: FullContactSearchOutput['contacts'] = []
    let profilesFound = 0
    let totalCost = 0

    for (const contact of contacts) {
      try {
        this.log(context, 'debug', 'Searching FullContact for contact', {
          email: contact.email,
          nome: contact.nome
        })

        // Check cache first (unless disabled)
        const cacheKey = generateCacheKey('fullcontact', {
          email: contact.email?.toLowerCase(),
          nome: contact.nome?.toLowerCase().trim()
        })

        const cached = context.disableCache ? undefined : this.cache.get(cacheKey)

        if (cached) {
          this.log(context, 'debug', 'Cache hit', { cacheKey })
          results.push(cached)
          if (cached.fullcontact?.found) {
            profilesFound++
            totalCost += this.costPerLookup
          }
          continue
        }

        // Search FullContact profile
        const profileData = await this.searchProfile(config, contact, context)

        // Store in cache
        if (!context.disableCache) {
          this.cache.set(cacheKey, profileData)
        }

        if (profileData.found) {
          profilesFound++
          totalCost += this.costPerLookup
        }

        results.push({
          original: contact.original,
          fullcontact: profileData,
          enrichmentMetadata: {
            cost: profileData.found ? this.costPerLookup : 0,
            sources: profileData.found ? ['fullcontact'] : [],
            timestamp: new Date().toISOString(),
            fullcontactFailed: !profileData.found,
            fullcontactError: profileData.error
          }
        })

      } catch (error) {
        this.log(context, 'warn', 'Failed to search FullContact for contact', {
          email: contact.email,
          error: (error as Error).message
        })

        // Continue with other contacts even if one fails
        results.push({
          original: contact.original,
          fullcontact: {
            found: false,
            error: (error as Error).message
          },
          enrichmentMetadata: {
            cost: 0,
            sources: [],
            timestamp: new Date().toISOString(),
            fullcontactFailed: true,
            fullcontactError: (error as Error).message
          }
        })
      }
    }

    return {
      contacts: results,
      metadata: {
        totalInput: contacts.length,
        totalProcessed: contacts.length,
        profilesFound,
        profilesNotFound: contacts.length - profilesFound,
        totalCost,
        avgCostPerContact: contacts.length > 0 ? totalCost / contacts.length : 0
      }
    }
  }

  /**
   * Search FullContact profile using API
   * FullContact v3 API: https://api.fullcontact.com/v3/person.enrich
   *
   * API Documentation:
   * - Endpoint: POST https://api.fullcontact.com/v3/person.enrich
   * - Headers: Authorization: Bearer {API_KEY}, Content-Type: application/json
   * - Body: { "email": "email@example.com" }
   * - Response: JSON with details.profiles, details.demographics, details.interests
   */
  private async searchProfile(
    config: FullContactSearchConfig,
    contact: any,
    context: ExecutionContext
  ): Promise<FullContactProfileData> {
    const email = contact.email || contact.original?.email

    if (!email) {
      return {
        found: false,
        error: 'Email not provided'
      }
    }

    const apiUrl = 'https://api.fullcontact.com/v3/person.enrich'

    // Build request body
    const requestBody = {
      email: email
    }

    // Prepare request data for logging
    const requestData = {
      timestamp: new Date().toISOString(),
      endpoint: apiUrl,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken.substring(0, 10)}...${config.apiToken.substring(Math.max(0, config.apiToken.length - 4))}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: requestBody
    }

    this.log(context, 'info', '📡 FullContact API Request:', {
      endpoint: apiUrl,
      method: 'POST',
      email: email,
      body: JSON.stringify(requestBody)
    })

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(config.timeout || 30000)
      })

      const statusCode = response.status

      // Read response body
      let responseBody: any
      const responseText = await response.text()
      try {
        responseBody = JSON.parse(responseText)
      } catch {
        responseBody = responseText
      }

      // Prepare response data for logging
      const responseData = {
        timestamp: new Date().toISOString(),
        status: statusCode,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody
      }

      // Save request and response to file
      const apiLog = {
        request: requestData,
        response: responseData
      }

      await writeFile('/tmp/fullcontact-api-log.json', JSON.stringify(apiLog, null, 2))
      this.log(context, 'info', '📁 FullContact API log saved to /tmp/fullcontact-api-log.json')

      this.log(context, 'info', `📡 FullContact API Response: ${statusCode}`, {
        status: statusCode,
        statusText: response.statusText
      })

      // Handle 404 - Profile not found
      if (statusCode === 404) {
        this.log(context, 'info', 'Profile not found in FullContact', {
          email: email
        })

        return {
          found: false,
          error: 'Profile not found'
        }
      }

      // Handle 401 - Unauthorized
      if (statusCode === 401) {
        this.log(context, 'error', 'FullContact API key invalid', {
          email: email
        })

        return {
          found: false,
          error: 'Invalid API key'
        }
      }

      // Handle 429 - Rate limit
      if (statusCode === 429) {
        this.log(context, 'error', 'FullContact API rate limit exceeded', {
          email: email
        })

        return {
          found: false,
          error: 'Rate limit exceeded'
        }
      }

      // Handle other errors
      if (!response.ok) {
        let errorMessage = `API error: ${statusCode} ${response.statusText}`
        if (typeof responseBody === 'object' && responseBody !== null) {
          errorMessage = `API error: ${JSON.stringify(responseBody, null, 2)}`
        }

        this.log(context, 'error', 'FullContact API error', {
          status: statusCode,
          statusText: response.statusText,
          email: email,
          errorMessage: errorMessage
        })

        return {
          found: false,
          error: errorMessage
        }
      }

      // Parse successful response (already parsed in responseBody)
      const data = responseBody

      this.log(context, 'info', '✅ FullContact profile found', {
        email: email,
        data: JSON.stringify(data, null, 2)
      })

      // Extract relevant data from FullContact response
      const profileData: FullContactProfileData = {
        found: true
      }

      // Extract social profiles from data.details.profiles (can be array or object)
      // Also check for direct fields at root level (twitter, linkedin, facebook)
      const profiles: any = {}

      // Check direct fields at root level (present in v3 API response)
      if (data.twitter) profiles.twitter = data.twitter
      if (data.linkedin) profiles.linkedin = data.linkedin
      if (data.facebook) profiles.facebook = data.facebook
      if (data.instagram) profiles.instagram = data.instagram

      // Check data.details.profiles (can be array or object)
      if (data.details?.profiles) {
        const detailsProfiles = data.details.profiles

        // Handle array format
        if (Array.isArray(detailsProfiles)) {
          detailsProfiles.forEach((profile: any) => {
            const id = profile.id || ''
            const username = profile.username || ''

            if (profile.type === 'instagram' && username) {
              profiles.instagram = username
            } else if (profile.type === 'twitter' && username) {
              profiles.twitter = username
            } else if (profile.type === 'linkedin' && (id || username)) {
              profiles.linkedin = id || username
            } else if (profile.type === 'facebook' && (id || username)) {
              profiles.facebook = id || username
            }
          })
        }
        // Handle object format (keys are social network types)
        else if (typeof detailsProfiles === 'object' && detailsProfiles !== null) {
          for (const [network, profileData] of Object.entries(detailsProfiles)) {
            if (profileData && typeof profileData === 'object') {
              const profile = profileData as any
              if (network === 'instagram' && profile.username) {
                profiles.instagram = profile.username
              } else if (network === 'twitter' && profile.username) {
                profiles.twitter = profile.username
              } else if (network === 'linkedin' && (profile.id || profile.username)) {
                profiles.linkedin = profile.id || profile.username
              } else if (network === 'facebook' && (profile.id || profile.username)) {
                profiles.facebook = profile.id || profile.username
              }
            }
          }
        }
      }

      if (Object.keys(profiles).length > 0) {
        profileData.profiles = profiles
      }

      // Extract demographics from data.details.demographics
      if (data.details?.demographics) {
        const demographics: any = {}

        if (data.details.demographics.locationGeneral) {
          demographics.location = data.details.demographics.locationGeneral
        }

        if (data.details.demographics.gender) {
          demographics.gender = data.details.demographics.gender
        }

        if (data.details.demographics.ageRange) {
          demographics.age = `${data.details.demographics.ageRange.start}-${data.details.demographics.ageRange.end}`
        }

        if (data.details.demographics.country) {
          demographics.country = data.details.demographics.country
        }

        if (Object.keys(demographics).length > 0) {
          profileData.demographics = demographics
        }
      }

      // Extract interests from data.details.interests
      if (data.details?.interests) {
        const interests: string[] = []

        if (Array.isArray(data.details.interests)) {
          data.details.interests.forEach((interest: any) => {
            if (typeof interest === 'string') {
              interests.push(interest)
            } else if (interest.name) {
              interests.push(interest.name)
            }
          })
        }

        if (interests.length > 0) {
          profileData.interests = interests
        }
      }

      return profileData

    } catch (error) {
      // Handle fetch errors (timeout, network, etc.)
      this.log(context, 'error', 'FullContact API request failed', {
        email: email,
        error: (error as Error).message
      })

      return {
        found: false,
        error: `Request failed: ${(error as Error).message}`
      }
    }
  }

  /**
   * Execute in mock mode - returns sample FullContact data
   */
  private async executeMock(
    config: FullContactSearchConfig,
    input: FullContactSearchInput,
    context: ExecutionContext,
    startTime: number
  ) {
    await this.sleep(500) // Simulate API latency

    this.log(context, 'info', '📡 FullContact API Details (Mock Mode):', {
      endpoint: 'https://api.fullcontact.com/v3/person.enrich',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer <FULLCONTACT_API_KEY>',
        'Content-Type': 'application/json'
      }
    })

    const mockContacts: FullContactSearchOutput['contacts'] = input.contacts.map((contact, index) => {
      // 70% success rate in mock mode
      const found = index % 10 < 7

      // Build mock request payload
      const mockRequestPayload = {
        email: contact.email,
        name: contact.nome
      }

      this.log(context, 'info', `📤 [Contact ${index + 1}] Request Payload:`, {
        email: mockRequestPayload.email,
        name: mockRequestPayload.name,
        url: `https://api.fullcontact.com/v3/person.enrich?email=${encodeURIComponent(mockRequestPayload.email || '')}`
      })

      if (found) {
        const mockProfiles = this.getMockFullContactData(contact)

        // Mock response payload
        const mockResponsePayload = {
          status: 200,
          data: {
            fullName: contact.nome,
            emails: [{ value: contact.email, type: 'primary' }],
            socialProfiles: mockProfiles.profiles,
            demographics: mockProfiles.demographics,
            interests: mockProfiles.interests
          }
        }

        this.log(context, 'info', `📥 [Contact ${index + 1}] Response Payload:`, {
          status: mockResponsePayload.status,
          found: true,
          profiles: mockResponsePayload.data.socialProfiles,
          interests: mockResponsePayload.data.interests,
          demographics: mockResponsePayload.data.demographics
        })

        return {
          original: contact.original,
          fullcontact: {
            found: true,
            ...mockProfiles
          },
          enrichmentMetadata: {
            cost: this.costPerLookup,
            sources: ['fullcontact'],
            timestamp: new Date().toISOString(),
            fullcontactFailed: false
          }
        }
      } else {
        const mockResponsePayload = {
          status: 404,
          error: 'Profile not found',
          message: 'No profile found for the given email address'
        }

        this.log(context, 'info', `📥 [Contact ${index + 1}] Response Payload:`, {
          status: mockResponsePayload.status,
          found: false,
          error: mockResponsePayload.error
        })

        return {
          original: contact.original,
          fullcontact: {
            found: false,
            error: 'Profile not found (mock)'
          },
          enrichmentMetadata: {
            cost: 0,
            sources: [],
            timestamp: new Date().toISOString(),
            fullcontactFailed: true,
            fullcontactError: 'Profile not found (mock)'
          }
        }
      }
    })

    const profilesFound = mockContacts.filter(c => c.fullcontact?.found).length
    const totalCost = profilesFound * this.costPerLookup

    const mockOutput: FullContactSearchOutput = {
      contacts: mockContacts,
      metadata: {
        totalInput: input.contacts.length,
        totalProcessed: input.contacts.length,
        profilesFound,
        profilesNotFound: input.contacts.length - profilesFound,
        totalCost,
        avgCostPerContact: input.contacts.length > 0 ? totalCost / input.contacts.length : 0
      }
    }

    const executionTime = Date.now() - startTime

    this.log(context, 'info', '🎭 Mock: FullContact enrichment completed', {
      totalProcessed: mockOutput.metadata.totalProcessed,
      profilesFound: mockOutput.metadata.profilesFound
    })

    return {
      status: 'completed',
      output: mockOutput,
      executionTime,
      error: undefined,
      retryCount: 0,
      startTime,
      endTime: Date.now(),
      metadata: { ...mockOutput.metadata, mock: true },
      logs: []
    }
  }

  /**
   * Get realistic mock FullContact data (B2C focus)
   */
  private getMockFullContactData(contact: any): Omit<FullContactProfileData, 'found' | 'error'> {
    const mockProfiles = [
      {
        profiles: {
          instagram: 'travel_lover_2024',
          twitter: '@travel_lover',
          linkedin: 'https://linkedin.com/in/johndoe'
        },
        demographics: {
          age: '25-34',
          gender: 'Female',
          location: 'Milan, Italy',
          country: 'IT'
        },
        interests: ['Travel', 'Photography', 'Food', 'Adventure', 'Nature']
      },
      {
        profiles: {
          instagram: 'fitness_fanatic_it',
          twitter: '@fitness_guru'
        },
        demographics: {
          age: '25-34',
          gender: 'Male',
          location: 'Rome, Italy',
          country: 'IT'
        },
        interests: ['Fitness', 'Health', 'Yoga', 'Wellness', 'Nutrition', 'Gym']
      },
      {
        profiles: {
          instagram: 'tech_enthusiast_dev',
          twitter: '@tech_guru_it',
          linkedin: 'https://linkedin.com/in/techpro'
        },
        demographics: {
          age: '35-44',
          gender: 'Male',
          location: 'Turin, Italy',
          country: 'IT'
        },
        interests: ['Technology', 'AI', 'Software Development', 'Startups', 'Innovation', 'Gadgets']
      },
      {
        profiles: {
          instagram: 'foodie_lover_milano',
          twitter: '@food_lover_milano'
        },
        demographics: {
          age: '25-34',
          gender: 'Female',
          location: 'Milan, Italy',
          country: 'IT'
        },
        interests: ['Food', 'Cooking', 'Restaurants', 'Wine', 'Dining Out', 'Italian Cuisine']
      },
      {
        profiles: {
          instagram: 'fashion_style_it',
          twitter: '@fashionista_it'
        },
        demographics: {
          age: '25-34',
          gender: 'Female',
          location: 'Florence, Italy',
          country: 'IT'
        },
        interests: ['Fashion', 'Style', 'Shopping', 'Beauty', 'Design', 'Luxury']
      },
      {
        profiles: {
          instagram: 'music_lover_sound',
          twitter: '@music_fan_it'
        },
        demographics: {
          age: '18-24',
          gender: 'Male',
          location: 'Bologna, Italy',
          country: 'IT'
        },
        interests: ['Music', 'Concerts', 'Festivals', 'Guitar', 'Bands', 'Live Music']
      },
      {
        profiles: {
          instagram: 'art_creative_design',
          linkedin: 'https://linkedin.com/in/creativepro'
        },
        demographics: {
          age: '25-34',
          gender: 'Female',
          location: 'Milan, Italy',
          country: 'IT'
        },
        interests: ['Art', 'Design', 'Creativity', 'Photography', 'Museums', 'Culture']
      },
      {
        profiles: {
          instagram: 'sports_fanatic_it',
          twitter: '@sports_guru'
        },
        demographics: {
          age: '25-34',
          gender: 'Male',
          location: 'Naples, Italy',
          country: 'IT'
        },
        interests: ['Sports', 'Football', 'Basketball', 'Fitness', 'Olympics', 'Athletics']
      }
    ]

    // Return random mock profile based on contact
    const hash = contact.email ? contact.email.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0) : 0
    const index = hash % mockProfiles.length

    return mockProfiles[index]
  }
}
