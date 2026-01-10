/**
 * Database Service - CLI database connection manager
 */

import { WorkflowService, ExecutionTrackingService } from '../../../lib/workflow-engine'
import { logger } from './logger'
import { configLoader } from './config-loader'
import fs from 'fs/promises'
import path from 'path'

interface CliConfig {
  database?: {
    supabaseUrl?: string
    supabaseKey?: string
    tenantId?: string
  }
  secrets?: Record<string, string>
  defaults?: {
    outputFormat?: 'table' | 'json'
    verbose?: boolean
  }
}

class DatabaseService {
  private workflowService: WorkflowService | null = null
  private executionService: ExecutionTrackingService | null = null
  private supabaseUrl: string = ''
  private supabaseKey: string = ''
  private tenantId: string | undefined
  private cliConfig: CliConfig | null = null

  /**
   * Load CLI configuration from .workflow-cli.json
   */
  private async loadCliConfig(): Promise<void> {
    const configPath = path.join(process.cwd(), '.workflow-cli.json')

    try {
      const content = await fs.readFile(configPath, 'utf-8')
      this.cliConfig = JSON.parse(content)
      logger.debug('Loaded CLI configuration from .workflow-cli.json')
    } catch {
      // Config file doesn't exist or is invalid - that's ok
      this.cliConfig = null
    }
  }

  /**
   * Initialize database connection
   */
  async initialize(options?: {
    supabaseUrl?: string
    supabaseKey?: string
    tenantId?: string
  }): Promise<void> {
    // Load CLI config
    await this.loadCliConfig()

    // Try to load from environment
    await configLoader.loadEnvFile()

    // Priority: CLI options > CLI config > Environment variables
    this.supabaseUrl = options?.supabaseUrl ||
                       this.cliConfig?.database?.supabaseUrl ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       process.env.SUPABASE_URL ||
                       ''

    this.supabaseKey = options?.supabaseKey ||
                       this.cliConfig?.database?.supabaseKey ||
                       process.env.SUPABASE_SERVICE_ROLE_KEY ||
                       process.env.SUPABASE_KEY ||
                       ''

    this.tenantId = options?.tenantId ||
                   this.cliConfig?.database?.tenantId ||
                   process.env.TENANT_ID

    // Validate
    if (!this.supabaseUrl || this.supabaseUrl.includes('your-project')) {
      throw new Error(
        'Supabase URL not configured.\n' +
        'Options:\n' +
        '  1. Create .workflow-cli.json with database credentials\n' +
        '  2. Set NEXT_PUBLIC_SUPABASE_URL environment variable\n' +
        '  3. Use --supabase-url option\n\n' +
        'Example .workflow-cli.json:\n' +
        '  {\n' +
        '    "database": {\n' +
        '      "supabaseUrl": "https://your-project.supabase.co",\n' +
        '      "supabaseKey": "your-service-role-key"\n' +
        '    }\n' +
        '  }'
      )
    }

    if (!this.supabaseKey || this.supabaseKey.includes('your-')) {
      throw new Error(
        'Supabase key not configured.\n' +
        'Add supabaseKey to .workflow-cli.json or set SUPABASE_SERVICE_ROLE_KEY environment variable'
      )
    }

    // Initialize services
    this.workflowService = new WorkflowService(this.supabaseUrl, this.supabaseKey, this.tenantId)
    this.executionService = new ExecutionTrackingService(this.supabaseUrl, this.supabaseKey)

    logger.debug('Database service initialized', {
      url: this.supabaseUrl,
      tenantId: this.tenantId || 'default',
      source: options?.supabaseUrl ? 'cli-option' : this.cliConfig?.database?.supabaseUrl ? 'config-file' : 'env-var'
    })
  }

  /**
   * Get workflow service
   */
  getWorkflowService(): WorkflowService {
    if (!this.workflowService) {
      throw new Error('Database service not initialized. Call initialize() first.')
    }
    return this.workflowService
  }

  /**
   * Get execution service
   */
  getExecutionService(): ExecutionTrackingService {
    if (!this.executionService) {
      throw new Error('Database service not initialized. Call initialize() first.')
    }
    return this.executionService
  }

  /**
   * Check if database is connected
   */
  isConnected(): boolean {
    return this.workflowService !== null
  }

  /**
   * Get connection info
   */
  getConnectionInfo(): { url: string; tenantId?: string } {
    return {
      url: this.supabaseUrl,
      tenantId: this.tenantId
    }
  }

  /**
   * Get CLI secrets
   */
  getCliSecrets(): Record<string, string> {
    return this.cliConfig?.secrets || {}
  }
}

export const databaseService = new DatabaseService()
