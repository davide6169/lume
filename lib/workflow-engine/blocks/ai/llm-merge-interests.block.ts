/**
 * LLM Merge Interests Block
 *
 * Merges interests from multiple sources (FullContact B2C, PDL B2B) using LLM.
 * Performs intelligent deduplication, combines similar items, prioritizes specific over generic.
 *
 * Different from Interest Inference:
 * - Interest Inference: Extracts interests from raw bio text
 * - LLM Merge: Combines already-extracted interests from multiple sources
 *
 * Features:
 * - Deduplicates similar interests
 * - Combines related items
 * - Prioritizes specific over generic
 * - Tracks source attribution
 * - Mock mode for testing
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'
import { OpenRouterService } from '@/lib/services/openrouter'

export interface LLMMergeInterestsConfig {
  apiToken: string // {{secrets.openrouter}}
  model?: string // Default: 'google/gemma-2-27b-it:free'
  mode?: 'live' | 'mock'
  enabled?: boolean
  maxInterests?: number // Default: 15
  temperature?: number // Default: 0.3 (lower for more deterministic merge)
}

export interface LLMMergeInterestsInput {
  contacts: Array<{
    original: Record<string, any>
    fullcontact?: {
      found: boolean
      interests?: string[]
    }
    pdl?: {
      found: boolean
      skills?: string[]
    }
  }>
}

export interface MergedInterests {
  interests: string[] // Merged and deduplicated interests
  sources: string[] // ['fullcontact'] or ['pdl'] or ['fullcontact', 'pdl']
  metadata: {
    fullcontactCount: number
    pdlCount: number
    mergedCount: number
    duplicatesRemoved: number
    mergeStrategy: string
  }
}

export interface LLMMergeInterestsOutput {
  contacts: Array<{
    original: Record<string, any>
    mergedInterests?: MergedInterests
  }>
  metadata: {
    totalInput: number
    totalProcessed: number
    totalCost: number
    avgCostPerContact: number
    fromFullContactOnly: number
    fromPDLOnly: number
    fromBoth: number
  }
}

/**
 * LLM Merge Interests Block Executor
 */
export class LLMMergeInterestsBlock extends BaseBlockExecutor {
  static supportsMock: boolean = true
  private costPerMerge = 0.01

  constructor() {
    super('ai.llmMergeInterests')
  }

  async execute(
    config: LLMMergeInterestsConfig,
    input: LLMMergeInterestsInput,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      // 🎭 MOCK MODE: Check if we should use mock data
      const shouldMock = config.mode === 'mock' || context.mode === 'demo' || context.mode === 'test'

      if (shouldMock) {
        return await this.executeMock(config, input, context, startTime)
      }

      // LIVE MODE
      if (!config.apiToken) {
        throw new Error('OpenRouter API token is required (unless using mock mode)')
      }

      this.log(context, 'info', 'Merging interests from multiple sources using LLM', {
        contactsCount: input.contacts.length,
        model: config.model || 'google/gemma-2-27b-it:free'
      })

      const results = await this.mergeContacts(config, input.contacts, context)

      const executionTime = Date.now() - startTime

      this.log(context, 'info', 'LLM merge completed', {
        totalProcessed: results.metadata.totalProcessed,
        totalCost: results.metadata.totalCost.toFixed(2)
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
      this.log(context, 'error', 'LLM merge failed', {
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
   * Merge interests for all contacts
   */
  private async mergeContacts(
    config: LLMMergeInterestsConfig,
    contacts: Array<any>,
    context: ExecutionContext
  ): Promise<LLMMergeInterestsOutput> {
    const results: LLMMergeInterestsOutput['contacts'] = []
    let fromFullContactOnly = 0
    let fromPDLOnly = 0
    let fromBoth = 0
    let totalCost = 0

    const openrouterService = new OpenRouterService(config.apiToken)

    for (const contact of contacts) {
      const hasFullContact = contact.fullcontact?.found === true && contact.fullcontact.interests?.length > 0
      const hasPDL = contact.pdl?.found === true && contact.pdl.skills?.length > 0

      if (hasFullContact && !hasPDL) fromFullContactOnly++
      if (!hasFullContact && hasPDL) fromPDLOnly++
      if (hasFullContact && hasPDL) fromBoth++

      const mergedData = await this.mergeContactInterests(
        config,
        contact,
        openrouterService,
        context
      )

      totalCost += this.costPerMerge

      results.push({
        original: contact.original,
        mergedInterests: mergedData
      })
    }

    return {
      contacts: results,
      metadata: {
        totalInput: contacts.length,
        totalProcessed: contacts.length,
        totalCost,
        avgCostPerContact: totalCost / contacts.length,
        fromFullContactOnly,
        fromPDLOnly,
        fromBoth
      }
    }
  }

  /**
   * Merge interests for single contact using LLM
   */
  private async mergeContactInterests(
    config: LLMMergeInterestsConfig,
    contact: any,
    openrouterService: OpenRouterService,
    context: ExecutionContext
  ): Promise<MergedInterests | undefined> {
    const fullcontactInterests = contact.fullcontact?.interests || []
    const pdlSkills = contact.pdl?.skills || []

    // If no data from both sources, return undefined
    if (fullcontactInterests.length === 0 && pdlSkills.length === 0) {
      return undefined
    }

    // If only one source has data, no merge needed
    if (fullcontactInterests.length > 0 && pdlSkills.length === 0) {
      return {
        interests: fullcontactInterests.slice(0, config.maxInterests || 15),
        sources: ['fullcontact'],
        metadata: {
          fullcontactCount: fullcontactInterests.length,
          pdlCount: 0,
          mergedCount: Math.min(fullcontactInterests.length, config.maxInterests || 15),
          duplicatesRemoved: 0,
          mergeStrategy: 'single-source'
        }
      }
    }

    if (pdlSkills.length > 0 && fullcontactInterests.length === 0) {
      return {
        interests: pdlSkills.slice(0, config.maxInterests || 15),
        sources: ['pdl'],
        metadata: {
          fullcontactCount: 0,
          pdlCount: pdlSkills.length,
          mergedCount: Math.min(pdlSkills.length, config.maxInterests || 15),
          duplicatesRemoved: 0,
          mergeStrategy: 'single-source'
        }
      }
    }

    // Both sources have data - use LLM to merge
    try {
      const prompt = this.buildMergePrompt(fullcontactInterests, pdlSkills, config.maxInterests || 15)

      const response = await openrouterService.chatCompletion({
        model: config.model || 'google/gemma-2-27b-it:free',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at merging and deduplicating interest lists. Always respond with a valid JSON array of strings, nothing else.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: config.temperature || 0.3
      })

      const content = response.choices[0]?.message?.content || '[]'
      const mergedInterests = JSON.parse(content)

      return {
        interests: mergedInterests,
        sources: ['fullcontact', 'pdl'],
        metadata: {
          fullcontactCount: fullcontactInterests.length,
          pdlCount: pdlSkills.length,
          mergedCount: mergedInterests.length,
          duplicatesRemoved: fullcontactInterests.length + pdlSkills.length - mergedInterests.length,
          mergeStrategy: 'llm-dedupe-merge'
        }
      }

    } catch (error) {
      this.log(context, 'warn', 'LLM merge failed, using simple concatenation', {
        error: (error as Error).message
      })

      // Fallback: simple concatenation with deduplication
      const allInterests = [...fullcontactInterests, ...pdlSkills]
      const uniqueInterests = Array.from(new Set(allInterests))

      return {
        interests: uniqueInterests.slice(0, config.maxInterests || 15),
        sources: ['fullcontact', 'pdl'],
        metadata: {
          fullcontactCount: fullcontactInterests.length,
          pdlCount: pdlSkills.length,
          mergedCount: Math.min(uniqueInterests.length, config.maxInterests || 15),
          duplicatesRemoved: allInterests.length - uniqueInterests.length,
          mergeStrategy: 'simple-dedupe-fallback'
        }
      }
    }
  }

  /**
   * Build prompt for LLM merge
   */
  private buildMergePrompt(fullcontactInterests: string[], pdlSkills: string[], maxInterests: number): string {
    return `Merge these two lists into a unified interest list:

**FullContact (B2C Personal Interests):**
${fullcontactInterests.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

**PDL (B2B Professional Skills):**
${pdlSkills.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

**Requirements:**
1. Remove duplicates and very similar items
2. Combine related items when it makes sense
3. Prioritize specific terms over generic ones
4. Keep maximum ${maxInterests} items
5. Return ONLY a JSON array of strings, no other text

**Response format:**
["Interest 1", "Interest 2", "Interest 3", ...]`
  }

  /**
   * Mock mode - returns merged mock data
   */
  private async executeMock(
    config: LLMMergeInterestsConfig,
    input: LLMMergeInterestsInput,
    context: ExecutionContext,
    startTime: number
  ) {
    await this.sleep(500) // Simulate LLM processing

    const mockContacts: LLMMergeInterestsOutput['contacts'] = input.contacts.map(contact => {
      const hasFullContact = contact.fullcontact?.found === true && contact.fullcontact.interests?.length > 0
      const hasPDL = contact.pdl?.found === true && contact.pdl.skills?.length > 0

      if (!hasFullContact && !hasPDL) {
        return { original: contact.original }
      }

      // Generate realistic merged interests
      const mockInterests = this.generateMockMergedInterests(hasFullContact, hasPDL)

      return {
        original: contact.original,
        mergedInterests: mockInterests
      }
    })

    const fromFullContactOnly = mockContacts.filter(c =>
      c.mergedInterests?.sources.length === 1 && c.mergedInterests?.sources[0] === 'fullcontact'
    ).length
    const fromPDLOnly = mockContacts.filter(c =>
      c.mergedInterests?.sources.length === 1 && c.mergedInterests?.sources[0] === 'pdl'
    ).length
    const fromBoth = mockContacts.filter(c =>
      c.mergedInterests?.sources.length === 2
    ).length

    const mockOutput: LLMMergeInterestsOutput = {
      contacts: mockContacts,
      metadata: {
        totalInput: input.contacts.length,
        totalProcessed: input.contacts.length,
        totalCost: 0,
        avgCostPerContact: 0,
        fromFullContactOnly,
        fromPDLOnly,
        fromBoth
      }
    }

    const executionTime = Date.now() - startTime

    this.log(context, 'info', '🎭 Mock: LLM merge completed', {
      totalProcessed: mockOutput.metadata.totalProcessed
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
   * Generate mock merged interests
   */
  private generateMockMergedInterests(hasFullContact: boolean, hasPDL: boolean): MergedInterests {
    if (hasFullContact && !hasPDL) {
      return {
        interests: ['Travel', 'Photography', 'Food', 'Technology', 'Fitness'],
        sources: ['fullcontact'],
        metadata: {
          fullcontactCount: 5,
          pdlCount: 0,
          mergedCount: 5,
          duplicatesRemoved: 0,
          mergeStrategy: 'single-source'
        }
      }
    }

    if (!hasFullContact && hasPDL) {
      return {
        interests: ['Business Strategy', 'Management', 'Sales', 'Marketing', 'Finance'],
        sources: ['pdl'],
        metadata: {
          fullcontactCount: 0,
          pdlCount: 5,
          mergedCount: 5,
          duplicatesRemoved: 0,
          mergeStrategy: 'single-source'
        }
      }
    }

    // Both sources
    return {
      interests: [
        'Travel',
        'Photography',
        'Business Strategy',
        'Management',
        'Technology',
        'Marketing',
        'Fitness',
        'Sales'
      ],
      sources: ['fullcontact', 'pdl'],
      metadata: {
        fullcontactCount: 5,
        pdlCount: 5,
        mergedCount: 8,
        duplicatesRemoved: 2, // Technology was in both
        mergeStrategy: 'llm-dedupe-merge'
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
