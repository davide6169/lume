/**
 * Logger Output Block
 *
 * Simple output block that logs data to console.
 * Useful for testing and debugging workflows.
 */

import { BaseBlockExecutor } from '../../registry'
import { ExecutionContext } from '../../types'

export interface LoggerOutputConfig {
  prefix?: string
  format?: 'json' | 'pretty'
}

/**
 * Logger Output Block Executor
 */
export class LoggerOutputBlock extends BaseBlockExecutor {
  static supportsMock = true // Utility block - no API calls, works in all modes

  constructor() {
    super('output.logger')
  }

  /**
   * Execute block - log data
   */
  async execute(
    config: LoggerOutputConfig,
    input: any,
    context: ExecutionContext
  ): Promise<any> {
    this.log(context, 'info', 'Executing Logger Output block', { config })

    const startTime = Date.now()

    try {
      const prefix = config.prefix || '[Output]'
      const format = config.format || 'pretty'

      if (format === 'json') {
        console.log(prefix, JSON.stringify(input, null, 2))
      } else {
        console.log(prefix, input)
      }

      this.log(context, 'info', 'Logger Output block completed', {
        executionTime: Date.now() - startTime
      })

      return {
        status: 'completed',
        output: input,
        executionTime: Date.now() - startTime,
        error: undefined
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'Logger Output block failed', { error })

      return {
        status: 'failed',
        output: null,
        executionTime,
        error: error as Error
      }
    }
  }
}
