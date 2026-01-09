/**
 * Workflow Engine - Job Integration Module
 *
 * Exports job-related functionality for workflow execution
 * within the job processor system.
 */

// Workflow Execution Service
export {
  WorkflowExecutionService,
  workflowExecutionService
} from './workflow-execution.service'

export type {
  WorkflowExecutionOptions,
  WorkflowExecutionResult
} from './workflow-execution.service'

// Workflow Job Handler
export {
  processWorkflowJob,
  createWorkflowJob,
  getWorkflowJobProgress
} from './workflow-job.handler'
