/**
 * Pass Through Transform Block
 *
 * Simply passes input through to output without modification.
 * Useful for conditional branches where you want to skip processing.
 */

import { BaseBlockExecutor } from '../../registry'
import { ExecutionContext } from '../../types'

export interface PassThroughConfig {
  // No config needed
}

/**
 * Pass Through Block Executor
 */
export class PassThroughBlock extends BaseBlockExecutor {
  static supportsMock = true // Utility block - no API calls, works in all modes

  constructor() {
    super('transform.passThrough')
  }

  /**
   * Execute block - pass through data
   */
  async execute(
    config: PassThroughConfig,
    input: any,
    context: ExecutionContext
  ): Promise<any> {
    this.log(context, 'info', 'Executing Pass Through block')

    const startTime = Date.now()

    try {
      // Simply return the input as output
      const executionTime = Date.now() - startTime

      this.log(context, 'info', 'Pass Through block completed', {
        executionTime
      })

      return {
        status: 'completed',
        output: input,
        executionTime,
        error: undefined
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'Pass Through block failed', { error })

      return {
        status: 'failed',
        output: null,
        executionTime,
        error: error as Error
      }
    }
  }
}
