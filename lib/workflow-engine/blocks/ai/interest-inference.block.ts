/**
 * AI Interest Inference Block
 *
 * Infers user interests and preferences from social media data,
 * bio, posts, and other text content using OpenRouter LLM.
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'
import { OpenRouterService } from '@/lib/services/openrouter'

export interface InterestInferenceConfig {
  apiToken: string // {{secrets.openrouter}}
  data: Array<{
    id?: string
    text?: string
    bio?: string
    posts?: string[]
    hashtags?: string[]
    [key: string]: any
  }> // {{input.contacts}}
  model?: string // Default: "mistralai/mistral-7b-instruct:free"
  maxInterests?: number // Default: 10 per contact
}

/**
 * AI Interest Inference Block Executor
 */
export class InterestInferenceBlock extends BaseBlockExecutor {
  constructor() {
    super('ai.interestInference')
  }

  async execute(
    config: InterestInferenceConfig,
    input: any,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      this.log(context, 'info', 'Executing AI Interest Inference block', {
        dataCount: config.data?.length || 0,
        model: config.model || 'mistralai/mistral-7b-instruct:free'
      })

      // Validate config
      if (!config.apiToken) {
        throw new Error('OpenRouter API token is required')
      }
      if (!config.data || !Array.isArray(config.data)) {
        throw new Error('Data array is required')
      }

      const service = new OpenRouterService(config.apiToken)
      const model = config.model || 'mistralai/mistral-7b-instruct:free'
      const maxInterests = config.maxInterests || 10

      this.log(context, 'info', `Inferring interests for ${config.data.length} contacts`, {
        maxInterests
      })

      const results: any[] = []
      let totalInterests = 0

      // Process each contact
      for (let i = 0; i < config.data.length; i++) {
        const contact = config.data[i]
        this.log(context, 'debug', `Processing contact ${i + 1}/${config.data.length}`)

        try {
          // Build prompt for this contact
          const prompt = this.buildInterestInferencePrompt(contact)
          const interests = await this.inferInterests(service, prompt, model, maxInterests)

          results.push({
            ...contact,
            interests,
            interestsInferred: true,
            inferredAt: new Date().toISOString()
          })

          totalInterests += interests.length

          // Update progress
          const progress = Math.round(((i + 1) / config.data.length) * 100)
          context.updateProgress(progress, {
            timestamp: new Date().toISOString(),
            event: 'interest_inference_progress',
            details: {
              processed: i + 1,
              total: config.data.length,
              totalInterests
            }
          })
        } catch (error) {
          this.log(context, 'warn', `Failed to infer interests for contact ${i + 1}`, {
            error: (error as Error).message
          })
          results.push({
            ...contact,
            interests: [],
            interestsInferred: false,
            inferenceError: (error as Error).message
          })
        }
      }

      const executionTime = Date.now() - startTime

      const output = {
        contacts: results,
        metadata: {
          totalContacts: config.data.length,
          totalInterests,
          avgInterestsPerContact: totalInterests / config.data.length,
          maxInterests,
          model
        }
      }

      this.log(context, 'info', 'Interest inference completed', {
        executionTime,
        totalContacts: config.data.length,
        totalInterests,
        avgInterestsPerContact: (totalInterests / config.data.length).toFixed(2)
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
          totalInterests
        },
        logs: []
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'AI Interest Inference block failed', {
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
   * Build prompt for interest inference
   */
  private buildInterestInferencePrompt(contact: any): string {
    const parts: string[] = []

    parts.push('Analyze this person\'s social media data and infer their interests.')

    if (contact.bio) {
      parts.push(`Bio: "${contact.bio}"`)
    }

    if (contact.posts && Array.isArray(contact.posts) && contact.posts.length > 0) {
      const samplePosts = contact.posts.slice(0, 5) // Max 5 posts
      parts.push(`Recent posts:\n${samplePosts.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}`)
    }

    if (contact.text) {
      parts.push(`Text: "${contact.text}"`)
    }

    if (contact.hashtags && Array.isArray(contact.hashtags) && contact.hashtags.length > 0) {
      parts.push(`Hashtags: ${contact.hashtags.join(', ')}`)
    }

    parts.push(`
Return a JSON array of inferred interests with this structure:
[
  {
    "topic": "technology",
    "confidence": 0.95,
    "category": "professional"
  }
]

Rules:
- Infer 5-10 interests per person
- Assign confidence score (0-1)
- Categorize as: professional, personal, hobby, entertainment, sports, travel, food, etc.
- Base interests on explicit content and reasonable inference
- Return ONLY the JSON array, no explanations`)

    return parts.join('\n\n')
  }

  /**
   * Call LLM to infer interests
   */
  private async inferInterests(
    service: OpenRouterService,
    prompt: string,
    model: string,
    maxInterests: number
  ): Promise<Array<{ topic: string; confidence: number; category: string }>> {
    const response = await service.chatCompletion({
      model,
      messages: [
        { role: 'system', content: 'You are an expert at analyzing social media data and inferring user interests and preferences.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.5
    })

    const content = response.choices[0]?.message?.content || '[]'

    try {
      // Parse JSON response
      let interests = JSON.parse(content)

      // Handle markdown code blocks
      if (!Array.isArray(interests)) {
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          interests = JSON.parse(jsonMatch[1])
        }
      }

      // Validate and limit
      if (Array.isArray(interests)) {
        return interests
          .filter((i: any) => i.topic && typeof i.confidence === 'number')
          .slice(0, maxInterests)
      }

      return []
    } catch (error) {
      console.error('Failed to parse interests:', content)
      return []
    }
  }
}
