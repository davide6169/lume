/**
 * Command: blocks baseline
 * Generate baseline configuration for a block
 */

import { logger } from '../utils/logger'
import { configLoader } from '../utils/config-loader'
import { blockRegistry } from '../../../lib/workflow-engine'
import { registerAllBuiltInBlocks } from '../../../lib/workflow-engine/blocks'
import path from 'path'

export async function registerBlocksBaselineCommand(options: {
  type?: string
  output?: string
}): Promise<void> {
  // Initialize blocks
  registerAllBuiltInBlocks()

  if (!options.type) {
    logger.error('Block type is required (--type <blockType>)')
    process.exit(1)
  }

  logger.header(`Generate Baseline: ${options.type}`)

  // Check if block exists
  if (!blockRegistry.has(options.type)) {
    logger.error(`Block not found: ${options.type}`)
    logger.info('Use "workflow blocks list" to see all available blocks')
    process.exit(1)
  }

  try {
    const metadata = blockRegistry.getMetadata(options.type)

    // Generate baseline config
    const baseline = {
      blockType: options.type,
      description: `Baseline test config for ${metadata?.name || options.type} block`,
      version: metadata?.version || '1.0.0',
      generatedAt: new Date().toISOString(),
      input: metadata?.inputSchema || {},
      config: metadata?.configSchema?.default || {},
      secrets: generateSecretsTemplate(metadata?.configSchema),
      expectedOutputSchema: metadata?.outputSchema || {}
    }

    // Save baseline
    const outputPath = path.join(options.output!, `${options.type}.baseline.json`)
    await configLoader.saveJson(outputPath, baseline)

    logger.success(`✅ Baseline config generated: ${outputPath}`)
    logger.info('You can now use this config with:')
    logger.info(`  npm run workflow:blocks:test -- --type ${options.type} --use-baseline`)

  } catch (error: any) {
    logger.error(`Failed to generate baseline: ${error.message}`)
    process.exit(1)
  }
}

function generateSecretsTemplate(configSchema?: any): Record<string, string> {
  const secrets: Record<string, string> = {}

  // Common API keys based on config schema
  if (configSchema?.properties) {
    for (const [key, value]: any of Object.entries(configSchema.properties)) {
      if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token')) {
        secrets[key.toUpperCase()] = `\${${key.toUpperCase()}}`
      }
    }
  }

  // Default common secrets
  const commonSecrets = [
    'OPENROUTER_API_KEY',
    'APOLLO_API_KEY',
    'HUNTER_IO_API_KEY',
    'FACEBOOK_ACCESS_TOKEN',
    'INSTAGRAM_ACCESS_TOKEN'
  ]

  commonSecrets.forEach(secret => {
    if (!secrets[secret]) {
      secrets[secret] = `\${${secret}}`
    }
  })

  return secrets
}
