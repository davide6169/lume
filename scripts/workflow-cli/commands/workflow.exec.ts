/**
 * Command: workflow exec
 * Execute a workflow
 */

import { logger } from '../utils/logger'
import { configLoader, secretsManager } from '../utils/config-loader'
import { WorkflowOrchestrator } from '../../../lib/workflow-engine/orchestrator'
import { ContextFactory } from '../../../lib/workflow-engine/context'
import { WorkflowService } from '../../../lib/workflow-engine/database/workflow.service'
import { registerAllBuiltInBlocks } from '../../../lib/workflow-engine/blocks'

export async function registerExecCommand(options: {
  id?: string
  file?: string
  useBaseline?: boolean
  input?: string
  mode?: string
  watch?: boolean
  json?: boolean
}): Promise<void> {
  // Initialize blocks
  registerAllBuiltInBlocks()

  if (!options.id) {
    logger.error('Workflow ID is required (--id <workflowId>)')
    process.exit(1)
  }

  // Validate mode
  const validModes = ['live', 'mock', 'demo', 'test', 'production']
  const mode = (options.mode || 'demo') as 'production' | 'demo' | 'test'
  if (!validModes.includes(mode) && mode !== 'production') {
    logger.error(`Invalid mode: ${mode}. Valid modes: ${validModes.join(', ')}`)
    process.exit(1)
  }

  // Map 'live' to 'production', 'mock' to 'demo'
  const executionMode: 'production' | 'demo' | 'test' =
    mode === 'live' || mode === 'production' ? 'production' :
    mode === 'mock' || mode === 'demo' ? 'demo' : 'test'

  logger.header(`Execute Workflow: ${options.id}`)
  logger.kv('Mode', executionMode.toUpperCase(), executionMode === 'demo' || executionMode === 'test' ? '🎭 MOCK' : '✅ LIVE')

  try {
    let input: any = {}
    let variables: Record<string, any> = {}
    let secrets: Record<string, string> = {}

    // Load configuration
    if (options.useBaseline) {
      logger.info('Loading baseline configuration...')
      // TODO: Load baseline config
      logger.warn('Baseline loading not yet implemented, using defaults')
    } else if (options.file) {
      logger.info(`Loading test configuration: ${options.file}`)
      const testConfig = await configLoader.loadTestConfig(options.file)
      input = testConfig.input || {}
      variables = testConfig.variables || {}
      secrets = testConfig.secrets || {}
    } else if (options.input) {
      logger.info('Using inline input')
      input = JSON.parse(options.input)
    }

    // Load secrets based on mode
    if (executionMode === 'production') {
      logger.info('Loading secrets from environment...')
      secrets = await secretsManager.getDefaultSecrets()

      // Check if required secrets are available
      const missingSecrets = Object.entries(secrets)
        .filter(([_, value]) => !value)
        .map(([key, _]) => key)

      if (missingSecrets.length > 0) {
        logger.warn(`Missing secrets: ${missingSecrets.join(', ')}`)
        logger.info('Set environment variables or use --mode demo/test for mock mode')
      }
    } else {
      logger.info('Mock mode: No secrets required 🎭')
      secrets = {}
    }

    logger.subheader('Execution Configuration')
    logger.kv('Workflow ID', options.id)
    logger.kv('Mode', executionMode)
    logger.kv('Watch Mode', options.watch ? 'Enabled' : 'Disabled')

    if (Object.keys(input).length > 0) {
      console.log('')
      logger.info('Input:')
      logger.json(input)
    }

    if (Object.keys(variables).length > 0) {
      console.log('')
      logger.info('Variables:')
      logger.json(variables)
    }

    // Load workflow from database or file
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const workflowService = new WorkflowService(supabaseUrl, supabaseKey)

    logger.info(`Loading workflow: ${options.id}`)
    const workflowDB = await workflowService.getWorkflowByWorkflowId(options.id)

    if (!workflowDB) {
      logger.error(`Workflow not found: ${options.id}`)
      process.exit(1)
    }

    if (!workflowDB.is_active) {
      logger.error('Workflow is not active')
      process.exit(1)
    }

    logger.success(`Workflow loaded: ${workflowDB.name} v${workflowDB.version}`)

    // Create execution context
    const executionId = `cli_${Date.now()}`

    const context = ContextFactory.create({
      workflowId: options.id,
      executionId,
      mode: executionMode,
      variables,
      secrets,
      logger: {
        debug: (msg: string, meta?: any) => logger.debug(msg, meta),
        info: (msg: string, meta?: any) => logger.info(msg, meta),
        warn: (msg: string, meta?: any) => logger.warn(msg, meta),
        error: (msg: string, meta?: any) => logger.error(msg, meta)
      },
      progress: (progress, event) => {
        if (options.watch) {
          const bar = '█'.repeat(Math.floor(progress / 5))
          const empty = '░'.repeat(20 - Math.floor(progress / 5))
          process.stdout.write(`\r[${bar}${empty}] ${progress}% - ${event.event}`)
          if (progress === 100) console.log('')
        }
      }
    })

    // Execute workflow
    console.log('')
    logger.subheader('Executing Workflow...')
    console.log('')

    const startTime = Date.now()
    const orchestrator = new WorkflowOrchestrator()
    const result = await orchestrator.execute(workflowDB.definition, context, input)
    const executionTime = Date.now() - startTime

    console.log('')
    logger.subheader('Execution Results')

    // Status
    if (result.status === 'completed') {
      logger.success('Status: COMPLETED ✅')
    } else if (result.status === 'failed') {
      logger.error('Status: FAILED ❌')
    } else if (result.status === 'partial') {
      logger.warn('Status: PARTIAL ⚠️')
    } else {
      logger.info(`Status: ${result.status}`)
    }

    console.log('')
    logger.kv('Execution Time', `${executionTime}ms`)
    logger.kv('Total Nodes', result.metadata?.totalNodes || 0)
    logger.kv('Completed Nodes', result.metadata?.completedNodes || 0)
    logger.kv('Failed Nodes', result.metadata?.failedNodes || 0)
    logger.kv('Skipped Nodes', result.metadata?.skippedNodes || 0)

    // Output
    if (result.output && Object.keys(result.output).length > 0) {
      console.log('')
      logger.info('Output:')
      if (options.json) {
        logger.json(result.output)
      } else {
        console.log(JSON.stringify(result.output, null, 2))
      }
    }

    // Error
    if (result.error) {
      console.log('')
      logger.error('Error:')
      logger.error(result.error.message)
      if (result.error.stack) {
        console.log('')
        logger.debug(result.error.stack)
      }
    }

    // Exit with appropriate code
    if (result.status === 'completed') {
      process.exit(0)
    } else if (result.status === 'failed') {
      process.exit(1)
    } else {
      process.exit(2)
    }

  } catch (error: any) {
    logger.error(`Failed to execute workflow: ${error.message}`)
    if (error.stack) {
      logger.debug(error.stack)
    }
    process.exit(1)
  }
}
