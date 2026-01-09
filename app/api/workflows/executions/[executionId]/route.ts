/**
 * Execution Status API
 *
 * GET /api/workflows/executions/[executionId] - Get execution status
 * POST /api/workflows/executions/[executionId]/cancel - Cancel execution
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ExecutionTrackingService } from '@/lib/workflow-engine/database'
import { jobProcessor } from '@/lib/services/job-processor'

interface RouteContext {
  params: {
    executionId: string
  }
}

// ============================================================
// GET /api/workflows/executions/[executionId] - Get execution status
// ============================================================

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { executionId } = context.params

    const trackingService = ExecutionTrackingService.getInstance()
    const execution = await trackingService.getExecutionById(executionId)

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 })
    }

    // Check authorization (execution belongs to user's workflow)
    if (execution.tenant_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get detailed execution info including block executions
    const blockExecutions = await trackingService.getBlockExecutions(executionId)
    const timelineEvents = await trackingService.getExecutionTimeline(executionId)

    return NextResponse.json({
      success: true,
      data: {
        ...execution,
        blockExecutions,
        timelineEvents
      }
    })
  } catch (error) {
    console.error('[ExecutionStatus API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch execution status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ============================================================
// POST /api/workflows/executions/[executionId]/cancel - Cancel execution
// ============================================================

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { executionId } = context.params

    // Try to cancel as job processor job first
    const job = jobProcessor.getJob(executionId)

    if (job) {
      // Cancel via job processor
      const cancelledJob = jobProcessor.cancelJob(executionId)

      if (!cancelledJob) {
        return NextResponse.json({ error: 'Failed to cancel execution' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Execution cancelled',
        executionId,
        status: cancelledJob.status
      })
    } else {
      // Cancel via tracking service (database)
      const trackingService = ExecutionTrackingService.getInstance()
      const cancelled = await trackingService.cancelExecution(executionId)

      if (!cancelled) {
        return NextResponse.json({ error: 'Failed to cancel execution or execution not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        message: 'Execution cancelled',
        executionId,
        status: 'cancelled'
      })
    }
  } catch (error) {
    console.error('[ExecutionCancel API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel execution', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
