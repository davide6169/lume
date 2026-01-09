/**
 * Workflows API Endpoint
 *
 * POST   /api/workflows - Create workflow
 * GET    /api/workflows - List workflows
 * GET    /api/workflows/:id - Get workflow by ID
 * PUT    /api/workflows/:id - Update workflow
 * DELETE /api/workflows/:id - Delete workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { WorkflowService } from '@/lib/workflow-engine/database/workflow.service'
import { workflowValidator } from '@/lib/workflow-engine'

// GET /api/workflows - List workflows
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const options = {
      is_active: searchParams.get('is_active') === 'true' ? true : undefined,
      category: searchParams.get('category') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      order_by: (searchParams.get('order_by') as any) || undefined,
      order_direction: (searchParams.get('order_direction') as any) || undefined
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const workflowService = new WorkflowService(supabaseUrl, supabaseKey)
    const result = await workflowService.listWorkflows(options)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[WorkflowsAPI] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to list workflows', message: (error as Error).message },
      { status: 500 }
    )
  }
}

// POST /api/workflows - Create workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate workflow definition
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const workflowService = new WorkflowService(supabaseUrl, supabaseKey)
    const workflow = await workflowService.createWorkflow(body)

    return NextResponse.json(workflow, { status: 201 })
  } catch (error) {
    console.error('[WorkflowsAPI] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow', message: (error as Error).message },
      { status: 500 }
    )
  }
}
