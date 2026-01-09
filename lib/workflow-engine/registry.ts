/**
 * Block Registry and Factory
 *
 * Central registry for all workflow block types.
 * Provides factory methods to create block executors.
 */

import {
  BlockType,
  BlockExecutor,
  BlockFactory,
  NodeDefinition
} from './types'

/**
 * Block registry - manages all available block types
 */
export class BlockRegistry implements BlockFactory {
  private registry: Map<string, new (...args: any[]) => BlockExecutor>
  private metadata: Map<string, BlockMetadata>

  constructor() {
    this.registry = new Map()
    this.metadata = new Map()
  }

  /**
   * Register a block executor type
   */
  register(
    type: string,
    executorClass: new (...args: any[]) => BlockExecutor,
    metadata?: Partial<BlockMetadata>
  ): void {
    if (this.registry.has(type)) {
      throw new Error(`Block type already registered: ${type}`)
    }

    this.registry.set(type, executorClass)

    // Store metadata
    const defaultMetadata: BlockMetadata = {
      type,
      name: type,
      description: '',
      category: 'custom',
      version: '1.0.0',
      ...metadata
    }
    this.metadata.set(type, defaultMetadata)
  }

  /**
   * Create a new block executor instance
   */
  create(type: string): BlockExecutor | null {
    const ExecutorClass = this.registry.get(type)
    if (!ExecutorClass) {
      return null
    }
    return new ExecutorClass()
  }

  /**
   * Check if a block type is registered
   */
  has(type: string): boolean {
    return this.registry.has(type)
  }

  /**
   * List all registered block types
   */
  list(): string[] {
    return Array.from(this.registry.keys())
  }

  /**
   * Get metadata for a block type
   */
  getMetadata(type: string): BlockMetadata | undefined {
    return this.metadata.get(type)
  }

  /**
   * Get all block metadata
   */
  getAllMetadata(): BlockMetadata[] {
    return Array.from(this.metadata.values())
  }

  /**
   * Get blocks by category
   */
  getByCategory(category: string): BlockMetadata[] {
    return Array.from(this.metadata.values()).filter(m => m.category === category)
  }

  /**
   * Unregister a block type
   */
  unregister(type: string): boolean {
    const deleted = this.registry.delete(type)
    this.metadata.delete(type)
    return deleted
  }

  /**
   * Clear all registered blocks
   */
  clear(): void {
    this.registry.clear()
    this.metadata.clear()
  }
}

/**
 * Block metadata
 */
export interface BlockMetadata {
  type: string
  name: string
  description: string
  category: 'input' | 'output' | 'api' | 'ai' | 'transform' | 'filter' | 'branch' | 'merge' | 'custom'
  version: string
  icon?: string
  configSchema?: any
  inputSchema?: any
  outputSchema?: any
  tags?: string[]
}

/**
 * Global block registry instance
 */
export const blockRegistry = new BlockRegistry()

/**
 * Helper function to register a block
 */
export function registerBlock(
  type: string,
  executorClass: new (...args: any[]) => BlockExecutor,
  metadata?: Partial<BlockMetadata>
): void {
  blockRegistry.register(type, executorClass, metadata)
}

/**
 * Helper function to create a block executor
 */
export function createBlockExecutor(type: string): BlockExecutor {
  const executor = blockRegistry.create(type)
  if (!executor) {
    throw new Error(`Unknown block type: ${type}. Block not registered in registry.`)
  }
  return executor
}

/**
 * Base class for all block executors
 * Provides common functionality and enforces interface
 */
export abstract class BaseBlockExecutor implements BlockExecutor {
  protected readonly type: string

  constructor(type?: string) {
    this.type = type || this.constructor.name.replace('Block', '')
  }

  /**
   * Execute the block - must be implemented by subclasses
   */
  abstract execute(
    config: any,
    input: any,
    context: any
  ): Promise<any>

  /**
   * Validate input against schema
   */
  async validateInput(input: any, schema: any): Promise<boolean> {
    if (!schema) return true

    try {
      return this.validateAgainstSchema(input, schema)
    } catch (error) {
      console.error(`[Block:${this.type}] Input validation failed:`, error)
      return false
    }
  }

  /**
   * Validate output against schema
   */
  async validateOutput(output: any, schema: any): Promise<boolean> {
    if (!schema) return true

    try {
      return this.validateAgainstSchema(output, schema)
    } catch (error) {
      console.error(`[Block:${this.type}] Output validation failed:`, error)
      return false
    }
  }

  /**
   * Validate data against JSON schema
   */
  private validateAgainstSchema(data: any, schema: any): boolean {
    // Basic schema validation
    // In production, use a proper JSON schema validator like ajv
    if (!schema) return true

    const { type, properties, required, items } = schema

    // Type validation
    if (type === 'string') {
      return typeof data === 'string'
    } else if (type === 'number') {
      return typeof data === 'number'
    } else if (type === 'boolean') {
      return typeof data === 'boolean'
    } else if (type === 'array') {
      if (!Array.isArray(data)) return false
      if (items) {
        return data.every((item: any) => this.validateAgainstSchema(item, items))
      }
      return true
    } else if (type === 'object') {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return false
      }

      // Check required fields
      if (required && Array.isArray(required)) {
        for (const field of required) {
          if (!(field in data)) {
            return false
          }
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

      return true
    } else if (type === 'null') {
      return data === null
    }

    return true
  }

  /**
   * Get block type
   */
  getType(): string {
    return this.type
  }

  /**
   * Execute with timeout
   */
  protected async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
      )
    ])
  }

  /**
   * Execute with retry
   */
  protected async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    initialDelay: number,
    backoffMultiplier: number
  ): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error

        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(backoffMultiplier, attempt)
          console.warn(
            `[Block:${this.type}] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
            error
          )
          await this.sleep(delay)
        }
      }
    }

    throw lastError || new Error('Retry failed')
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Log execution
   */
  protected log(context: any, level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: any): void {
    const logger = context?.logger
    if (logger && typeof logger[level] === 'function') {
      logger[level](message, {
        blockType: this.type,
        ...meta
      })
    } else {
      console.log(`[Block:${this.type}] ${message}`, meta || '')
    }
  }
}

/**
 * Registry initialization function
 * Call this to register all built-in blocks
 */
export function initializeBuiltInBlocks(): void {
  // Import and register all built-in blocks
  // This will be implemented when we create the block implementations
  console.log('[BlockRegistry] Initializing built-in blocks...')

  // Input blocks
  // registerBlock('input', DatabaseInputBlock, { ... })
  // registerBlock('input.upload', UploadInputBlock, { ... })

  // API blocks
  // registerBlock('api.apify', ApifyScraperBlock, { ... })
  // registerBlock('api.apollo', ApolloEnrichmentBlock, { ... })

  // AI blocks
  // registerBlock('ai.openrouter', OpenRouterBlock, { ... })

  // Output blocks
  // registerBlock('output.database', DatabaseOutputBlock, { ... })
  // registerBlock('output.csv', CSVOutputBlock, { ... })

  console.log(`[BlockRegistry] Registered ${blockRegistry.list().length} block types`)
}
