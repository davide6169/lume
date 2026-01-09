/**
 * Execute Workflow API Endpoint
 *
 * POST /api/workflows/[workflowId]/execute - Execute a workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { WorkflowOrchestrator } from '@/lib/workflow-engine'
import { ContextFactory } from '@/lib/workflow-engine'
import { WorkflowService } from '@/lib/workflow-engine/database/workflow.service'
import { ExecutionTrackingService } from '@/lib/workflow-engine/database/execution-tracking.service'

type RouteContext = {
  params: Promise<{ workflowId: string }>
}

// POST /api/workflows/[workflowId]/execute - Execute workflow
export async function POST(request: NextRequest, context: RouteContext) {
  const startTime = Date.now()

  try {
    const { workflowId } = await context.params
    const body = await request.json()
    const { input, mode, secrets, variables } = body

    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Get workflow definition from database
    const workflowService = new WorkflowService(supabaseUrl, supabaseKey)
    const workflowDB = await workflowService.getWorkflowByWorkflowId(workflowId)

    if (!workflowDB) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    if (!workflowDB.is_active) {
      return NextResponse.json(
        { error: 'Workflow is not active' },
        { status: 400 }
      )
    }

    // Generate execution ID
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create execution tracker
    const executionTracker = new ExecutionTrackingService(supabaseUrl, supabaseKey)

    // Create execution record
    const execution = await executionTracker.createExecution({
      workflow_id: workflowId,
      execution_id: executionId,
      status: 'running',
      input_data: input,
      mode: mode || 'production',
      progress_percentage: 0,
      metadata: {
        workflow_name: workflowDB.name,
        workflow_version: workflowDB.version
      }
    })

    // Create execution context with database logging
    const executionContext = ContextFactory.create({
      workflowId,
      executionId,
      mode: mode || 'production',
      variables: variables || {},
      secrets: secrets || {},
      progress: async (progress, event) => {
        // Update progress in database
        await executionTracker.updateProgress(executionId, progress)

        // Log timeline event
        await executionTracker.createTimelineEvent({
          workflow_execution_id: execution.id, // Use the UUID from execution record
          event: event.event,
          event_type: event.event,
          details: event.details,
          node_id: event.nodeId,
          block_type: event.blockType,
          error_message: event.error
        })
      }
    })

    // Execute workflow
    const orchestrator = new WorkflowOrchestrator()
    const result = await orchestrator.execute(
      workflowDB.definition,
      executionContext,
      input
    )

    const executionTime = Date.now() - startTime

    // Update execution record
    await executionTracker.updateExecution(executionId, {
      status: result.status,
      output_data: result.output,
      error_message: result.error?.message,
      error_stack: result.error?.stack,
      execution_time_ms: executionTime,
      completed_at: new Date().toISOString(),
      progress_percentage: 100
    })

    // Return result
    return NextResponse.json({
      execution_id: executionId,
      workflow_id: workflowId,
      status: result.status,
      execution_time_ms: executionTime,
      output: result.output,
      error: result.error?.message,
      metadata: result.metadata
    })
  } catch (error) {
    console.error('[WorkflowExecutionAPI] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to execute workflow', message: (error as Error).message },
      { status: 500 }
    )
  }
}
