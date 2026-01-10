/**
 * Command: blocks get
 * Get details for a specific block
 */

import { blockRegistry } from '../../../lib/workflow-engine'
import { registerAllBuiltInBlocks } from '../../../lib/workflow-engine/blocks'
import { logger } from '../utils/logger'

export function registerBlocksGetCommand(options: {
  type?: string
  json?: boolean
}): void {
  // Initialize blocks
  registerAllBuiltInBlocks()

  if (!options.type) {
    logger.error('Block type is required (--type <blockType>)')
    process.exit(1)
  }

  const metadata = blockRegistry.getMetadata(options.type)

  if (!metadata) {
    logger.error(`Block not found: ${options.type}`)
    logger.info('Use "workflow blocks list" to see all available blocks')
    process.exit(1)
  }

  if (options.json) {
    logger.json(metadata)
  } else {
    logger.header(`Block: ${metadata.name}`)

    logger.kv('Type', metadata.type)
    logger.kv('Category', metadata.category)
    logger.kv('Version', metadata.version)
    logger.kv('Description', metadata.description)

    if (metadata.tags && metadata.tags.length > 0) {
      logger.kv('Tags', metadata.tags.join(', '))
    }

    if (metadata.icon) {
      logger.kv('Icon', metadata.icon)
    }

    if (metadata.configSchema) {
      console.log('')
      logger.subheader('Configuration Schema')
      logger.json(metadata.configSchema)
    }

    if (metadata.inputSchema) {
      console.log('')
      logger.subheader('Input Schema')
      logger.json(metadata.inputSchema)
    }

    if (metadata.outputSchema) {
      console.log('')
      logger.subheader('Output Schema')
      logger.json(metadata.outputSchema)
    }
  }
}
