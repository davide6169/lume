/**
 * Bio Data Filter Block
 *
 * Filters contacts that have bio data from LinkedIn or Instagram.
 * Routes contacts with bio data to interest inference, others to assembler.
 *
 * Input: Array of contacts with linkedin/instagram data
 * Output: Filtered contacts separated by hasBio (true/false)
 *
 * Features:
 * - Check for LinkedIn bio/headline
 * - Check for Instagram bio
 * - Configurable minimum bio length
 * - Optional post count requirement
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'

// Types
export interface HasBioDataFilterConfig {
  requireBio?: boolean // Require bio text (default: true)
  minBioLength?: number // Minimum bio length in chars (default: 10)
  requirePosts?: boolean // Require at least N posts (default: false)
  minPostCount?: number // Minimum post count (default: 1)
  checkLinkedIn?: boolean // Check LinkedIn data (default: true)
  checkInstagram?: boolean // Check Instagram data (default: true)
}

export interface HasBioDataFilterInput {
  contacts: Array<{
    original: Record<string, any>
    linkedin?: {
      found: boolean
      bio?: string
      headline?: string
      [key: string]: any
    }
    instagram?: {
      found: boolean
      bio?: string
      posts?: Array<any>
      [key: string]: any
    }
    [key: string]: any
  }>
}

export interface HasBioDataFilterOutput {
  hasBio: Array<{
    original: Record<string, any>
    linkedin?: any
    instagram?: any
    bioSources: string[]
    bioText: string
    postCount: number
  }>
  noBio: Array<{
    original: Record<string, any>
    linkedin?: any
    instagram?: any
    reason: string
  }>
  metadata: {
    totalInput: number
    hasBioCount: number
    noBioCount: number
    linkedinBioCount: number
    instagramBioCount: number
    bothSourcesCount: number
  }
}

/**
 * Bio Data Filter Block
 */
export class HasBioDataFilterBlock extends BaseBlockExecutor {
  constructor() {
    super('filter.hasBioData')
  }

  async execute(
    config: HasBioDataFilterConfig,
    input: HasBioDataFilterInput,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      // Check for mock mode
      const shouldMock = context.mode === 'demo' || context.mode === 'test'

      if (shouldMock) {
        this.log(context, 'info', '🎭 MOCK MODE: Simulating bio data filter')
        return await this.executeMock(config, input, context, startTime)
      }

      this.log(context, 'info', 'Filtering contacts with bio data', {
        contactsCount: input.contacts.length,
        requireBio: config.requireBio !== false,
        minBioLength: config.minBioLength || 10
      })

      // Validate input
      if (!input.contacts || !Array.isArray(input.contacts)) {
        throw new Error('Input must have contacts array')
      }

      // Filter contacts
      const result = this.filterContacts(input, config)

      const executionTime = Date.now() - startTime

      this.log(context, 'info', 'Bio data filter completed', {
        totalInput: result.metadata.totalInput,
        hasBioCount: result.metadata.hasBioCount,
        noBioCount: result.metadata.noBioCount,
        linkedinBioCount: result.metadata.linkedinBioCount,
        instagramBioCount: result.metadata.instagramBioCount
      })

      return {
        status: 'completed',
        output: result,
        executionTime,
        error: undefined,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: result.metadata,
        logs: []
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'Bio data filter failed', {
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
   * Filter contacts by bio data availability
   */
  private filterContacts(
    input: HasBioDataFilterInput,
    config: HasBioDataFilterConfig
  ): HasBioDataFilterOutput {
    const requireBio = config.requireBio !== false
    const minBioLength = config.minBioLength || 10
    const requirePosts = config.requirePosts === true
    const minPostCount = config.minPostCount || 1
    const checkLinkedIn = config.checkLinkedIn !== false
    const checkInstagram = config.checkInstagram !== false

    const hasBio: HasBioDataFilterOutput['hasBio'] = []
    const noBio: HasBioDataFilterOutput['noBio'] = []
    let linkedinBioCount = 0
    let instagramBioCount = 0
    let bothSourcesCount = 0

    for (const contact of input.contacts) {
      const bioCheck = this.checkBioData(contact, {
        requireBio,
        minBioLength,
        requirePosts,
        minPostCount,
        checkLinkedIn,
        checkInstagram
      })

      if (bioCheck.hasBio) {
        // Count sources
        if (bioCheck.linkedinBio) linkedinBioCount++
        if (bioCheck.instagramBio) instagramBioCount++
        if (bioCheck.linkedinBio && bioCheck.instagramBio) bothSourcesCount++

        hasBio.push({
          original: contact.original,
          linkedin: contact.linkedin,
          instagram: contact.instagram,
          bioSources: bioCheck.sources,
          bioText: bioCheck.bioText,
          postCount: bioCheck.postCount
        })
      } else {
        noBio.push({
          original: contact.original,
          linkedin: contact.linkedin,
          instagram: contact.instagram,
          reason: bioCheck.reason
        })
      }
    }

    return {
      hasBio,
      noBio,
      metadata: {
        totalInput: input.contacts.length,
        hasBioCount: hasBio.length,
        noBioCount: noBio.length,
        linkedinBioCount,
        instagramBioCount,
        bothSourcesCount
      }
    }
  }

  /**
   * Check if contact has bio data
   */
  private checkBioData(
    contact: any,
    config: {
      requireBio: boolean
      minBioLength: number
      requirePosts: boolean
      minPostCount: number
      checkLinkedIn: boolean
      checkInstagram: boolean
    }
  ): {
    hasBio: boolean
    linkedinBio: boolean
    instagramBio: boolean
    sources: string[]
    bioText: string
    postCount: number
    reason?: string
  } {
    const sources: string[] = []
    const bioParts: string[] = []
    let postCount = 0
    let linkedinBio = false
    let instagramBio = false

    // Check LinkedIn
    if (config.checkLinkedIn && contact.linkedin?.found) {
      const li = contact.linkedin
      const liBio = li.bio || li.headline || ''

      if (liBio && liBio.length >= config.minBioLength) {
        linkedinBio = true
        sources.push('linkedin')
        bioParts.push(liBio)
      }
    }

    // Check Instagram
    if (config.checkInstagram && contact.instagram?.found) {
      const ig = contact.instagram
      const igBio = ig.bio || ''

      if (igBio && igBio.length >= config.minBioLength) {
        instagramBio = true
        sources.push('instagram')
        bioParts.push(igBio)
      }

      // Count posts
      if (ig.posts && Array.isArray(ig.posts)) {
        postCount += ig.posts.length
      }
    }

    // Combine bio text
    const bioText = bioParts.join(' \n\n---\n\n ')

    // Check requirements
    if (config.requireBio && sources.length === 0) {
      return {
        hasBio: false,
        linkedinBio: false,
        instagramBio: false,
        sources: [],
        bioText: '',
        postCount: 0,
        reason: 'No bio data found'
      }
    }

    if (bioText.length > 0 && bioText.length < config.minBioLength) {
      return {
        hasBio: false,
        linkedinBio,
        instagramBio,
        sources,
        bioText,
        postCount,
        reason: `Bio too short (${bioText.length}/${config.minBioLength} chars)`
      }
    }

    if (config.requirePosts && postCount < config.minPostCount) {
      return {
        hasBio: false,
        linkedinBio,
        instagramBio,
        sources,
        bioText,
        postCount,
        reason: `Not enough posts (${postCount}/${config.minPostCount})`
      }
    }

    return {
      hasBio: true,
      linkedinBio,
      instagramBio,
      sources,
      bioText,
      postCount
    }
  }

  /**
   * Execute in mock mode - returns sample filtered contacts
   */
  private async executeMock(
    config: HasBioDataFilterConfig,
    input: HasBioDataFilterInput,
    context: ExecutionContext,
    startTime: number
  ) {
    await this.sleep(100) // Simulate processing latency

    // Mock: 2/3 have bio data
    const mockHasBio: HasBioDataFilterOutput['hasBio'] = []
    const mockNoBio: HasBioDataFilterOutput['noBio'] = []

    input.contacts.forEach((contact, index) => {
      const hasBio = index % 3 !== 2 // 2 out of 3 have bio

      if (hasBio) {
        mockHasBio.push({
          original: contact.original,
          linkedin: contact.linkedin,
          instagram: contact.instagram,
          bioSources: ['instagram'],
          bioText: 'Tech enthusiast and entrepreneur. Passionate about innovation and digital transformation.',
          postCount: 12
        })
      } else {
        mockNoBio.push({
          original: contact.original,
          linkedin: contact.linkedin,
          instagram: contact.instagram,
          reason: 'No bio data found'
        })
      }
    })

    const mockOutput: HasBioDataFilterOutput = {
      hasBio: mockHasBio,
      noBio: mockNoBio,
      metadata: {
        totalInput: input.contacts.length,
        hasBioCount: mockHasBio.length,
        noBioCount: mockNoBio.length,
        linkedinBioCount: Math.floor(mockHasBio.length / 2),
        instagramBioCount: mockHasBio.length,
        bothSourcesCount: Math.floor(mockHasBio.length / 2)
      }
    }

    const executionTime = Date.now() - startTime

    this.log(context, 'info', '🎭 Mock: Bio data filter completed', {
      totalInput: mockOutput.metadata.totalInput,
      hasBioCount: mockOutput.metadata.hasBioCount,
      noBioCount: mockOutput.metadata.noBioCount
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
