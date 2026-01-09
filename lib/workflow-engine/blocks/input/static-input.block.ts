/**
 * Static Input Block
 *
 * Simple input block that returns static data defined in config.
 * Useful for testing and demo workflows.
 */

import { BaseBlockExecutor } from '../../registry'
import { ExecutionContext } from '../../types'

export interface StaticInputConfig {
  data: any
}

/**
 * Static Input Block Executor
 */
export class StaticInputBlock extends BaseBlockExecutor {
  constructor() {
    super('input.static')
  }

  /**
   * Execute block - return static data
   */
  async execute(
    config: StaticInputConfig,
    input: any,
    context: ExecutionContext
  ): Promise<any> {
    this.log(context, 'info', 'Executing Static Input block', { config })

    const startTime = Date.now()

    try {
      // Validate config
      if (!config || config.data === undefined) {
        throw new Error('Static input block requires config.data')
      }

      // Return static data
      const output = config.data

      const executionTime = Date.now() - startTime

      this.log(context, 'info', 'Static Input block completed', {
        executionTime,
        dataSize: JSON.stringify(output).length
      })

      return {
        status: 'completed',
        output,
        executionTime,
        error: undefined
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'Static Input block failed', { error })

      return {
        status: 'failed',
        output: null,
        executionTime,
        error: error as Error
      }
    }
  }
}

/**
 * Database Input Block (placeholder)
 *
 * Reads data from database based on query.
 * Will be implemented with actual Supabase integration.
 */
export class DatabaseInputBlock extends BaseBlockExecutor {
  constructor() {
    super('input.database')
  }

  async execute(
    config: any,
    input: any,
    context: ExecutionContext
  ): Promise<any> {
    this.log(context, 'info', 'Executing Database Input block', { config })

    const startTime = Date.now()

    try {
      // TODO: Implement actual database query
      // For now, return mock data in demo mode
      if (context.mode === 'demo') {
        const output = {
          sourceAudienceId: 'demo-audience-1',
          name: 'Demo Audience',
          type: 'instagram',
          urls: [
            'https://instagram.com/p/ABC123',
            'https://instagram.com/p/DEF456'
          ]
        }

        this.log(context, 'info', 'Demo data returned', {
          executionTime: Date.now() - startTime
        })

        return {
          status: 'completed',
          output,
          executionTime: Date.now() - startTime,
          error: undefined
        }
      }

      // Production mode - query database
      // TODO: Implement with Supabase client
      throw new Error('Database input block not yet implemented for production mode')
    } catch (error) {
      this.log(context, 'error', 'Database Input block failed', { error })
      return {
        status: 'failed',
        output: null,
        executionTime: Date.now() - startTime,
        error: error as Error
      }
    }
  }
}
