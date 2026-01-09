/**
 * Workflow Engine - Main Entry Point
 *
 * Configurable block-based workflow engine for lead enrichment pipelines.
 *
 * @package workflow-engine
 * @version 1.0.0
 */

// Core types
export * from './types'

// Validator
export { WorkflowValidator, workflowValidator } from './validator'

// Registry and Factory
export {
  BlockRegistry,
  blockRegistry,
  registerBlock,
  createBlockExecutor,
  BaseBlockExecutor,
  initializeBuiltInBlocks,
  type BlockMetadata
} from './registry'

// Context Manager
export {
  ContextManager,
  ContextFactory,
  DefaultLogger,
  VariableInterpolator
} from './context'

// Orchestrator
export {
  WorkflowOrchestrator,
  workflowOrchestrator
} from './orchestrator'

// Database Integration
export * from './database'

// Job Integration
export * from './job'

// Block registration
export { registerAllBuiltInBlocks } from './blocks'

// Re-export commonly used types
export type {
  WorkflowDefinition,
  NodeDefinition,
  EdgeDefinition,
  BlockExecutor,
  ExecutionContext,
  ExecutionResult,
  WorkflowExecutionResult,
  ValidationResult,
  BlockConfig,
  ExecutionOptions,
  Logger
} from './types'
