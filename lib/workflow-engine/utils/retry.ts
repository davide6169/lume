/**
 * Retry Logic Utility
 *
 * Advanced retry mechanism with exponential backoff, jitter, and circuit breaker.
 *
 * Features:
 * - Exponential backoff with configurable multiplier
 * - Jitter to avoid thundering herd problem
 * - Circuit breaker to stop failing operations quickly
 * - Retry condition predicates
 * - Max retry attempts
 *
 * Use case: When calling external APIs that may fail temporarily
 * (network errors, rate limits, server errors).
 */

export interface RetryConfig {
  maxRetries: number // Maximum number of retry attempts (default: 3)
  initialDelay: number // Initial delay in milliseconds (default: 1000)
  maxDelay?: number // Maximum delay in milliseconds (default: 30000)
  backoffMultiplier: number // Multiplier for exponential backoff (default: 2)
  jitter?: boolean // Add random jitter to delays (default: true)
  jitterAmount?: number // Jitter amount as percentage (default: 0.1 = 10%)
  retryCondition?: (error: any) => boolean // Custom retry condition
  onRetry?: (attempt: number, error: any) => void // Callback on retry
}

export interface RetryStats {
  attempts: number
  successful: boolean
  totalDelay: number // Total time spent in delays (ms)
  errors: Array<{
    attempt: number
    error: string
    delay: number
  }>
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  jitterAmount: 0.1,
  retryCondition: () => true,
  onRetry: () => {}
}

/**
 * Retry executor with exponential backoff
 */
export class RetryExecutor {
  constructor(private config: Partial<RetryConfig> = {}) {}

  /**
   * Execute function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    configOverride?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...DEFAULT_RETRY_CONFIG, ...this.config, ...configOverride }
    const stats: RetryStats = {
      attempts: 0,
      successful: false,
      totalDelay: 0,
      errors: []
    }

    let lastError: any

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      stats.attempts = attempt + 1

      try {
        const result = await fn()
        stats.successful = true
        return result
      } catch (error) {
        lastError = error

        stats.errors.push({
          attempt: attempt + 1,
          error: (error as Error).message || String(error),
          delay: 0
        })

        // Check if we should retry
        if (attempt < config.maxRetries && config.retryCondition(error)) {
          const delay = this.calculateDelay(attempt, config)
          stats.totalDelay += delay
          stats.errors[stats.errors.length - 1].delay = delay

          // Call onRetry callback
          config.onRetry(attempt + 1, error)

          // Wait before retry
          await this.sleep(delay)
        } else {
          // No more retries or shouldn't retry
          throw new RetryError(
            `Operation failed after ${attempt + 1} attempts`,
            stats,
            lastError
          )
        }
      }
    }

    throw new RetryError(
      'Operation failed after all retry attempts',
      stats,
      lastError
    )
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, config: Required<RetryConfig>): number {
    // Exponential backoff
    let delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt)

    // Apply max delay cap
    if (config.maxDelay) {
      delay = Math.min(delay, config.maxDelay)
    }

    // Add jitter if enabled
    if (config.jitter) {
      const jitterRange = delay * (config.jitterAmount || 0.1)
      const jitter = (Math.random() - 0.5) * 2 * jitterRange
      delay += jitter
    }

    return Math.max(0, Math.floor(delay))
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Custom error class for retry failures
 */
export class RetryError extends Error {
  constructor(
    message: string,
    public stats: RetryStats,
    public originalError: any
  ) {
    super(message)
    this.name = 'RetryError'
  }
}

/**
 * Circuit Breaker Pattern
 *
 * Stops calling a failing operation after threshold is reached.
 * Prevents cascading failures and saves resources.
 */
export interface CircuitBreakerConfig {
  failureThreshold: number // Number of failures before opening (default: 5)
  resetTimeout: number // Time to wait before trying again (default: 60000ms)
  halfOpenAttempts: number // Number of attempts in half-open state (default: 1)
}

export enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Failing, reject requests
  HALF_OPEN = 'half_open' // Testing if service recovered
}

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount: number = 0
  private successCount: number = 0
  private lastFailureTime: number = 0
  private nextAttemptTime: number = 0

  constructor(private config: CircuitBreakerConfig) {}

  /**
   * Execute operation with circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(
          `Circuit breaker is OPEN. Failing fast. Next attempt at ${new Date(this.nextAttemptTime).toISOString()}`
        )
      }
      // Transition to half-open
      this.state = CircuitState.HALF_OPEN
      this.successCount = 0
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.failureCount = 0

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= this.config.halfOpenAttempts) {
        this.state = CircuitState.CLOSED
      }
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN
      this.nextAttemptTime = Date.now() + this.config.resetTimeout
    }
  }

  /**
   * Get current state
   */
  getState(): {
    state: CircuitState
    failureCount: number
    successCount: number
    nextAttemptTime?: number
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttemptTime:
        this.state === CircuitState.OPEN ? this.nextAttemptTime : undefined
    }
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = 0
    this.nextAttemptTime = 0
  }
}

/**
 * Common retry conditions
 */
export const RetryConditions = {
  /**
   * Retry on network errors
   */
  isNetworkError: (error: any) => {
    return (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.message?.includes('network') ||
      error.message?.includes('fetch')
    )
  },

  /**
   * Retry on 5xx server errors
   */
  isServerError: (error: any) => {
    const status = error.status || error.statusCode
    return status >= 500 && status < 600
  },

  /**
   * Retry on 429 rate limit errors
   */
  isRateLimitError: (error: any) => {
    const status = error.status || error.statusCode
    return status === 429
  },

  /**
   * Retry on any error (default)
   */
  always: () => true
}

/**
 * Pre-configured retry executors
 */
export const RetryExecutors = {
  /**
   * Standard retry for API calls
   * - 3 retries
   * - 1s initial delay, 2x multiplier
   * - Max 30s delay
   */
  standard: () => new RetryExecutor({
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true
  }),

  /**
   * Aggressive retry for critical operations
   * - 5 retries
   * - 500ms initial delay, 1.5x multiplier
   * - Max 60s delay
   */
  aggressive: () => new RetryExecutor({
    maxRetries: 5,
    initialDelay: 500,
    maxDelay: 60000,
    backoffMultiplier: 1.5,
    jitter: true
  }),

  /**
   * Conservative retry for non-critical operations
   * - 2 retries
   * - 2s initial delay, 3x multiplier
   * - Max 10s delay
   */
  conservative: () => new RetryExecutor({
    maxRetries: 2,
    initialDelay: 2000,
    maxDelay: 10000,
    backoffMultiplier: 3,
    jitter: true
  })
}

/**
 * Helper function to execute with retry
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const executor = new RetryExecutor(config)
  return executor.execute(fn)
}
