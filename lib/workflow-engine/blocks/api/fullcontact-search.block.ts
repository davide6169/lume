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
   * NOTE: This is a placeholder implementation
   * Real API integration to be implemented based on FullContact API docs
   */
  private async searchProfile(
    config: FullContactSearchConfig,
    contact: any,
    context: ExecutionContext
  ): Promise<FullContactProfileData> {
    // Placeholder for real FullContact API call
    // For now, return not found
    // TODO: Implement actual FullContact API integration

    this.log(context, 'warn', 'FullContact API not yet implemented, returning not found', {
      email: contact.email
    })

    return {
      found: false,
      error: 'FullContact API integration not yet implemented'
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

    const mockContacts: FullContactSearchOutput['contacts'] = input.contacts.map((contact, index) => {
      // 70% success rate in mock mode
      const found = index % 10 < 7

      if (found) {
        const mockProfiles = this.getMockFullContactData(contact)
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
