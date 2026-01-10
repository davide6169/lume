/**
 * Cache Utility with TTL
 *
 * In-memory caching system with Time-To-Live (TTL) support.
 * Optimizes API calls by caching results and reusing them.
 *
 * Features:
 * - TTL per entry (auto-expiration)
 * - Maximum size limit (LRU eviction)
 * - Cache statistics (hits, misses, hit rate)
 * - Function decorators for automatic caching
 * - Multiple cache instances with different configs
 *
 * Use cases:
 * - Country detection: 24h TTL (rarely changes)
 * - Instagram data: 7 days TTL (profiles don't change often)
 * - LinkedIn data: 30 days TTL (very stable)
 * - LLM results: 7 days TTL (interests stable over time)
 */

export interface CacheEntry<T> {
  value: T
  expiresAt: number
  createdAt: number
  accessCount: number
  lastAccessedAt: number
}

export interface CacheConfig {
  maxSize?: number // Maximum number of entries (default: 1000)
  defaultTTL?: number // Default TTL in milliseconds (default: 1 hour)
  cleanupInterval?: number // Cleanup interval in milliseconds (default: 5 minutes)
}

export interface CacheStats {
  size: number
  maxSize: number
  hits: number
  misses: number
  hitRate: number // Percentage (0-100)
  evictions: number
  totalSets: number
}

/**
 * In-memory Cache with TTL and LRU eviction
 */
export class Cache<T = any> {
  private cache: Map<string, CacheEntry<T>>
  private stats: CacheStats
  private cleanupTimer: NodeJS.Timeout | null

  constructor(
    private config: CacheConfig = {}
  ) {
    this.cache = new Map()
    this.stats = {
      size: 0,
      maxSize: config.maxSize || 1000,
      hits: 0,
      misses: 0,
      hitRate: 0,
      evictions: 0,
      totalSets: 0
    }

    // Start cleanup timer
    this.cleanupTimer = setInterval(
      () => this.cleanup(),
      config.cleanupInterval || 300000 // 5 minutes
    )
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key)

    // Cache miss
    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return undefined
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.stats.size--
      this.stats.misses++
      this.updateHitRate()
      return undefined
    }

    // Cache hit - update access stats
    entry.accessCount++
    entry.lastAccessedAt = Date.now()
    this.stats.hits++
    this.updateHitRate()

    return entry.value
  }

  /**
   * Set value in cache with optional TTL
   */
  set(key: string, value: T, ttl?: number): void {
    // Check if we need to evict
    if (this.cache.size >= (this.config.maxSize || 1000) && !this.cache.has(key)) {
      this.evictLRU()
    }

    const now = Date.now()
    const entry: CacheEntry<T> = {
      value,
      expiresAt: now + (ttl || this.config.defaultTTL || 3600000), // Default 1 hour
      createdAt: now,
      accessCount: 0,
      lastAccessedAt: now
    }

    this.cache.set(key, entry)
    this.stats.totalSets++
    this.stats.size = this.cache.size
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.stats.size--
      return false
    }
    return true
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.size = this.cache.size
    }
    return deleted
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear()
    this.stats.size = 0
    this.stats.hits = 0
    this.stats.misses = 0
    this.stats.hitRate = 0
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Get all keys (non-expired)
   */
  keys(): string[] {
    const now = Date.now()
    const validKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now <= entry.expiresAt) {
        validKeys.push(key)
      }
    }

    return validKeys
  }

  /**
   * Get cache size (only non-expired entries)
   */
  size(): number {
    this.cleanup()
    return this.cache.size
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    let removed = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        removed++
      }
    }

    if (removed > 0) {
      this.stats.size = this.cache.size
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | undefined
    let lruTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt < lruTime) {
        lruTime = entry.lastAccessedAt
        lruKey = key
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey)
      this.stats.evictions++
      this.stats.size = this.cache.size
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
  }

  /**
   * Stop cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}

/**
 * Pre-configured cache instances
 */
export const Caches = {
  /**
   * Country Cache - 24 hour TTL
   * Country detection rarely changes
   */
  country: () => new Cache({
    maxSize: 500,
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
    cleanupInterval: 60 * 60 * 1000 // 1 hour
  }),

  /**
   * Instagram Cache - 7 day TTL
   * Instagram profiles don't change often
   */
  instagram: () => new Cache({
    maxSize: 1000,
    defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
    cleanupInterval: 24 * 60 * 60 * 1000 // 1 day
  }),

  /**
   * LinkedIn Cache - 30 day TTL
   * LinkedIn profiles are very stable
   */
  linkedin: () => new Cache({
    maxSize: 1000,
    defaultTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
    cleanupInterval: 7 * 24 * 60 * 60 * 1000 // 1 week
  }),

  /**
   * LLM Results Cache - 7 day TTL
   * Interest inference results stable over time
   */
  llm: () => new Cache({
    maxSize: 2000,
    defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
    cleanupInterval: 24 * 60 * 60 * 1000 // 1 day
  }),

  /**
   * Short-term Cache - 5 minute TTL
   * For frequently changing data
   */
  shortTerm: () => new Cache({
    maxSize: 100,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    cleanupInterval: 60 * 1000 // 1 minute
  }),

  /**
   * FullContact Cache - 7 day TTL
   * Consumer profiles change moderately
   */
  fullcontact: () => new Cache({
    maxSize: 1000,
    defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
    cleanupInterval: 24 * 60 * 60 * 1000 // 1 day
  }),

  /**
   * People Data Labs Cache - 30 day TTL
   * Professional data is very stable
   */
  pdl: () => new Cache({
    maxSize: 1000,
    defaultTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
    cleanupInterval: 7 * 24 * 60 * 60 * 1000 // 1 week
  })
}

/**
 * Create a custom cache
 */
export function createCache<T = any>(config: CacheConfig): Cache<T> {
  return new Cache<T>(config)
}

/**
 * Cache decorator for functions
 * Caches function results based on arguments
 */
export function cached<T extends (...args: any[]) => any>(
  cache: Cache<ReturnType<T>>,
  keyGenerator?: (...args: Parameters<T>) => string
): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => any {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: Parameters<T>): Promise<ReturnType<T>> {
      // Generate cache key
      const key = keyGenerator
        ? keyGenerator(...args)
        : `${propertyKey}:${JSON.stringify(args)}`

      // Try to get from cache
      const cached = cache.get(key)
      if (cached !== undefined) {
        return cached
      }

      // Call original method
      const result = await originalMethod.apply(this, args)

      // Store in cache
      cache.set(key, result)

      return result
    }

    return descriptor
  }
}

/**
 * Helper function to cache async functions
 */
export function memoize<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cache: Cache<ReturnType<T>> = new Cache(),
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : `memoize:${JSON.stringify(args)}`

    const cached = cache.get(key)
    if (cached !== undefined) {
      return cached
    }

    const result = await fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * Generate cache key from object
 */
export function generateCacheKey(prefix: string, obj: Record<string, any>): string {
  const sortedKeys = Object.keys(obj).sort()
  const keyParts = sortedKeys.map(k => `${k}:${JSON.stringify(obj[k])}`)
  return `${prefix}:${keyParts.join('|')}`
}

/**
 * Cache utility for API responses
 */
export class ApiCache {
  private cache: Cache<any>

  constructor(config?: CacheConfig) {
    this.cache = new Cache(config)
  }

  /**
   * Fetch with cache
   * Checks cache first, if miss, calls fetcher and caches result
   */
  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try cache
    const cached = this.cache.get(key)
    if (cached !== undefined) {
      return cached as T
    }

    // Cache miss - fetch and cache
    const result = await fetcher()
    this.cache.set(key, result, ttl)
    return result
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Get cache stats
   */
  getStats(): CacheStats {
    return this.cache.getStats()
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }
}

/**
 * Create API cache instance
 */
export function createApiCache(config?: CacheConfig): ApiCache {
  return new ApiCache(config)
}
