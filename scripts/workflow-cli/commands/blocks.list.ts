/**
 * Command: blocks list
 * List all available blocks
 */

import { blockRegistry } from '../../../lib/workflow-engine'
import { registerAllBuiltInBlocks } from '../../../lib/workflow-engine/blocks'
import { logger } from '../utils/logger'

export function registerBlocksListCommand(options: {
  category?: string
  json?: boolean
}): void {
  // Initialize blocks
  registerAllBuiltInBlocks()

  const blocks = blockRegistry.getAllMetadata()

  // Filter by category if specified
  let filteredBlocks = Array.isArray(blocks) ? blocks : []
  if (options.category) {
    filteredBlocks = filteredBlocks.filter((b: any) => b.category === options.category)
  }

  // Output
  if (options.json) {
    logger.json(filteredBlocks)
  } else {
    logger.header('Available Blocks')

    if (filteredBlocks.length === 0) {
      logger.warn('No blocks found')
      return
    }

    // Group by category
    const grouped = filteredBlocks.reduce((acc: any, block: any) => {
      if (!acc[block.category]) {
        acc[block.category] = []
      }
      acc[block.category].push(block)
      return acc
    }, {})

    for (const [category, categoryBlocks] of Object.entries(grouped)) {
      logger.subheader(`${category.toUpperCase()} (${(categoryBlocks as any[]).length})`)

      const tableData = (categoryBlocks as any[]).map(block => ({
        Type: block.type,
        Name: block.name,
        Version: block.version,
        Tags: block.tags?.join(', ') || '-'
      }))

      logger.table(tableData)
    }

    console.log('')
    logger.info(`Total: ${filteredBlocks.length} blocks`)
  }
}
