/**
 * Command: workflow create
 * Create a new workflow
 */

import { logger } from '../utils/logger'
import { configLoader } from '../utils/config-loader'
import { databaseService } from '../utils/db'
import { workflowValidator } from '../../../lib/workflow-engine'

export async function registerCreateCommand(options: {
  file?: string
  json?: boolean
}): Promise<void> {
  if (!options.file) {
    logger.error('Workflow file is required (--file <path>)')
    process.exit(1)
  }

  try {
    await databaseService.initialize()
    const workflowService = databaseService.getWorkflowService()

    logger.header('Create Workflow')

    // Load workflow definition
    const workflowDefinition = await configLoader.loadWorkflowDefinition(options.file)

    logger.info(`Creating workflow: ${workflowDefinition.workflowId}`)
    logger.subheader('Workflow Details')
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

    // Check if workflow already exists
    const existing = await workflowService.getWorkflowByWorkflowId(workflowDefinition.workflowId)
    if (existing) {
      logger.warn(`Workflow "${workflowDefinition.workflowId}" already exists`)
      logger.info('Use "workflow update" to modify an existing workflow')
      process.exit(1)
    }

    // Create workflow in database
    console.log('')
    logger.info('Creating workflow in database...')

    const created = await workflowService.createWorkflow({
      workflow_id: workflowDefinition.workflowId,
      name: workflowDefinition.name || workflowDefinition.workflowId,
      description: workflowDefinition.description || '',
      version: workflowDefinition.version || 1,
      definition: workflowDefinition,
      category: workflowDefinition.category || 'custom',
      tags: workflowDefinition.tags || [],
      metadata: workflowDefinition.metadata || {},
      is_active: true
    })

    if (!options.json) {
      console.log('')
      logger.success(`✅ Workflow created successfully!`)
      logger.kv('Database ID', created.id)
      logger.kv('Workflow ID', created.workflow_id)
      logger.kv('Name', created.name)
      logger.kv('Created', new Date(created.created_at).toLocaleString())

      console.log('')
      logger.info('You can now:')
      logger.info(`  • View details: npm run workflow get -- --id ${created.workflow_id}`)
      logger.info(`  • Execute: npm run workflow exec -- --id ${created.workflow_id}`)
    } else {
      logger.json(created)
    }
  } catch (error: any) {
    logger.error(`Failed to create workflow: ${error.message}`)
    process.exit(1)
  }
}
