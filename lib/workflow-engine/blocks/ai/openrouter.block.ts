/**
 * OpenRouter LLM Block
 *
 * Generic LLM block using OpenRouter API.
 * Supports any model available on OpenRouter.
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'
import { OpenRouterService } from '@/lib/services/openrouter'
import { MockDataGenerator } from '../../utils/mock-data-generator'

export interface OpenRouterConfig {
  apiToken: string // {{secrets.openrouter}}
  model: string // e.g., "mistralai/mistral-7b-instruct:free"
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  maxTokens?: number // Default: 1000
  temperature?: number // Default: 0.7
  topLevel?: number // Default: 1.0
  mock?: boolean // Enable mock mode for testing
}

/**
 * OpenRouter LLM Block Executor
 */
export class OpenRouterBlock extends BaseBlockExecutor {
  constructor() {
    super('ai.openrouter')
  }

  async execute(
    config: OpenRouterConfig,
    input: any,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      this.log(context, 'info', 'Executing OpenRouter LLM block', {
        model: config.model,
        messagesCount: config.messages.length,
        mock: config.mock || false
      })

      // Validate config
      if (!config.messages || !Array.isArray(config.messages)) {
        throw new Error('Messages array is required')
      }
      if (!config.model) {
        throw new Error('Model is required')
      }

      // Mock mode - skip API calls
      if (config.mock) {
        this.log(context, 'info', '🧪 MOCK MODE: Simulating OpenRouter LLM without API calls')

        // Simulate API latency
        await MockDataGenerator.simulateLatency(300, 1000)

        const mockResponse = MockDataGenerator.generateOpenRouterResponse(config.messages, config.model)

        this.log(context, 'info', 'OpenRouter LLM block completed (MOCK)', {
          executionTime: Date.now() - startTime,
          totalTokens: mockResponse.usage.totalTokens
        })

        return {
          status: 'completed',
          output: mockResponse,
          executionTime: Date.now() - startTime,
          error: undefined,
          retryCount: 0,
          startTime,
          endTime: Date.now(),
          metadata: {
            model: config.model,
            totalTokens: mockResponse.usage.totalTokens,
            mock: true
          },
          logs: []
        }
      }

      // Real API mode
      if (!config.apiToken) {
        throw new Error('OpenRouter API token is required (unless using mock mode)')
      }

      const service = new OpenRouterService(config.apiToken)

      // Call chat completion
      this.log(context, 'debug', 'Calling OpenRouter API')

      const response = await service.chatCompletion({
        model: config.model,
        messages: config.messages,
        max_tokens: config.maxTokens || 1000,
        temperature: config.temperature || 0.7,
        top_p: config.topLevel || 1.0
      })

      const executionTime = Date.now() - startTime

      const output = {
        content: response.choices[0]?.message?.content || '',
        model: response.model,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        },
        finishReason: response.choices[0]?.finish_reason,
        mock: false
      }

      this.log(context, 'info', 'OpenRouter LLM block completed', {
        executionTime,
        promptTokens: output.usage.promptTokens,
        completionTokens: output.usage.completionTokens,
        totalTokens: output.usage.totalTokens
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
          model: config.model,
          totalTokens: output.usage.totalTokens,
          mock: false
        },
        logs: []
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'OpenRouter LLM block failed', {
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
}
