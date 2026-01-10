/**
 * Field Mapping Transform Block
 *
 * Transforms data by renaming, mapping, or calculating fields.
 */

import { BaseBlockExecutor } from '../../registry'
import { ExecutionContext, TransformOperation } from '../../types'

export interface FieldMappingConfig {
  operations: TransformOperation[]
}

/**
 * Field Mapping Block Executor
 */
export class FieldMappingBlock extends BaseBlockExecutor {
  static supportsMock = true // Utility block - no API calls, works in all modes

  constructor() {
    super('transform.fieldMapping')
  }

  /**
   * Execute block - transform data
   */
  async execute(
    config: FieldMappingConfig,
    input: any,
    context: ExecutionContext
  ): Promise<any> {
    this.log(context, 'info', 'Executing Field Mapping block', { config })

    const startTime = Date.now()

    try {
      let output = Array.isArray(input) ? [...input] : { ...input }

      // Apply each operation
      for (const operation of config.operations) {
        output = await this.applyOperation(operation, output, context)
      }

      this.log(context, 'info', 'Field Mapping block completed', {
        executionTime: Date.now() - startTime
      })

      return {
        status: 'completed',
        output,
        executionTime: Date.now() - startTime,
        error: undefined
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'Field Mapping block failed', { error })

      return {
        status: 'failed',
        output: null,
        executionTime,
        error: error as Error
      }
    }
  }

  /**
   * Apply a single transform operation
   */
  private async applyOperation(
    operation: TransformOperation,
    data: any,
    context: ExecutionContext
  ): Promise<any> {
    switch (operation.type) {
      case 'map':
        return this.mapField(operation, data)

      case 'rename':
        return this.renameField(operation, data)

      case 'calculate':
        return this.calculateField(operation, data)

      case 'deduplicate':
        return this.deduplicate(operation, data)

      default:
        this.log(context, 'warn', `Unknown operation type: ${operation.type}`)
        return data
    }
  }

  /**
   * Map field value
   */
  private mapField(operation: TransformOperation, data: any): any {
    if (!operation.field || !operation.targetField) return data

    if (Array.isArray(data)) {
      return data.map(item => ({
        ...item,
        [operation.targetField!]: this.getNestedValue(item, operation.field!)
      }))
    }

    return {
      ...data,
      [operation.targetField!]: this.getNestedValue(data, operation.field!)
    }
  }

  /**
   * Rename field
   */
  private renameField(operation: TransformOperation, data: any): any {
    if (!operation.field || !operation.targetField) return data

    if (Array.isArray(data)) {
      return data.map(item => {
        const newItem = { ...item }
        const value = newItem[operation.field!]
        delete newItem[operation.field!]
        newItem[operation.targetField!] = value
        return newItem
      })
    }

    const newItem = { ...data }
    const value = newItem[operation.field!]
    delete newItem[operation.field!]
    newItem[operation.targetField!] = value
    return newItem
  }

  /**
   * Calculate field
   */
  private calculateField(operation: TransformOperation, data: any): any {
    if (!operation.targetField || !operation.transformation) return data

    const { formula } = operation.transformation

    if (Array.isArray(data)) {
      return data.map(item => ({
        ...item,
        [operation.targetField!]: this.evaluateFormula(formula, item)
      }))
    }

    return {
      ...data,
      [operation.targetField!]: this.evaluateFormula(formula, data)
    }
  }

  /**
   * Deduplicate array
   */
  private deduplicate(operation: TransformOperation, data: any): any {
    if (!Array.isArray(data)) return data

    const key = operation.field || 'id'

    const seen = new Set()
    return data.filter(item => {
      const keyValue = item[key]
      if (seen.has(keyValue)) {
        return false
      }
      seen.add(keyValue)
      return true
    })
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
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

  /**
   * Evaluate formula (simple implementation)
   */
  private evaluateFormula(formula: string, data: any): any {
    // Very simple formula evaluation
    // In production, use a proper expression parser
    try {
      // Replace field references with actual values
      let expression = formula

      // Find all {{field}} references
      const refs = expression.match(/\{\{([^}]+)\}\}/g)
      if (refs) {
        for (const ref of refs) {
          const field = ref.replace(/\{\{|\}\}/g, '')
          const value = this.getNestedValue(data, field)
          expression = expression.replace(ref, JSON.stringify(value))
        }
      }

      // For now, just return the expression if it's a simple reference
      if (refs && refs.length === 1) {
        const field = refs[0].replace(/\{\{|\}\}/g, '')
        return this.getNestedValue(data, field)
      }

      // More complex evaluation would go here
      return expression
    } catch (error) {
      return null
    }
  }
}
