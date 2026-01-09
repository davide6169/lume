/**
 * Filter Block
 *
 * Filters data based on conditions. Items that match the conditions pass through,
 * items that don't match are skipped or cause an error based on configuration.
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext, Condition } from '../../types'

export interface FilterConfig {
  conditions: Condition[]
  onFail?: 'skip' | 'error' // Default: 'skip'
}

/**
 * Filter Block Executor
 */
export class FilterBlock extends BaseBlockExecutor {
  constructor() {
    super('filter')
  }

  async execute(
    config: FilterConfig,
    input: any,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      this.log(context, 'info', 'Executing Filter block', {
        inputType: Array.isArray(input) ? 'array' : typeof input,
        conditionsCount: config.conditions.length
      })

      const onFail = config.onFail || 'skip'

      // Handle array input
      if (Array.isArray(input)) {
        const filtered = input.filter((item, index) => {
          const passes = this.evaluateConditions(config.conditions, item)
          if (!passes && onFail === 'error') {
            throw new Error(`Item at index ${index} failed filter conditions`)
          }
          return passes
        })

        this.log(context, 'info', 'Filter completed', {
          inputCount: input.length,
          outputCount: filtered.length,
          filteredOut: input.length - filtered.length
        })

        const executionTime = Date.now() - startTime

        return {
          status: 'completed',
          output: filtered,
          executionTime,
          error: undefined,
          retryCount: 0,
          startTime,
          endTime: Date.now(),
          metadata: {
            inputCount: input.length,
            outputCount: filtered.length,
            filteredOut: input.length - filtered.length
          },
          logs: []
        }
      }

      // Handle single object input
      const passes = this.evaluateConditions(config.conditions, input)

      if (!passes && onFail === 'error') {
        throw new Error('Input failed filter conditions')
      }

      this.log(context, 'info', 'Filter completed', {
        passes
      })

      const executionTime = Date.now() - startTime

      return {
        status: 'completed',
        output: passes ? input : null,
        executionTime,
        error: undefined,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {
          passes
        },
        logs: []
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'Filter block failed', {
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
   * Evaluate conditions against data
   */
  private evaluateConditions(conditions: Condition[], data: any): boolean {
    // If no conditions, pass everything
    if (!conditions || conditions.length === 0) {
      return true
    }

    // All conditions must pass (AND logic)
    return conditions.every(condition => this.evaluateCondition(condition, data))
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
