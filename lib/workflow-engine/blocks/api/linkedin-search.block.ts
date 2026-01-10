/**
 * LinkedIn Search Block
 *
 * Searches LinkedIn profiles using Apify.
 * Extracts bio, headline, skills, and other profile data.
 *
 * Input: Array of contacts with name/email (business emails only)
 * Output: Array of contacts with LinkedIn data
 *
 * Actor: supreme_coder/linkedin-profile-scraper
 * Cost: ~$0.003 per search ($3/1000 profiles)
 * Note: NO LinkedIn cookie required
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'

// Types
export interface LinkedInSearchConfig {
  apiToken: string // {{secrets.apify}}
  mode?: 'live' | 'mock' // Force mock mode
  actor?: string // Default: 'supreme_coder/linkedin-profile-scraper'
  maxResults?: number // Max results per search (default: 1)
}

export interface LinkedInSearchInput {
  contacts: Array<{
    original: Record<string, any>
    email?: string
    nome?: string
    country?: string
  }>
}

export interface LinkedInProfileData {
  found: boolean
  url?: string
  bio?: string
  headline?: string
  fullName?: string
  firstName?: string
  lastName?: string
  location?: string
  skills?: string[]
  company?: string
  jobTitle?: string
  error?: string
}

export interface LinkedInSearchOutput {
  contacts: Array<{
    original: Record<string, any>
    linkedin?: LinkedInProfileData
    enrichmentMetadata?: {
      cost: number
      sources: string[]
      timestamp: string
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
 * LinkedIn Search Block
 */
export class LinkedInSearchBlock extends BaseBlockExecutor {
  constructor() {
    super('api.linkedinSearch')
  }

  async execute(
    config: LinkedInSearchConfig,
    input: LinkedInSearchInput,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      // Check for mock mode
      const shouldMock = config.mode === 'mock' || context.mode === 'demo' || context.mode === 'test'

      if (shouldMock) {
        this.log(context, 'info', '🎭 MOCK MODE: Simulating LinkedIn search')
        return await this.executeMock(config, input, context, startTime)
      }

      this.log(context, 'info', 'Searching LinkedIn profiles', {
        contactsCount: input.contacts.length
      })

      // Validate input
      if (!input.contacts || !Array.isArray(input.contacts)) {
        throw new Error('Input must have contacts array')
      }

      // Validate API token
      if (!config.apiToken) {
        throw new Error('Apify API token is required in config.apiToken or secrets.apify')
      }

      // Process contacts
      const results = await this.processContacts(config, input.contacts, context)

      const executionTime = Date.now() - startTime

      this.log(context, 'info', 'LinkedIn search completed', {
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
      this.log(context, 'error', 'LinkedIn search failed', {
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
   * Process all contacts and search LinkedIn profiles
   */
  private async processContacts(
    config: LinkedInSearchConfig,
    contacts: Array<any>,
    context: ExecutionContext
  ): Promise<LinkedInSearchOutput> {
    const results: LinkedInSearchOutput['contacts'] = []
    let profilesFound = 0
    let totalCost = 0
    const costPerProfile = 0.003 // $0.003 per LinkedIn search (supreme_coder actor)

    for (const contact of contacts) {
      try {
        this.log(context, 'debug', 'Searching LinkedIn for contact', {
          email: contact.email,
          nome: contact.nome
        })

        // Search LinkedIn profile using email/name
        const profileData = await this.searchProfile(config, contact, context)

        if (profileData.found) {
          profilesFound++
          totalCost += costPerProfile
        }

        results.push({
          original: contact.original,
          linkedin: profileData,
          enrichmentMetadata: {
            cost: profileData.found ? costPerProfile : 0,
            sources: profileData.found ? ['linkedin'] : [],
            timestamp: new Date().toISOString()
          }
        })

      } catch (error) {
        this.log(context, 'warn', 'Failed to search LinkedIn for contact', {
          email: contact.email,
          error: (error as Error).message
        })

        // Continue with other contacts even if one fails
        results.push({
          original: contact.original,
          linkedin: {
            found: false,
            error: (error as Error).message
          },
          enrichmentMetadata: {
            cost: 0,
            sources: [],
            timestamp: new Date().toISOString()
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
   * Search LinkedIn profile using Apify
   */
  private async searchProfile(
    config: LinkedInSearchConfig,
    contact: any,
    context: ExecutionContext
  ): Promise<LinkedInProfileData> {
    const baseUrl = 'https://api.apify.com/v2'
    const actor = config.actor || 'supreme_coder/linkedin-profile-scraper'
    const actorId = actor.includes('~') ? actor : actor.replace('/', '~')

    // Build search query from contact data
    const searchQuery = this.buildSearchQuery(contact)

    try {
      // Start Apify actor run
      this.log(context, 'debug', 'Starting Apify LinkedIn scraper', {
        email: contact.email,
        query: searchQuery
      })

      const requestBody = {
        profileUrls: [],
        profileUrl: '',
        resultsType: 'people',
        maxResults: config.maxResults || 1,
        searchQuery: searchQuery
      }

      const response = await fetch(`${baseUrl}/acts/${actorId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(`Apify API error: ${responseData.message || response.statusText}`)
      }

      const run = responseData.data

      // Wait for completion
      this.log(context, 'debug', 'Waiting for Apify run to complete', {
        runId: run.id,
        status: run.status
      })

      const completedRun = await this.waitForRun(config.apiToken, run.id, actorId)

      if (!completedRun.datasetId) {
        return {
          found: false,
          error: 'No dataset returned from Apify'
        }
      }

      // Fetch results
      const items = await this.fetchDataset(config.apiToken, completedRun.datasetId)

      if (!items || items.length === 0) {
        return {
          found: false,
          error: 'Profile not found or no data returned'
        }
      }

      // Parse LinkedIn profile data
      const profileItem = items[0] // First item should be profile data

      return {
        found: true,
        url: profileItem.url || profileItem.profileUrl,
        bio: profileItem.about || profileItem.summary || profileItem.bio,
        headline: profileItem.headline || profileItem.title,
        fullName: profileItem.fullName || profileItem.name,
        firstName: profileItem.firstName,
        lastName: profileItem.lastName,
        location: profileItem.location || profileItem.address,
        skills: profileItem.skills || [],
        company: profileItem.company || profileItem.companyName,
        jobTitle: profileItem.jobTitle || profileItem.position
      }

    } catch (error) {
      this.log(context, 'warn', 'LinkedIn profile search failed', {
        email: contact.email,
        error: (error as Error).message
      })

      return {
        found: false,
        error: (error as Error).message
      }
    }
  }

  /**
   * Build LinkedIn search query from contact data
   */
  private buildSearchQuery(contact: any): string {
    const parts: string[] = []

    if (contact.nome) {
      parts.push(contact.nome)
    }

    if (contact.email) {
      // Extract domain from email
      const domain = contact.email.split('@')[1]
      if (domain) {
        parts.push(domain)
      }
    }

    return parts.join(' ')
  }

  /**
   * Wait for Apify run to complete
   */
  private async waitForRun(
    apiToken: string,
    runId: string,
    actorId: string,
    maxWaitTime: number = 300000
  ): Promise<any> {
    const baseUrl = 'https://api.apify.com/v2'
    const pollInterval = 2000 // Check every 2 seconds
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      const response = await fetch(`${baseUrl}/acts/${actorId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      })

      const run = await response.json()

      if (run.data && (run.data.status === 'SUCCEEDED' || run.data.status === 'FAILED')) {
        return run.data
      }

      // Wait before next poll
      await this.sleep(pollInterval)
    }

    throw new Error(`Apify run timed out after ${maxWaitTime}ms`)
  }

  /**
   * Fetch dataset from Apify
   */
  private async fetchDataset(apiToken: string, datasetId: string): Promise<any[]> {
    const baseUrl = 'https://api.apify.com/v2'
    const items: any[] = []
    let offset = 0
    const limit = 100

    while (true) {
      const response = await fetch(
        `${baseUrl}/datasets/${datasetId}/items?offset=${offset}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch dataset: ${response.statusText}`)
      }

      const batch = await response.json()

      if (!batch.items || batch.items.length === 0) {
        break
      }

      items.push(...batch.items)

      if (batch.items.length < limit) {
        break // Last page
      }

      offset += limit
    }

    return items
  }

  /**
   * Execute in mock mode - returns sample LinkedIn data
   */
  private async executeMock(
    config: LinkedInSearchConfig,
    input: LinkedInSearchInput,
    context: ExecutionContext,
    startTime: number
  ) {
    await this.sleep(500) // Simulate API latency

    const mockContacts: LinkedInSearchOutput['contacts'] = input.contacts.map((contact, index) => {
      const found = index % 3 === 0 // 1 out of 3 found

      return {
        original: contact.original,
        linkedin: found ? {
          found: true,
          url: `https://www.linkedin.com/in/${contact.nome?.toLowerCase().replace(/\s/g, '-') || 'profile'}`,
          bio: 'Experienced professional with a proven track record in business development and innovation. Passionate about technology and driving growth.',
          headline: 'Business Development Manager | Innovation Strategist',
          fullName: contact.nome || 'Unknown',
          firstName: contact.nome?.split(' ')[0] || 'Unknown',
          lastName: contact.nome?.split(' ').slice(-1)[0] || 'Unknown',
          location: 'Milan, Italy',
          skills: ['Business Strategy', 'Innovation', 'Leadership', 'Project Management', 'Marketing'],
          company: contact.email?.split('@')[1] || 'Unknown Inc.',
          jobTitle: 'Business Development Manager'
        } : {
          found: false,
          error: 'Profile not found (mock)'
        },
        enrichmentMetadata: {
          cost: found ? 0.003 : 0,
          sources: found ? ['linkedin'] : [],
          timestamp: new Date().toISOString()
        }
      }
    })

    const profilesFound = mockContacts.filter(c => c.linkedin?.found).length
    const totalCost = profilesFound * 0.003

    const mockOutput: LinkedInSearchOutput = {
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

    this.log(context, 'info', '🎭 Mock: LinkedIn search completed', {
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
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
