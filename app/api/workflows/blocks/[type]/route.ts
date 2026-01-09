/**
 * Block Details API Endpoint
 *
 * GET /api/workflows/blocks/[type] - Get block schema and details
 */

import { NextRequest, NextResponse } from 'next/server'
import { blockRegistry } from '@/lib/workflow-engine/registry'

type RouteContext = {
  params: Promise<{ type: string }>
}

// GET /api/workflows/blocks/[type] - Get block details
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { type } = await context.params

    // Decode type (URL encoded)
    const blockType = decodeURIComponent(type)

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

    // Get block metadata
    const metadata = blockRegistry.getMetadata(blockType)

    if (!metadata) {
      return NextResponse.json(
        {
          error: 'Block metadata not found',
          message: `Block '${blockType}' is registered but has no metadata`
        },
        { status: 404 }
      )
    }

    // Try to create instance to get additional info
    let instanceInfo = null
    try {
      const executor = blockRegistry.create(blockType)
      if (executor) {
        instanceInfo = {
          type: executor.getType(),
          className: executor.constructor.name
        }
      }
    } catch (error) {
      // Block might not be instantiable without config
      console.warn(`Could not instantiate block ${blockType}:`, error)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...metadata,
        instanceInfo
      }
    })
  } catch (error) {
    console.error('[BlockDetailsAPI] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get block details',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
}
