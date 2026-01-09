/**
 * Blocks API Endpoint
 *
 * GET /api/workflows/blocks - List all available blocks
 */

import { NextRequest, NextResponse } from 'next/server'
import { blockRegistry } from '@/lib/workflow-engine/registry'

// GET /api/workflows/blocks - List all available blocks
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    let blocks

    if (category) {
      // Filter by category
      blocks = blockRegistry.getByCategory(category)
    } else {
      // Get all blocks
      blocks = blockRegistry.getAllMetadata()
    }

    // Group blocks by category for better organization
    const groupedByCategory = blocks.reduce((acc, block) => {
      if (!acc[block.category]) {
        acc[block.category] = []
      }
      acc[block.category].push(block)
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      success: true,
      data: {
        total: blocks.length,
        blocks: category ? blocks : groupedByCategory,
        categories: Object.keys(groupedByCategory)
      }
    })
  } catch (error) {
    console.error('[BlocksAPI] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to list blocks',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
}
