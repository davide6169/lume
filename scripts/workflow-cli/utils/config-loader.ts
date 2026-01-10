/**
 * Configuration Loader - Load and parse JSON configs
 */

import fs from 'fs/promises'
import path from 'path'
import { logger } from './logger'

export interface TestConfig {
  blockType?: string
  workflowId?: string
  description?: string
  version?: string
  generatedAt?: string
  input?: any
  config?: any
  secrets?: Record<string, string>
  expectedOutput?: any
  expectedOutputSchema?: any
  validation?: {
    expectedMinContacts?: number
    expectedMaxCost?: number
    maxDuration?: number
  }
}

export interface BaselineConfig extends TestConfig {
  blockType: string
  description: string
  version: string
  generatedAt: string
}

export interface WorkflowTestConfig extends TestConfig {
  workflowId: string
  input: {
    csvFile?: string
    parameters?: Record<string, any>
  }
}

class ConfigLoader {
  /**
   * Load JSON file
   */
  async loadJson(filePath: string): Promise<any> {
    try {
      const absolutePath = path.resolve(filePath)
      const content = await fs.readFile(absolutePath, 'utf-8')
      return JSON.parse(content)
    } catch (error: any) {
      logger.error(`Failed to load JSON file: ${filePath}`)
      logger.error(error.message)
      throw error
    }
  }

  /**
   * Save JSON file
   */
  async saveJson(filePath: string, data: any): Promise<void> {
    try {
      const absolutePath = path.resolve(filePath)
      const dir = path.dirname(absolutePath)

      // Create directory if it doesn't exist
      await fs.mkdir(dir, { recursive: true })

      // Write file
      await fs.writeFile(absolutePath, JSON.stringify(data, null, 2), 'utf-8')
      logger.success(`Saved: ${absolutePath}`)
    } catch (error: any) {
      logger.error(`Failed to save JSON file: ${filePath}`)
      logger.error(error.message)
      throw error
    }
  }

  /**
   * Load test configuration
   */
  async loadTestConfig(filePath: string): Promise<TestConfig> {
    const config = await this.loadJson(filePath)

    // Validate required fields
    if (!config.workflowId && !config.blockType) {
      throw new Error('Config must have either workflowId or blockType')
    }

    return config as TestConfig
  }

  /**
   * Load baseline configuration for a block
   */
  async loadBaselineConfig(blockType: string, baselineDir: string = './test-configs/baseline'): Promise<BaselineConfig> {
    const baselinePath = path.join(baselineDir, `${blockType}.baseline.json`)
    return await this.loadJson(baselinePath) as BaselineConfig
  }

  /**
   * Find baseline config for a block
   */
  async findBaselineConfig(blockType: string, searchDirs: string[] = ['./test-configs/baseline']): Promise<BaselineConfig | null> {
    for (const dir of searchDirs) {
      try {
        return await this.loadBaselineConfig(blockType, dir)
      } catch {
        // Try next directory
        continue
      }
    }
    return null
  }

  /**
   * Load workflow definition
   */
  async loadWorkflowDefinition(filePath: string): Promise<any> {
    const workflow = await this.loadJson(filePath)

    // Validate required fields
    if (!workflow.workflowId) {
      throw new Error('Workflow definition must have workflowId')
    }
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      throw new Error('Workflow definition must have nodes array')
    }
    if (!workflow.edges || !Array.isArray(workflow.edges)) {
      throw new Error('Workflow definition must have edges array')
    }

    return workflow
  }

  /**
   * Resolve secrets with environment variable substitution
   */
  resolveSecrets(secrets: Record<string, string>): Record<string, string> {
    const resolved: Record<string, string> = {}

    for (const [key, value] of Object.entries(secrets)) {
      // Check if value is an environment variable placeholder
      const envMatch = value.match(/^\$\{(.+)\}$/)
      if (envMatch) {
        const envVar = envMatch[1]
        const envValue = process.env[envVar]
        if (!envValue) {
          logger.warn(`Environment variable ${envVar} is not set`)
          resolved[key] = value // Keep placeholder
        } else {
          resolved[key] = envValue
        }
      } else {
        resolved[key] = value
      }
    }

    return resolved
  }

  /**
   * Load environment variables from .env file
   */
  async loadEnvFile(filePath: string = '.env'): Promise<void> {
    try {
      const absolutePath = path.resolve(filePath)
      const content = await fs.readFile(absolutePath, 'utf-8')

      content.split('\n').forEach(line => {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=')
          const value = valueParts.join('=')
          if (key && value) {
            process.env[key.trim()] = value.trim()
          }
        }
      })

      logger.debug(`Loaded environment variables from ${filePath}`)
    } catch (error) {
      // .env file is optional
      logger.debug('No .env file found (this is optional)')
    }
  }

  /**
   * Get test config directory
   */
  getTestConfigDir(...paths: string[]): string {
    return path.join(process.cwd(), 'test-configs', ...paths)
  }

  /**
   * Get baseline config directory
   */
  getBaselineDir(): string {
    return this.getTestConfigDir('baseline')
  }

  /**
   * Get workflow test configs directory
   */
  getWorkflowTestDir(): string {
    return this.getTestConfigDir('workflows')
  }
}

export const configLoader = new ConfigLoader()
