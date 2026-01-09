/**
 * Single Workflow API Endpoint
 *
 * GET    /api/workflows/[id] - Get workflow by ID
 * PUT    /api/workflows/[id] - Update workflow
 * DELETE /api/workflows/[id] - Delete workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { WorkflowService } from '@/lib/workflow-engine/database/workflow.service'
import { workflowValidator } from '@/lib/workflow-engine'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/workflows/[id] - Get workflow by ID
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const workflowService = new WorkflowService(supabaseUrl, supabaseKey)
    const workflow = await workflowService.getWorkflowById(id)

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('[WorkflowAPI] GET by ID error:', error)
    return NextResponse.json(
      { error: 'Failed to get workflow', message: (error as Error).message },
      { status: 500 }
    )
  }
}

// PUT /api/workflows/[id] - Update workflow
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()

    // Validate workflow definition if provided
    if (body.definition) {
      const validationResult = await workflowValidator.validate(body.definition)

      if (!validationResult.valid) {
        return NextResponse.json(
          {
            error: 'Invalid workflow definition',
            validationErrors: validationResult.errors,
            warnings: validationResult.warnings
          },
          { status: 400 }
        )
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const workflowService = new WorkflowService(supabaseUrl, supabaseKey)
    const workflow = await workflowService.updateWorkflow(id, body)

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('[WorkflowAPI] PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow', message: (error as Error).message },
      { status: 500 }
    )
  }
}

// DELETE /api/workflows/[id] - Delete workflow
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const workflowService = new WorkflowService(supabaseUrl, supabaseKey)
    await workflowService.deleteWorkflow(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[WorkflowAPI] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete workflow', message: (error as Error).message },
      { status: 500 }
    )
  }
}
