/**
 * Apify Scraper Block
 *
 * Scrapes comments from Facebook and Instagram posts using Apify actors.
 * Wraps the existing ApifyScraperService.
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'

// Import the existing service
import { ApifyScraperService } from '@/lib/services/apify-scraper'

export interface ApifyScraperConfig {
  apiToken: string // {{secrets.apify}}
  platform: 'facebook' | 'instagram' // {{input.platform}}
  url: string // {{input.url}}
  limit?: number // Default: 100 for FB, 1000 for IG
}

/**
 * Apify Scraper Block Executor
 */
export class ApifyScraperBlock extends BaseBlockExecutor {
  constructor() {
    super('api.apify')
  }

  async execute(
    config: ApifyScraperConfig,
    input: any,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      this.log(context, 'info', 'Executing Apify Scraper block', {
        platform: config.platform,
        url: config.url
      })

      // Validate config
      if (!config.apiToken) {
        throw new Error('Apify API token is required')
      }
      if (!config.url) {
        throw new Error('URL is required')
      }
      if (!config.platform) {
        throw new Error('Platform (facebook/instagram) is required')
      }

      // Initialize service
      const service = new ApifyScraperService(config.apiToken)

      // Validate token
      this.log(context, 'debug', 'Validating Apify token')
      const tokenValidation = await service.validateToken()
      if (!tokenValidation.valid) {
        throw new Error(`Apify token validation failed: ${tokenValidation.error}`)
      }

      this.log(context, 'debug', 'Token valid', {
        appName: tokenValidation.appName
      })

      // Fetch comments based on platform
      let comments: any[] = []
      const limit = config.limit || (config.platform === 'facebook' ? 100 : 1000)

      this.log(context, 'info', `Fetching ${config.platform} comments`, {
        limit
      })

      if (config.platform === 'facebook') {
        comments = await service.fetchFacebookComments(config.url, { limit })
      } else if (config.platform === 'instagram') {
        comments = await service.fetchInstagramComments(config.url, { limit })
      } else {
        throw new Error(`Invalid platform: ${config.platform}`)
      }

      this.log(context, 'info', `Fetched ${comments.length} comments`)

      const executionTime = Date.now() - startTime

      // Format output
      const output = {
        platform: config.platform,
        url: config.url,
        comments,
        metadata: {
          totalComments: comments.length,
          limit,
          fetchedAt: new Date().toISOString()
        }
      }

      this.log(context, 'info', 'Apify Scraper block completed', {
        executionTime,
        commentsCount: comments.length
      })

      return {
        status: 'completed',
        output,
        executionTime,
        error: undefined,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {
          commentsCount: comments.length,
          platform: config.platform
        },
        logs: []
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'Apify Scraper block failed', {
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
   * Validate input against schema
   */
  async validateInput(input: any, schema: any): Promise<boolean> {
    // Basic validation
    if (schema && schema.type === 'object') {
      if (schema.required) {
        for (const field of schema.required) {
          if (!(field in input)) {
            return false
          }
        }
      }
    }
    return true
  }

  /**
   * Validate output against schema
   */
  async validateOutput(output: any, schema: any): Promise<boolean> {
    if (!schema) return true

    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in output)) {
          return false
        }
      }
    }

    return true
  }
}
