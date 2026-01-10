/**
 * Execution Context Manager
 *
 * Manages runtime state for workflow execution including:
 * - Variables and interpolation
 * - Secrets management
 * - Node result storage
 * - Logging
 * - Progress tracking
 */

import {
  ExecutionContext,
  Logger,
  TimelineEvent,
  ExecutionResult,
  ProgressCallback
} from './types'

/**
 * Default logger implementation
 */
export class DefaultLogger implements Logger {
  private executionId: string
  private logs: TimelineEvent[] = []

  constructor(executionId: string) {
    this.executionId = executionId
  }

  debug(message: string, meta?: any): void {
    this.log('debug', message, meta)
  }

  info(message: string, meta?: any): void {
    this.log('info', message, meta)
  }

  warn(message: string, meta?: any): void {
    this.log('warn', message, meta)
  }

  error(message: string, meta?: any): void {
    this.log('error', message, meta)
  }

  node(nodeId: string, message: string, meta?: any): void {
    this.log('info', message, {
      ...meta,
      nodeId
    })
  }

  private log(level: string, message: string, meta?: any): void {
    const event: TimelineEvent = {
      timestamp: new Date().toISOString(),
      event: level.toUpperCase(),
      details: {
        message,
        ...meta
      }
    }

    this.logs.push(event)

    // Console output with color coding
    const prefix = `[Workflow:${this.executionId}]`
    const metaStr = meta ? JSON.stringify(meta, null, 2) : ''

    switch (level) {
      case 'debug':
        console.debug(prefix, message, metaStr)
        break
      case 'info':
        console.info(prefix, message, metaStr)
        break
      case 'warn':
        console.warn(prefix, message, metaStr)
        break
      case 'error':
        console.error(prefix, message, metaStr)
        break
    }
  }

  getLogs(): TimelineEvent[] {
    return [...this.logs]
  }

  clearLogs(): void {
    this.logs = []
  }
}

/**
 * Execution context manager
 */
export class ContextManager implements ExecutionContext {
  workflowId: string
  executionId: string
  mode: 'production' | 'demo' | 'test'
  variables: Record<string, any>
  secrets: Record<string, string>
  startTime: number
  nodeResults: Map<string, ExecutionResult>
  parentContext?: ExecutionContext
  logger: Logger
  progress?: ProgressCallback
  disableCache?: boolean // Disable caching for this execution

  private env: Record<string, string>
  private _metadata: Map<string, any>

  constructor(config: {
    workflowId: string
    executionId: string
    mode?: 'production' | 'demo' | 'test'
    variables?: Record<string, any>
    secrets?: Record<string, string>
    env?: Record<string, string>
    parentContext?: ExecutionContext
    logger?: Logger
    progress?: ProgressCallback
    disableCache?: boolean // Disable caching for fresh data
  }) {
    this.workflowId = config.workflowId
    this.executionId = config.executionId
    this.mode = config.mode || 'production'
    this.variables = config.variables || {}
    this.secrets = config.secrets || {}
    this.env = config.env || this.loadEnvironment()
    this.startTime = Date.now()
    this.nodeResults = new Map()
    this.parentContext = config.parentContext
    this.logger = config.logger || new DefaultLogger(config.executionId)
    this.progress = config.progress
    this.disableCache = config.disableCache || false
    this._metadata = new Map()

    // Log cache status
    if (this.disableCache) {
      this.logger.info('Cache disabled: All API calls will be made (no cache)')
    }
  }

  /**
   * Load environment variables
   */
  private loadEnvironment(): Record<string, string> {
    // In production, filter and return safe env vars
    const env: Record<string, string> = {}

    // Allow specific safe environment variables
    const safeKeys = ['NODE_ENV', 'REGION', 'ENVIRONMENT']

    for (const key of safeKeys) {
      if (process.env[key]) {
        env[key] = process.env[key]!
      }
    }

    return env
  }

  /**
   * Set a variable
   */
  setVariable(key: string, value: any): void {
    this.variables[key] = value
    this.logger.debug(`Variable set: ${key}`, { value })
  }

  /**
   * Get a variable
   */
  getVariable(key: string): any {
    return this.variables[key]
  }

  /**
   * Set multiple variables
   */
  setVariables(vars: Record<string, any>): void {
    Object.assign(this.variables, vars)
    this.logger.debug('Variables updated', { count: Object.keys(vars).length })
  }

  /**
   * Get a secret
   */
  getSecret(key: string): string | undefined {
    return this.secrets[key]
  }

  /**
   * Set a secret (runtime only, not persisted)
   */
  setSecret(key: string, value: string): void {
    this.secrets[key] = value
    // Don't log secrets!
  }

  /**
   * Get environment variable
   */
  getEnv(key: string): string | undefined {
    return this.env[key]
  }

  /**
   * Store node execution result
   */
  setNodeResult(nodeId: string, result: ExecutionResult): void {
    this.nodeResults.set(nodeId, result)
    this.logger.debug(`Node result stored: ${nodeId}`, {
      status: result.status,
      executionTime: result.executionTime
    })
  }

  /**
   * Get node execution result
   */
  getNodeResult(nodeId: string): ExecutionResult | undefined {
    return this.nodeResults.get(nodeId)
  }

  /**
   * Check if node has been executed
   */
  hasNodeResult(nodeId: string): boolean {
    return this.nodeResults.has(nodeId)
  }

  /**
   * Get all node results
   */
  getAllNodeResults(): Record<string, ExecutionResult> {
    const result: Record<string, ExecutionResult> = {}
    const entries = Array.from(this.nodeResults.entries())
    for (const [nodeId, execResult] of entries) {
      result[nodeId] = execResult
    }
    return result
  }

  /**
   * Get output from a specific node
   */
  getNodeOutput(nodeId: string): any | undefined {
    return this.nodeResults.get(nodeId)?.output
  }

  /**
   * Set metadata
   */
  setMetadata(key: string, value: any): void {
    this._metadata.set(key, value)
  }

  /**
   * Get metadata
   */
  getMetadata(key: string): any | undefined {
    return this._metadata.get(key)
  }

  /**
   * Get execution elapsed time
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime
  }

  /**
   * Update progress
   */
  updateProgress(progress: number, event: TimelineEvent): void {
    if (this.progress) {
      try {
        this.progress(progress, event)
      } catch (error) {
        this.logger.error('Progress callback failed', { error })
      }
    }
  }

  /**
   * Create child context for sub-workflow
   */
  createChildContext(childExecutionId: string): ExecutionContext {
    return new ContextManager({
      workflowId: this.workflowId,
      executionId: childExecutionId,
      mode: this.mode,
      variables: { ...this.variables },
      secrets: { ...this.secrets },
      env: { ...this.env },
      parentContext: this,
      logger: this.logger,
      progress: this.progress
    })
  }

  /**
   * Get context summary for logging
   */
  getSummary(): {
    workflowId: string
    executionId: string
    mode: string
    elapsedTime: number
    nodesCompleted: number
    variablesCount: number
  } {
    return {
      workflowId: this.workflowId,
      executionId: this.executionId,
      mode: this.mode,
      elapsedTime: this.getElapsedTime(),
      nodesCompleted: this.nodeResults.size,
      variablesCount: Object.keys(this.variables).length
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.nodeResults.clear()
    this._metadata.clear()
    if (this.logger instanceof DefaultLogger) {
      this.logger.clearLogs()
    }
  }

  /**
   * Check if currently in mock mode (demo or test)
   */
  isMockMode(): boolean {
    return this.mode === 'demo' || this.mode === 'test'
  }

  /**
   * Validate if a block type supports mock mode
   */
  validateMockCapability(blockType: string): boolean {
    // Dynamic import to avoid circular dependency
    const { blockSupportsMock } = require('./registry')
    return blockSupportsMock(blockType)
  }
}

/**
 * Context factory - creates execution contexts
 */
export class ContextFactory {
  private static defaultConfig = {
    mode: 'production' as const
  }

  static create(config: {
    workflowId: string
    executionId?: string
    mode?: 'production' | 'demo' | 'test'
    variables?: Record<string, any>
    secrets?: Record<string, string>
    logger?: Logger
    progress?: ProgressCallback
  }): ExecutionContext {
    const executionId = config.executionId || this.generateExecutionId()

    return new ContextManager({
      workflowId: config.workflowId,
      executionId,
      mode: config.mode || this.defaultConfig.mode,
      variables: config.variables,
      secrets: config.secrets,
      logger: config.logger,
      progress: config.progress
    })
  }

  static createDemoContext(workflowId: string, mockData?: any): ExecutionContext {
    return this.create({
      workflowId,
      mode: 'demo',
      variables: {
        mock: true,
        ...mockData
      }
    })
  }

  static createTestContext(workflowId: string): ExecutionContext {
    return this.create({
      workflowId,
      mode: 'test'
    })
  }

  private static generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Variable interpolation for templates
 * Supports:
 * - {{input.field}} - Input data
 * - {{variables.name}} - Workflow variables
 * - {{secrets.apiKey}} - Secrets
 * - {{env.NODE_ENV}} - Environment variables
 * - {{nodes.previousNode.output}} - Output from previous node
 * - {{workflow.id}} - Workflow metadata
 */
export class VariableInterpolator {
  /**
   * Interpolate variables in a template string
   */
  static interpolate(
    template: string,
    context: ExecutionContext,
    inputData: any = {}
  ): string {
    if (typeof template !== 'string') {
      return String(template)
    }

    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        const value = this.resolveExpression(expression.trim(), context, inputData)
        return this.formatValue(value)
      } catch (error) {
        console.warn(`Failed to interpolate: ${expression}`, error)
        return match // Keep original if interpolation fails
      }
    })
  }

  /**
   * Interpolate variables in an object (recursive)
   */
  static interpolateObject(
    obj: any,
    context: ExecutionContext,
    inputData: any = {}
  ): any {
    if (typeof obj === 'string') {
      return this.interpolate(obj, context, inputData)
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateObject(item, context, inputData))
    }

    if (obj && typeof obj === 'object') {
      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateObject(value, context, inputData)
      }
      return result
    }

    return obj
  }

  /**
   * Resolve an expression to a value
   */
  private static resolveExpression(
    expression: string,
    context: ExecutionContext,
    inputData: any
  ): any {
    const parts = expression.split('.')

    // Handle special prefixes
    const [prefix, ...rest] = parts

    switch (prefix) {
      case 'input':
        return this.getNestedValue(inputData, rest)

      case 'variables':
      case 'var':
        return this.getNestedValue(context.variables, rest)

      case 'secrets':
        return this.getNestedValue(context.secrets, rest)

      case 'env':
        return this.getNestedValue(
          Object.fromEntries(
            Object.entries(process.env).filter(([key]) =>
              ['NODE_ENV', 'REGION', 'ENVIRONMENT'].includes(key)
            )
          ),
          rest
        )

      case 'nodes':
        // Reference to previous node output
        const [nodeId, ...outputPath] = rest
        if (nodeId) {
          const nodeOutput = context.getNodeOutput(nodeId)
          return this.getNestedValue(nodeOutput, outputPath)
        }
        return undefined

      case 'workflow':
        // Workflow metadata
        const workflowMeta: any = {
          id: context.workflowId,
          executionId: context.executionId,
          mode: context.mode,
          startTime: context.startTime
        }
        return this.getNestedValue(workflowMeta, rest)

      default:
        // Default to input
        return this.getNestedValue(inputData, parts)
    }
  }

  /**
   * Get nested value from object using path
   */
  private static getNestedValue(obj: any, path: string[]): any {
    if (!obj || path.length === 0) return obj

    let current = obj
    for (const part of path) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part]
      } else {
        return undefined
      }
    }

    return current
  }

  /**
   * Format value for string interpolation
   */
  private static formatValue(value: any): string {
    if (value === null || value === undefined) {
      return ''
    }

    if (typeof value === 'object') {
      return JSON.stringify(value)
    }

    return String(value)
  }

  /**
   * Extract all variable references from a template
   */
  static extractVariables(template: string): string[] {
    const matches = template.match(/\{\{([^}]+)\}\}/g)
    if (!matches) return []

    return matches.map(match => match.replace(/\{\{|\}\}/g, '').trim())
  }
}
