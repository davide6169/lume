/**
 * Block Test API Endpoint
 *
 * POST /api/workflows/blocks/[type]/test - Test a single block execution
 */

import { NextRequest, NextResponse } from 'next/server'
import { blockRegistry } from '@/lib/workflow-engine/registry'
import { ContextFactory } from '@/lib/workflow-engine'

type RouteContext = {
  params: Promise<{ type: string }>
}

interface TestBlockRequest {
  config?: any
  input?: any
  variables?: Record<string, any>
  secrets?: Record<string, string>
  timeout?: number
}

// POST /api/workflows/blocks/[type]/test - Test block execution
export async function POST(request: NextRequest, context: RouteContext) {
  const startTime = Date.now()

  try {
    const { type } = await context.params

    // Decode type (URL encoded)
    const blockType = decodeURIComponent(type)

    // Parse request body
    const body: TestBlockRequest = await request.json()
    const { config = {}, input = {}, variables = {}, secrets = {}, timeout = 30000 } = body

    // Check if block exists
    if (!blockRegistry.has(blockType)) {
      return NextResponse.json(
        {
          error: 'Block not found',
          message: `Block type '${blockType}' is not registered`,
          availableBlocks: blockRegistry.list()
        },
        { status: 404 }
      )
    }

    // Create block executor instance
    const executor = blockRegistry.create(blockType)

    if (!executor) {
      return NextResponse.json(
        {
          error: 'Failed to create executor',
          message: `Could not create executor for block type '${blockType}'`
        },
        { status: 500 }
      )
    }

    // Create test execution context
    const testContext = ContextFactory.create({
      workflowId: 'test-workflow',
      executionId: `test-exec-${Date.now()}`,
      mode: 'test',
      variables: variables || {},
      secrets: secrets || {},
      logger: {
        debug: (msg: string, meta?: any) => console.log('[DEBUG]', msg, meta),
        info: (msg: string, meta?: any) => console.log('[INFO]', msg, meta),
        warn: (msg: string, meta?: any) => console.warn('[WARN]', msg, meta),
        error: (msg: string, meta?: any) => console.error('[ERROR]', msg, meta)
      }
    })

    // Execute block with timeout
    const executionPromise = executor.execute(config, input, testContext)

    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Block execution timeout after ${timeout}ms`)), timeout)
    })

    const result = await Promise.race([executionPromise, timeoutPromise]) as any

    const executionTime = Date.now() - startTime

    // Return test results
    return NextResponse.json({
      success: result.status === 'completed',
      data: {
        blockType,
        status: result.status,
        executionTime,
        output: result.output,
        error: result.error?.message || null,
        metadata: result.metadata || {},
        input,
        config
      }
    })
  } catch (error) {
    const executionTime = Date.now() - startTime

    console.error('[BlockTestAPI] POST error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Block execution failed',
        message: (error as Error).message,
        executionTime
      },
      { status: 500 }
    )
  }
}
