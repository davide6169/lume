// ============================================
// API Usage Tracking Services
// Simulates real API usage endpoints for cost calculation
// ============================================

// Extend globalThis for HMR persistence (like JobProcessor)
declare global {
  var __apiUsageCounters: {
    openrouter_prompt: number
    openrouter_completion: number
    openrouter_total: number
    mixedbread_total: number
    apollo_enrichments: number
    hunter_finder_calls: number
    hunter_verifier_calls: number
    meta_calls: number
  } | undefined
}

interface OpenRouterUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

interface OpenRouterUsageResponse {
  data: {
    usage: OpenRouterUsage
  }
}

interface MixedbreadUsage {
  prompt_tokens: number
  total_tokens: number
}

interface MixedbreadUsageResponse {
  data: {
    usage: MixedbreadUsage
  }
}

interface ApolloUsage {
  credits_remaining: number
  credits_used: number
}

interface ApolloUsageResponse {
  data: {
    credits_remaining: number
    credits_used_this_month: number
  }
}

interface HunterUsage {
  emails_remaining: number
  emails_found: number
  verifications_remaining: number
}

interface HunterUsageResponse {
  data: {
    api_calls: {
      email_finder: {
        calls_remaining: number
        calls_used: number
      }
      email_verifier: {
        calls_remaining: number
        calls_used: number
      }
    }
  }
}

interface MetaUsage {
  rate_limit_remaining: number
  rate_limit_used: number
}

interface MetaUsageResponse {
  data: {
    usage: MetaUsage
  }
}

/**
 * Simulates real API usage endpoints for demo mode
 * Returns realistic usage data for cost calculation
 */
export class APIUsageStubService {
  private baseUrl = '/api'
  private counters

  constructor() {
    // Use globalThis to persist across HMR
    console.log('[APIUsageStubService] Constructor called')
    if (typeof globalThis !== 'undefined') {
      console.log('[APIUsageStubService] globalThis exists')
      console.log('[APIUsageStubService] globalThis.__apiUsageCounters:', globalThis.__apiUsageCounters)
      if (!globalThis.__apiUsageCounters) {
        console.log('[APIUsageStubService] Creating new global counters')
        globalThis.__apiUsageCounters = {
          openrouter_prompt: 0,
          openrouter_completion: 0,
          openrouter_total: 0,
          mixedbread_total: 0,
          apollo_enrichments: 0,
          hunter_finder_calls: 0,
          hunter_verifier_calls: 0,
          meta_calls: 0
        }
      }
      this.counters = globalThis.__apiUsageCounters
      console.log('[APIUsageStubService] Using global counters')
    } else {
      console.log('[APIUsageStubService] No globalThis, creating local counters')
      // Fallback for environments without globalThis
      this.counters = {
        openrouter_prompt: 0,
        openrouter_completion: 0,
        openrouter_total: 0,
        mixedbread_total: 0,
        apollo_enrichments: 0,
        hunter_finder_calls: 0,
        hunter_verifier_calls: 0,
        meta_calls: 0
      }
    }
  }

  // Simulate network delay
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get OpenRouter API usage (stub)
   * Real endpoint would be: https://openrouter.ai/api/v1/usage
   */
  async getOpenRouterUsage(): Promise<OpenRouterUsageResponse> {
    await this.delay(100)

    // Return cumulative usage from counters
    return {
      data: {
        usage: {
          prompt_tokens: this.counters.openrouter_prompt,
          completion_tokens: this.counters.openrouter_completion,
          total_tokens: this.counters.openrouter_total
        }
      }
    }
  }

  /**
   * Get Mixedbread API usage (stub)
   */
  async getMixedbreadUsage(): Promise<MixedbreadUsageResponse> {
    await this.delay(100)

    return {
      data: {
        usage: {
          prompt_tokens: this.counters.mixedbread_total,
          total_tokens: this.counters.mixedbread_total
        }
      }
    }
  }

  /**
   * Get Apollo.io API usage (stub)
   */
  async getApolloUsage(): Promise<ApolloUsageResponse> {
    await this.delay(100)

    return {
      data: {
        credits_remaining: 10000 - this.counters.apollo_enrichments,
        credits_used_this_month: this.counters.apollo_enrichments
      }
    }
  }

  /**
   * Get Hunter.io API usage (stub)
   */
  async getHunterUsage(): Promise<HunterUsageResponse> {
    await this.delay(100)

    return {
      data: {
        api_calls: {
          email_finder: {
            calls_remaining: 1000 - this.counters.hunter_finder_calls,
            calls_used: this.counters.hunter_finder_calls
          },
          email_verifier: {
            calls_remaining: 2000 - this.counters.hunter_verifier_calls,
            calls_used: this.counters.hunter_verifier_calls
          }
        }
      }
    }
  }

  /**
   * Get Meta GraphAPI usage (stub)
   */
  async getMetaUsage(): Promise<MetaUsageResponse> {
    await this.delay(100)

    return {
      data: {
        usage: {
          rate_limit_remaining: 200 - this.counters.meta_calls,
          rate_limit_used: this.counters.meta_calls
        }
      }
    }
  }

  // ============================================
  // Simulation Methods - Increment counters
  // ============================================

  /**
   * Simulate OpenRouter API call (LLM extraction)
   */
  simulateOpenRouterCall(promptTokens: number, completionTokens: number): void {
    this.counters.openrouter_prompt += promptTokens
    this.counters.openrouter_completion += completionTokens
    this.counters.openrouter_total += (promptTokens + completionTokens)
    console.log(`[APIUsageStubService] Simulated OpenRouter call: ${promptTokens} prompt + ${completionTokens} completion tokens`)
  }

  /**
   * Simulate Mixedbread API call (embeddings)
   */
  simulateMixedbreadCall(tokens: number): void {
    this.counters.mixedbread_total += tokens
    console.log(`[APIUsageStubService] Simulated Mixedbread call: ${tokens} tokens`)
  }

  /**
   * Simulate Apollo.io enrichment call
   */
  simulateApolloEnrichment(count: number): void {
    this.counters.apollo_enrichments += count
    console.log(`[APIUsageStubService] Simulated Apollo enrichment: ${count} contacts`)
  }

  /**
   * Simulate Hunter.io email finder call
   */
  simulateHunterFinderCall(count: number): void {
    this.counters.hunter_finder_calls += count
    console.log(`[APIUsageStubService] Simulated Hunter email finder: ${count} calls`)
  }

  /**
   * Simulate Hunter.io email verifier call
   */
  simulateHunterVerifierCall(count: number): void {
    this.counters.hunter_verifier_calls += count
    console.log(`[APIUsageStubService] Simulated Hunter email verifier: ${count} calls`)
  }

  /**
   * Simulate Apify scraping call
   */
  simulateApifyCall(resultsCount: number): void {
    this.counters.apify_results += resultsCount
    console.log(`[APIUsageStubService] Simulated Apify scraping: ${resultsCount} results`)
  }

  /**
   * Reset all counters (call after job completion)
   */
  resetUsage(): void {
    console.log('[APIUsageStubService] Resetting usage counters')
    this.counters.openrouter_prompt = 0
    this.counters.openrouter_completion = 0
    this.counters.openrouter_total = 0
    this.counters.mixedbread_total = 0
    this.counters.apollo_enrichments = 0
    this.counters.hunter_finder_calls = 0
    this.counters.hunter_verifier_calls = 0
    this.counters.apify_results = 0
  }
}

// Singleton instance
let apiUsageStubService: APIUsageStubService | null = null

export function getAPIUsageStubService(): APIUsageStubService {
  if (!apiUsageStubService) {
    apiUsageStubService = new APIUsageStubService()
  }
  return apiUsageStubService
}

/**
 * Pricing information for each API
 */
export const API_PRICING = {
  openrouter: {
    per_million_tokens: 1.5, // Claude 3.5 Sonnet pricing
    per_token: 1.5 / 1000000
  },
  mixedbread: {
    per_million_tokens: 0.01, // mxbai-embed-large-v1
    per_token: 0.01 / 1000000
  },
  apollo: {
    per_enrichment: 0.03, // Average cost per contact enrichment
  },
  hunter: {
    email_finder: 0.02, // 2 credits per search
    email_verifier: 0.001, // 1 credit per verification
  },
  apify: {
    instagram: 1.50, // per 1,000 results
    facebook: 5.00, // per ~100 results
    per_result_instagram: 1.50 / 1000,
    per_result_facebook: 5.00 / 100
  }
}
