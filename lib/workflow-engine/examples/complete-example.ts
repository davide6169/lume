/**
 * Complete Workflow Engine Example
 *
 * This example demonstrates:
 * 1. Creating a workflow definition
 * 2. Validating the workflow
 * 3. Registering custom blocks
 * 4. Executing a workflow (manually for now)
 * 5. Using variable interpolation
 * 6. Logging and progress tracking
 */

import {
  WorkflowDefinition,
  BlockType,
  ExecutionContext
} from '../types'
import { workflowValidator } from '../validator'
import {
  BlockRegistry,
  registerBlock,
  BaseBlockExecutor
} from '../registry'
import { ContextFactory, VariableInterpolator } from '../context'

// ============================================================
// 1. Define a Custom Block
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
    this.log(context, 'info', 'Starting data enrichment', { input })

    const startTime = Date.now()

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

      this.log(context, 'info', 'Data enrichment completed', {
        executionTime,
        outputSize: JSON.stringify(enriched).length
      })

      return {
        status: 'completed',
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
}

// ============================================================
// 2. Define the Workflow
// ============================================================

const workflow: WorkflowDefinition = {
  $schema: 'http://lume.ai/schemas/workflow-v1.json#',
  workflowId: 'example-enrichment-pipeline',
  name: 'Example Data Enrichment Pipeline',
  version: 1,
  description: 'Demonstrates a simple enrichment pipeline with custom blocks',
  metadata: {
    author: 'Workflow Engine',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['example', 'enrichment', 'demo']
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
      type: BlockType.INPUT,
      name: 'Data Input',
      description: 'Receives initial data',
      config: {
        source: 'static',
        data: {
          users: [
            { id: 1, name: 'Alice', email: 'alice@example.com' },
            { id: 2, name: 'Bob', email: 'bob@example.com' },
            { id: 3, name: 'Charlie', email: 'charlie@example.com' }
          ]
        }
      },
      inputSchema: null,
      outputSchema: {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                email: { type: 'string' }
              }
            }
          }
        }
      }
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
      inputSchema: {
        type: 'object',
        properties: {
          users: { type: 'array' }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          users: { type: 'array' }
        }
      }
    },
    {
      id: 'transform-1',
      type: BlockType.TRANSFORM,
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
      type: BlockType.OUTPUT,
      name: 'Logger Output',
      description: 'Logs the final result',
      config: {
        prefix: '[Workflow Result]',
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
// 3. Main Execution Function
// ============================================================

async function runExample() {
  console.log('=== Workflow Engine - Complete Example ===\n')

  // Step 1: Register custom blocks
  console.log('1️⃣  Registering custom blocks...')
  registerBlock('custom.dataEnrichment', DataEnrichmentBlock, {
    name: 'Data Enrichment',
    description: 'Enriches data with additional information',
    category: 'custom',
    version: '1.0.0',
    tags: ['enrichment', 'data']
  })
  console.log('   ✅ Block registered: custom.dataEnrichment\n')

  // Step 2: Validate workflow
  console.log('2️⃣  Validating workflow definition...')
  const validationResult = await workflowValidator.validate(workflow)

  if (!validationResult.valid) {
    console.error('   ❌ Validation failed!')
    console.error('   Errors:', validationResult.errors)
    return
  }

  console.log('   ✅ Workflow is valid!')
  if (validationResult.warnings.length > 0) {
    console.log('   ⚠️  Warnings:', validationResult.warnings.length)
    validationResult.warnings.forEach(warning => {
      console.log(`      - ${warning.message}`)
    })
  }
  console.log('')

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
  console.log(`   ✅ Context created: ${context.executionId}`)
  console.log(`   Mode: ${context.mode}`)
  console.log(`   Variables: ${Object.keys(context.variables).length}`)
  console.log('')

  // Step 4: Demonstrate variable interpolation
  console.log('4️⃣  Demonstrating variable interpolation...')
  const template1 = 'Environment: {{variables.environment}}'
  const template2 = 'API Key: {{secrets.apiKey}}'
  const template3 = 'Workflow ID: {{workflow.workflowId}}'

  console.log(`   Template: "${template1}"`)
  console.log(`   Result:   "${VariableInterpolator.interpolate(template1, context, {})}"`)
  console.log('')
  console.log(`   Template: "${template2}"`)
  console.log(`   Result:   "${VariableInterpolator.interpolate(template2, context, {})}"`)
  console.log('')
  console.log(`   Template: "${template3}"`)
  console.log(`   Result:   "${VariableInterpolator.interpolate(template3, context, {})}"`)
  console.log('')

  // Step 5: Execute blocks (manual execution for now)
  console.log('5️⃣  Executing workflow blocks...')
  console.log('')

  // Node 1: Input
  console.log('   📥 Node: input-1')
  const inputBlockConfig = workflow.nodes.find(n => n.id === 'input-1')!.config
  const inputData = inputBlockConfig.data

  context.setNodeResult('input-1', {
    nodeId: 'input-1',
    status: 'completed' as const,
    input: null,
    output: inputData,
    executionTime: 0,
    retryCount: 0,
    startTime: Date.now(),
    endTime: Date.now(),
    metadata: {},
    logs: []
  })

  console.log(`   ✅ Input loaded: ${inputData.users.length} users`)
  console.log('')

  // Node 2: Enrichment
  console.log('   ⚡ Node: enrich-1')
  const enrichBlock = new DataEnrichmentBlock()
  const enrichConfig = workflow.nodes.find(n => n.id === 'enrich-1')!.config
  const enrichResult = await enrichBlock.execute(enrichConfig, inputData, context)

  context.setNodeResult('enrich-1', enrichResult)

  if (enrichResult.status === 'completed') {
    console.log(`   ✅ Enrichment completed in ${enrichResult.executionTime}ms`)
    console.log(`   Output sample:`, JSON.stringify(enrichResult.output).substring(0, 100) + '...')
  } else {
    console.log(`   ❌ Enrichment failed: ${enrichResult.error?.message}`)
  }
  console.log('')

  // Node 3: Transform
  console.log('   🔧 Node: transform-1')
  const transformData = {
    users: enrichResult.output.users.map((user: any) => ({
      ...user,
      transformed: true
    }))
  }

  context.setNodeResult('transform-1', {
    nodeId: 'transform-1',
    status: 'completed' as const,
    input: enrichResult.output,
    output: transformData,
    executionTime: 10,
    retryCount: 0,
    startTime: Date.now(),
    endTime: Date.now(),
    metadata: {},
    logs: []
  })

  console.log(`   ✅ Transform completed`)
  console.log('')

  // Node 4: Output
  console.log('   📤 Node: output-1')
  console.log('   Final output:')
  console.log('   ', JSON.stringify(transformData, null, 2).split('\n').join('\n   '))
  console.log('')

  // Step 6: Summary
  console.log('6️⃣  Execution Summary')
  console.log('   ' + '='.repeat(50))
  console.log(`   Total time: ${context.getElapsedTime()}ms`)
  console.log(`   Nodes completed: ${context.nodeResults.size}`)
  console.log(`   Workflow ID: ${context.workflowId}`)
  console.log(`   Execution ID: ${context.executionId}`)
  console.log('   ' + '='.repeat(50))
  console.log('')

  console.log('✅ Example completed successfully!')
}

// ============================================================
// Run the Example
// ============================================================

if (require.main === module) {
  runExample().catch(error => {
    console.error('❌ Example failed:', error)
    process.exit(1)
  })
}

export { runExample, workflow, DataEnrichmentBlock }
