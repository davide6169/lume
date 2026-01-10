/**
 * Instagram Search Block
 *
 * Searches Instagram profiles using Apify.
 * Extracts bio, posts, and other profile data.
 *
 * Input: Array of contacts with name/email
 * Output: Array of contacts with Instagram data
 *
 * Actor: apify/instagram-scraper
 * Cost: ~$0.050 per search
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'

// Types
export interface InstagramSearchConfig {
  apiToken: string // {{secrets.apify}}
  mode?: 'live' | 'mock' // Force mock mode
  actor?: string // Default: 'apify/instagram-scraper'
  maxResults?: number // Max posts per profile (default: 10)
  includePosts?: boolean // Include posts in results (default: true)
  maxPosts?: number // Max posts to fetch (default: 12)
}

export interface InstagramSearchInput {
  contacts: Array<{
    original: Record<string, any>
    email?: string
    nome?: string
    country?: string
  }>
}

export interface InstagramProfileData {
  found: boolean
  username?: string
  url?: string
  bio?: string
  fullName?: string
  followers?: number
  following?: number
  posts?: Array<{
    id: string
    text: string
    timestamp: string
    likes: number
    comments: number
    imageUrl?: string
  }>
  error?: string
}

export interface InstagramSearchOutput {
  contacts: Array<{
    original: Record<string, any>
    instagram?: InstagramProfileData
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
 * Instagram Search Block
 */
export class InstagramSearchBlock extends BaseBlockExecutor {
  constructor() {
    super('api.instagramSearch')
  }

  async execute(
    config: InstagramSearchConfig,
    input: InstagramSearchInput,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      // Check for mock mode
      const shouldMock = config.mode === 'mock' || context.mode === 'demo' || context.mode === 'test'

      if (shouldMock) {
        this.log(context, 'info', '🎭 MOCK MODE: Simulating Instagram search')
        return await this.executeMock(config, input, context, startTime)
      }

      this.log(context, 'info', 'Searching Instagram profiles', {
        contactsCount: input.contacts.length,
        includePosts: config.includePosts !== false,
        maxPosts: config.maxPosts || 12
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

      this.log(context, 'info', 'Instagram search completed', {
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
      this.log(context, 'error', 'Instagram search failed', {
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
   * Process all contacts and search Instagram profiles
   */
  private async processContacts(
    config: InstagramSearchConfig,
    contacts: Array<any>,
    context: ExecutionContext
  ): Promise<InstagramSearchOutput> {
    const results: InstagramSearchOutput['contacts'] = []
    let profilesFound = 0
    let totalCost = 0
    const costPerProfile = 0.050 // $0.050 per Instagram search

    for (const contact of contacts) {
      try {
        this.log(context, 'debug', 'Searching Instagram for contact', {
          email: contact.email,
          nome: contact.nome
        })

        // Guess Instagram username from email/name
        const username = this.guessInstagramUsername(contact)
        const profileData = await this.searchProfile(config, username, context)

        if (profileData.found) {
          profilesFound++
          totalCost += costPerProfile
        }

        results.push({
          original: contact.original,
          instagram: profileData,
          enrichmentMetadata: {
            cost: profileData.found ? costPerProfile : 0,
            sources: profileData.found ? ['instagram'] : [],
            timestamp: new Date().toISOString()
          }
        })

      } catch (error) {
        this.log(context, 'warn', 'Failed to search Instagram for contact', {
          email: contact.email,
          error: (error as Error).message
        })

        // Continue with other contacts even if one fails
        results.push({
          original: contact.original,
          instagram: {
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
   * Guess Instagram username from contact data
   */
  private guessInstagramUsername(contact: any): string | null {
    // Try to extract from email (part before @)
    if (contact.email) {
      const emailParts = contact.email.split('@')
      if (emailParts.length > 0) {
        const emailUsername = emailParts[0].toLowerCase().replace(/[^a-z0-9._]/g, '')
        if (emailUsername.length > 2) {
          return emailUsername
        }
      }
    }

    // Try to create from name
    if (contact.nome) {
      const nameParts = contact.nome.toLowerCase().split(' ')
      if (nameParts.length >= 2) {
        // Combine first and last name
        const username = (nameParts[0] + '.' + nameParts[nameParts.length - 1]).replace(/[^a-z0-9.]/g, '')
        if (username.length > 2) {
          return username
        }
      }
    }

    return null
  }

  /**
   * Search Instagram profile using Apify
   */
  private async searchProfile(
    config: InstagramSearchConfig,
    username: string | null,
    context: ExecutionContext
  ): Promise<InstagramProfileData> {
    if (!username) {
      return {
        found: false,
        error: 'Could not guess Instagram username from contact data'
      }
    }

    const baseUrl = 'https://api.apify.com/v2'
    const actor = config.actor || 'apify/instagram-scraper'
    const actorId = actor.includes('~') ? actor : actor.replace('/', '~')

    // Build Instagram profile URL
    const profileUrl = `https://www.instagram.com/${username}/`

    try {
      // Start Apify actor run
      this.log(context, 'debug', 'Starting Apify Instagram scraper', {
        username,
        url: profileUrl
      })

      const requestBody = {
        directUrls: [profileUrl],
        resultsType: config.includePosts !== false ? 'posts' : 'details',
        maxItems: config.maxPosts || 12,
        addParentData: false
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

      // Parse Instagram profile data
      const profileItem = items[0] // First item should be profile data

      return {
        found: true,
        username: profileItem.username || username,
        url: profileUrl,
        bio: profileItem.bio || profileItem.description,
        fullName: profileItem.fullName || profileItem.name,
        followers: profileItem.followersCount || profileItem.followers,
        following: profileItem.followsCount || profileItem.following,
        posts: this.extractPosts(items, config.maxPosts || 12)
      }

    } catch (error) {
      this.log(context, 'warn', 'Instagram profile search failed', {
        username,
        error: (error as Error).message
      })

      return {
        found: false,
        error: (error as Error).message
      }
    }
  }

  /**
   * Extract posts from Apify dataset items
   */
  private extractPosts(items: any[], maxPosts: number): InstagramProfileData['posts'] {
    const posts: InstagramProfileData['posts'] = []

    for (const item of items) {
      if (item.type === 'post' && posts.length < maxPosts) {
        posts.push({
          id: item.id || item.postId,
          text: item.text || item.caption || '',
          timestamp: item.timestamp || item.takenAt || new Date().toISOString(),
          likes: item.likesCount || item.likes || 0,
          comments: item.commentsCount || item.comments || 0,
          imageUrl: item.displayUrl || item.imageUrl
        })
      }
    }

    return posts
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
   * Execute in mock mode - returns sample Instagram data
   */
  private async executeMock(
    config: InstagramSearchConfig,
    input: InstagramSearchInput,
    context: ExecutionContext,
    startTime: number
  ) {
    await this.sleep(500) // Simulate API latency

    const mockContacts: InstagramSearchOutput['contacts'] = input.contacts.map((contact, index) => {
      const found = index % 2 === 0 // Alternate between found/not found

      return {
        original: contact.original,
        instagram: found ? {
          found: true,
          username: this.guessInstagramUsername(contact) || 'unknown',
          url: `https://www.instagram.com/${this.guessInstagramUsername(contact) || 'unknown'}/`,
          bio: 'Digital entrepreneur and tech enthusiast. Sharing insights about innovation and business. 🚀',
          fullName: contact.nome || 'Unknown',
          followers: 1000 + Math.floor(Math.random() * 50000),
          following: 500 + Math.floor(Math.random() * 2000),
          posts: [
            {
              id: `mock_post_${index}_1`,
              text: 'Excited to announce our new project! 🎉',
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              likes: 150 + Math.floor(Math.random() * 500),
              comments: 20 + Math.floor(Math.random() * 50)
            },
            {
              id: `mock_post_${index}_2`,
              text: 'Great day at the office! 💼',
              timestamp: new Date(Date.now() - 172800000).toISOString(),
              likes: 100 + Math.floor(Math.random() * 300),
              comments: 10 + Math.floor(Math.random() * 30)
            }
          ]
        } : {
          found: false,
          error: 'Profile not found (mock)'
        },
        enrichmentMetadata: {
          cost: found ? 0.050 : 0,
          sources: found ? ['instagram'] : [],
          timestamp: new Date().toISOString()
        }
      }
    })

    const profilesFound = mockContacts.filter(c => c.instagram?.found).length
    const totalCost = profilesFound * 0.050

    const mockOutput: InstagramSearchOutput = {
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

    this.log(context, 'info', '🎭 Mock: Instagram search completed', {
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
