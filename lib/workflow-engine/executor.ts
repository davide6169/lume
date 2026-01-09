/**
 * Block Executor - Core Execution Engine
 *
 * Handles execution of individual blocks with:
 * - Error handling and retry logic
 * - Timeout management
 * - Schema validation (input/output)
 * - Performance tracking
 * - Result caching
 */

import {
  BlockExecutor as IBlockExecutor,
  BlockConfig,
  ExecutionContext,
  ExecutionResult,
  ExecutionStatus,
  JSONSchema,
  RetryPolicy,
  BlockType,
  ExecutionOptions
} from './types'
import { createBlockExecutor } from './registry'
import { VariableInterpolator } from './context'

/**
 * Execution metrics for performance tracking
 */
export interface ExecutionMetrics {
  startTime: number
  endTime: number
  executionTime: number
  memoryUsed?: number
  dataSize?: number
  retryCount: number
  cacheHit: boolean
}

/**
 * Execution error with context
 */
export class ExecutionError extends Error {
  constructor(
    message: string,
    public nodeId: string,
    public blockType: string,
    public originalError?: Error,
    public retryCount: number = 0
  ) {
    super(message)
    this.name = 'ExecutionError'
  }
}

/**
 * Core Block Executor
 *
 * Executes blocks with full error handling, retry logic, and validation
 */
export class CoreBlockExecutor {
  private cache: Map<string, { result: any; timestamp: number }>
  private cacheTimeout: number = 5 * 60 * 1000 // 5 minutes default

  constructor() {
    this.cache = new Map()
  }

  /**
   * Execute a block with full error handling and options
   */
  async execute(
    nodeId: string,
    blockType: string,
    config: BlockConfig,
    input: any,
    context: ExecutionContext,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now()
    const metrics: ExecutionMetrics = {
      startTime,
      endTime: 0,
      executionTime: 0,
      retryCount: 0,
      cacheHit: false
    }

    // Log execution start
    context.logger.node(nodeId, 'Execution started', {
      blockType,
      inputSize: this.getDataSize(input)
    })

    try {
      // Check cache if enabled
      if (options.enableCache && this.shouldUseCache(config, blockType)) {
        const cached = this.getCachedResult(nodeId, input)
        if (cached) {
          metrics.cacheHit = true
          context.logger.node(nodeId, 'Cache hit', {
            cachedAt: cached.timestamp
          })

          return this.createSuccessResult(
            nodeId,
            cached.result,
            metrics,
            []
          )
        }
      }

      // Validate input schema if present
      if (options.validateOutput !== false) {
        const inputSchema = config.inputSchema
        if (inputSchema) {
          const isValid = await this.validateData(input, inputSchema, context)
          if (!isValid) {
            throw new Error('Input validation failed')
          }
        }
      }

      // Interpolate variables in config
      const interpolatedConfig = VariableInterpolator.interpolateObject(
        config,
        context,
        input
      )

      // Get or create block executor instance
      const blockExecutor = this.getBlockExecutor(blockType)
      if (!blockExecutor) {
        throw new Error(`Unknown block type: ${blockType}`)
      }

      // Execute with retry logic
      const result = await this.executeWithRetry(
        blockExecutor,
        interpolatedConfig,
        input,
        context,
        options.retryPolicy || config.retryPolicy,
        options.timeout || config.timeout || 30000,
        metrics
      )

      // Validate output schema if present
      if (result.status === ExecutionStatus.COMPLETED && options.validateOutput !== false) {
        const outputSchema = config.outputSchema
        if (outputSchema) {
          const isValid = await this.validateData(result.output, outputSchema, context)
          if (!isValid) {
            throw new Error('Output validation failed')
          }
        }
      }

      // Cache result if enabled and successful
      if (options.enableCache && result.status === ExecutionStatus.COMPLETED) {
        this.setCachedResult(nodeId, input, result.output)
      }

      metrics.endTime = Date.now()
      metrics.executionTime = metrics.endTime - startTime

      // Log completion
      context.logger.node(nodeId, 'Execution completed', {
        status: result.status,
        executionTime: metrics.executionTime,
        retryCount: metrics.retryCount,
        cacheHit: metrics.cacheHit
      })

      return {
        nodeId,
        status: result.status,
        input,
        output: result.output,
        error: result.error,
        executionTime: metrics.executionTime,
        retryCount: metrics.retryCount,
        startTime: metrics.startTime,
        endTime: metrics.endTime,
        metadata: {
          metrics,
          blockType,
          config: interpolatedConfig
        },
        logs: []
      }
    } catch (error) {
      metrics.endTime = Date.now()
      metrics.executionTime = metrics.endTime - startTime

      const execError = error instanceof ExecutionError
        ? error
        : new ExecutionError(
            (error as Error).message,
            nodeId,
            blockType,
            error as Error,
            metrics.retryCount
          )

      // Log error
      context.logger.node(nodeId, 'Execution failed', {
        error: execError.message,
        executionTime: metrics.executionTime,
        retryCount: metrics.retryCount
      })

      return {
        nodeId,
        status: ExecutionStatus.FAILED,
        input,
        output: null,
        error: execError,
        executionTime: metrics.executionTime,
        retryCount: metrics.retryCount,
        startTime: metrics.startTime,
        endTime: metrics.endTime,
        metadata: {
          metrics,
          blockType
        },
        logs: []
      }
    }
  }

  /**
   * Execute with retry logic
   */
  private async executeWithRetry(
    executor: any,
    config: BlockConfig,
    input: any,
    context: ExecutionContext,
    retryPolicy: RetryPolicy | undefined,
    timeout: number,
    metrics: ExecutionMetrics
  ): Promise<{ status: ExecutionStatus; output: any; error?: Error }> {
    const policy = retryPolicy || {
      maxRetries: 0,
      backoffMultiplier: 2,
      initialDelay: 1000
    }

    let lastError: Error | undefined

    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      try {
        // Execute with timeout
        const result = await this.executeWithTimeout(
          executor.execute(config, input, context),
          timeout
        ) as any

        // Handle legacy block format (some blocks return just the result)
        const output = result?.output !== undefined ? result.output : result

        return {
          status: ExecutionStatus.COMPLETED,
          output
        }
      } catch (error) {
        lastError = error as Error
        metrics.retryCount = attempt

        // Check if should retry
        if (attempt < policy.maxRetries && this.shouldRetry(error as Error, policy)) {
          const delay = policy.initialDelay * Math.pow(policy.backoffMultiplier, attempt)

          context.logger.debug(`Retry attempt ${attempt + 1}/${policy.maxRetries}`, {
            error: (error as Error).message,
            delay
          })

          await this.sleep(delay)
        } else {
          throw error
        }
      }
    }

    throw lastError || new Error('Execution failed after retries')
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
      )
    ])
  }

  /**
   * Validate data against JSON schema
   */
  private async validateData(
    data: any,
    schema: JSONSchema,
    context: ExecutionContext
  ): Promise<boolean> {
    try {
      return this.validateAgainstSchema(data, schema)
    } catch (error) {
      context.logger.warn('Schema validation failed', {
        error: (error as Error).message,
        schema,
        data
      })
      return false
    }
  }

  /**
   * Validate data against schema (basic implementation)
   */
  private validateAgainstSchema(data: any, schema: JSONSchema): boolean {
    const { type, properties, required, items, enum: enumValues } = schema

    // Type validation
    if (type === 'string') {
      if (typeof data !== 'string') return false
    } else if (type === 'number') {
      if (typeof data !== 'number' || isNaN(data)) return false
    } else if (type === 'boolean') {
      if (typeof data !== 'boolean') return false
    } else if (type === 'array') {
      if (!Array.isArray(data)) return false
      if (items) {
        return data.every((item: any) => this.validateAgainstSchema(item, items))
      }
    } else if (type === 'object') {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return false
      }

      // Check required fields
      if (required && Array.isArray(required)) {
        for (const field of required) {
          if (!(field in data)) return false
        }
      }

      // Validate properties
      if (properties) {
        for (const [key, value] of Object.entries(data)) {
          if (properties[key]) {
            if (!this.validateAgainstSchema(value, properties[key])) {
              return false
            }
          }
        }
      }
    } else if (type === 'null') {
      if (data !== null) return false
    }

    // Enum validation
    if (enumValues && Array.isArray(enumValues)) {
      if (!enumValues.includes(data)) return false
    }

    return true
  }

  /**
   * Check if error should trigger retry
   */
  private shouldRetry(error: Error, policy: RetryPolicy): boolean {
    const message = error.message.toLowerCase()

    // Default retryable errors
    const retryablePatterns = [
      'timeout',
      'network',
      'rate limit',
      'temporary',
      'unavailable',
      'connection'
    ]

    // Check custom retryable errors
    if (policy.retryableErrors) {
      for (const retryableError of policy.retryableErrors) {
        if (message.includes(retryableError.toLowerCase())) {
          return true
        }
      }
    }

    // Check default patterns
    return retryablePatterns.some(pattern => message.includes(pattern))
  }

  /**
   * Get block executor instance
   */
  private getBlockExecutor(blockType: string): any {
    try {
      return createBlockExecutor(blockType)
    } catch (error) {
      return null
    }
  }

  /**
   * Check if cache should be used for this block
   */
  private shouldUseCache(config: BlockConfig, blockType: string): boolean {
    // Don't cache blocks with side effects or dynamic data
    const nonCachableTypes = [
      BlockType.INPUT,
      BlockType.OUTPUT
    ]

    const configType = config.type || blockType
    return !nonCachableTypes.includes(configType as BlockType)
  }

  /**
   * Get cached result
   */
  private getCachedResult(nodeId: string, input: any): any | null {
    const key = this.getCacheKey(nodeId, input)
    const cached = this.cache.get(key)

    if (!cached) return null

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key)
      return null
    }

    return cached
  }

  /**
   * Set cached result
   */
  private setCachedResult(nodeId: string, input: any, result: any): void {
    const key = this.getCacheKey(nodeId, input)
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    })

    // Clean old cache entries
    this.cleanCache()
  }

  /**
   * Generate cache key
   */
  private getCacheKey(nodeId: string, input: any): string {
    const inputStr = JSON.stringify(input)
    return `${nodeId}:${this.hashString(inputStr)}`
  }

  /**
   * Simple hash function for cache keys
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(36)
  }

  /**
   * Clean old cache entries
   */
  private cleanCache(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    for (const [key, value] of entries) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get data size in bytes
   */
  private getDataSize(data: any): number {
    return JSON.stringify(data).length
  }

  /**
   * Create success result
   */
  private createSuccessResult(
    nodeId: string,
    output: any,
    metrics: ExecutionMetrics,
    logs: any[]
  ): ExecutionResult {
    return {
      nodeId,
      status: ExecutionStatus.COMPLETED,
      input: null,
      output,
      error: undefined,
      executionTime: metrics.executionTime,
      retryCount: metrics.retryCount,
      startTime: metrics.startTime,
      endTime: metrics.endTime,
      metadata: { metrics },
      logs
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Set cache timeout
   */
  setCacheTimeout(timeout: number): void {
    this.cacheTimeout = timeout
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size
  }
}

/**
 * Singleton instance
 */
export const coreBlockExecutor = new CoreBlockExecutor()

/**
 * Helper function to execute a block
 */
export async function executeBlock(
  nodeId: string,
  blockType: string,
  config: BlockConfig,
  input: any,
  context: ExecutionContext,
  options?: ExecutionOptions
): Promise<ExecutionResult> {
  return coreBlockExecutor.execute(
    nodeId,
    blockType,
    config,
    input,
    context,
    options
  )
}
