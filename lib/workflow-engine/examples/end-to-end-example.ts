/**
 * End-to-End Workflow Engine Example
 *
 * This example demonstrates the complete workflow engine execution:
 * 1. Define a workflow with multiple nodes
 * 2. Validate the workflow
 * 3. Register custom blocks
 * 4. Execute the workflow using the orchestrator
 * 5. Track progress and results
 */

import {
  WorkflowDefinition,
  BlockType,
  ExecutionStatus
} from '../types'
import {
  workflowValidator,
  WorkflowOrchestrator,
  ContextFactory,
  registerBlock,
  BaseBlockExecutor
} from '../index'

// ============================================================
// Custom Blocks for this Example
// ============================================================

/**
 * Data Generator Block - Creates sample data
 */
class DataGeneratorBlock extends BaseBlockExecutor {
  constructor() {
    super('custom.dataGenerator')
  }

  async execute(config: any, input: any, context: any) {
    this.log(context, 'info', 'Generating sample data')

    const count = config.count || 5
    const data = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      score: Math.floor(Math.random() * 100)
    }))

    return {
      status: 'completed',
      output: { users: data },
      executionTime: 50,
      error: undefined,
      retryCount: 0,
      startTime: Date.now(),
      endTime: Date.now() + 50,
      metadata: {},
      logs: []
    }
  }
}

/**
 * Score Filter Block - Filters users by score
 */
class ScoreFilterBlock extends BaseBlockExecutor {
  constructor() {
    super('custom.scoreFilter')
  }

  async execute(config: any, input: any, context: any) {
    this.log(context, 'info', 'Filtering by score')

    const minScore = config.minScore || 50
    const users = input.users || []

    const filtered = users.filter((user: any) => user.score >= minScore)

    this.log(context, 'info', `Filtered ${users.length} → ${filtered.length} users`)

    return {
      status: 'completed',
      output: { users: filtered, filteredCount: filtered.length },
      executionTime: 20,
      error: undefined,
      retryCount: 0,
      startTime: Date.now(),
      endTime: Date.now() + 20,
      metadata: {},
      logs: []
    }
  }
}

/**
 * Score Multiplier Block - Multiplies all scores
 */
class ScoreMultiplierBlock extends BaseBlockExecutor {
  constructor() {
    super('custom.scoreMultiplier')
  }

  async execute(config: any, input: any, context: any) {
    this.log(context, 'info', 'Multiplying scores')

    const multiplier = config.multiplier || 2
    const users = input.users || []

    const transformed = users.map((user: any) => ({
      ...user,
      score: user.score * multiplier,
      originalScore: user.score
    }))

    return {
      status: 'completed',
      output: { users: transformed },
      executionTime: 30,
      error: undefined,
      retryCount: 0,
      startTime: Date.now(),
      endTime: Date.now() + 30,
      metadata: {},
      logs: []
    }
  }
}

/**
 * Statistics Block - Calculates statistics
 */
class StatisticsBlock extends BaseBlockExecutor {
  constructor() {
    super('custom.statistics')
  }

  async execute(config: any, input: any, context: any) {
    this.log(context, 'info', 'Calculating statistics')

    const users = input.users || []

    const stats = {
      totalUsers: users.length,
      averageScore: users.reduce((sum: number, u: any) => sum + u.score, 0) / users.length,
      maxScore: Math.max(...users.map((u: any) => u.score)),
      minScore: Math.min(...users.map((u: any) => u.score)),
      scores: users.map((u: any) => u.score)
    }

    return {
      status: 'completed',
      output: { users, statistics: stats },
      executionTime: 40,
      error: undefined,
      retryCount: 0,
      startTime: Date.now(),
      endTime: Date.now() + 40,
      metadata: {},
      logs: []
    }
  }
}

// ============================================================
// Workflow Definition
// ============================================================

const workflow: WorkflowDefinition = {
  workflowId: 'data-pipeline-example',
  name: 'Data Processing Pipeline',
  version: 1,
  description: 'Example workflow demonstrating data processing pipeline',
  metadata: {
    author: 'Workflow Engine',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['example', 'pipeline', 'data-processing']
  },
  globals: {
    timeout: 600,
    retryPolicy: {
      maxRetries: 2,
      backoffMultiplier: 2,
      initialDelay: 1000
    },
    errorHandling: 'continue'
  },
  nodes: [
    {
      id: 'generate',
      type: 'custom.dataGenerator',
      name: 'Generate Data',
      description: 'Creates sample user data',
      config: {
        count: 10
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
                email: { type: 'string' },
                score: { type: 'number' }
              }
            }
          }
        }
      }
    },
    {
      id: 'filter',
      type: 'custom.scoreFilter',
      name: 'Filter High Scores',
      description: 'Filters users with score >= 50',
      config: {
        minScore: 50
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'multiply',
      type: 'custom.scoreMultiplier',
      name: 'Multiply Scores',
      description: 'Multiplies all scores by 2',
      config: {
        multiplier: 2
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'stats',
      type: 'custom.statistics',
      name: 'Calculate Statistics',
      description: 'Calculates user statistics',
      config: {},
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'output',
      type: BlockType.OUTPUT,
      name: 'Final Output',
      description: 'Logs final results',
      config: {
        format: 'pretty'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'generate', target: 'filter' },
    { id: 'e2', source: 'filter', target: 'multiply' },
    { id: 'e3', source: 'multiply', target: 'stats' },
    { id: 'e4', source: 'stats', target: 'output' }
  ]
}

// ============================================================
// Main Execution Function
// ============================================================

async function runEndToEndExample() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║   Workflow Engine - End-to-End Execution Example        ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')

  // Step 1: Register custom blocks
  console.log('📦 Step 1: Registering custom blocks')
  console.log('─'.repeat(60))

  registerBlock('custom.dataGenerator', DataGeneratorBlock, {
    name: 'Data Generator',
    description: 'Generates sample user data',
    category: 'custom'
  })

  registerBlock('custom.scoreFilter', ScoreFilterBlock, {
    name: 'Score Filter',
    description: 'Filters users by score threshold',
    category: 'transform'
  })

  registerBlock('custom.scoreMultiplier', ScoreMultiplierBlock, {
    name: 'Score Multiplier',
    description: 'Multiplies user scores',
    category: 'transform'
  })

  registerBlock('custom.statistics', StatisticsBlock, {
    name: 'Statistics Calculator',
    description: 'Calculates statistics on user data',
    category: 'transform'
  })

  console.log('✅ Registered 4 custom blocks')
  console.log('')

  // Step 2: Validate workflow
  console.log('✓ Step 2: Validating workflow')
  console.log('─'.repeat(60))

  const validationResult = await workflowValidator.validate(workflow)

  if (!validationResult.valid) {
    console.error('❌ Validation failed!')
    validationResult.errors.forEach(error => {
      console.error(`   [${error.type}] ${error.message}`)
    })
    return
  }

  console.log(`✅ Workflow "${workflow.workflowId}" is valid`)
  console.log(`   Nodes: ${workflow.nodes.length}`)
  console.log(`   Edges: ${workflow.edges.length}`)

  if (validationResult.warnings.length > 0) {
    console.log(`   ⚠️  Warnings: ${validationResult.warnings.length}`)
  }
  console.log('')

  // Step 3: Create execution context
  console.log('⚙️  Step 3: Creating execution context')
  console.log('─'.repeat(60))

  const context = ContextFactory.create({
    workflowId: workflow.workflowId,
    mode: 'production',
    variables: {
      environment: 'production',
      version: '1.0.0'
    },
    progress: (progress, event) => {
      const icon = event.event === 'layer_completed' ? '✓' : '→'
      console.log(`   ${icon} [${progress}%] ${event.event}: ${event.details?.message || ''}`)
    }
  })

  console.log(`✅ Context created: ${context.executionId}`)
  console.log(`   Mode: ${context.mode}`)
  console.log('')

  // Step 4: Execute workflow
  console.log('🚀 Step 4: Executing workflow')
  console.log('─'.repeat(60))
  console.log('')

  const orchestrator = new WorkflowOrchestrator()
  const startTime = Date.now()

  const result = await orchestrator.execute(
    workflow,
    context,
    {} // No input needed, workflow generates its own data
  )

  const totalTime = Date.now() - startTime
  console.log('')
  console.log('─'.repeat(60))
  console.log('')

  // Step 5: Display results
  console.log('📊 Step 5: Execution Results')
  console.log('─'.repeat(60))
  console.log('')

  console.log(`Status: ${result.status === 'completed' ? '✅ COMPLETED' : '❌ FAILED'}`)
  console.log(`Total Time: ${result.executionTime}ms`)
  console.log(`Nodes Completed: ${result.metadata.completedNodes}/${result.metadata.totalNodes}`)
  console.log(`Nodes Failed: ${result.metadata.failedNodes}`)
  console.log(`Nodes Skipped: ${result.metadata.skippedNodes}`)
  console.log('')

  // Display node results
  console.log('Node Results:')
  console.log('─'.repeat(60))

  for (const [nodeId, nodeResult] of Object.entries(result.nodeResults)) {
    const node = workflow.nodes.find(n => n.id === nodeId)
    const nodeName = node?.name || nodeId
    const icon = nodeResult.status === ExecutionStatus.COMPLETED ? '✅' : '❌'

    console.log(`${icon} ${nodeName} (${nodeId})`)
    console.log(`   Status: ${nodeResult.status}`)
    console.log(`   Time: ${nodeResult.executionTime}ms`)

    if (nodeResult.status === ExecutionStatus.COMPLETED && nodeResult.output) {
      const output = nodeResult.output
      if (output.statistics) {
        console.log(`   Output:`)
        console.log(`   - Total Users: ${output.statistics.totalUsers}`)
        console.log(`   - Average Score: ${output.statistics.averageScore.toFixed(2)}`)
        console.log(`   - Score Range: ${output.statistics.minScore} - ${output.statistics.maxScore}`)
      } else if (output.filteredCount !== undefined) {
        console.log(`   Output: ${output.filteredCount} users passed filter`)
      } else if (output.users) {
        console.log(`   Output: ${output.users.length} users`)
      }
    }

    if (nodeResult.error) {
      console.log(`   Error: ${nodeResult.error.message}`)
    }

    console.log('')
  }

  // Display final output
  if (result.output) {
    console.log('─'.repeat(60))
    console.log('Final Output:')
    console.log('─'.repeat(60))

    if (result.output.statistics) {
      console.log(JSON.stringify(result.output.statistics, null, 2))
    } else {
      console.log(JSON.stringify(result.output, null, 2))
    }
    console.log('')
  }

  // Summary
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║                     Execution Summary                       ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`Workflow: ${workflow.workflowId}`)
  console.log(`Status: ${result.status.toUpperCase()}`)
  console.log(`Execution Time: ${totalTime}ms`)
  console.log(`Nodes: ${result.metadata.completedNodes}/${result.metadata.totalNodes} completed`)
  console.log(`Timeline Events: ${result.timeline.length}`)
  console.log('')

  if (result.status === ExecutionStatus.COMPLETED) {
    console.log('✅ Workflow executed successfully!')
  } else {
    console.log('❌ Workflow execution failed')
    if (result.error) {
      console.log(`Error: ${result.error.message}`)
    }
  }

  console.log('')
}

// ============================================================
// Run the Example
// ============================================================

if (require.main === module) {
  runEndToEndExample().catch(error => {
    console.error('❌ Example failed:', error)
    process.exit(1)
  })
}

export { runEndToEndExample, workflow }
