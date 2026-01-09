/**
 * Workflow Validator
 *
 * Validates workflow definitions including:
 * - JSON Schema validation
 * - Node and edge validation
 * - DAG (Directed Acyclic Graph) verification
 * - Configuration validation
 */

import {
  WorkflowDefinition,
  NodeDefinition,
  EdgeDefinition,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  BlockType,
  JSONSchema,
  ExecutionStatus
} from './types'

export class WorkflowValidator {
  /**
   * Validate a complete workflow definition
   */
  async validate(workflow: WorkflowDefinition): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 1. Basic structure validation
    const structureErrors = this.validateStructure(workflow)
    errors.push(...structureErrors)

    if (errors.length > 0) {
      return { valid: false, errors, warnings }
    }

    // 2. Node validation
    const nodeValidation = this.validateNodes(workflow)
    errors.push(...nodeValidation.errors)
    warnings.push(...nodeValidation.warnings)

    // 3. Edge validation
    const edgeValidation = this.validateEdges(workflow)
    errors.push(...edgeValidation)

    // 4. DAG validation
    const dagErrors = this.validateDAG(workflow)
    errors.push(...dagErrors)

    // 5. Schema validation
    const schemaErrors = this.validateSchemas(workflow)
    errors.push(...schemaErrors)

    // 6. Configuration validation
    const configWarnings = this.validateConfigurations(workflow)
    warnings.push(...configWarnings)

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate basic workflow structure
   */
  private validateStructure(workflow: WorkflowDefinition): ValidationError[] {
    const errors: ValidationError[] = []

    // Required top-level fields
    if (!workflow.workflowId) {
      errors.push({
        type: 'schema',
        message: 'Missing required field: workflowId',
        path: 'workflowId'
      })
    }

    if (!workflow.name) {
      errors.push({
        type: 'schema',
        message: 'Missing required field: name',
        path: 'name'
      })
    }

    if (typeof workflow.version !== 'number') {
      errors.push({
        type: 'schema',
        message: 'Missing or invalid field: version (must be number)',
        path: 'version'
      })
    }

    // Nodes array
    if (!Array.isArray(workflow.nodes)) {
      errors.push({
        type: 'schema',
        message: 'Missing or invalid field: nodes (must be array)',
        path: 'nodes'
      })
    }

    // Edges array
    if (!Array.isArray(workflow.edges)) {
      errors.push({
        type: 'schema',
        message: 'Missing or invalid field: edges (must be array)',
        path: 'edges'
      })
    }

    // Metadata
    if (!workflow.metadata) {
      errors.push({
        type: 'schema',
        message: 'Missing required field: metadata',
        path: 'metadata'
      })
    } else {
      if (!workflow.metadata.createdAt) {
        errors.push({
          type: 'schema',
          message: 'Missing required field: metadata.createdAt',
          path: 'metadata.createdAt'
        })
      }
    }

    return errors
  }

  /**
   * Validate all nodes in the workflow
   */
  private validateNodes(workflow: WorkflowDefinition): {
    errors: ValidationError[]
    warnings: ValidationWarning[]
  } {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const nodeIds = new Set<string>()

    for (let i = 0; i < workflow.nodes.length; i++) {
      const node = workflow.nodes[i]
      const nodePath = `nodes[${i}]`

      // Check unique node IDs
      if (nodeIds.has(node.id)) {
        errors.push({
          type: 'schema',
          nodeId: node.id,
          message: `Duplicate node ID: ${node.id}`,
          path: nodePath
        })
      }
      nodeIds.add(node.id)

      // Validate node ID
      if (!node.id || typeof node.id !== 'string') {
        errors.push({
          type: 'schema',
          message: 'Invalid or missing node ID',
          path: `${nodePath}.id`
        })
      }

      // Validate node type
      if (!node.type) {
        errors.push({
          type: 'schema',
          nodeId: node.id,
          message: 'Missing node type',
          path: `${nodePath}.type`
        })
      } else if (!Object.values(BlockType).includes(node.type as BlockType)) {
        warnings.push({
          type: 'best_practice',
          nodeId: node.id,
          message: `Unknown block type: ${node.type}. Using custom type.`,
          suggestion: 'Ensure custom block is registered in BlockRegistry'
        })
      }

      // Validate node name
      if (!node.name || typeof node.name !== 'string') {
        errors.push({
          type: 'schema',
          nodeId: node.id,
          message: 'Invalid or missing node name',
          path: `${nodePath}.name`
        })
      }

      // Validate config exists
      if (!node.config || typeof node.config !== 'object') {
        errors.push({
          type: 'config',
          nodeId: node.id,
          message: 'Invalid or missing node config',
          path: `${nodePath}.config`
        })
      }

      // Validate schemas
      if (node.inputSchema !== null && !this.isValidJSONSchema(node.inputSchema)) {
        errors.push({
          type: 'schema',
          nodeId: node.id,
          message: 'Invalid input schema',
          path: `${nodePath}.inputSchema`
        })
      }

      if (node.outputSchema !== null && !this.isValidJSONSchema(node.outputSchema)) {
        errors.push({
          type: 'schema',
          nodeId: node.id,
          message: 'Invalid output schema',
          path: `${nodePath}.outputSchema`
        })
      }

      // Validate timeout
      if (node.timeout !== undefined && (typeof node.timeout !== 'number' || node.timeout <= 0)) {
        errors.push({
          type: 'config',
          nodeId: node.id,
          message: 'Invalid timeout (must be positive number)',
          path: `${nodePath}.timeout`
        })
      }

      // Validate retry config
      if (node.retryConfig) {
        if (typeof node.retryConfig.maxRetries !== 'number' || node.retryConfig.maxRetries < 0) {
          errors.push({
            type: 'config',
            nodeId: node.id,
            message: 'Invalid retryConfig.maxRetries',
            path: `${nodePath}.retryConfig.maxRetries`
          })
        }
        if (typeof node.retryConfig.backoffMultiplier !== 'number' || node.retryConfig.backoffMultiplier < 1) {
          errors.push({
            type: 'config',
            nodeId: node.id,
            message: 'Invalid retryConfig.backoffMultiplier (must be >= 1)',
            path: `${nodePath}.retryConfig.backoffMultiplier`
          })
        }
      }
    }

    return { errors, warnings }
  }

  /**
   * Validate all edges in the workflow
   */
  private validateEdges(workflow: WorkflowDefinition): ValidationError[] {
    const errors: ValidationError[] = []
    const nodeIds = new Set(workflow.nodes.map(n => n.id))
    const edgeIds = new Set<string>()

    for (let i = 0; i < workflow.edges.length; i++) {
      const edge = workflow.edges[i]
      const edgePath = `edges[${i}]`

      // Check unique edge IDs
      if (edge.id && edgeIds.has(edge.id)) {
        errors.push({
          type: 'schema',
          message: `Duplicate edge ID: ${edge.id}`,
          path: edgePath
        })
      }
      if (edge.id) edgeIds.add(edge.id)

      // Validate source exists
      if (!edge.source) {
        errors.push({
          type: 'connection',
          message: 'Missing edge source',
          path: `${edgePath}.source`
        })
      } else if (!nodeIds.has(edge.source)) {
        errors.push({
          type: 'connection',
          message: `Source node not found: ${edge.source}`,
          path: `${edgePath}.source`
        })
      }

      // Validate target exists
      if (!edge.target) {
        errors.push({
          type: 'connection',
          message: 'Missing edge target',
          path: `${edgePath}.target`
        })
      } else if (!nodeIds.has(edge.target)) {
        errors.push({
          type: 'connection',
          message: `Target node not found: ${edge.target}`,
          path: `${edgePath}.target`
        })
      }

      // Check for self-loops
      if (edge.source && edge.source === edge.target) {
        errors.push({
          type: 'dag',
          nodeId: edge.source,
          message: 'Self-loops are not allowed',
          path: edgePath
        })
      }

      // Validate ports if specified
      if (edge.sourcePort && typeof edge.sourcePort !== 'string') {
        errors.push({
          type: 'connection',
          message: 'Invalid sourcePort (must be string)',
          path: `${edgePath}.sourcePort`
        })
      }

      if (edge.targetPort && typeof edge.targetPort !== 'string') {
        errors.push({
          type: 'connection',
          message: 'Invalid targetPort (must be string)',
          path: `${edgePath}.targetPort`
        })
      }
    }

    return errors
  }

  /**
   * Validate that the workflow graph is a DAG (no cycles)
   */
  private validateDAG(workflow: WorkflowDefinition): ValidationError[] {
    const errors: ValidationError[] = []

    // Build adjacency list
    const adjacency = new Map<string, string[]>()
    const nodes = workflow.nodes

    // Initialize adjacency list
    for (const node of nodes) {
      adjacency.set(node.id, [])
    }

    // Build edges
    for (const edge of workflow.edges) {
      if (edge.source && edge.target) {
        const targets = adjacency.get(edge.source) || []
        targets.push(edge.target)
        adjacency.set(edge.source, targets)
      }
    }

    // Detect cycles using DFS
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const cycles: string[][] = []

    const detectCycle = (nodeId: string, path: string[]): boolean => {
      visited.add(nodeId)
      recursionStack.add(nodeId)
      path.push(nodeId)

      const neighbors = adjacency.get(nodeId) || []
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (detectCycle(neighbor, [...path])) {
            return true
          }
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor)
          const cycle = [...path.slice(cycleStart), neighbor]
          cycles.push(cycle)
          return true
        }
      }

      recursionStack.delete(nodeId)
      return false
    }

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (detectCycle(node.id, [])) {
          break
        }
      }
    }

    // Add errors for each cycle found
    for (const cycle of cycles) {
      errors.push({
        type: 'dag',
        message: `Cycle detected: ${cycle.join(' → ')}`,
        path: 'edges'
      })
    }

    // Check for unreachable nodes
    const reachable = new Set<string>()
    const findReachable = (nodeId: string) => {
      reachable.add(nodeId)
      const neighbors = adjacency.get(nodeId) || []
      for (const neighbor of neighbors) {
        if (!reachable.has(neighbor)) {
          findReachable(neighbor)
        }
      }
    }

    // Find all nodes reachable from input nodes
    const inputNodes = nodes.filter(n => n.type === BlockType.INPUT)
    if (inputNodes.length > 0) {
      for (const inputNode of inputNodes) {
        findReachable(inputNode.id)
      }
    } else {
      // If no input nodes, start from all nodes without incoming edges
      const hasIncoming = new Set(workflow.edges.map(e => e.target))
      for (const node of nodes) {
        if (!hasIncoming.has(node.id)) {
          findReachable(node.id)
        }
      }
    }

    // Warn about unreachable nodes
    for (const node of nodes) {
      if (!reachable.has(node.id)) {
        errors.push({
          type: 'dag',
          nodeId: node.id,
          message: `Node is unreachable from any input node`,
          path: `nodes.${node.id}`
        })
      }
    }

    return errors
  }

  /**
   * Validate JSON schemas
   */
  private validateSchemas(workflow: WorkflowDefinition): ValidationError[] {
    const errors: ValidationError[] = []

    // Validate schemas defined in workflow
    if (workflow.schemas) {
      for (const [schemaId, schema] of Object.entries(workflow.schemas)) {
        if (!this.isValidJSONSchema(schema)) {
          errors.push({
            type: 'schema',
            message: `Invalid schema definition: ${schemaId}`,
            path: `schemas.${schemaId}`
          })
        }
      }
    }

    // Validate schema references
    for (const node of workflow.nodes) {
      const refs = this.findSchemaRefs(node.inputSchema)
      for (const ref of refs) {
        const schemaId = ref.replace(/^#\//, '').replace(/^#/g, '')
        if (workflow.schemas && !workflow.schemas[schemaId]) {
          errors.push({
            type: 'schema',
            nodeId: node.id,
            message: `Schema reference not found: ${ref}`,
            path: `nodes.${node.id}.inputSchema`
          })
        }
      }

      const outRefs = this.findSchemaRefs(node.outputSchema)
      for (const ref of outRefs) {
        const schemaId = ref.replace(/^#\//, '').replace(/^#/g, '')
        if (workflow.schemas && !workflow.schemas[schemaId]) {
          errors.push({
            type: 'schema',
            nodeId: node.id,
            message: `Schema reference not found: ${ref}`,
            path: `nodes.${node.id}.outputSchema`
          })
        }
      }
    }

    return errors
  }

  /**
   * Find all $ref values in a schema
   */
  private findSchemaRefs(schema: JSONSchema | null): string[] {
    if (!schema) return []

    const refs: string[] = []

    const traverse = (obj: any) => {
      if (!obj || typeof obj !== 'object') return

      if (obj.$ref && typeof obj.$ref === 'string') {
        refs.push(obj.$ref)
      }

      for (const value of Object.values(obj)) {
        if (value && typeof value === 'object') {
          traverse(value)
        }
      }
    }

    traverse(schema)
    return refs
  }

  /**
   * Validate block configurations
   */
  private validateConfigurations(workflow: WorkflowDefinition): ValidationWarning[] {
    const warnings: ValidationWarning[] = []

    // Check for input blocks
    const inputBlocks = workflow.nodes.filter(n => n.type === BlockType.INPUT)
    if (inputBlocks.length === 0) {
      warnings.push({
        type: 'best_practice',
        message: 'No input blocks found. Workflow may not have data source.',
        suggestion: 'Add an input block to define the data source'
      })
    } else if (inputBlocks.length > 1) {
      warnings.push({
        type: 'best_practice',
        message: `Multiple input blocks found (${inputBlocks.length}). Ensure this is intentional.`,
        suggestion: 'Consider using merge block to combine multiple sources'
      })
    }

    // Check for output blocks
    const outputBlocks = workflow.nodes.filter(n => n.type === BlockType.OUTPUT)
    if (outputBlocks.length === 0) {
      warnings.push({
        type: 'best_practice',
        message: 'No output blocks found. Workflow may not produce results.',
        suggestion: 'Add an output block to store or return results'
      })
    }

    // Check for expensive operations
    const aiBlocks = workflow.nodes.filter(n => n.type === BlockType.AI)
    if (aiBlocks.length > 0) {
      warnings.push({
        type: 'cost',
        message: `${aiBlocks.length} AI block(s) detected. This may incur significant costs.`,
        suggestion: 'Consider using cost limits and batch sizes to control costs'
      })
    }

    // Check for API blocks without batch mode
    const apiBlocks = workflow.nodes.filter(n => n.type === BlockType.API)
    for (const block of apiBlocks) {
      if (block.config.batchMode === false && block.config.batchSize === undefined) {
        warnings.push({
          type: 'performance',
          nodeId: block.id,
          message: 'API block with batch mode disabled may be slow for large datasets.',
          suggestion: 'Consider enabling batch mode or setting appropriate batch size'
        })
      }
    }

    // Check for timeout configuration
    if (!workflow.globals?.timeout) {
      warnings.push({
        type: 'best_practice',
        message: 'No global timeout configured. Workflows may run indefinitely.',
        suggestion: 'Set a global timeout in workflow.globals.timeout'
      })
    }

    // Check for retry policy
    if (!workflow.globals?.retryPolicy) {
      warnings.push({
        type: 'best_practice',
        message: 'No global retry policy configured. Transient failures may fail the workflow.',
        suggestion: 'Set a retry policy in workflow.globals.retryPolicy'
      })
    }

    return warnings
  }

  /**
   * Check if a value is a valid JSON Schema
   */
  private isValidJSONSchema(schema: any): boolean {
    if (!schema || typeof schema !== 'object') return false

    // Must have a type
    if (!schema.type) return false

    // Valid types
    const validTypes = ['object', 'array', 'string', 'number', 'boolean', 'null']
    if (!validTypes.includes(schema.type)) return false

    // If object, should have properties
    if (schema.type === 'object' && schema.properties) {
      if (typeof schema.properties !== 'object') return false
    }

    // If array, should have items
    if (schema.type === 'array' && schema.items) {
      if (typeof schema.items !== 'object') return false
    }

    return true
  }
}

/**
 * Singleton instance
 */
export const workflowValidator = new WorkflowValidator()
