/**
 * Command: blocks test
 * Test a block
 */

import { logger } from '../utils/logger'
import { configLoader, secretsManager } from '../utils/config-loader'
import { blockRegistry, createBlockExecutor } from '../../../lib/workflow-engine'
import { ContextFactory } from '../../../lib/workflow-engine/context'
import { registerAllBuiltInBlocks } from '../../../lib/workflow-engine/blocks'
import { readStdin } from '../utils/stdin'

export async function registerBlocksTestCommand(options: {
  type?: string
  config?: string
  useBaseline?: boolean
  mode?: string
  json?: boolean
}): Promise<void> {
  // Initialize blocks
  registerAllBuiltInBlocks()

  if (!options.type) {
    logger.error('Block type is required (--type <blockType>)')
    process.exit(1)
  }

  // Validate mode
  const validModes = ['live', 'mock', 'demo', 'test', 'production']
  const mode = (options.mode || 'test') as 'production' | 'demo' | 'test'
  if (!validModes.includes(mode) && mode !== 'production') {
    logger.error(`Invalid mode: ${mode}. Valid modes: ${validModes.join(', ')}`)
    process.exit(1)
  }

  // Map 'live' to 'production', 'mock' to 'demo'
  const executionMode: 'production' | 'demo' | 'test' =
    mode === 'live' || mode === 'production' ? 'production' :
    mode === 'mock' || mode === 'demo' ? 'demo' : 'test'

  logger.header(`Test Block: ${options.type}`)
  logger.kv('Mode', executionMode.toUpperCase(), executionMode === 'demo' || executionMode === 'test' ? '🎭 MOCK' : '✅ LIVE')

  // Check if block exists
  if (!blockRegistry.has(options.type)) {
    logger.error(`Block not found: ${options.type}`)
    logger.info('Use "workflow blocks list" to see all available blocks')
    process.exit(1)
  }

  // Get block metadata
  const metadata = blockRegistry.getMetadata(options.type)
  logger.kv('Name', metadata?.name || 'Unknown')
  logger.kv('Category', metadata?.category || 'Unknown')
  logger.kv('Description', metadata?.description || 'No description')

  try {
    let testConfig: any

    if (options.useBaseline) {
      logger.info('Loading baseline configuration...')
      const baselineDir = configLoader.getBaselineDir()
      testConfig = await configLoader.loadBaselineConfig(options.type, baselineDir)
    } else if (options.config) {
      logger.info(`Loading test configuration: ${options.config}`)
      testConfig = await configLoader.loadTestConfig(options.config)
    } else {
      // Check if input is coming from stdin
      // isTTY is false when piped, true/undefined when not piped
      const hasStdin = process.stdin.isTTY === false

      if (!hasStdin) {
        // No stdin, no file specified

        // 🎯 SMART FEATURE: In demo mode, auto-load baseline if not specified
        if (executionMode === 'demo') {
          logger.info('Demo mode: No config specified, auto-loading baseline configuration...')
          const baselineDir = configLoader.getBaselineDir()
          try {
            testConfig = await configLoader.loadBaselineConfig(options.type, baselineDir)
            logger.success('Auto-loaded baseline configuration for demo ✨')
          } catch (baselineError) {
            logger.error('Failed to load baseline configuration')
            logger.info('Make sure the baseline file exists:')
            logger.info(`  test-configs/baseline/${options.type}.baseline.json`)
            logger.info('')
            logger.info('Alternatively, provide:')
            logger.info('  --config <path>    - Custom configuration file')
            logger.info('  echo \'{"input":{...}}\' | workflow blocks test --type <type>')
            process.exit(1)
          }
        } else {
          // Test/live mode: require explicit config
          logger.error('Must provide --config, --use-baseline, or pipe configuration via stdin')
          logger.info('Examples:')
          logger.info('  workflow blocks test --type api.apify --config test.json')
          logger.info('  workflow blocks test --type api.apify --use-baseline')
          logger.info('  echo \'{"input":{...}}\' | workflow blocks test --type api.apify')
          logger.info('  cat test.json | workflow blocks test --type api.apify')
          logger.info('')
          logger.info('💡 Tip: Use --mode demo for auto-loading baseline configuration')
          process.exit(1)
        }
      } else {
        // Read from stdin
        logger.info('Reading configuration from stdin...')
        const stdinData = await readStdin()
        try {
          testConfig = JSON.parse(stdinData)
          logger.success('Loaded configuration from stdin')
        } catch (parseError) {
          logger.error('Failed to parse stdin as JSON')
          logger.debug('Stdin content:', stdinData)
          logger.info('Tip: Ensure stdin contains valid JSON with input and config')
          process.exit(1)
        }
      }
    }

    console.log('')
    logger.subheader('Test Configuration')

    if (testConfig.description) {
      logger.info('Description:', testConfig.description)
    }

    console.log('')
    logger.info('Input:')
    logger.json(testConfig.input || {})

    if (testConfig.config) {
      console.log('')
      logger.info('Block Config:')
      logger.json(testConfig.config)

      // Add mode to config if not already present
      if (!testConfig.config.mode) {
        testConfig.config.mode = executionMode
      }
    } else {
      // Create minimal config with mode
      testConfig.config = { mode: executionMode }
    }

    // Load secrets based on mode
    let secrets: Record<string, string> = {}
    if (executionMode === 'production') {
      logger.info('')
      logger.info('Loading secrets from environment...')
      secrets = await secretsManager.getDefaultSecrets()
    } else {
      logger.info('')
      logger.info('Mock mode: No secrets required 🎭')
    }

    // Create execution context
    const context = ContextFactory.create({
      workflowId: 'block-test',
      executionId: `block_test_${Date.now()}`,
      mode: executionMode,
      variables: testConfig.variables || {},
      secrets,
      logger: {
        debug: (msg: string, meta?: any) => logger.debug(msg, meta),
        info: (msg: string, meta?: any) => logger.info(msg, meta),
        warn: (msg: string, meta?: any) => logger.warn(msg, meta),
        error: (msg: string, meta?: any) => logger.error(msg, meta)
      }
    })

    // Execute block
    console.log('')
    logger.subheader('Executing Block...')
    console.log('')

    const startTime = Date.now()
    const executor = createBlockExecutor(options.type)
    const result = await executor.execute(
      testConfig.config || {},
      testConfig.input || {},
      context
    )
    const executionTime = Date.now() - startTime

    console.log('')
    logger.subheader('Test Results')

    // Status
    if (result.status === 'completed') {
      logger.success('Status: COMPLETED ✅')
    } else if (result.status === 'failed') {
      logger.error('Status: FAILED ❌')
    } else {
      logger.warn(`Status: ${result.status.toUpperCase()} ⚠️`)
    }

    console.log('')
    logger.kv('Execution Time', `${result.executionTime || executionTime}ms`)
    logger.kv('Retries', result.retryCount || 0)

    if (result.metadata) {
      if (result.metadata.mock) {
        logger.kv('Mode', 'MOCK 🎭')
      }
    }

    // Output
    if (result.output) {
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

    // Logs
    if (result.logs && result.logs.length > 0) {
      console.log('')
      logger.info('Logs:')
      result.logs.forEach((log: any) => {
        const level = log.level || 'info'
        const prefix = level.toUpperCase().padEnd(5)
        console.log(`  ${prefix} ${log.message}`)
      })
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
    logger.error(`Failed to test block: ${error.message}`)
    if (error.stack) {
      logger.debug(error.stack)
    }
    process.exit(1)
  }
}
