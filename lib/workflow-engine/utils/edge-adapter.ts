/**
 * Edge Adapter Executor
 *
 * Applies data transformations between workflow nodes.
 * Enables clean separation between blocks - no need to modify block outputs
 * to match downstream inputs.
 */

import type { EdgeAdapter } from '../types'

/**
 * Apply edge adapter to transform source output to target input
 */
export function applyEdgeAdapter(
  sourceOutput: any,
  adapter: EdgeAdapter,
  context?: any
): any {
  switch (adapter.type) {
    case 'map':
      return applyMapAdapter(sourceOutput, adapter)
    case 'template':
      return applyTemplateAdapter(sourceOutput, adapter)
    case 'function':
      return applyFunctionAdapter(sourceOutput, adapter, context)
    default:
      throw new Error(`Unknown adapter type: ${(adapter as any).type}`)
  }
}

/**
 * Map adapter - simple field-to-field mapping
 *
 * Example:
 *   mapping: { contacts: 'rows', metadata: 'metadata' }
 *   Result: { contacts: output.rows, metadata: output.metadata }
 *
 * With templates:
 *   mapping: { contacts: '{{output.rows}}', count: '{{output.rows.length}}' }
 *   Result: { contacts: [...], count: 2 }
 */
function applyMapAdapter(sourceOutput: any, adapter: EdgeAdapter): any {
  if (!adapter.mapping) {
    return sourceOutput
  }

  const result: Record<string, any> = {}

  for (const [targetField, sourcePath] of Object.entries(adapter.mapping)) {
    // Check if it's a template (contains {{}})
    if (typeof sourcePath === 'string' && sourcePath.includes('{{')) {
      result[targetField] = evaluateTemplate(sourcePath, sourceOutput)
    } else {
      // Simple path access
      result[targetField] = getNestedValue(sourceOutput, sourcePath)
    }
  }

  return result
}

/**
 * Template adapter - template-based mapping
 *
 * Example:
 *   template: {
 *     contacts: '{{output.rows}}',
 *     total: '{{output.rows.length}}',
 *     timestamp: '{{now}}'
 *   }
 */
function applyTemplateAdapter(sourceOutput: any, adapter: EdgeAdapter): any {
  if (!adapter.template) {
    return sourceOutput
  }

  const result: Record<string, any> = {}

  for (const [field, template] of Object.entries(adapter.template)) {
    result[field] = evaluateTemplate(template as string, sourceOutput)
  }

  return result
}

/**
 * Function adapter - custom JavaScript function
 *
 * Example:
 *   function: 'return { contacts: output.rows, count: output.rows.length };'
 *
 * SECURITY: In production, this should be evaluated in a secure sandbox (vm2, isolates, etc.)
 */
function applyFunctionAdapter(
  sourceOutput: any,
  adapter: EdgeAdapter,
  context?: any
): any {
  if (!adapter.function) {
    return sourceOutput
  }

  try {
    // Support both arrow function syntax and simple function body
    let functionBody = adapter.function

    // If it's an arrow function, extract the body
    const arrowMatch = functionBody.match(/^\(([^)]*)\)\s*=>\s*(.+)$/s)
    if (arrowMatch) {
      functionBody = arrowMatch[2]
      // If it's a simple expression, wrap in return
      if (!functionBody.startsWith('{') || functionBody.startsWith('{ return')) {
        functionBody = `return ${functionBody};`
      }
    }

    // Ensure the function body has a return statement
    if (!functionBody.includes('return')) {
      functionBody = `return ${functionBody};`
    }

    // Create a function from the string
    const fn = new Function('output', 'context', functionBody)

    // Execute it
    return fn(sourceOutput, context)
  } catch (error) {
    throw new Error(`Function adapter failed: ${(error as Error).message}`)
  }
}

/**
 * Evaluate template string with {{variable}} syntax
 *
 * Examples:
 *   '{{output.rows}}' → output.rows value
 *   '{{output.rows.length}}' → 2
 *   'prefix-{{output.id}}' → 'prefix-123'
 */
function evaluateTemplate(template: string, data: any): any {
  // Check if the entire template is just one placeholder
  const singleMatch = template.match(/^\{\{([^}]+)\}\}$/)
  if (singleMatch) {
    const path = singleMatch[1].trim()

    // Handle special values
    if (path === 'now') {
      return new Date().toISOString()
    }

    // Direct path access - return the actual value, not stringified
    const value = getNestedValue(data, path)
    return value !== undefined ? value : ''
  }

  // Complex template with multiple placeholders or literal text
  const result = template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const trimmedPath = path.trim()

    // Handle special values
    if (trimmedPath === 'now') {
      return new Date().toISOString()
    }

    const value = getNestedValue(data, trimmedPath)
    return value !== undefined ? String(value) : ''
  })

  // Try to convert to number if it looks like a number
  if (result && !isNaN(Number(result)) && !result.includes(' ')) {
    return Number(result)
  }

  return result
}

/**
 * Get nested value from object using dot notation
 *
 * Examples:
 *   getNestedValue({ a: { b: 5 } }, 'a.b') → 5
 *   getNestedValue({ a: { b: { c: 5 } } }, 'a.b.c') → 5
 *   getNestedValue({ rows: [...] }, 'rows') → [...]
 */
function getNestedValue(obj: any, path: string): any {
  if (!path) return obj

  const parts = path.split('.')
  let current = obj

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    current = current[part]
  }

  return current
}

/**
 * Validate adapter configuration
 */
export function validateAdapter(adapter: EdgeAdapter): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!adapter.type) {
    errors.push('Adapter must have a type')
  }

  if (!['map', 'template', 'function'].includes(adapter.type)) {
    errors.push(`Invalid adapter type: ${adapter.type}`)
  }

  if (adapter.type === 'map' && !adapter.mapping) {
    errors.push('Map adapter must have mapping object')
  }

  if (adapter.type === 'template' && !adapter.template) {
    errors.push('Template adapter must have template object')
  }

  if (adapter.type === 'function' && !adapter.function) {
    errors.push('Function adapter must have function string')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
