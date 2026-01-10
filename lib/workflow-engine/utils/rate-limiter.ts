/**
 * Rate Limiter Utility
 *
 * Implements Token Bucket algorithm for API rate limiting.
 * Prevents exceeding API rate limits and avoiding 429 errors.
 *
 * Use case: When calling external APIs (Apify, OpenRouter, etc.)
 * you need to respect their rate limits to avoid being blocked.
 *
 * Example:
 * - Apify: ~100 requests/minute
 * - OpenRouter: ~60 requests/minute
 * - LinkedIn: varies by plan
 *
 * Token Bucket Algorithm:
 * - Bucket has a maximum capacity of tokens
 * - Tokens are added at a fixed rate over time
 * - Each request consumes 1 token
 * - If bucket is empty, request waits for tokens
 */

export interface RateLimiterConfig {
  maxRequests: number // Maximum number of requests (bucket capacity)
  perMilliseconds: number // Time period for max requests
}

export interface RateLimiterStats {
  totalRequests: number
  successfulRequests: number
  throttledRequests: number
  currentTokens: number
  waitTime: number // Total time spent waiting for tokens (ms)
}

/**
 * Token Bucket Rate Limiter
 */
export class RateLimiter {
  private tokens: number
  private lastRefillTime: number
  private stats: RateLimiterStats

  constructor(
    private config: RateLimiterConfig
  ) {
    this.tokens = config.maxRequests
    this.lastRefillTime = Date.now()
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      throttledRequests: 0,
      currentTokens: config.maxRequests,
      waitTime: 0
    }
  }

  /**
   * Acquire a token (wait if necessary)
   */
  async acquire(): Promise<void> {
    this.stats.totalRequests++

    const waitTime = this.calculateWaitTime()

    if (waitTime > 0) {
      this.stats.throttledRequests++
      this.stats.waitTime += waitTime
      await this.sleep(waitTime)
    }

    // Consume token
    this.tokens--
    this.stats.currentTokens = this.tokens
    this.stats.successfulRequests++
  }

  /**
   * Acquire multiple tokens at once
   */
  async acquireMultiple(count: number): Promise<void> {
    if (count > this.config.maxRequests) {
      throw new Error(
        `Cannot acquire ${count} tokens, max is ${this.config.maxRequests}`
      )
    }

    for (let i = 0; i < count; i++) {
      await this.acquire()
    }
  }

  /**
   * Try to acquire a token without waiting
   * Returns true if token was acquired, false otherwise
   */
  tryAcquire(): boolean {
    this.refill()

    if (this.tokens >= 1) {
      this.tokens--
      this.stats.currentTokens = this.tokens
      this.stats.totalRequests++
      this.stats.successfulRequests++
      return true
    }

    this.stats.totalRequests++
    this.stats.throttledRequests++
    return false
  }

  /**
   * Calculate time to wait for next token
   */
  private calculateWaitTime(): number {
    this.refill()

    if (this.tokens >= 1) {
      return 0 // No wait needed
    }

    // Calculate how long to wait for 1 token
    const refillRate = this.config.maxRequests / this.config.perMilliseconds
    const tokensNeeded = 1 - this.tokens
    const waitTime = tokensNeeded / refillRate

    return Math.ceil(waitTime)
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefillTime

    if (elapsed <= 0) {
      return
    }

    // Calculate how many tokens to add
    const refillRate = this.config.maxRequests / this.config.perMilliseconds
    const tokensToAdd = elapsed * refillRate

    this.tokens = Math.min(
      this.config.maxRequests,
      this.tokens + tokensToAdd
    )

    this.lastRefillTime = now
    this.stats.currentTokens = this.tokens
  }

  /**
   * Get current stats
   */
  getStats(): RateLimiterStats {
    this.refill()
    return { ...this.stats }
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.tokens = this.config.maxRequests
    this.lastRefillTime = Date.now()
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      throttledRequests: 0,
      currentTokens: this.config.maxRequests,
      waitTime: 0
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Pre-configured rate limiters for common APIs
 */
export const RateLimiters = {
  /**
   * Apify Rate Limiter
   * Limit: ~100 requests/minute
   */
  apify: () => new RateLimiter({
    maxRequests: 100,
    perMilliseconds: 60000 // 1 minute
  }),

  /**
   * OpenRouter Rate Limiter
   * Limit: ~60 requests/minute
   */
  openrouter: () => new RateLimiter({
    maxRequests: 60,
    perMilliseconds: 60000 // 1 minute
  }),

  /**
   * Generic moderate rate limiter
   * Limit: 10 requests/second
   */
  moderate: () => new RateLimiter({
    maxRequests: 10,
    perMilliseconds: 1000 // 1 second
  }),

  /**
   * Aggressive rate limiter for strict APIs
   * Limit: 1 request/second
   */
  strict: () => new RateLimiter({
    maxRequests: 1,
    perMilliseconds: 1000 // 1 second
  })
}

/**
 * Create a custom rate limiter
 */
export function createRateLimiter(
  requestsPerMinute: number
): RateLimiter {
  return new RateLimiter({
    maxRequests: requestsPerMinute,
    perMilliseconds: 60000 // 1 minute
  })
}
