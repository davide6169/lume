/**
 * Workflow Engine - Example with Orchestrator
 *
 * This example demonstrates how to use the WorkflowOrchestrator
 * to automatically execute workflows with parallel node execution.
 */

import {
  WorkflowDefinition,
  BlockType,
  ExecutionContext
} from '../types'
import { workflowValidator } from '../validator'
import {
  registerBlock,
  BaseBlockExecutor
} from '../registry'
import { ContextFactory } from '../context'
import { workflowOrchestrator } from '../orchestrator'

// ============================================================
// Define Custom Blocks
// ============================================================

class DataEnrichmentBlock extends BaseBlockExecutor {
  constructor() {
    super('custom.dataEnrichment')
  }

  async execute(
    config: any,
    input: any,
    context: ExecutionContext
  ) {
    const startTime = Date.now()
    this.log(context, 'info', 'Starting data enrichment', { input })

    try {
      // Simulate API call to enrich data
      const enriched = {
        ...input,
        enriched: true,
        enrichmentTimestamp: new Date().toISOString(),
        additionalData: {
          score: Math.random() * 100,
          category: ['premium', 'standard', 'basic'][Math.floor(Math.random() * 3)]
        }
      }

      // Simulate processing time
      await this.sleep(100)

      const executionTime = Date.now() - startTime
      this.log(context, 'info', 'Data enrichment completed', { executionTime })

      return {
        nodeId: 'enrichment',
        status: 'completed' as const,
        input,
        output: enriched,
        executionTime,
        error: undefined,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {},
        logs: []
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'Data enrichment failed', { error })

      return {
        nodeId: 'enrichment',
        status: 'failed' as const,
        input,
        output: null,
        error: error as Error,
        executionTime,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {},
        logs: []
      }
    }
  }
}

class TransformBlock extends BaseBlockExecutor {
  constructor() {
    super('custom.transform')
  }

  async execute(config: any, input: any, context: ExecutionContext) {
    const startTime = Date.now()
    this.log(context, 'info', 'Transforming data')

    try {
      // Apply transformations based on config
      let output = { ...input }

      if (config.operations && Array.isArray(config.operations)) {
        for (const op of config.operations) {
          if (op.type === 'map' && op.field && op.targetField) {
            if (input[op.field]) {
              output[op.targetField] = input[op.field]
              delete output[op.field]
            }
          }
        }
      }

      output.transformed = true

      await this.sleep(50)

      const executionTime = Date.now() - startTime
      this.log(context, 'info', 'Transform completed', { executionTime })

      return {
        nodeId: 'transform',
        status: 'completed' as const,
        input,
        output,
        executionTime,
        error: undefined,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {},
        logs: []
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'Transform failed', { error })

      return {
        nodeId: 'transform',
        status: 'failed' as const,
        input,
        output: null,
        error: error as Error,
        executionTime,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {},
        logs: []
      }
    }
  }
}

class StaticInputBlock extends BaseBlockExecutor {
  constructor() {
    super('input.static')
  }

  async execute(config: any, input: any, context: ExecutionContext) {
    const startTime = Date.now()

    this.log(context, 'info', 'Loading static input', { data: config.data })

    return {
      nodeId: 'input',
      status: 'completed' as const,
      input: null,
      output: config.data || {},
      executionTime: Date.now() - startTime,
      error: undefined,
      retryCount: 0,
      startTime,
      endTime: Date.now(),
      metadata: {},
      logs: []
    }
  }
}

class LoggerOutputBlock extends BaseBlockExecutor {
  constructor() {
    super('output.logger')
  }

  async execute(config: any, input: any, context: ExecutionContext) {
    const startTime = Date.now()

    this.log(context, 'info', `Output: ${config.prefix || ''}`, {
      data: input,
      format: config.format
    })

    // Pretty print based on format
    if (config.format === 'pretty') {
      console.log(
        `${config.prefix || '[Output]'}`,
        JSON.stringify(input, null, 2)
          .split('\n')
          .map((line: string) => '  ' + line)
          .join('\n')
      )
    } else {
      console.log(`${config.prefix || '[Output]'}`, JSON.stringify(input))
    }

    return {
      nodeId: 'output',
      status: 'completed' as const,
      input,
      output: { logged: true },
      executionTime: Date.now() - startTime,
      error: undefined,
      retryCount: 0,
      startTime,
      endTime: Date.now(),
      metadata: {},
      logs: []
    }
  }
}

// ============================================================
// Define Workflow
// ============================================================

const workflow: WorkflowDefinition = {
  $schema: 'http://lume.ai/schemas/workflow-v1.json#',
  workflowId: 'example-with-orchestrator',
  name: 'Example with Orchestrator',
  version: 1,
  description: 'Demonstrates automatic workflow execution with orchestrator',
  metadata: {
    author: 'Workflow Engine',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['example', 'orchestrator', 'demo']
  },
  globals: {
    timeout: 300,
    retryPolicy: {
      maxRetries: 2,
      backoffMultiplier: 2,
      initialDelay: 1000
    },
    errorHandling: 'continue'
  },
  nodes: [
    {
      id: 'input-1',
      type: 'input.static',
      name: 'Data Input',
      description: 'Receives initial data',
      config: {
        data: {
          users: [
            { id: 1, name: 'Alice', email: 'alice@example.com' },
            { id: 2, name: 'Bob', email: 'bob@example.com' },
            { id: 3, name: 'Charlie', email: 'charlie@example.com' }
          ]
        }
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'enrich-1',
      type: 'custom.dataEnrichment',
      name: 'Data Enrichment',
      description: 'Enriches user data with additional information',
      config: {
        enrichmentType: 'score',
        batchSize: 10
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'transform-1',
      type: 'custom.transform',
      name: 'Field Mapping',
      description: 'Maps and renames fields',
      config: {
        operations: [
          {
            type: 'map',
            field: 'name',
            targetField: 'fullName'
          }
        ]
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'output-1',
      type: 'output.logger',
      name: 'Logger Output',
      description: 'Logs the final result',
      config: {
        prefix: '🎯 [Final Result]',
        format: 'pretty'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    {
      id: 'e1',
      source: 'input-1',
      target: 'enrich-1',
      sourcePort: 'out',
      targetPort: 'in'
    },
    {
      id: 'e2',
      source: 'enrich-1',
      target: 'transform-1',
      sourcePort: 'out',
      targetPort: 'in'
    },
    {
      id: 'e3',
      source: 'transform-1',
      target: 'output-1',
      sourcePort: 'out',
      targetPort: 'in'
    }
  ]
}

// ============================================================
// Parallel Workflow Example
// ============================================================

const parallelWorkflow: WorkflowDefinition = {
  $schema: 'http://lume.ai/schemas/workflow-v1.json#',
  workflowId: 'parallel-example',
  name: 'Parallel Execution Example',
  version: 1,
  description: 'Demonstrates parallel execution of independent nodes',
  metadata: {
    author: 'Workflow Engine',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['example', 'parallel', 'demo']
  },
  nodes: [
    {
      id: 'input-1',
      type: 'input.static',
      name: 'Data Input',
      config: {
        data: {
          value: 42,
          items: [1, 2, 3, 4, 5]
        }
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'enrich-1',
      type: 'custom.dataEnrichment',
      name: 'Enrichment 1',
      description: 'First enrichment branch',
      config: { branch: 'A' },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'enrich-2',
      type: 'custom.dataEnrichment',
      name: 'Enrichment 2',
      description: 'Second enrichment branch',
      config: { branch: 'B' },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'transform-1',
      type: 'custom.transform',
      name: 'Transform',
      description: 'Transform merged results',
      config: {
        operations: [{ type: 'map', field: 'value', targetField: 'result' }]
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'output-1',
      type: 'output.logger',
      name: 'Logger Output',
      config: {
        prefix: '✅ [Parallel Result]',
        format: 'pretty'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-1', target: 'enrich-1' },
    { id: 'e2', source: 'input-1', target: 'enrich-2' },
    { id: 'e3', source: 'enrich-1', target: 'transform-1' },
    { id: 'e4', source: 'enrich-2', target: 'transform-1' },
    { id: 'e5', source: 'transform-1', target: 'output-1' }
  ]
}

// ============================================================
// Main Execution Function
// ============================================================

async function runLinearExample() {
  console.log('\n=== Linear Workflow Execution ===\n')

  // Step 1: Register custom blocks
  console.log('1️⃣  Registering custom blocks...')
  registerBlock('input.static', StaticInputBlock, {
    name: 'Static Input',
    description: 'Provides static data',
    category: 'input'
  })
  registerBlock('custom.dataEnrichment', DataEnrichmentBlock, {
    name: 'Data Enrichment',
    description: 'Enriches data with additional information',
    category: 'custom'
  })
  registerBlock('custom.transform', TransformBlock, {
    name: 'Transform',
    description: 'Transforms data',
    category: 'transform'
  })
  registerBlock('output.logger', LoggerOutputBlock, {
    name: 'Logger Output',
    description: 'Logs output to console',
    category: 'output'
  })
  console.log('   ✅ All blocks registered\n')

  // Step 2: Validate workflow
  console.log('2️⃣  Validating workflow...')
  const validationResult = await workflowValidator.validate(workflow)

  if (!validationResult.valid) {
    console.error('   ❌ Validation failed!')
    console.error('   Errors:', validationResult.errors)
    return
  }

  console.log('   ✅ Workflow is valid!\n')

  // Step 3: Create execution context
  console.log('3️⃣  Creating execution context...')
  const context = ContextFactory.create({
    workflowId: workflow.workflowId,
    mode: 'demo',
    variables: {
      environment: 'development',
      version: '1.0.0'
    },
    secrets: {
      apiKey: process.env.API_KEY || 'demo-key-123'
    },
    progress: (progress, event) => {
      console.log(`   [${progress}%] ${event.event}: ${event.details?.message || ''}`)
    }
  })
  console.log(`   ✅ Context created: ${context.executionId}\n`)

  // Step 4: Execute workflow with orchestrator
  console.log('4️⃣  Executing workflow with orchestrator...\n')

  const startTime = Date.now()
  const result = await workflowOrchestrator.execute(workflow, context, {})
  const totalTime = Date.now() - startTime

  console.log('\n5️⃣  Execution Results')
  console.log('   ' + '='.repeat(50))
  console.log(`   Status: ${result.status.toUpperCase()}`)
  console.log(`   Total time: ${totalTime}ms`)
  console.log(`   Execution time: ${result.executionTime}ms`)
  console.log(`   Nodes completed: ${result.metadata.completedNodes}/${result.metadata.totalNodes}`)
  console.log(`   Nodes failed: ${result.metadata.failedNodes}`)
  console.log('   ' + '='.repeat(50))

  if (result.status === 'completed') {
    console.log('\n✅ Workflow completed successfully!')
  } else {
    console.log('\n❌ Workflow failed!')
    if (result.error) {
      console.error('   Error:', result.error.message)
    }
  }

  return result
}

async function runParallelExample() {
  console.log('\n\n=== Parallel Workflow Execution ===\n')

  const context = ContextFactory.create({
    workflowId: parallelWorkflow.workflowId,
    mode: 'demo',
    progress: (progress, event) => {
      console.log(`   [${progress}%] ${event.event}`)
    }
  })

  console.log('Executing parallel workflow...\n')
  const startTime = Date.now()

  const result = await workflowOrchestrator.execute(parallelWorkflow, context, {})

  const totalTime = Date.now() - startTime

  console.log('\n📊 Parallel Execution Results')
  console.log('   ' + '='.repeat(50))
  console.log(`   Status: ${result.status.toUpperCase()}`)
  console.log(`   Total time: ${totalTime}ms`)
  console.log(`   Nodes completed: ${result.metadata.completedNodes}/${result.metadata.totalNodes}`)
  console.log('   ' + '='.repeat(50))

  return result
}

// ============================================================
// Run Examples
// ============================================================

async function main() {
  try {
    // Run linear example
    await runLinearExample()

    // Run parallel example
    await runParallelExample()

    console.log('\n✅ All examples completed successfully!\n')
  } catch (error) {
    console.error('\n❌ Example failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export {
  runLinearExample,
  runParallelExample,
  workflow,
  parallelWorkflow,
  DataEnrichmentBlock,
  TransformBlock
}
