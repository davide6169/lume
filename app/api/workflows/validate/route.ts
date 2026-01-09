/**
 * Workflow Validation API Endpoint
 *
 * POST /api/workflows/validate - Validate workflow definition without saving
 */

import { NextRequest, NextResponse } from 'next/server'
import { workflowValidator } from '@/lib/workflow-engine'
import { blockRegistry } from '@/lib/workflow-engine/registry'

interface ValidateRequest {
  workflow: any
  checkBlocks?: boolean
}

// POST /api/workflows/validate - Validate workflow definition
export async function POST(request: NextRequest) {
  try {
    const body: ValidateRequest = await request.json()
    const { workflow, checkBlocks = true } = body

    if (!workflow) {
      return NextResponse.json(
        {
          error: 'Workflow definition is required',
          message: 'Please provide a workflow definition in the request body'
        },
        { status: 400 }
      )
    }

    // Validate workflow structure
    const validationResult = await workflowValidator.validate(workflow)

    // Additional block availability check
    let blockValidation = {
      valid: true,
      missingBlocks: [] as string[],
      unavailableBlocks: [] as string[]
    }

    if (checkBlocks && validationResult.valid) {
      // Check if all blocks referenced in nodes are registered
      const nodeBlocks = workflow.nodes?.map((node: any) => node.type) || []

      for (const blockType of nodeBlocks) {
        if (!blockRegistry.has(blockType)) {
          blockValidation.unavailableBlocks.push(blockType)
          blockValidation.valid = false
        }
      }

      // Check for required blocks (input and output)
      const hasInput = nodeBlocks.some((type: string) => type.startsWith('input.'))
      const hasOutput = nodeBlocks.some((type: string) => type.startsWith('output.'))

      if (!hasInput) {
        blockValidation.missingBlocks.push('input')
      }
      if (!hasOutput) {
        blockValidation.missingBlocks.push('output')
      }

      if (blockValidation.missingBlocks.length > 0) {
        blockValidation.valid = false
      }
    }

    // Combine validation results
    const isValid = validationResult.valid && blockValidation.valid

    return NextResponse.json({
      success: true,
      data: {
        valid: isValid,
        workflow: {
          structure: validationResult.valid,
          errors: validationResult.errors || [],
          warnings: validationResult.warnings || []
        },
        blocks: blockValidation,
        summary: {
          totalErrors: (validationResult.errors?.length || 0) + blockValidation.missingBlocks.length + blockValidation.unavailableBlocks.length,
          totalWarnings: validationResult.warnings?.length || 0,
          hasCriticalIssues: !isValid
        }
      }
    })
  } catch (error) {
    console.error('[WorkflowValidationAPI] POST error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        message: (error as Error).message,
        data: {
          valid: false,
          workflow: {
            structure: false,
            errors: [
              {
                type: 'validation_error',
                message: (error as Error).message,
                path: 'unknown'
              }
            ],
            warnings: []
          },
          blocks: {
            valid: true,
            missingBlocks: [],
            unavailableBlocks: []
          },
          summary: {
            totalErrors: 1,
            totalWarnings: 0,
            hasCriticalIssues: true
          }
        }
      },
      { status: 500 }
    )
  }
}
