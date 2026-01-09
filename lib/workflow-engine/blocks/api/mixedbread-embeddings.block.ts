/**
 * Mixedbread Embeddings Block
 *
 * Generates vector embeddings for semantic search using Mixedbread API.
 * Wraps the existing Mixedbread service.
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'

// Import the existing service
import { MixedbreadService } from '@/lib/services/mixedbread'

export interface MixedbreadEmbeddingsConfig {
  apiToken: string // {{secrets.mixedbread}}
  items: Array<{
    id?: string
    text?: string
    content?: string
    [key: string]: any
  }> // {{input.contacts}} or {{input.items}}
  model?: string // Default: "mxbai-embed-large-v1"
  fields?: string[] // Fields to embed (default: ["text", "content"])
}

/**
 * Mixedbread Embeddings Block Executor
 */
export class MixedbreadEmbeddingsBlock extends BaseBlockExecutor {
  constructor() {
    super('api.mixedbread')
  }

  async execute(
    config: MixedbreadEmbeddingsConfig,
    input: any,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      this.log(context, 'info', 'Executing Mixedbread Embeddings block', {
        itemsCount: config.items?.length || 0,
        model: config.model || 'mxbai-embed-large-v1'
      })

      // Validate config
      if (!config.apiToken) {
        throw new Error('Mixedbread API token is required')
      }
      if (!config.items || !Array.isArray(config.items)) {
        throw new Error('Items array is required')
      }

      const service = new MixedbreadService(config.apiToken)
      const model = config.model || 'mxbai-embed-large-v1'
      const fields = config.fields || ['text', 'content']
      const batchSize = 10 // Mixedbread can handle batching

      this.log(context, 'info', `Generating embeddings for ${config.items.length} items`, {
        model,
        batchSize
      })

      const results: any[] = []
      let successful = 0
      let failed = 0

      // Process in batches
      for (let i = 0; i < config.items.length; i += batchSize) {
        const batch = config.items.slice(i, i + batchSize)

        this.log(context, 'debug', `Processing batch ${Math.floor(i / batchSize) + 1}`, {
          batchSize: batch.length
        })

        for (const item of batch) {
          try {
            // Extract text to embed
            const textToEmbed = this.extractText(item, fields)

            if (!textToEmbed) {
              this.log(context, 'warn', 'No text found to embed', {
                itemId: item.id
              })
              results.push({ ...item, embedding: null })
              failed++
              continue
            }

            // Generate embedding
            const embeddingResponse = await service.generateEmbedding({
              model,
              input: textToEmbed
            })
            const embedding = embeddingResponse.data[0].embedding

            results.push({
              ...item,
              embedding,
              embeddedAt: new Date().toISOString()
            })

            successful++
          } catch (error) {
            this.log(context, 'error', 'Failed to generate embedding', {
              itemId: item.id,
              error: (error as Error).message
            })
            results.push({ ...item, embedding: null })
            failed++
          }
        }

        // Update progress
        const progress = Math.round(((i + batchSize) / config.items.length) * 100)
        context.updateProgress(progress, {
          timestamp: new Date().toISOString(),
          event: 'embedding_progress',
          details: {
            processed: Math.min(i + batchSize, config.items.length),
            total: config.items.length,
            successful,
            failed
          }
        })
      }

      const executionTime = Date.now() - startTime

      const output = {
        items: results,
        metadata: {
          totalItems: config.items.length,
          successful,
          failed,
          model,
          embeddingDimension: 1024, // mxbai-embed-large-v1 dimension
          cost: 0, // Mixedbread pricing may vary
          currency: 'USD'
        }
      }

      this.log(context, 'info', 'Mixedbread Embeddings block completed', {
        executionTime,
        successful,
        failed,
        model
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
          successful,
          failed,
          model
        },
        logs: []
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'Mixedbread Embeddings block failed', {
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
   * Extract text from item based on configured fields
   */
  private extractText(item: any, fields: string[]): string {
    for (const field of fields) {
      if (item[field] && typeof item[field] === 'string') {
        return item[field]
      }
    }

    // If no field matches, try to concatenate all string fields
    const textParts: string[] = []
    for (const [key, value] of Object.entries(item)) {
      if (typeof value === 'string' && value.length > 0) {
        textParts.push(value)
      }
    }

    return textParts.join(' ')
  }
}
