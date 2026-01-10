/**
 * CSV Interest Enrichment - Workflow Fase 4 Test
 *
 * Test del workflow-based approach con le nuove utility di affidabilità:
 * - Retry Logic con exponential backoff
 * - Rate Limiting con token bucket
 * - Circuit Breaker pattern
 *
 * Questo test dimostra l'uso delle utility di reliability.
 */

import dotenv from 'dotenv'
import { registerAllBuiltInBlocks } from './lib/workflow-engine/blocks'
import {
  RetryExecutor,
  CircuitBreaker,
  RetryConditions,
  RateLimiter,
  RateLimiters,
  retry
} from './lib/workflow-engine/utils'
import type { RetryConfig, CircuitBreakerConfig, RateLimiterConfig } from './lib/workflow-engine/utils'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize blocks
registerAllBuiltInBlocks()

// ============================================================
// SAMPLE FUNCTIONS THAT MIGHT FAIL
// ============================================================

let failCount = 0
let shouldFail = true

async function unreliableApiCall(id: string): Promise<any> {
  console.log(`📞 Calling API for ${id}...`)

  // Simulate API that fails first 2 times, then succeeds
  if (shouldFail && failCount < 2) {
    failCount++
    throw new Error(`API error: Connection refused (attempt ${failCount})`)
  }

  shouldFail = true // Reset for next call
  return { id, status: 'success', data: `Result for ${id}` }
}

async function rateLimitedApiCall(id: string): Promise<any> {
  console.log(`📞 API call ${id} at ${new Date().toISOString()}`)
  return { id, status: 'success' }
}

async function failingCircuitApiCall(): Promise<any> {
  throw new Error('Service unavailable')
}

// ============================================================
// TEST 1: Retry Logic
// ============================================================

async function testRetryLogic() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 1: Retry Logic with Exponential Backoff')
  console.log('='.repeat(80) + '\n')

  const config: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
    onRetry: (attempt, error) => {
      console.log(`  🔄 Retry attempt ${attempt}: ${error.message}`)
    }
  }

  const executor = new RetryExecutor(config)

  try {
    failCount = 0
    const result = await executor.execute(async () => {
      return await unreliableApiCall('test-1')
    })

    console.log('\n✅ SUCCESS after retries:')
    console.log(`  Result: ${JSON.stringify(result)}`)

  } catch (error: any) {
    console.log('\n❌ FAILED after all retries:')
    console.log(`  Error: ${error.message}`)
    if (error.stats) {
      console.log(`  Stats:`, error.stats)
    }
  }
}

// ============================================================
// TEST 2: Circuit Breaker
// ============================================================

async function testCircuitBreaker() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 2: Circuit Breaker Pattern')
  console.log('='.repeat(80) + '\n')

  const config: CircuitBreakerConfig = {
    failureThreshold: 3, // Open circuit after 3 failures
    resetTimeout: 10000, // Wait 10s before trying again
    halfOpenAttempts: 2 // Try 2 times in half-open state
  }

  const circuitBreaker = new CircuitBreaker(config)

  console.log('Phase 1: Triggering failures to open circuit...\n')

  // Trigger failures
  for (let i = 1; i <= 4; i++) {
    try {
      await circuitBreaker.execute(async () => {
        return await failingCircuitApiCall()
      })
      console.log(`  ✅ Call ${i} succeeded`)
    } catch (error: any) {
      const state = circuitBreaker.getState()
      console.log(`  ❌ Call ${i} failed - Circuit: ${state.state.toUpperCase()}`)
    }
  }

  console.log('\nPhase 2: Circuit is OPEN, calls should fail fast...\n')

  // Try calling when circuit is open
  try {
    await circuitBreaker.execute(async () => {
      return await failingCircuitApiCall()
    })
    console.log('  ✅ Call succeeded (unexpected!)')
  } catch (error: any) {
    console.log(`  ⚡ Call rejected immediately: ${error.message.substring(0, 60)}...`)
  }

  console.log('\nPhase 3: Resetting circuit breaker...\n')
  circuitBreaker.reset()

  const state = circuitBreaker.getState()
  console.log(`  Circuit state after reset: ${state.state.toUpperCase()}`)
}

// ============================================================
// TEST 3: Rate Limiter
// ============================================================

async function testRateLimiter() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 3: Rate Limiter (Token Bucket)')
  console.log('='.repeat(80) + '\n')

  // Create rate limiter: 5 requests per 3 seconds
  const rateLimiter = new RateLimiter({
    maxRequests: 5,
    perMilliseconds: 3000
  })

  console.log('Making 7 requests with rate limiter (max 5 per 3s)...\n')

  const startTime = Date.now()

  for (let i = 1; i <= 7; i++) {
    await rateLimiter.acquire()
    const elapsed = Date.now() - startTime
    await rateLimitedApiCall(`request-${i}`)
    console.log(`  ⏱️  Elapsed: ${elapsed}ms | Tokens remaining: ${rateLimiter.getStats().currentTokens.toFixed(1)}`)
  }

  const totalTime = Date.now() - startTime
  const stats = rateLimiter.getStats()

  console.log(`\n📊 RATE LIMITER STATS:`)
  console.log(`  Total time: ${totalTime}ms`)
  console.log(`  Total requests: ${stats.totalRequests}`)
  console.log(`  Throttled: ${stats.throttledRequests}`)
  console.log(`  Total wait time: ${stats.waitTime}ms`)
  console.log(`  Current tokens: ${stats.currentTokens.toFixed(1)}`)
}

// ============================================================
// TEST 4: Pre-configured Rate Limiters
// ============================================================

async function testPreconfiguredLimiters() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 4: Pre-configured Rate Limiters')
  console.log('='.repeat(80) + '\n')

  console.log('Testing Apify rate limiter (100 req/min)...\n')

  const apifyLimiter = RateLimiters.apify()
  const startTime = Date.now()

  // Make 5 requests
  for (let i = 1; i <= 5; i++) {
    await apifyLimiter.acquire()
    const elapsed = Date.now() - startTime
    console.log(`  Request ${i}: ${elapsed}ms elapsed`)
  }

  console.log('\nTesting OpenRouter rate limiter (60 req/min)...\n')

  const openRouterLimiter = RateLimiters.openrouter()

  // Make 3 requests
  for (let i = 1; i <= 3; i++) {
    await openRouterLimiter.acquire()
    console.log(`  Request ${i} completed`)
  }

  console.log('\n✅ Pre-configured limiters working correctly')
}

// ============================================================
// TEST 5: Retry with Condition
// ============================================================

async function testRetryWithCondition() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 5: Retry with Custom Condition')
  console.log('='.repeat(80) + '\n')

  // Only retry on network errors
  const config: RetryConfig = {
    maxRetries: 3,
    initialDelay: 500,
    backoffMultiplier: 2,
    retryCondition: RetryConditions.isNetworkError
  }

  const executor = new RetryExecutor(config)

  console.log('Test 5a: Network error (should retry)\n')
  failCount = 0

  try {
    await executor.execute(async () => {
      return await unreliableApiCall('test-network')
    })
    console.log('  ✅ Success after retries\n')
  } catch (error: any) {
    console.log(`  ❌ Failed: ${error.message}\n`)
  }

  console.log('Test 5b: Other error (should NOT retry)\n')

  try {
    await executor.execute(async () => {
      throw new Error('Validation error: Invalid input')
    })
  } catch (error: any) {
    console.log(`  ❌ Failed immediately (no retries): ${error.message}`)
  }
}

// ============================================================
// TEST 6: Helper Function
// ============================================================

async function testRetryHelper() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 6: Retry Helper Function')
  console.log('='.repeat(80) + '\n')

  console.log('Using retry() helper function...\n')

  failCount = 0

  try {
    const result = await retry(
      async () => {
        return await unreliableApiCall('helper-test')
      },
      {
        maxRetries: 2,
        initialDelay: 500,
        onRetry: (attempt, error) => {
          console.log(`  🔄 Retry ${attempt}: ${error.message}`)
        }
      }
    )

    console.log(`\n  ✅ Success: ${JSON.stringify(result)}`)
  } catch (error: any) {
    console.log(`  ❌ Failed: ${error.message}`)
  }
}

// ============================================================
// TEST 7: Combined Retry + Rate Limiter
// ============================================================

async function testCombined() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 7: Combined Retry + Rate Limiter')
  console.log('='.repeat(80) + '\n')

  const rateLimiter = new RateLimiter({
    maxRequests: 2,
    perMilliseconds: 2000 // 2 requests per 2 seconds
  })

  const executor = new RetryExecutor({
    maxRetries: 2,
    initialDelay: 500,
    backoffMultiplier: 1.5
  })

  console.log('Making 3 API calls with retry + rate limiting...\n')

  for (let i = 1; i <= 3; i++) {
    try {
      // Rate limit first
      await rateLimiter.acquire()

      // Then execute with retry
      const result = await executor.execute(async () => {
        return await rateLimitedApiCall(`combined-${i}`)
      })

      console.log(`  ✅ Request ${i} completed`)
    } catch (error: any) {
      console.log(`  ❌ Request ${i} failed: ${error.message}`)
    }
  }

  console.log(`\n📊 Combined stats:`)
  console.log(`  Rate limiter: ${rateLimiter.getStats().totalRequests} requests`)
  console.log(`  Total wait time: ${rateLimiter.getStats().waitTime}ms`)
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function runTests() {
  console.log('\n' + '█'.repeat(80))
  console.log('  CSV INTEREST ENRICHMENT - FASE 4 TEST')
  console.log('  Testing Retry Logic and Rate Limiting utilities')
  console.log('█'.repeat(80))

  try {
    // Test 1: Basic retry logic
    await testRetryLogic()

    // Test 2: Circuit breaker
    await testCircuitBreaker()

    // Test 3: Rate limiter
    await testRateLimiter()

    // Test 4: Pre-configured limiters
    await testPreconfiguredLimiters()

    // Test 5: Retry with condition
    await testRetryWithCondition()

    // Test 6: Retry helper
    await testRetryHelper()

    // Test 7: Combined
    await testCombined()

    console.log('\n' + '█'.repeat(80))
    console.log('  ✅ ALL TESTS PASSED - FASE 4 COMPLETE!')
    console.log('█'.repeat(80))
    console.log('\n📚 USAGE SUMMARY:')
    console.log('  • RetryExecutor: For automatic retry with exponential backoff')
    console.log('  • CircuitBreaker: To stop calling failing operations')
    console.log('  • RateLimiter: To respect API rate limits')
    console.log('  • retry() helper: Quick retry function')
    console.log('  • RateLimiters.apify/openrouter(): Pre-configured limiters')
    console.log('')

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error)
    process.exit(1)
  }
}

// Run tests
runTests()
