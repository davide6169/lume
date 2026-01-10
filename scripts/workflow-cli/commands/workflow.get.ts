/**
 * Command: workflow get
 * Get workflow details
 */

import { logger } from '../utils/logger'
import { databaseService } from '../utils/db'

export async function registerGetCommand(options: {
  id?: string
  json?: boolean
}): Promise<void> {
  if (!options.id) {
    logger.error('Workflow ID is required (--id <workflowId>)')
    process.exit(1)
  }

  try {
    await databaseService.initialize()
    const workflowService = databaseService.getWorkflowService()

    logger.header(`Workflow: ${options.id}`)

    // Get workflow from database
    const workflow = await workflowService.getWorkflowByWorkflowId(options.id)

    if (!workflow) {
      logger.error(`Workflow not found: ${options.id}`)
      logger.info('Use "workflow list" to see all available workflows')
      process.exit(1)
    }

    if (options.json) {
      logger.json(workflow)
    } else {
      // Display workflow details
      logger.kv('Workflow ID', workflow.workflow_id)
      logger.kv('Name', workflow.name)
      logger.kv('Description', workflow.description || 'No description')
      logger.kv('Version', workflow.version || 1)
      logger.kv('Category', workflow.category || '-')

      if (workflow.tags && workflow.tags.length > 0) {
        logger.kv('Tags', workflow.tags.join(', '))
      }

      logger.kv('Status', workflow.is_active ? '✅ Active' : '⏸ Inactive')

      console.log('')
      logger.subheader('Statistics')
      logger.kv('Total Executions', workflow.total_executions || 0)
      logger.kv('Successful', workflow.successful_executions || 0)
      logger.kv('Failed', workflow.failed_executions || 0)

      const successRate = workflow.total_executions > 0
        ? ((workflow.successful_executions / workflow.total_executions) * 100).toFixed(1)
        : '0.0'
      logger.kv('Success Rate', `${successRate}%`)

      console.log('')
      logger.subheader('Metadata')
      logger.kv('Created', new Date(workflow.created_at).toLocaleString())
      logger.kv('Updated', new Date(workflow.updated_at).toLocaleString())

      if (workflow.metadata && Object.keys(workflow.metadata).length > 0) {
        logger.json(workflow.metadata)
      }

      console.log('')
      logger.subheader('Definition')
      logger.kv('Nodes', workflow.definition?.nodes?.length || 0)
      logger.kv('Edges', workflow.definition?.edges?.length || 0)
    }
  } catch (error: any) {
    logger.error(`Failed to get workflow: ${error.message}`)
    process.exit(1)
  }
}
