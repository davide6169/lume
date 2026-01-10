/**
 * Branch Block
 *
 * Routes data to different branches based on a condition.
 * This is a special block that doesn't transform data but controls workflow flow.
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext, Condition } from '../../types'

export interface BranchConfig {
  condition: Condition
  branches: {
    true: string // Target node ID for true condition
    false: string // Target node ID for false condition
  }
}

/**
 * Branch Block Executor
 */
export class BranchBlock extends BaseBlockExecutor {
  static supportsMock = true // Flow control block - no API calls, works in all modes

  constructor() {
    super('branch')
  }

  async execute(
    config: BranchConfig,
    input: any,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      this.log(context, 'info', 'Executing Branch block')

      // Evaluate condition
      const result = this.evaluateCondition(config.condition, input)

      this.log(context, 'info', 'Branch condition evaluated', {
        result,
        trueBranch: config.branches.true,
        falseBranch: config.branches.false
      })

      const executionTime = Date.now() - startTime

      // Return output with routing information
      const output = {
        ...input,
        _branch: result ? 'true' : 'false',
        _routedTo: result ? config.branches.true : config.branches.false
      }

      return {
        status: 'completed',
        output,
        executionTime,
        error: undefined,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {
          branchResult: result,
          routedTo: output._routedTo
        },
        logs: []
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'Branch block failed', {
        error: (error as Error).message
      })

      return {
        status: 'failed',
        output: null,
        executionTime,
        error: error as Error,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {},
        logs: []
      }
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: Condition, data: any): boolean {
    const { field, operator, value, conditions } = condition

    // Handle nested conditions (AND/OR)
    if (conditions && conditions.length > 0) {
      if (operator === 'and') {
        return conditions.every(c => this.evaluateCondition(c, data))
      } else if (operator === 'or') {
        return conditions.some(c => this.evaluateCondition(c, data))
      }
    }

    // Get field value
    const fieldValue = this.getFieldValue(data, field)

    // Evaluate based on operator
    switch (operator) {
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null

      case 'not_exists':
        return fieldValue === undefined || fieldValue === null

      case 'equals':
        return fieldValue === value

      case 'not_equals':
        return fieldValue !== value

      case 'contains':
        if (typeof fieldValue === 'string') {
          return fieldValue.includes(value)
        }
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(value)
        }
        return false

      case 'not_contains':
        if (typeof fieldValue === 'string') {
          return !fieldValue.includes(value)
        }
        if (Array.isArray(fieldValue)) {
          return !fieldValue.includes(value)
        }
        return true

      case 'greater_than':
        return typeof fieldValue === 'number' && fieldValue > value

      case 'less_than':
        return typeof fieldValue === 'number' && fieldValue < value

      case 'regex':
        if (typeof fieldValue !== 'string') return false
        try {
          const regex = new RegExp(value)
          return regex.test(fieldValue)
        } catch (error) {
          console.error('Invalid regex pattern:', value)
          return false
        }

      case 'in':
        return Array.isArray(value) && value.includes(fieldValue)

      case 'not_in':
        return Array.isArray(value) && !value.includes(fieldValue)

      default:
        console.warn(`Unknown operator: ${operator}`)
        return false
    }
  }

  /**
   * Get nested field value from object
   */
  private getFieldValue(obj: any, path: string | undefined): any {
    if (!path) return obj

    const parts = path.split('.')
    let current = obj

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part]
      } else {
        return undefined
      }
    }

    return current
  }
}
