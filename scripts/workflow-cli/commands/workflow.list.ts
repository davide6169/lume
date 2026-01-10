/**
 * Command: workflow list
 * List all workflows
 */

import { logger } from '../utils/logger'
import { databaseService } from '../utils/db'

export async function registerListCommand(options: {
  filter?: string
  tags?: string
  json?: boolean
}): Promise<void> {
  try {
    // Initialize database connection
    await databaseService.initialize()

    const workflowService = databaseService.getWorkflowService()

    logger.header('Workflows')

    // Build query options
    const queryOptions: any = {
      limit: 100,
      offset: 0
    }

    // Parse filter
    if (options.filter) {
      const [key, value] = options.filter.split('=')
      if (key === 'category') {
        queryOptions.category = value
      } else if (key === 'active') {
        queryOptions.is_active = value === 'true' || value === '1'
      }
    }

    // Parse tags
    if (options.tags) {
      queryOptions.tags = options.tags.split(',')
    }

    // Fetch workflows from database
    const result = await workflowService.listWorkflows(queryOptions)

    if (!result.data || result.data.length === 0) {
      logger.warn('No workflows found')
      logger.info('Use "workflow create --file <path>" to create your first workflow')
      return
    }

    // Output
    if (options.json) {
      logger.json(result.data)
    } else {
      const tableData = result.data.map(w => ({
        ID: w.workflow_id,
        Name: w.name,
        Category: w.category || '-',
        Version: w.version || 1,
        Status: w.is_active ? '✅ Active' : '⏸ Inactive',
        Executions: w.total_executions || 0,
        'Success Rate': w.total_executions > 0
          ? `${((w.successful_executions / w.total_executions) * 100).toFixed(1)}%`
          : '-',
        Tags: w.tags?.join(', ') || '-'
      }))

      logger.table(tableData)
      console.log('')
      logger.info(`Total: ${result.count} workflows`)
      if (result.has_more) {
        logger.warn(`Showing first ${result.data.length} workflows (use pagination options for more)`)
      }
    }
  } catch (error: any) {
    logger.error(`Failed to list workflows: ${error.message}`)
    logger.info('Make sure your database is configured with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
}
