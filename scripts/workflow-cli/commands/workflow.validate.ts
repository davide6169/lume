/**
 * Command: workflow validate
 * Validate a workflow definition
 */

import { logger } from '../utils/logger'
import { configLoader } from '../utils/config-loader'
import { workflowValidator } from '../../../lib/workflow-engine'

export async function registerValidateCommand(options: {
  file?: string
  json?: boolean
}): Promise<void> {
  if (!options.file) {
    logger.error('Workflow file is required (--file <path>)')
    process.exit(1)
  }

  logger.header('Validate Workflow')

  try {
    const workflow = await configLoader.loadWorkflowDefinition(options.file)

    logger.info(`Validating workflow: ${workflow.workflowId}`)

    const result = workflowValidator.validate(workflow)

    if (options.json) {
      logger.json(result)
    } else {
      if (result.valid) {
        logger.success('✅ Workflow is valid!')
        logger.info('The workflow definition can be executed.')
      } else {
        logger.error('❌ Workflow validation failed!')
        console.log('')
        logger.subheader('Errors:')
        result.errors?.forEach(error => {
          logger.error(`  • ${error.message || error}`)
          if (error && typeof error === 'object' && 'path' in error) {
            logger.info(`    Path: ${(error as any).path?.join('.') || 'N/A'}`)
          }
        })

        if (result.warnings && result.warnings.length > 0) {
          console.log('')
          logger.subheader('Warnings:')
          result.warnings.forEach(warning => {
            logger.warn(`  • ${warning.message}`)
          })
        }

        process.exit(1)
      }
    }
  } catch (error: any) {
    logger.error(`Failed to validate workflow: ${error.message}`)
    process.exit(1)
  }
}
