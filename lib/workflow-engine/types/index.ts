/**
 * Workflow Engine - Core Type Definitions
 *
 * This file defines all TypeScript types for the workflow engine system.
 * All types are designed to be serializable to/from JSON for database storage.
 */

/**
 * Block type enum - defines all available block types
 */
export enum BlockType {
  // Data sources
  INPUT = 'input',

  // External services
  API = 'api',
  AI = 'ai',

  // Data processing
  TRANSFORM = 'transform',
  FILTER = 'filter',
  BRANCH = 'branch',
  MERGE = 'merge',

  // Data destinations
  OUTPUT = 'output'
}

/**
 * Execution status enum
 */
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped'
}

/**
 * JSON Schema definition for type safety
 */
export interface JSONSchema {
  $id?: string
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  properties?: Record<string, JSONSchema>
  items?: JSONSchema
  required?: string[]
  enum?: (string | number)[]
  format?: string
  minimum?: number
  maximum?: number
  minItems?: number
  maxItems?: number
  pattern?: string
  $ref?: string
  allOf?: JSONSchema[]
  anyOf?: JSONSchema[]
  oneOf?: JSONSchema[]
  not?: JSONSchema
}

/**
 * Block configuration - generic config object
 */
export interface BlockConfig {
  [key: string]: any
}

/**
 * Variable mapping configuration for template interpolation
 * Example: { "url": "{{input.url}}", "apiKey": "{{secrets.apifyKey}}" }
 */
export interface VariableMapping {
  [key: string]: string
}

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  maxRetries: number
  backoffMultiplier: number
  initialDelay: number
  retryableErrors?: string[]
}

/**
 * Error handling strategy
 */
export type ErrorHandlingStrategy = 'continue' | 'stop' | 'retry' | 'skip'

/**
 * Condition operator for filters and branches
 */
export enum ConditionOperator {
  EXISTS = 'exists',
  NOT_EXISTS = 'not_exists',
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  REGEX = 'regex',
  IN = 'in',
  NOT_IN = 'not_in',
  AND = 'and',
  OR = 'or'
}

/**
 * Condition definition for filters and branches
 */
export interface Condition {
  field?: string
  operator: ConditionOperator | string
  value?: any
  conditions?: Condition[]
}

/**
 * Filter block configuration
 */
export interface FilterConfig extends BlockConfig {
  conditions: Condition[]
  onFail?: 'skip' | 'error'
}

/**
 * Branch block configuration
 */
export interface BranchConfig extends BlockConfig {
  condition: Condition
  branches: {
    true: string // node ID
    false: string // node ID
  }
}

/**
 * Merge block configuration
 */
export interface MergeConfig extends BlockConfig {
  strategy: 'deepMerge' | 'append' | 'zip' | 'intersect'
  sources?: string[] // input port names
}

/**
 * API block configuration
 */
export interface APIBlockConfig extends BlockConfig {
  provider: string
  endpoint?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  mapping?: VariableMapping
  batchMode?: boolean
  batchSize?: number
  timeout?: number
}

/**
 * AI block configuration
 */
export interface AIBlockConfig extends BlockConfig {
  provider: string
  model: string
  promptTemplate?: string
  temperature?: number
  maxTokens?: number
  mapping?: VariableMapping
}

/**
 * Transform operation types
 */
export enum TransformOperationType {
  MAP = 'map',
  RENAME = 'rename',
  CALCULATE = 'calculate',
  FORMAT = 'format',
  EXTRACT = 'extract',
  ARRAY_TO_OBJECT = 'array_to_object',
  OBJECT_TO_ARRAY = 'object_to_array',
  FLATTEN = 'flatten',
  GROUP = 'group',
  SORT = 'sort',
  DEDUPLICATE = 'deduplicate'
}

/**
 * Transform operation definition
 */
export interface TransformOperation {
  type: TransformOperationType | string
  field?: string
  targetField?: string
  transformation?: any
  condition?: Condition
}

/**
 * Transform block configuration
 */
export interface TransformConfig extends BlockConfig {
  operations: TransformOperation[]
}

/**
 * Node (Block) definition
 */
export interface NodeDefinition {
  id: string
  type: BlockType | string
  name: string
  description?: string
  config: BlockConfig
  inputSchema: JSONSchema | null
  outputSchema: JSONSchema | null
  retryConfig?: RetryPolicy
  timeout?: number
}

/**
 * Edge (Connection) definition
 */
export interface EdgeDefinition {
  id: string
  source: string // source node ID
  target: string // target node ID
  sourcePort?: string // output port name (default: 'out')
  targetPort?: string // input port name (default: 'in')
  condition?: Condition // conditional routing
}

/**
 * Workflow metadata
 */
export interface WorkflowMetadata {
  author?: string
  createdAt: string
  updatedAt: string
  tags?: string[]
  version?: number
}

/**
 * Global workflow configuration
 */
export interface WorkflowGlobals {
  timeout?: number // overall workflow timeout in seconds
  retryPolicy?: RetryPolicy
  errorHandling?: ErrorHandlingStrategy
  maxParallelNodes?: number
}

/**
 * Workflow definition - complete DAG configuration
 */
export interface WorkflowDefinition {
  $schema?: string
  workflowId: string
  name: string
  version: number
  description?: string
  metadata: WorkflowMetadata
  globals?: WorkflowGlobals
  nodes: NodeDefinition[]
  edges: EdgeDefinition[]
  schemas?: Record<string, JSONSchema>
}

/**
 * Execution context - holds runtime state
 */
export interface ExecutionContext {
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
  disableCache?: boolean // Disable caching for fresh data
  setVariable(key: string, value: any): void
  getVariable(key: string): any
  setVariables(vars: Record<string, any>): void
  getSecret(key: string): string | undefined
  setSecret(key: string, value: string): void
  setNodeResult(nodeId: string, result: ExecutionResult): void
  getNodeResult(nodeId: string): ExecutionResult | undefined
  hasNodeResult(nodeId: string): boolean
  getAllNodeResults(): Record<string, ExecutionResult>
  getNodeOutput(nodeId: string): any | undefined
  setMetadata(key: string, value: any): void
  getMetadata(key: string): any | undefined
  getElapsedTime(): number
  updateProgress(progress: number, event: TimelineEvent): void
  createChildContext(childExecutionId: string): ExecutionContext
  cleanup(): void
}

/**
 * Structured logger interface
 */
export interface Logger {
  debug(message: string, meta?: any): void
  info(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  error(message: string, meta?: any): void
  node(nodeId: string, message: string, meta?: any): void
}

/**
 * Progress callback for real-time updates
 */
export interface ProgressCallback {
  (progress: number, event: TimelineEvent): void
}

/**
 * Timeline event for tracking workflow execution
 */
export interface TimelineEvent {
  timestamp: string
  event: string
  details?: any
  nodeId?: string
  blockType?: string
  error?: string
}

/**
 * Block execution result
 */
export interface ExecutionResult {
  nodeId: string
  status: ExecutionStatus
  input: any
  output: any
  error?: Error
  executionTime: number
  retryCount: number
  metadata: {
    [key: string]: any
  }
  startTime: number
  endTime: number
  logs: TimelineEvent[]
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  executionId: string
  workflowId: string
  status: ExecutionStatus
  input: any
  output: any
  error?: Error
  startTime: number
  endTime: number
  executionTime: number
  nodeResults: Record<string, ExecutionResult>
  timeline: TimelineEvent[]
  metadata: {
    totalNodes: number
    completedNodes: number
    failedNodes: number
    skippedNodes: number
  }
}

/**
 * Block executor interface
 * All blocks must implement this interface
 */
export interface BlockExecutor {
  /**
   * Execute the block with given input and context
   */
  execute(
    config: BlockConfig,
    input: any,
    context: ExecutionContext
  ): Promise<ExecutionResult>

  /**
   * Validate input against input schema
   */
  validateInput(input: any, schema: JSONSchema): Promise<boolean>

  /**
   * Validate output against output schema
   */
  validateOutput(output: any, schema: JSONSchema): Promise<boolean>
}

/**
 * Block factory - creates block executors
 */
export interface BlockFactory {
  create(type: BlockType | string): BlockExecutor | null
  register(type: string, executor: new (...args: any[]) => BlockExecutor): void
  list(): string[]
}

/**
 * Workflow validator result
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

/**
 * Validation error
 */
export interface ValidationError {
  type: 'schema' | 'dag' | 'connection' | 'config'
  nodeId?: string
  message: string
  path?: string
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  type: 'performance' | 'cost' | 'best_practice'
  nodeId?: string
  message: string
  suggestion?: string
}

/**
 * Variable interpolation context
 */
export interface InterpolationContext {
  input: any
  variables: Record<string, any>
  secrets: Record<string, string>
  env: Record<string, string>
  node: {
    id: string
    type: string
    config: BlockConfig
  }
}

/**
 * Cost tracking for blocks
 */
export interface BlockCost {
  apiCalls?: number
  costPerCall?: number
  totalCost: number
  currency: string
  breakdown?: Record<string, number>
}

/**
 * Performance metrics for blocks
 */
export interface BlockMetrics {
  executionTime: number
  memoryUsed?: number
  dataSize?: number
  cacheHits?: number
  cacheMisses?: number
}

/**
 * Workflow template definition
 */
export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  definition: WorkflowDefinition
  isSystemTemplate: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Block execution options
 */
export interface ExecutionOptions {
  timeout?: number
  retryPolicy?: RetryPolicy
  errorHandling?: ErrorHandlingStrategy
  enableCache?: boolean
  validateOutput?: boolean
  dryRun?: boolean
}

/**
 * Node execution state for orchestration
 */
export interface NodeExecutionState {
  nodeId: string
  status: ExecutionStatus
  dependencies: string[] // node IDs that must complete first
  dependents: string[] // node IDs waiting for this one
  retryCount: number
  result?: ExecutionResult
}

/**
 * Workflow execution plan
 * Generated by orchestrator before execution
 */
export interface ExecutionPlan {
  executionOrder: string[][] // Layers of nodes that can run in parallel
  nodeStates: Map<string, NodeExecutionState>
  estimatedTime: number
  estimatedCost: number
}
