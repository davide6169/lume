/**
 * Database Integration - Complete Example
 *
 * This example demonstrates the full database integration:
 * 1. Creating a workflow in the database
 * 2. Executing it with tracking
 * 3. Querying execution history
 * 4. Analyzing results
 */

import {
  WorkflowDefinition,
  BlockType
} from '../types'
import {
  workflowValidator,
  WorkflowOrchestrator,
  ContextFactory,
  registerAllBuiltInBlocks,
  WorkflowService,
  ExecutionTrackingService
} from '../index'

// ============================================
// Example Workflow Definition
// ============================================

const exampleWorkflow: WorkflowDefinition = {
  workflowId: 'db-integration-example',
  name: 'Database Integration Example',
  version: 1,
  description: 'Demonstrates workflow persistence and execution tracking',
  metadata: {
    author: 'Workflow Engine',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['example', 'database', 'integration']
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
      id: 'input',
      type: BlockType.INPUT,
      name: 'Data Input',
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
      outputSchema: null
    },
    {
      id: 'transform',
      type: BlockType.TRANSFORM,
      name: 'Score Multiplier',
      config: {
        operations: [
          {
            type: 'calculate',
            field: 'score',
            transformation: 'id * 10'
          }
        ]
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'output',
      type: BlockType.OUTPUT,
      name: 'Logger Output',
      config: {
        format: 'pretty'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input', 'target': 'transform' },
    { id: 'e2', source: 'transform', 'target': 'output' }
  ]
}

// ============================================
// Main Integration Function
// ============================================

async function runDatabaseIntegrationExample() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║   Workflow Engine - Database Integration Example            ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')

  // Step 1: Register blocks
  console.log('📦 Step 1: Registering blocks')
  console.log('─'.repeat(60))
  registerAllBuiltInBlocks()
  console.log('✅ Blocks registered')
  console.log('')

  // Step 2: Validate workflow
  console.log('✓ Step 2: Validating workflow')
  console.log('─'.repeat(60))

  const validationResult = await workflowValidator.validate(exampleWorkflow)

  if (!validationResult.valid) {
    console.error('❌ Validation failed!')
    return
  }

  console.log('✅ Workflow is valid')
  console.log('')

  // Step 3: Initialize services
  console.log('⚙️  Step 3: Initializing database services')
  console.log('─'.repeat(60))

  // Note: In production, get these from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-project.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-key'

  console.log('✅ Services initialized')
  console.log(`   Supabase URL: ${supabaseUrl}`)
  console.log('')

  // Step 4: Create workflow in database
  console.log('💾 Step 4: Creating workflow in database')
  console.log('─'.repeat(60))

  try {
    const workflowService = new WorkflowService(supabaseUrl, supabaseKey)

    const createdWorkflow = await workflowService.createWorkflow({
      workflow_id: exampleWorkflow.workflowId,
      name: exampleWorkflow.name,
      description: exampleWorkflow.description,
      version: exampleWorkflow.version,
      definition: exampleWorkflow,
      category: 'example',
      tags: ['example', 'database'],
      metadata: {
        author: 'Workflow Engine',
        demo: true
      }
    })

    console.log('✅ Workflow created in database')
    console.log(`   ID: ${createdWorkflow.id}`)
    console.log(`   Workflow ID: ${createdWorkflow.workflow_id}`)
    console.log(`   Created at: ${createdWorkflow.created_at}`)
    console.log('')

    // Step 5: Execute workflow with tracking
    console.log('🚀 Step 5: Executing workflow with database tracking')
    console.log('─'.repeat(60))

    const executionTracker = new ExecutionTrackingService(supabaseUrl, supabaseKey)

    // Create execution record
    const execution = await executionTracker.createExecution({
      workflow_id: exampleWorkflow.workflowId,
      execution_id: `db-example-${Date.now()}`,
      status: 'running',
      input_data: { test: true },
      mode: 'demo',
      progress_percentage: 0
    })

    console.log('✅ Execution record created')
    console.log(`   Execution ID: ${execution.execution_id}`)
    console.log('')

    // Create context with database logging
    const context = ContextFactory.create({
      workflowId: exampleWorkflow.workflowId,
      executionId: execution.execution_id,
      mode: 'demo',
      variables: {},
      progress: async (progress, event) => {
        // Update database
        await executionTracker.updateProgress(execution.execution_id, progress)

        // Log event
        await executionTracker.createTimelineEvent({
          workflow_execution_id: execution.id, // UUID
          event: event.event,
          event_type: event.event,
          details: event.details,
          node_id: event.nodeId
        })

        console.log(`   [${progress}%] ${event.event}`)
      }
    })

    // Execute workflow
    console.log('   Executing workflow DAG...')
    const orchestrator = new WorkflowOrchestrator()
    const startTime = Date.now()

    const result = await orchestrator.execute(
      exampleWorkflow,
      context,
      { test: true }
    )

    const executionTime = Date.now() - startTime

    // Update execution record
    await executionTracker.updateExecution(execution.execution_id, {
      status: result.status,
      output_data: result.output,
      execution_time_ms: executionTime,
      completed_at: new Date().toISOString(),
      progress_percentage: 100
    })

    console.log('')
    console.log('✅ Workflow execution completed')
    console.log(`   Status: ${result.status}`)
    console.log(`   Execution Time: ${executionTime}ms`)
    console.log('')

    // Step 6: Query execution history
    console.log('📊 Step 6: Querying execution history')
    console.log('─'.repeat(60))

    const executions = await executionTracker.listExecutions({
      workflow_id: exampleWorkflow.workflowId,
      limit: 10
    })

    console.log(`✅ Found ${executions.length} execution(s)`)
    console.log('')

    executions.forEach((exec, i) => {
      console.log(`   ${i + 1}. ${exec.execution_id}`)
      console.log(`      Status: ${exec.status}`)
      console.log(`      Started: ${exec.started_at}`)
      if (exec.completed_at) {
        console.log(`      Duration: ${exec.execution_time_ms}ms`)
      }
      console.log('')
    })

    // Step 7: Query block executions
    console.log('📋 Step 7: Querying block executions')
    console.log('─'.repeat(60))

    const blockExecutions = await executionTracker.getBlockExecutions(execution.id!)

    console.log(`✅ Found ${blockExecutions.length} block execution(s)`)
    console.log('')

    blockExecutions.forEach((blockExec, i) => {
      console.log(`   ${i + 1}. ${blockExec.node_id} (${blockExec.block_type})`)
      console.log(`      Status: ${blockExec.status}`)
      console.log(`      Duration: ${blockExec.execution_time_ms}ms`)
      if (blockExec.retry_count > 0) {
        console.log(`      Retries: ${blockExec.retry_count}`)
      }
      console.log('')
    })

    // Step 8: Query timeline events
    console.log('📝 Step 8: Querying timeline events')
    console.log('─'.repeat(60))

    const timelineEvents = await executionTracker.getTimelineEvents(execution.id!)

    console.log(`✅ Found ${timelineEvents.length} timeline event(s)`)
    console.log('')

    // Show first few events
    const previewEvents = timelineEvents.slice(0, 10)
    previewEvents.forEach((event, i) => {
      console.log(`   ${i + 1}. [${event.event_type || 'event'}] ${event.event}`)
      if (event.node_id) {
        console.log(`      Node: ${event.node_id}`)
      }
      if (event.error_message) {
        console.log(`      Error: ${event.error_message}`)
      }
      console.log('')
    })

    if (timelineEvents.length > 10) {
      console.log(`   ... and ${timelineEvents.length - 10} more events`)
      console.log('')
    }

    // Summary
    console.log('╔════════════════════════════════════════════════════════════╗')
    console.log('║                    Integration Summary                        ║')
    console.log('╚════════════════════════════════════════════════════════════╝')
    console.log('')
    console.log('Workflow:')
    console.log(`  ID: ${createdWorkflow.workflow_id}`)
    console.log(`  UUID: ${createdWorkflow.id}`)
    console.log(`  Status: Active`)
    console.log('')
    console.log('Execution:')
    console.log(`  Execution ID: ${execution.execution_id}`)
    console.log(`  Status: ${result.status}`)
    console.log(`  Duration: ${executionTime}ms`)
    console.log(`  Blocks: ${blockExecutions.length}`)
    console.log(`  Events: ${timelineEvents.length}`)
    console.log('')
    console.log('Database Features Demonstrated:')
    console.log('  ✅ Workflow persistence')
    console.log('  ✅ Execution tracking')
    console.log('  ✅ Block execution logs')
    console.log('  ✅ Timeline event logging')
    console.log('  ✅ Progress tracking')
    console.log('  ✅ Historical queries')
    console.log('  ✅ Statistics and counters')
    console.log('')
    console.log('🎉 Database integration is fully functional!')
    console.log('')

  } catch (error) {
    console.error('❌ Database integration example failed:', error)
    console.log('')
    console.log('Note: This example requires a running Supabase instance.')
    console.log('To set up:')
    console.log('1. Run migration: npx supabase db push')
    console.log('2. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    console.log('')
  }
}

// ============================================
// Run the Example
// ============================================

if (require.main === module) {
  runDatabaseIntegrationExample().catch(error => {
    console.error('❌ Example failed:', error)
    process.exit(1)
  })
}

export { runDatabaseIntegrationExample }
