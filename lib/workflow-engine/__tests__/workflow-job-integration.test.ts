/**
 * Workflow Job Integration Tests
 *
 * Tests for workflow execution within the job processor system.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { jobProcessor } from '@/lib/services/job-processor'
import { processWorkflowJob, createWorkflowJob, getWorkflowJobProgress } from '@/lib/workflow-engine/job'
import { registerBlock, BaseBlockExecutor } from '@/lib/workflow-engine'
import type { WorkflowDefinition } from '@/lib/workflow-engine/types'

// Mock block for testing
class MockTestBlock extends BaseBlockExecutor {
  constructor() {
    super('test.mockBlock')
  }

  async execute(config: any, input: any, context: any) {
    await this.sleep(50)

    return {
      nodeId: 'test-mock',
      status: 'completed' as const,
      input,
      output: {
        ...input,
        processed: true,
        timestamp: new Date().toISOString()
      },
      executionTime: 50,
      error: undefined,
      retryCount: 0,
      startTime: Date.now(),
      endTime: Date.now(),
      metadata: {},
      logs: []
    }
  }
}

describe('Workflow Job Integration', () => {
  let testWorkflow: WorkflowDefinition

  beforeAll(() => {
    // Register mock block
    registerBlock('test.mockBlock', MockTestBlock, {
      name: 'Mock Test Block',
      description: 'Block for testing',
      category: 'test'
    })
  })

  beforeEach(() => {
    // Define test workflow
    testWorkflow = {
      workflowId: 'test-workflow',
      name: 'Test Workflow',
      version: 1,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      nodes: [
        {
          id: 'input-1',
          type: 'input.static',
          name: 'Input',
          config: { data: { test: true } },
          inputSchema: null,
          outputSchema: null
        },
        {
          id: 'process-1',
          type: 'test.mockBlock',
          name: 'Process',
          config: {},
          inputSchema: null,
          outputSchema: null
        },
        {
          id: 'output-1',
          type: 'output.logger',
          name: 'Output',
          config: {},
          inputSchema: null,
          outputSchema: null
        }
      ],
      edges: [
        { id: 'e1', source: 'input-1', target: 'process-1' },
        { id: 'e2', source: 'process-1', target: 'output-1' }
      ]
    }
  })

  describe('createWorkflowJob', () => {
    it('should create a workflow job structure', () => {
      const payload = {
        workflowId: 'test-workflow',
        input: { data: 'test' },
        mode: 'test' as const
      }

      const jobData = createWorkflowJob('user-123', payload)

      expect(jobData.userId).toBe('user-123')
      expect(jobData.type).toBe('WORKFLOW')
      expect(jobData.status).toBe('pending')
      expect(jobData.progress).toBe(0)
      expect(jobData.payload).toEqual(payload)
      expect(jobData.timeline).toHaveLength(1)
      expect(jobData.timeline[0].event).toBe('JOB_CREATED')
    })

    it('should include workflow metadata in timeline', () => {
      const payload = {
        workflowId: 'test-workflow',
        input: { data: 'test' },
        mode: 'demo' as const,
        variables: { apiKey: 'test-key' }
      }

      const jobData = createWorkflowJob('user-123', payload)

      expect(jobData.timeline[0].details).toEqual({
        workflowId: 'test-workflow',
        mode: 'demo'
      })
    })
  })

  describe('processWorkflowJob', () => {
    it('should process a workflow job successfully', async () => {
      const job = jobProcessor.createJob('user-123', 'WORKFLOW', {
        workflowId: 'test-workflow',
        workflowDefinition: testWorkflow,
        input: { testData: true },
        mode: 'test'
      })

      const progressUpdates: any[] = []

      await jobProcessor.startJob(job.id, async (job, updateProgress) => {
        await processWorkflowJob(job, updateProgress)
      }, {
        onProgress: (jobId, progress, timeline) => {
          progressUpdates.push({ progress, timeline: [...timeline] })
        }
      })

      const completedJob = jobProcessor.getJob(job.id)

      expect(completedJob).toBeDefined()
      expect(completedJob?.status).toBe('completed')
      expect(completedJob?.progress).toBe(100)
      expect(completedJob?.result?.success).toBe(true)
      expect(progressUpdates.length).toBeGreaterThan(0)
    })

    it('should update progress during execution', async () => {
      const job = jobProcessor.createJob('user-123', 'WORKFLOW', {
        workflowId: 'test-workflow',
        workflowDefinition: testWorkflow,
        input: {},
        mode: 'test'
      })

      const progressValues: number[] = []

      await jobProcessor.startJob(job.id, async (job, updateProgress) => {
        await processWorkflowJob(job, (progress, event) => {
          progressValues.push(progress)
          updateProgress(progress, event)
        })
      })

      // Progress should increase
      expect(progressValues.length).toBeGreaterThan(0)
      expect(Math.max(...progressValues)).toBe(100)
    })

    it('should handle workflow execution failures', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...testWorkflow,
        nodes: [
          {
            id: 'invalid-node',
            type: 'nonexistent.block',
            name: 'Invalid Block',
            config: {},
            inputSchema: null,
            outputSchema: null
          }
        ],
        edges: []
      }

      const job = jobProcessor.createJob('user-123', 'WORKFLOW', {
        workflowId: 'invalid-workflow',
        workflowDefinition: invalidWorkflow,
        input: {},
        mode: 'test'
      })

      await expect(
        jobProcessor.startJob(job.id, async (job, updateProgress) => {
          await processWorkflowJob(job, updateProgress)
        })
      ).rejects.toThrow()

      const failedJob = jobProcessor.getJob(job.id)
      expect(failedJob?.status).toBe('failed')
    })
  })

  describe('getWorkflowJobProgress', () => {
    it('should extract progress information from job', () => {
      const job = jobProcessor.createJob('user-123', 'WORKFLOW', {
        workflowId: 'test-workflow',
        workflowDefinition: testWorkflow,
        input: {},
        mode: 'test'
      })

      const progress = getWorkflowJobProgress(job)

      expect(progress.status).toBe('pending')
      expect(progress.progress).toBe(0)
      expect(progress.completedNodes).toBe(0)
    })

    it('should extract error information from failed job', async () => {
      const job = jobProcessor.createJob('user-123', 'WORKFLOW', {
        workflowId: 'test-workflow',
        workflowDefinition: testWorkflow,
        input: {},
        mode: 'test'
      })

      // Simulate failed job
      job.status = 'failed'
      job.result = {
        success: false,
        error: 'Test error message'
      }

      const progress = getWorkflowJobProgress(job)

      expect(progress.status).toBe('failed')
      expect(progress.error).toBe('Test error message')
    })
  })

  describe('Job Processor Integration', () => {
    it('should handle workflow jobs alongside other job types', async () => {
      // Create a SEARCH job
      const searchJob = jobProcessor.createJob('user-123', 'SEARCH', {
        sourceAudienceIds: ['aud-1'],
        mode: 'test'
      })

      // Create a WORKFLOW job
      const workflowJob = jobProcessor.createJob('user-123', 'WORKFLOW', {
        workflowId: 'test-workflow',
        workflowDefinition: testWorkflow,
        input: {},
        mode: 'test'
      })

      expect(searchJob.type).toBe('SEARCH')
      expect(workflowJob.type).toBe('WORKFLOW')

      const stats = jobProcessor.getStats()
      expect(stats.total).toBeGreaterThanOrEqual(2)
    })

    it('should maintain job isolation', async () => {
      const job1 = jobProcessor.createJob('user-123', 'WORKFLOW', {
        workflowId: 'test-workflow',
        workflowDefinition: testWorkflow,
        input: { id: 1 },
        mode: 'test'
      })

      const job2 = jobProcessor.createJob('user-123', 'WORKFLOW', {
        workflowId: 'test-workflow',
        workflowDefinition: testWorkflow,
        input: { id: 2 },
        mode: 'test'
      })

      expect(job1.id).not.toBe(job2.id)

      const retrievedJob1 = jobProcessor.getJob(job1.id)
      const retrievedJob2 = jobProcessor.getJob(job2.id)

      expect(retrievedJob1?.payload.input.id).toBe(1)
      expect(retrievedJob2?.payload.input.id).toBe(2)
    })
  })
})
