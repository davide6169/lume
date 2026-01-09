/**
 * Single Workflow API
 *
 * GET, PUT, DELETE operations on individual workflows
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { WorkflowService } from '@/lib/workflow-engine/database'
import { workflowValidator } from '@/lib/workflow-engine'
import type { WorkflowDefinition } from '@/lib/workflow-engine/types'

interface RouteContext {
  params: {
    workflowId: string
  }
}

// ============================================================
// GET /api/workflows/[workflowId] - Get workflow by ID
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

    const { workflowId } = context.params

    const workflowService = WorkflowService.getInstance()
    const workflow = await workflowService.getWorkflowById(workflowId)

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Check authorization
    if (workflow.createdBy !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: workflow
    })
  } catch (error) {
    console.error('[Workflow API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ============================================================
// PUT /api/workflows/[workflowId] - Update workflow
// ============================================================

export async function PUT(
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

    const { workflowId } = context.params
    const body = await request.json()
    const { workflow: workflowUpdate, validate = true } = body

    if (!workflowUpdate) {
      return NextResponse.json({ error: 'Workflow definition is required' }, { status: 400 })
    }

    // Validate updated workflow
    if (validate) {
      const validation = await workflowValidator.validate(workflowUpdate)
      if (!validation.valid) {
        return NextResponse.json({
          error: 'Workflow validation failed',
          details: validation.errors
        }, { status: 400 })
      }
    }

    const workflowService = WorkflowService.getInstance()

    // Check if workflow exists and user owns it
    const existing = await workflowService.getWorkflowById(workflowId)
    if (!existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }
    if (existing.createdBy !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Update workflow
    const updated = await workflowService.updateWorkflow(workflowId, {
      name: workflowUpdate.name,
      description: workflowUpdate.description,
      version: workflowUpdate.version,
      definition: workflowUpdate
    })

    return NextResponse.json({
      success: true,
      data: updated
    })
  } catch (error) {
    console.error('[Workflow API] PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ============================================================
// DELETE /api/workflows/[workflowId] - Delete workflow
// ============================================================

export async function DELETE(
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

    const { workflowId } = context.params

    const workflowService = WorkflowService.getInstance()

    // Check if workflow exists and user owns it
    const existing = await workflowService.getWorkflowById(workflowId)
    if (!existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }
    if (existing.createdBy !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Delete workflow (soft delete by setting is_active = false)
    await workflowService.deleteWorkflow(workflowId)

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully'
    })
  } catch (error) {
    console.error('[Workflow API] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
