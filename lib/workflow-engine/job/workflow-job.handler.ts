/**
 * Workflow Job Handler
 *
 * Handles the execution of workflow jobs within the job processor.
 * Integrates workflow engine with job tracking and progress updates.
 */

import { Job } from '@/types'
import { workflowExecutionService } from './workflow-execution.service'
import type { WorkflowJobPayload } from '@/types'

/**
 * Process a workflow job
 * Called by the job processor to execute workflow jobs
 */
export async function processWorkflowJob(
  job: Job,
  updateProgress: (progress: number, event?: any) => void
): Promise<void> {
  console.log(`[WorkflowJobHandler] Processing workflow job ${job.id}`)

  const payload = job.payload as WorkflowJobPayload

  // Validate payload
  const validation = workflowExecutionService.validatePayload(payload)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  try {
    // Update initial progress
    updateProgress(5, {
      timestamp: new Date().toISOString(),
      event: 'WORKFLOW_LOADING',
      details: { workflowId: payload.workflowId }
    })

    // Execute workflow with progress tracking
    const result = await workflowExecutionService.executeWorkflow(payload, {
      onProgress: (progress, event) => {
        // Map workflow progress (0-100) to job progress (5-95)
        // Leave 5% at start and end for job overhead
        const jobProgress = 5 + Math.round((progress / 100) * 90)
        updateProgress(jobProgress, event)
      },

      onNodeComplete: (nodeId, nodeResult) => {
        console.log(`[WorkflowJobHandler] Node completed: ${nodeId}`)
      },

      onError: (error) => {
        console.error(`[WorkflowJobHandler] Workflow error: ${error}`)
        updateProgress(job.progress || 50, {
          timestamp: new Date().toISOString(),
          event: 'WORKFLOW_ERROR',
          details: { error }
        })
      }
    })

    // Update final progress
    if (result.success) {
      updateProgress(100, {
        timestamp: new Date().toISOString(),
        event: 'WORKFLOW_COMPLETED',
        details: {
          executionId: result.executionId,
          workflowId: result.workflowId,
          totalNodes: result.metadata.totalNodes,
          completedNodes: result.metadata.completedNodes,
          failedNodes: result.metadata.failedNodes,
          executionTime: result.metadata.executionTime
        }
      })

      console.log(`[WorkflowJobHandler] Workflow job ${job.id} completed successfully`, {
        executionId: result.executionId,
        executionTime: result.metadata.executionTime
      })
    } else {
      throw new Error(result.error || 'Workflow execution failed')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error(`[WorkflowJobHandler] Workflow job ${job.id} failed:`, errorMessage)

    updateProgress(job.progress || 50, {
      timestamp: new Date().toISOString(),
      event: 'WORKFLOW_FAILED',
      details: { error: errorMessage }
    })

    throw error
  }
}

/**
 * Create a workflow job
 * Helper function to create a properly structured workflow job
 */
export function createWorkflowJob(
  userId: string,
  payload: WorkflowJobPayload
): Omit<Job, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId,
    type: 'WORKFLOW',
    status: 'pending',
    progress: 0,
    payload,
    timeline: [{
      timestamp: new Date().toISOString(),
      event: 'JOB_CREATED',
      details: {
        workflowId: payload.workflowId,
        mode: payload.mode || 'production'
      }
    }]
  }
}

/**
 * Get workflow job progress summary
 * Extracts meaningful progress information from workflow job timeline
 */
export function getWorkflowJobProgress(job: Job): {
  status: string
  progress: number
  currentStep?: string
  completedNodes: number
  totalNodes?: number
  executionTime?: number
  error?: string
} {
  const timeline = job.timeline || []
  const lastEvent = timeline[timeline.length - 1]

  // Extract metadata from timeline
  const metadata = lastEvent?.details || {}

  return {
    status: job.status,
    progress: job.progress,
    currentStep: lastEvent?.event,
    completedNodes: metadata.completedNodes || 0,
    totalNodes: metadata.totalNodes,
    executionTime: metadata.executionTime,
    error: job.result?.error
  }
}
