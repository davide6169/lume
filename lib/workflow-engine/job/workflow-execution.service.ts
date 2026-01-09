/**
 * Workflow Execution Service
 *
 * Integrates the workflow engine with the job processor system.
 * Handles workflow execution as background jobs with progress tracking.
 */

import { workflowOrchestrator, workflowValidator } from '..'
import type {
  WorkflowDefinition,
  ExecutionContext,
  WorkflowExecutionResult
} from '../types'
import { ContextFactory } from '../context'
import { WorkflowService } from '../database'
import type { WorkflowJobPayload } from '@/types'

export interface WorkflowExecutionOptions {
  onProgress?: (progress: number, event: any) => void
  onNodeComplete?: (nodeId: string, result: any) => void
  onError?: (error: string) => void
}

export interface WorkflowExecutionResult {
  success: boolean
  executionId: string
  workflowId: string
  status: 'completed' | 'failed' | 'cancelled'
  result?: any
  error?: string
  metadata: {
    totalNodes: number
    completedNodes: number
    failedNodes: number
    executionTime: number
    nodeResults: Record<string, any>
  }
}

/**
 * Workflow Execution Service
 * Bridges the workflow engine with the job processor
 */
export class WorkflowExecutionService {
  private static instance: WorkflowExecutionService

  private constructor() {}

  static getInstance(): WorkflowExecutionService {
    if (!WorkflowExecutionService.instance) {
      WorkflowExecutionService.instance = new WorkflowExecutionService()
    }
    return WorkflowExecutionService.instance
  }

  /**
   * Execute a workflow job
   */
  async executeWorkflow(
    payload: WorkflowJobPayload,
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now()
    const { workflowId, workflowDefinition, input, mode = 'production', variables = {}, metadata = {} } = payload

    console.log(`[WorkflowExecutionService] Starting workflow execution: ${workflowId}`)

    try {
      // 1. Load workflow definition
      let workflow: WorkflowDefinition

      if (workflowDefinition) {
        // Use inline definition
        workflow = workflowDefinition
        console.log(`[WorkflowExecutionService] Using inline workflow definition`)
      } else {
        // Load from database
        const workflowService = WorkflowService.getInstance()
        const dbWorkflow = await workflowService.getWorkflowById(workflowId)

        if (!dbWorkflow) {
          throw new Error(`Workflow ${workflowId} not found`)
        }

        workflow = dbWorkflow.definition
        console.log(`[WorkflowExecutionService] Loaded workflow from database: ${dbWorkflow.name}`)
      }

      // 2. Validate workflow
      console.log(`[WorkflowExecutionService] Validating workflow...`)
      const validation = await workflowValidator.validate(workflow)

      if (!validation.valid) {
        const error = `Workflow validation failed: ${validation.errors.map(e => e.message).join(', ')}`
        console.error(`[WorkflowExecutionService] ${error}`)
        throw new Error(error)
      }

      console.log(`[WorkflowExecutionService] Workflow is valid`)

      // 3. Create execution context
      const context = ContextFactory.create({
        workflowId: workflow.workflowId,
        mode,
        variables,
        secrets: this.getSecretsFromEnv(),
        progress: (progress, event) => {
          console.log(`[WorkflowExecutionService] [${progress}%] ${event.event}`, event.details)

          // Call user-provided callback
          if (options.onProgress) {
            options.onProgress(progress, event)
          }
        }
      })

      // 4. Execute workflow
      console.log(`[WorkflowExecutionService] Executing workflow with orchestrator...`)
      const executionResult: WorkflowExecutionResult = await workflowOrchestrator.execute(
        workflow,
        context,
        input
      )

      const executionTime = Date.now() - startTime

      console.log(`[WorkflowExecutionService] Workflow execution completed:`, {
        status: executionResult.status,
        executionTime,
        completedNodes: executionResult.metadata.completedNodes,
        failedNodes: executionResult.metadata.failedNodes
      })

      // 5. Transform result to job result format
      if (executionResult.status === 'completed') {
        return {
          success: true,
          executionId: executionResult.executionId,
          workflowId: executionResult.workflowId,
          status: 'completed',
          result: executionResult.output,
          metadata: {
            totalNodes: executionResult.metadata.totalNodes,
            completedNodes: executionResult.metadata.completedNodes,
            failedNodes: executionResult.metadata.failedNodes,
            executionTime: executionResult.executionTime,
            nodeResults: executionResult.nodeResults
          }
        }
      } else {
        return {
          success: false,
          executionId: executionResult.executionId,
          workflowId: executionResult.workflowId,
          status: 'failed',
          error: executionResult.error?.message || 'Workflow execution failed',
          metadata: {
            totalNodes: executionResult.metadata.totalNodes,
            completedNodes: executionResult.metadata.completedNodes,
            failedNodes: executionResult.metadata.failedNodes,
            executionTime: executionResult.executionTime,
            nodeResults: executionResult.nodeResults
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const executionTime = Date.now() - startTime

      console.error(`[WorkflowExecutionService] Workflow execution failed:`, {
        error: errorMessage,
        executionTime
      })

      // Call error callback
      if (options.onError) {
        options.onError(errorMessage)
      }

      return {
        success: false,
        executionId: crypto.randomUUID(),
        workflowId,
        status: 'failed',
        error: errorMessage,
        metadata: {
          totalNodes: 0,
          completedNodes: 0,
          failedNodes: 0,
          executionTime,
          nodeResults: {}
        }
      }
    }
  }

  /**
   * Get secrets from environment variables
   */
  private getSecretsFromEnv(): Record<string, string> {
    return {
      // OpenRouter
      openrouter: process.env.OPENROUTER_API_KEY || '',

      // Apollo
      apollo: process.env.APOLLO_API_KEY || '',

      // Hunter.io
      hunter: process.env.HUNTER_API_KEY || '',

      // Mixedbread
      mixedbread: process.env.MIXEDBREAD_API_KEY || '',

      // Apify
      apify: process.env.APIFY_API_KEY || '',

      // Supabase
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    }
  }

  /**
   * Validate workflow job payload
   */
  validatePayload(payload: any): { valid: boolean; error?: string } {
    if (!payload.workflowId && !payload.workflowDefinition) {
      return {
        valid: false,
        error: 'Either workflowId or workflowDefinition is required'
      }
    }

    if (payload.input === undefined) {
      return {
        valid: false,
        error: 'Input is required'
      }
    }

    return { valid: true }
  }
}

/**
 * Singleton instance
 */
export const workflowExecutionService = WorkflowExecutionService.getInstance()
