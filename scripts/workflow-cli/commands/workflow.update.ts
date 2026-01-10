/**
 * Command: workflow update
 * Update an existing workflow
 */

import { logger } from '../utils/logger'
import { configLoader } from '../utils/config-loader'
import { databaseService } from '../utils/db'
import { workflowValidator } from '../../../lib/workflow-engine'

export async function registerUpdateCommand(options: {
  id?: string
  file?: string
  json?: boolean
}): Promise<void> {
  if (!options.id) {
    logger.error('Workflow ID is required (--id <workflowId>)')
    process.exit(1)
  }

  if (!options.file) {
    logger.error('Workflow file is required (--file <path>)')
    process.exit(1)
  }

  try {
    await databaseService.initialize()
    const workflowService = databaseService.getWorkflowService()

    logger.header('Update Workflow')

    // Load workflow definition
    const workflowDefinition = await configLoader.loadWorkflowDefinition(options.file)

    logger.info(`Updating workflow: ${options.id}`)
    logger.kv('ID', workflowDefinition.workflowId)
    logger.kv('Name', workflowDefinition.name || workflowDefinition.workflowId)
    logger.kv('Nodes', workflowDefinition.nodes?.length || 0)
    logger.kv('Edges', workflowDefinition.edges?.length || 0)

    // Validate workflow
    console.log('')
    logger.info('Validating workflow definition...')
    const validationResult = workflowValidator.validate(workflowDefinition)

    if (!validationResult.valid) {
      logger.error('❌ Workflow validation failed!')
      if (validationResult.errors) {
        validationResult.errors.forEach(error => {
          logger.error(`  • ${error.message}`)
        })
      }
      process.exit(1)
    }

    logger.success('✅ Workflow is valid')

    // Check if workflow exists
    const existing = await workflowService.getWorkflowByWorkflowId(options.id)
    if (!existing) {
      logger.error(`Workflow not found: ${options.id}`)
      logger.info('Use "workflow create" to create a new workflow')
      process.exit(1)
    }

    // Update workflow in database
    console.log('')
    logger.info('Updating workflow in database...')

    const updated = await workflowService.updateWorkflowByWorkflowId(options.id, {
      name: workflowDefinition.name,
      description: workflowDefinition.description,
      version: workflowDefinition.version,
      definition: workflowDefinition,
      category: workflowDefinition.category,
      tags: workflowDefinition.tags,
      metadata: workflowDefinition.metadata
    })

    if (!options.json) {
      console.log('')
      logger.success(`✅ Workflow updated successfully!`)
      logger.kv('Database ID', updated.id)
      logger.kv('Workflow ID', updated.workflow_id)
      logger.kv('Name', updated.name)
      logger.kv('Updated', new Date(updated.updated_at).toLocaleString())

      console.log('')
      logger.info('You can now:')
      logger.info(`  • View details: npm run workflow get -- --id ${updated.workflow_id}`)
    } else {
      logger.json(updated)
    }
  } catch (error: any) {
    logger.error(`Failed to update workflow: ${error.message}`)
    process.exit(1)
  }
}
