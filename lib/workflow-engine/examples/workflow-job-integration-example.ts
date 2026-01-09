/**
 * Workflow Job Integration Example
 *
 * Demonstrates how to execute workflows through the job processor system.
 */

import { jobProcessor } from '@/lib/services/job-processor'
import { processWorkflowJob, createWorkflowJob } from '@/lib/workflow-engine/job'
import { registerBlock, BaseBlockExecutor } from '@/lib/workflow-engine'
import type { WorkflowDefinition, WorkflowJobPayload } from '@/lib/workflow-engine/types'

// ============================================================
// Register Custom Block
// ============================================================

class SimpleProcessingBlock extends BaseBlockExecutor {
  constructor() {
    super('custom.simpleProcessing')
  }

  async execute(config: any, input: any, context: any) {
    const startTime = Date.now()
    this.log(context, 'info', 'Processing data', { input })

    // Simulate processing
    await this.sleep(100)

    const output = {
      ...input,
      processed: true,
      timestamp: new Date().toISOString()
    }

    this.log(context, 'info', 'Processing completed')

    return {
      nodeId: 'simple-processing',
      status: 'completed' as const,
      input,
      output,
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
  workflowId: 'simple-workflow-example',
  name: 'Simple Processing Workflow',
  version: 1,
  description: 'A simple workflow that demonstrates job integration',
  metadata: {
    author: 'Workflow Engine',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  nodes: [
    {
      id: 'input-1',
      type: 'input.static',
      name: 'Data Input',
      config: {
        data: {
          message: 'Hello from workflow job!',
          items: [1, 2, 3, 4, 5]
        }
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'process-1',
      type: 'custom.simpleProcessing',
      name: 'Process Data',
      config: {},
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'output-1',
      type: 'output.logger',
      name: 'Log Output',
      config: {
        prefix: '✅ [Workflow Result]',
        format: 'pretty'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-1', target: 'process-1' },
    { id: 'e2', source: 'process-1', target: 'output-1' }
  ]
}

// ============================================================
// Execute Workflow as Job
// ============================================================

async function executeWorkflowAsJob() {
  console.log('\n=== Workflow Job Integration Example ===\n')

  // 1. Register custom block
  console.log('1️⃣  Registering custom block...')
  registerBlock('custom.simpleProcessing', SimpleProcessingBlock, {
    name: 'Simple Processing',
    description: 'Processes data',
    category: 'custom',
    version: '1.0.0'
  })
  console.log('   ✅ Block registered\n')

  // 2. Create workflow job payload
  console.log('2️⃣  Creating workflow job payload...')
  const payload: WorkflowJobPayload = {
    workflowId: 'simple-workflow-example',
    workflowDefinition: workflow, // Inline definition
    input: {
      userId: 'user-123',
      timestamp: new Date().toISOString()
    },
    mode: 'demo',
    variables: {
      environment: 'development'
    },
    metadata: {
      source: 'job-integration-example'
    }
  }
  console.log(`   ✅ Payload created: ${payload.workflowId}\n`)

  // 3. Create job using job processor
  console.log('3️⃣  Creating workflow job...')
  const job = jobProcessor.createJob('user-123', 'WORKFLOW', payload)
  console.log(`   ✅ Job created: ${job.id}`)
  console.log(`   Status: ${job.status}`)
  console.log(`   Type: ${job.type}\n`)

  // 4. Start job processing
  console.log('4️⃣  Starting job processing...\n')

  try {
    await jobProcessor.startJob(job.id, processWorkflowJob, {
      onProgress: (jobId, progress, timeline) => {
        const lastEvent = timeline[timeline.length - 1]
        console.log(`   [${progress}%] ${lastEvent.event}`)
        if (lastEvent.details) {
          console.log(`       Details:`, JSON.stringify(lastEvent.details, null, 2).split('\n').map((line: string) => '       ' + line).join('\n'))
        }
      },
      onComplete: (jobId, result) => {
        console.log(`\n   ✅ Job ${jobId} completed!`)
        console.log('   Result:', result)
      },
      onError: (jobId, error) => {
        console.error(`\n   ❌ Job ${jobId} failed: ${error}`)
      }
    })

    // 5. Get final job status
    const completedJob = jobProcessor.getJob(job.id)
    if (completedJob) {
      console.log('\n5️⃣  Final Job Status')
      console.log('   ' + '='.repeat(50))
      console.log(`   Job ID: ${completedJob.id}`)
      console.log(`   Status: ${completedJob.status}`)
      console.log(`   Progress: ${completedJob.progress}%`)
      console.log(`   Timeline Events: ${completedJob.timeline.length}`)
      console.log('   ' + '='.repeat(50))

      if (completedJob.result?.success) {
        console.log('\n✅ Workflow job completed successfully!')
        console.log('Output:', completedJob.result.data)
      } else {
        console.log('\n❌ Workflow job failed')
        console.log('Error:', completedJob.result?.error)
      }
    }
  } catch (error) {
    console.error('\n❌ Job processing failed:', error)
  }

  // 6. Get job statistics
  const stats = jobProcessor.getStats()
  console.log('\n6️⃣  Job Processor Statistics')
  console.log('   ' + '='.repeat(50))
  console.log(`   Total Jobs: ${stats.total}`)
  console.log(`   Processing: ${stats.processing}`)
  console.log(`   Completed: ${stats.completed}`)
  console.log(`   Failed: ${stats.failed}`)
  console.log(`   Pending: ${stats.pending}`)
  console.log('   ' + '='.repeat(50))
}

// ============================================================
// Run Example
// ============================================================

async function main() {
  try {
    await executeWorkflowAsJob()
    console.log('\n✅ Example completed successfully!\n')
  } catch (error) {
    console.error('\n❌ Example failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { executeWorkflowAsJob, workflow }
