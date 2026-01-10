/**
 * Command: workflow delete
 * Delete a workflow
 */

import { logger } from '../utils/logger'
import { databaseService } from '../utils/db'
import readline from 'readline'

export async function registerDeleteCommand(options: {
  id?: string
  yes?: boolean
}): Promise<void> {
  if (!options.id) {
    logger.error('Workflow ID is required (--id <workflowId>)')
    process.exit(1)
  }

  try {
    await databaseService.initialize()
    const workflowService = databaseService.getWorkflowService()

    logger.header('Delete Workflow')

    // Get workflow details first
    const workflow = await workflowService.getWorkflowByWorkflowId(options.id)
    if (!workflow) {
      logger.error(`Workflow not found: ${options.id}`)
      process.exit(1)
    }

    logger.warn(`You are about to delete workflow: ${workflow.name}`)
    logger.kv('ID', workflow.workflow_id)
    logger.kv('Name', workflow.name)
    logger.kv('Category', workflow.category || '-')
    logger.kv('Executions', workflow.total_executions || 0)

    // Confirm deletion unless --yes flag is provided
    if (!options.yes) {
      console.log('')
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })

      const answer = await new Promise<string>((resolve) => {
        rl.question('Are you sure you want to delete this workflow? (yes/no): ', resolve)
      })

      rl.close()

      if (answer.toLowerCase() !== 'yes') {
        logger.info('Deletion cancelled')
        process.exit(0)
      }
    }

    // Delete from database
    console.log('')
    logger.info('Deleting workflow from database...')

    await workflowService.deleteWorkflowByWorkflowId(options.id)

    console.log('')
    logger.success(`✅ Workflow deleted successfully: ${options.id}`)
  } catch (error: any) {
    logger.error(`Failed to delete workflow: ${error.message}`)
    process.exit(1)
  }
}
