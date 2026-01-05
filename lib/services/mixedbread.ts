// ============================================
// Mixedbread AI API - Production Service
// Real API calls to Mixedbread for text embeddings
// ============================================

interface MixedbreadEmbeddingRequest {
  model: string
  input: string | string[]
  encoding_format?: 'float' | 'base64'
}

interface MixedbreadUsage {
  prompt_tokens: number
  total_tokens: number
}

interface MixedbreadEmbeddingResponse {
  model: string
  data: Array<{
    embedding: number[]
    index: number
    object: 'embedding'
  }>
  usage: MixedbreadUsage
}

interface MixedbreadEmbeddingBatchResponse {
  model: string
  data: Array<{
    embedding: number[]
    index: number
    object: 'embedding'
  }>
  usage: MixedbreadUsage
}

/**
 * Production service for Mixedbread AI API
 *
 * Endpoint: POST https://api.mixedbread.ai/v1/embeddings
 *
 * Documentation: https://docs.mixedbread.ai
 *
 * Required headers:
 * - Authorization: Bearer {API_KEY}
 *
 * Models:
 * - mixedbread-ai/mxbai-embed-large-v1: 1024 dimensions, high quality
 * - mixedbread-ai/mxbai-embed-small-v1: 384 dimensions, faster
 *
 * Costs:
 * - Free tier: 10,000 requests/month
 * - Pay-as-you-go: €0.00001 per 1K tokens
 */
export class MixedbreadService {
  private readonly baseUrl = 'https://api.mixedbread.ai/v1'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Generate embeddings for a single text
   *
   * POST https://api.mixedbread.ai/v1/embeddings
   *
   * @param request - Embedding request
   * @returns Embedding response
   */
  async generateEmbedding(request: MixedbreadEmbeddingRequest): Promise<MixedbreadEmbeddingResponse> {
    try {
      console.log('[Mixedbread] Generating embedding for model:', request.model)

      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          input: request.input,
          encoding_format: request.encoding_format || 'float',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Mixedbread] API error:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`Mixedbread API error: ${response.status} ${errorText}`)
      }

      const data: MixedbreadEmbeddingResponse = await response.json()

      console.log('[Mixedbread] Embedding generated successfully:', {
        model: data.model,
        dimensions: data.data[0]?.embedding.length,
        promptTokens: data.usage.prompt_tokens,
        totalTokens: data.usage.total_tokens,
      })

      return data
    } catch (error) {
      console.error('[Mixedbread] Request failed:', error)
      throw error
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   *
   * @param texts - Array of texts to embed
   * @param model - Model to use (default: mxbai-embed-large-v1)
   * @returns Array of embeddings
   */
  async generateEmbeddingsBatch(texts: string[], model: string = 'mixedbread-ai/mxbai-embed-large-v1'): Promise<number[][]> {
    if (texts.length === 0) {
      return []
    }

    try {
      console.log(`[Mixedbread] Generating embeddings for ${texts.length} texts`)

      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: texts,
          encoding_format: 'float',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Mixedbread] Batch API error:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`Mixedbread batch API error: ${response.status} ${errorText}`)
      }

      const data: MixedbreadEmbeddingBatchResponse = await response.json()

      // Extract embeddings in order
      const embeddings = data.data
        .sort((a, b) => a.index - b.index)
        .map(item => item.embedding)

      console.log('[Mixedbread] Batch embeddings generated successfully:', {
        count: embeddings.length,
        model: data.model,
        dimensions: embeddings[0]?.length,
        totalTokens: data.usage.total_tokens,
      })

      return embeddings
    } catch (error) {
      console.error('[Mixedbread] Batch request failed:', error)
      throw error
    }
  }

  /**
   * Generate embedding for a contact (for similarity search)
   *
   * Creates a searchable text representation of the contact and embeds it
   *
   * @param contact - Contact object with name, email, etc.
   * @param model - Model to use (default: mxbai-embed-large-v1)
   * @returns Embedding vector
   */
  async embedContact(
    contact: {
      firstName?: string
      lastName?: string
      email?: string
      company?: string
      title?: string
      location?: string
    },
    model: string = 'mixedbread-ai/mxbai-embed-large-v1'
  ): Promise<number[]> {
    // Create a searchable text representation
    const searchText = [
      contact.firstName || '',
      contact.lastName || '',
      contact.email || '',
      contact.company || '',
      contact.title || '',
      contact.location || '',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (!searchText) {
      throw new Error('Contact has no searchable text')
    }

    try {
      const response = await this.generateEmbedding({
        model,
        input: searchText,
      })

      return response.data[0].embedding
    } catch (error) {
      console.error('[Mixedbread] Failed to embed contact:', error)
      throw error
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   *
   * @param embedding1 - First embedding vector
   * @param embedding2 - Second embedding vector
   * @returns Similarity score between 0 and 1
   */
  cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length')
    }

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i]
      norm1 += embedding1[i] * embedding1[i]
      norm2 += embedding2[i] * embedding2[i]
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * Find most similar contacts using vector similarity
   *
   * @param queryEmbedding - Query embedding vector
   * @param contactEmbeddings - Array of [embedding, contactId] tuples
   * @param topK - Number of results to return (default: 5)
   * @returns Array of [contactId, similarity] sorted by similarity
   */
  findSimilar(
    queryEmbedding: number[],
    contactEmbeddings: Array<{ embedding: number[]; contactId: string }>,
    topK: number = 5
  ): Array<{ contactId: string; similarity: number }> {
    const similarities = contactEmbeddings.map(({ embedding, contactId }) => ({
      contactId,
      similarity: this.cosineSimilarity(queryEmbedding, embedding),
    }))

    // Sort by similarity descending
    similarities.sort((a, b) => b.similarity - a.similarity)

    // Return top K
    return similarities.slice(0, topK)
  }

  /**
   * Check if the API key is valid by making a test call
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const result = await this.generateEmbedding({
        model: 'mixedbread-ai/mxbai-embed-large-v1',
        input: 'test',
      })

      return !!result.model
    } catch (error) {
      console.error('[Mixedbread] API key validation failed:', error)
      return false
    }
  }

  /**
   * Get embedding dimensions for a model
   *
   * @param model - Model name
   * @returns Embedding dimensions
   */
  getModelDimensions(model: string): number {
    const dimensions: Record<string, number> = {
      'mixedbread-ai/mxbai-embed-large-v1': 1024,
      'mixedbread-ai/mxbai-embed-small-v1': 384,
    }

    return dimensions[model] || 1024
  }
}

/**
 * Factory function to create Mixedbread service
 */
export function createMixedbreadService(apiKey: string): MixedbreadService {
  return new MixedbreadService(apiKey)
}
