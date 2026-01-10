/**
 * Command: workflow delete
 * Delete a workflow
 */

import { logger } from '../utils/logger'
import readline from 'readline'

export async function registerDeleteCommand(options: {
  id?: string
  yes?: boolean
}): Promise<void> {
  if (!options.id) {
    logger.error('Workflow ID is required (--id <workflowId>)')
    process.exit(1)
  }

  logger.header('Delete Workflow')
  logger.warn(`You are about to delete workflow: ${options.id}`)

  // Confirm deletion unless --yes flag is provided
  if (!options.yes) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const answer = await new Promise<string>((resolve) => {
      rl.question('Are you sure? (yes/no): ', resolve)
    })

    rl.close()

    if (answer.toLowerCase() !== 'yes') {
      logger.info('Deletion cancelled')
      process.exit(0)
    }
  }

  // TODO: Delete from database
  logger.warn('Database integration not yet implemented')
  logger.info(`Workflow "${options.id}" ready to be deleted`)
}
