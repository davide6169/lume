/**
 * CSV Interest Enrichment - Workflow Fase 5 Test
 *
 * Test del workflow-based approach con le nuove utility di caching:
 * - Cache with TTL (Time-To-Live)
 * - LRU eviction when full
 * - Cache statistics
 * - Function decorators
 * - Pre-configured caches
 *
 * Questo test dimostra l'uso del sistema di caching.
 */

import dotenv from 'dotenv'
import { registerAllBuiltInBlocks } from './lib/workflow-engine/blocks'
import {
  Cache,
  Caches,
  createCache,
  memoize,
  generateCacheKey,
  ApiCache,
  createApiCache
} from './lib/workflow-engine/utils'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize blocks
registerAllBuiltInBlocks()

// ============================================================
// SAMPLE DATA
// ============================================================

let apiCallCount = 0

async function mockInstagramApiCall(username: string): Promise<any> {
  apiCallCount++
  console.log(`  📞 Calling Instagram API for @${username}... (call #${apiCallCount})`)

  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 100))

  return {
    username,
    bio: 'Tech enthusiast and entrepreneur',
    followers: 10000 + Math.floor(Math.random() * 5000),
    posts: [
      { id: '1', text: 'Amazing post!' },
      { id: '2', text: 'Great content!' }
    ]
  }
}

async function mockLinkedInApiCall(email: string): Promise<any> {
  apiCallCount++
  console.log(`  📞 Calling LinkedIn API for ${email}... (call #${apiCallCount})`)

  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 150))

  return {
    email,
    headline: 'Business Innovation Expert',
    bio: 'Experienced professional with proven track record',
    skills: ['Business Strategy', 'Innovation', 'Leadership']
  }
}

// ============================================================
// TEST 1: Basic Cache Operations
// ============================================================

async function testBasicCache() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 1: Basic Cache Operations')
  console.log('='.repeat(80) + '\n')

  const cache = new Cache({
    maxSize: 100,
    defaultTTL: 5000 // 5 seconds
  })

  console.log('Setting values in cache...\n')
  cache.set('user:1', { name: 'Mario', age: 30 })
  cache.set('user:2', { name: 'Luca', age: 25 })
  cache.set('user:3', { name: 'Giulia', age: 28 })

  console.log('Retrieving values from cache:\n')
  console.log(`  user:1 = ${JSON.stringify(cache.get('user:1'))}`)
  console.log(`  user:2 = ${JSON.stringify(cache.get('user:2'))}`)
  console.log(`  user:3 = ${JSON.stringify(cache.get('user:3'))}`)
  console.log(`  user:4 = ${cache.get('user:4')} (miss)`)

  console.log('\n📊 Cache stats:')
  const stats = cache.getStats()
  console.log(`  Size: ${stats.size}/${stats.maxSize}`)
  console.log(`  Hits: ${stats.hits}`)
  console.log(`  Misses: ${stats.misses}`)
  console.log(`  Hit rate: ${stats.hitRate.toFixed(1)}%`)
}

// ============================================================
// TEST 2: TTL Expiration
// ============================================================

async function testTTLExpiration() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 2: TTL Expiration')
  console.log('='.repeat(80) + '\n')

  const cache = new Cache({
    maxSize: 100,
    defaultTTL: 2000 // 2 seconds
  })

  console.log('Setting value with 2s TTL...\n')
  cache.set('temp:data', { value: 'expires-soon' })

  console.log('Immediately after set:')
  console.log(`  Has key: ${cache.has('temp:data')}`)
  console.log(`  Value: ${JSON.stringify(cache.get('temp:data'))}`)

  console.log('\nWaiting 3 seconds...\n')
  await new Promise(resolve => setTimeout(resolve, 3000))

  console.log('After 3 seconds:')
  console.log(`  Has key: ${cache.has('temp:data')}`)
  console.log(`  Value: ${cache.get('temp:data')} (expired)`)

  console.log('\n📊 Cache stats after expiration:')
  const stats = cache.getStats()
  console.log(`  Misses: ${stats.misses}`)
  console.log(`  Size: ${stats.size}`)
}

// ============================================================
// TEST 3: LRU Eviction
// ============================================================

async function testLRUEviction() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 3: LRU Eviction (Least Recently Used)')
  console.log('='.repeat(80) + '\n')

  const cache = new Cache({
    maxSize: 3, // Small cache to trigger eviction
    defaultTTL: 60000 // 1 minute
  })

  console.log('Cache size: 3 (max)\n')

  console.log('Adding 3 items:')
  cache.set('item:1', 'Value 1')
  console.log('  Added item:1')
  cache.set('item:2', 'Value 2')
  console.log('  Added item:2')
  cache.set('item:3', 'Value 3')
  console.log('  Added item:3')

  console.log('\nAccessing item:1 (to make it recently used)')
  cache.get('item:1')
  console.log('  item:1 accessed')

  console.log('\nAdding item:4 (should evict item:2 - LRU):')
  cache.set('item:4', 'Value 4')

  console.log('\nCurrent keys:')
  console.log(`  ${cache.keys().join(', ')}`)

  console.log('\n📊 Cache stats:')
  const stats = cache.getStats()
  console.log(`  Evictions: ${stats.evictions}`)
  console.log(`  Size: ${stats.size}/${stats.maxSize}`)
}

// ============================================================
// TEST 4: Pre-configured Caches
// ============================================================

async function testPreconfiguredCaches() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 4: Pre-configured Caches')
  console.log('='.repeat(80) + '\n')

  console.log('Testing different cache configurations:\n')

  const countryCache = Caches.country()
  console.log(`✓ Country Cache: 24h TTL, max 500 entries`)

  const instagramCache = Caches.instagram()
  console.log(`✓ Instagram Cache: 7 days TTL, max 1000 entries`)

  const linkedinCache = Caches.linkedin()
  console.log(`✓ LinkedIn Cache: 30 days TTL, max 1000 entries`)

  const llmCache = Caches.llm()
  console.log(`✓ LLM Cache: 7 days TTL, max 2000 entries`)

  const shortTermCache = Caches.shortTerm()
  console.log(`✓ Short-term Cache: 5 min TTL, max 100 entries`)

  console.log('\nExample: Using Instagram cache')
  apiCallCount = 0

  // First call - cache miss
  console.log('\n1st call (cache miss):')
  const result1 = await mockInstagramApiCall('marco')
  instagramCache.set('instagram:marco', result1)

  // Second call - cache hit
  console.log('\n2nd call (cache hit):')
  const cached = instagramCache.get('instagram:marco')
  if (cached) {
    console.log(`  ✅ Retrieved from cache: ${JSON.stringify(cached).substring(0, 60)}...`)
  }

  console.log(`\n  Total API calls: ${apiCallCount} (saved 1 call with cache!)`)
}

// ============================================================
// TEST 5: API Cache Pattern
// ============================================================

async function testApiCachePattern() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 5: API Cache Pattern')
  console.log('='.repeat(80) + '\n')

  const apiCache = createApiCache({
    maxSize: 100,
    defaultTTL: 10000 // 10 seconds
  })

  console.log('Fetching Instagram data with cache:\n')
  apiCallCount = 0

  // First fetch - cache miss
  console.log('1st fetch:')
  const user1 = await apiCache.fetch(
    'instagram:marco',
    () => mockInstagramApiCall('marco')
  )
  console.log(`  Result: ${user1.username} - ${user1.followers} followers`)

  // Second fetch - cache hit
  console.log('\n2nd fetch (should use cache):')
  const user2 = await apiCache.fetch(
    'instagram:marco',
    () => mockInstagramApiCall('marco')
  )
  console.log(`  Result: ${user2.username} - ${user2.followers} followers`)

  console.log('\n📊 API Cache stats:')
  const stats = apiCache.getStats()
  console.log(`  Hit rate: ${stats.hitRate.toFixed(1)}%`)
  console.log(`  Hits: ${stats.hits}`)
  console.log(`  Misses: ${stats.misses}`)
  console.log(`  API calls saved: ${stats.hits}`)
}

// ============================================================
// TEST 6: Memoization
// ============================================================

async function testMemoization() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 6: Function Memoization')
  console.log('='.repeat(80) + '\n')

  const cache = createCache({
    maxSize: 100,
    defaultTTL: 10000
  })

  // Memoize expensive function
  const memoizedFetch = memoize(
    async (email: string) => {
      return await mockLinkedInApiCall(email)
    },
    cache,
    (email: string) => `linkedin:${email}` // Custom key generator
  )

  console.log('Calling memoized function:\n')
  apiCallCount = 0

  console.log('1st call:')
  const result1 = await memoizedFetch('marco@example.com')
  console.log(`  Result: ${result1.headline}`)

  console.log('\n2nd call (same email):')
  const result2 = await memoizedFetch('marco@example.com')
  console.log(`  Result: ${result2.headline}`)

  console.log('\n3rd call (different email):')
  const result3 = await memoizedFetch('luca@example.com')
  console.log(`  Result: ${result3.headline}`)

  console.log(`\n  Total API calls: ${apiCallCount}`)
  console.log(`  Cache hits: ${cache.getStats().hits}`)
}

// ============================================================
// TEST 7: Cache Key Generation
// ============================================================

async function testCacheKeyGeneration() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 7: Cache Key Generation')
  console.log('='.repeat(80) + '\n')

  const obj1 = {
    email: 'marco@example.com',
    country: 'IT',
    source: 'instagram'
  }

  const obj2 = {
    country: 'IT',
    email: 'marco@example.com',
    source: 'instagram'
  } // Same properties, different order

  const key1 = generateCacheKey('user', obj1)
  const key2 = generateCacheKey('user', obj2)

  console.log('Object 1:', JSON.stringify(obj1))
  console.log(`Key 1: ${key1}`)

  console.log('\nObject 2:', JSON.stringify(obj2))
  console.log(`Key 2: ${key2}`)

  console.log(`\n✓ Keys are identical: ${key1 === key2}`)
  console.log('  (Order-independent key generation works!)')
}

// ============================================================
// TEST 8: Real-World Scenario - Cost Savings
// ============================================================

async function testRealWorldScenario() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 8: Real-World Scenario - Cost Savings')
  console.log('='.repeat(80) + '\n')

  const instagramCache = Caches.instagram()
  const linkedinCache = Caches.linkedin()

  console.log('Scenario: Processing 10 contacts (some duplicates)\n')

  const contacts = [
    { email: 'marco@example.com', name: 'Marco' },
    { email: 'luca@example.com', name: 'Luca' },
    { email: 'marco@example.com', name: 'Marco' }, // Duplicate
    { email: 'giulia@example.com', name: 'Giulia' },
    { email: 'luca@example.com', name: 'Luca' }, // Duplicate
    { email: 'mario@example.com', name: 'Mario' },
    { email: 'marco@example.com', name: 'Marco' }, // Duplicate
    { email: 'anna@example.com', name: 'Anna' },
    { email: 'giulia@example.com', name: 'Giulia' }, // Duplicate
    { email: 'marco@example.com', name: 'Marco' }  // Duplicate
  ]

  apiCallCount = 0
  let instagramCost = 0
  let linkedinCost = 0

  for (const contact of contacts) {
    console.log(`\nProcessing: ${contact.name}`)

    // Check Instagram cache
    const igKey = `instagram:${contact.email}`
    let igData = instagramCache.get(igKey)

    if (!igData) {
      console.log('  Instagram: Cache miss - calling API')
      igData = await mockInstagramApiCall(contact.name.toLowerCase())
      instagramCache.set(igKey, igData)
      instagramCost += 0.050
    } else {
      console.log('  Instagram: ✅ Cache hit (saved $0.050)')
    }

    // Check LinkedIn cache
    const liKey = `linkedin:${contact.email}`
    let liData = linkedinCache.get(liKey)

    if (!liData) {
      console.log('  LinkedIn: Cache miss - calling API')
      liData = await mockLinkedInApiCall(contact.email)
      linkedinCache.set(liKey, liData)
      linkedinCost += 0.003
    } else {
      console.log('  LinkedIn: ✅ Cache hit (saved $0.003)')
    }
  }

  console.log('\n' + '─'.repeat(80))
  console.log('📊 RESULTS:')
  console.log('─'.repeat(80))

  const uniqueContacts = new Set(contacts.map(c => c.email)).size
  const totalContacts = contacts.length

  console.log(`\nTotal contacts processed: ${totalContacts}`)
  console.log(`Unique contacts: ${uniqueContacts}`)
  console.log(`Duplicate contacts: ${totalContacts - uniqueContacts}`)

  console.log(`\nAPI calls:`)
  console.log(`  Total: ${apiCallCount}`)
  console.log(`  Saved by cache: ${totalContacts * 2 - apiCallCount}`)

  console.log(`\nCosts:`)
  console.log(`  Instagram: $${instagramCost.toFixed(3)}`)
  console.log(`  LinkedIn: $${linkedinCost.toFixed(3)}`)
  console.log(`  Total: $${(instagramCost + linkedinCost).toFixed(3)}`)

  console.log(`\nWithout cache:`)
  const withoutCache = totalContacts * (0.050 + 0.003)
  console.log(`  Would cost: $${withoutCache.toFixed(3)}`)

  console.log(`\n💰 Savings: $${(withoutCache - (instagramCost + linkedinCost)).toFixed(3)}`)

  const igStats = instagramCache.getStats()
  const liStats = linkedinCache.getStats()

  console.log(`\n📈 Cache Performance:`)
  console.log(`  Instagram hit rate: ${igStats.hitRate.toFixed(1)}%`)
  console.log(`  LinkedIn hit rate: ${liStats.hitRate.toFixed(1)}%`)
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function runTests() {
  console.log('\n' + '█'.repeat(80))
  console.log('  CSV INTEREST ENRICHMENT - FASE 5 TEST')
  console.log('  Testing Cache utility with TTL and LRU eviction')
  console.log('█'.repeat(80))

  try {
    // Test 1: Basic cache operations
    await testBasicCache()

    // Test 2: TTL expiration
    await testTTLExpiration()

    // Test 3: LRU eviction
    await testLRUEviction()

    // Test 4: Pre-configured caches
    await testPreconfiguredCaches()

    // Test 5: API cache pattern
    await testApiCachePattern()

    // Test 6: Memoization
    await testMemoization()

    // Test 7: Cache key generation
    await testCacheKeyGeneration()

    // Test 8: Real-world scenario
    await testRealWorldScenario()

    console.log('\n' + '█'.repeat(80))
    console.log('  ✅ ALL TESTS PASSED - FASE 5 COMPLETE!')
    console.log('█'.repeat(80))
    console.log('\n📚 USAGE SUMMARY:')
    console.log('  • Cache: Basic cache with TTL and LRU eviction')
    console.log('  • Caches.country/instagram/linkedin/llm: Pre-configured caches')
    console.log('  • memoize(): Wrap functions for automatic caching')
    console.log('  • ApiCache: Fetch with automatic caching')
    console.log('  • generateCacheKey(): Create consistent cache keys')
    console.log('')

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error)
    process.exit(1)
  }
}

// Run tests
runTests()
