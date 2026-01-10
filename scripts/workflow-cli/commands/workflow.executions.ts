/**
 * Command: workflow executions
 * List workflow executions
 */

import { logger } from '../utils/logger'
import { databaseService } from '../utils/db'

export async function registerExecutionsCommand(options: {
  id?: string
  status?: string
  limit?: string
  json?: boolean
}): Promise<void> {
  try {
    await databaseService.initialize()
    const executionService = databaseService.getExecutionService()

    logger.header('Workflow Executions')

    // Build query options
    const queryOptions: any = {
      limit: parseInt(options.limit || '50'),
      offset: 0
    }

    if (options.id) {
      queryOptions.workflow_id = options.id
    }

    if (options.status) {
      queryOptions.status = options.status
    }

    logger.info('Fetching executions from database...')

    // Fetch executions
    const executions = await executionService.listExecutions(queryOptions)

    if (!executions || executions.length === 0) {
      logger.warn('No executions found')
      if (options.id) {
        logger.info(`Use "workflow exec -- --id ${options.id}" to run this workflow`)
      }
      return
    }

    // Output
    if (options.json) {
      logger.json(executions)
    } else {
      const tableData = executions.map(ex => ({
        ID: logger.truncate(ex.execution_id || ex.id || '', 20),
        Workflow: logger.truncate(ex.workflow_id || '', 25),
        Status: ex.status === 'completed' ? '✅' : ex.status === 'failed' ? '❌' : ex.status === 'running' ? '🔄' : '⏸',
        Mode: ex.mode || '-',
        Duration: ex.execution_time_ms ? logger.formatDuration(ex.execution_time_ms) : '-',
        Started: ex.started_at ? new Date(ex.started_at).toLocaleString() : '-'
      }))

      logger.table(tableData)
      console.log('')
      logger.info(`Total: ${executions.length} execution(s)`)
    }
  } catch (error: any) {
    logger.error(`Failed to list executions: ${error.message}`)
    logger.info('Make sure your database is configured')
    process.exit(1)
  }
}
