// ============================================
// OpenRouter API - Production Service
// Real API calls to OpenRouter for LLM inference
// ============================================

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  top_k?: number
  frequency_penalty?: number
  presence_penalty?: number
  repetition_penalty?: number
  stream?: boolean
}

interface OpenRouterChoice {
  message: {
    role: string
    content: string
  }
  finish_reason: string
}

interface OpenRouterUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

interface OpenRouterResponse {
  id: string
  model: string
  choices: OpenRouterChoice[]
  usage: OpenRouterUsage
}

/**
 * Production service for OpenRouter API
 *
 * Endpoint: POST https://openrouter.ai/api/v1/chat/completions
 *
 * Documentation: https://openrouter.ai/docs/quick-start
 *
 * Required headers:
 * - Authorization: Bearer {API_KEY}
 * - HTTP-Referer: {YOUR_SITE_URL} (for ranking)
 * - X-Title: {YOUR_SITE_NAME} (for ranking)
 *
 * Costs: Varies by model (see https://openrouter.ai/models)
 */
export class OpenRouterService {
  private readonly baseUrl = 'https://openrouter.ai/api/v1'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Generate chat completion using OpenRouter
   *
   * POST https://openrouter.ai/api/v1/chat/completions
   *
   * @param request - Chat completion request
   * @returns Chat completion response
   */
  async chatCompletion(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    try {
      console.log('[OpenRouter] Calling chat completion for model:', request.model)

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lume.app',
          'X-Title': 'Lume - Lead Unified Mapping Enrichment',
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          max_tokens: request.max_tokens || 1000,
          temperature: request.temperature || 0.7,
          top_p: request.top_p || 1.0,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[OpenRouter] API error:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`)
      }

      const data: OpenRouterResponse = await response.json()

      console.log('[OpenRouter] Chat completion successful:', {
        id: data.id,
        model: data.model,
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      })

      return data
    } catch (error) {
      console.error('[OpenRouter] Request failed:', error)
      throw error
    }
  }

  /**
   * Extract contacts from text using LLM
   *
   * This is the main function for contact extraction from social media posts
   *
   * @param text - Text to extract contacts from (e.g., Facebook post, Instagram caption)
   * @param model - Model to use (default: mistralai/mistral-7b-instruct:free)
   * @returns Extracted contacts as JSON string
   */
  async extractContacts(text: string, model: string = 'mistralai/mistral-7b-instruct:free'): Promise<any> {
    const systemPrompt = `You are a contact extraction expert. Extract contact information from social media posts.

Extract ONLY contacts that are EXPLICITLY mentioned in the text.

Return a JSON array with this exact structure:
[
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "company": "Example Corp",
    "title": "CEO"
  }
]

Rules:
- ONLY extract contacts with at least firstName + lastName
- Include email if explicitly mentioned
- Include phone if explicitly mentioned
- Include company/title if mentioned
- If no valid contacts found, return empty array: []
- Return ONLY the JSON array, no explanations`

    const userPrompt = `Extract contacts from this text:\n\n${text}`

    try {
      const response = await this.chatCompletion({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for more consistent extraction
      })

      const content = response.choices[0]?.message?.content || '[]'

      // Try to parse JSON
      try {
        const contacts = JSON.parse(content)
        console.log('[OpenRouter] Extracted contacts:', contacts.length)
        return contacts
      } catch (parseError) {
        console.error('[OpenRouter] Failed to parse JSON from LLM response:', content)
        // Try to extract JSON from markdown code block
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1])
        }
        return []
      }
    } catch (error) {
      console.error('[OpenRouter] Contact extraction failed:', error)
      return []
    }
  }

  /**
   * Generate embeddings for contact (using a model that supports embeddings)
   *
   * Note: OpenRouter doesn't natively support embeddings.
   * For embeddings, use Mixedbread or OpenAI directly.
   *
   * This method is a placeholder for future implementation.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    console.warn('[OpenRouter] Embeddings not supported by OpenRouter. Use Mixedbread instead.')
    throw new Error('Embeddings not supported. Use Mixedbread service instead.')
  }

  /**
   * Check if the API key is valid by making a test call
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const result = await this.chatCompletion({
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          { role: 'user', content: 'Say "OK"' }
        ],
        max_tokens: 10,
      })

      return !!result.id
    } catch (error) {
      console.error('[OpenRouter] API key validation failed:', error)
      return false
    }
  }

  /**
   * List available models
   *
   * GET https://openrouter.ai/api/v1/models
   */
  async listModels(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.status}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('[OpenRouter] Failed to list models:', error)
      return []
    }
  }
}

/**
 * Factory function to create OpenRouter service
 */
export function createOpenRouterService(apiKey: string): OpenRouterService {
  return new OpenRouterService(apiKey)
}
