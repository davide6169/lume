/**
 * Orchestrator Integration Tests
 */

import {
  WorkflowOrchestrator,
  workflowValidator,
  ContextFactory,
  registerBlock,
  BaseBlockExecutor,
  WorkflowDefinition,
  BlockType
} from '..'

// Mock block for testing
class MockInputBlock extends BaseBlockExecutor {
  constructor() {
    super('input.mock')
  }

  async execute(config: any, input: any, context: any) {
    const startTime = Date.now()

    await this.sleep(50) // Simulate work

    return {
      nodeId: 'mock',
      status: 'completed' as const,
      input,
      output: config.data || { message: 'Hello from input' },
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

class MockProcessBlock extends BaseBlockExecutor {
  constructor() {
    super('process.mock')
  }

  async execute(config: any, input: any, context: any) {
    const startTime = Date.now()

    await this.sleep(50) // Simulate work

    return {
      nodeId: 'mock',
      status: 'completed' as const,
      input,
      output: {
        ...input,
        processed: true,
        timestamp: new Date().toISOString()
      },
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

class MockOutputBlock extends BaseBlockExecutor {
  private static lastOutput: any = null

  constructor() {
    super('output.mock')
  }

  async execute(config: any, input: any, context: any) {
    const startTime = Date.now()

    MockOutputBlock.lastOutput = input

    await this.sleep(50) // Simulate work

    return {
      nodeId: 'mock',
      status: 'completed' as const,
      input,
      output: { stored: true },
      executionTime: Date.now() - startTime,
      error: undefined,
      retryCount: 0,
      startTime,
      endTime: Date.now(),
      metadata: {},
      logs: []
    }
  }

  static getLastOutput() {
    return MockOutputBlock.lastOutput
  }

  static reset() {
    MockOutputBlock.lastOutput = null
  }
}

class FailingBlock extends BaseBlockExecutor {
  constructor() {
    super('fail.mock')
  }

  async execute(config: any, input: any, context: any) {
    const startTime = Date.now()

    await this.sleep(50)

    return {
      nodeId: 'mock',
      status: 'failed' as const,
      input,
      output: null,
      error: new Error('Intentional failure'),
      executionTime: Date.now() - startTime,
      retryCount: 0,
      startTime,
      endTime: Date.now(),
      metadata: {},
      logs: []
    }
  }
}

describe('WorkflowOrchestrator', () => {
  let orchestrator: WorkflowOrchestrator

  beforeAll(() => {
    // Register mock blocks
    registerBlock('input.mock', MockInputBlock, {
      name: 'Mock Input',
      description: 'Mock input block',
      category: 'input'
    })
    registerBlock('process.mock', MockProcessBlock, {
      name: 'Mock Process',
      description: 'Mock process block',
      category: 'transform'
    })
    registerBlock('output.mock', MockOutputBlock, {
      name: 'Mock Output',
      description: 'Mock output block',
      category: 'output'
    })
    registerBlock('fail.mock', FailingBlock, {
      name: 'Failing Block',
      description: 'Block that always fails',
      category: 'custom'
    })
  })

  beforeEach(() => {
    orchestrator = new WorkflowOrchestrator()
    MockOutputBlock.reset()
  })

  describe('Linear Workflow Execution', () => {
    it('should execute a simple linear workflow', async () => {
      const workflow: WorkflowDefinition = {
        workflowId: 'test-linear',
        name: 'Linear Test Workflow',
        version: 1,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        nodes: [
          {
            id: 'input-1',
            type: 'input.mock',
            name: 'Input',
            config: { data: { value: 42 } },
            inputSchema: null,
            outputSchema: null
          },
          {
            id: 'process-1',
            type: 'process.mock',
            name: 'Process',
            config: {},
            inputSchema: null,
            outputSchema: null
          },
          {
            id: 'output-1',
            type: 'output.mock',
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

      // Validate workflow
      const validation = await workflowValidator.validate(workflow)
      expect(validation.valid).toBe(true)

      // Create context
      const context = ContextFactory.create({
        workflowId: 'test-linear',
        mode: 'test'
      })

      // Execute workflow
      const result = await orchestrator.execute(workflow, context, {})

      // Assertions
      expect(result.status).toBe('completed')
      expect(result.executionTime).toBeGreaterThan(0)
      expect(result.nodeResults).toHaveProperty('input-1')
      expect(result.nodeResults).toHaveProperty('process-1')
      expect(result.nodeResults).toHaveProperty('output-1')

      // Check node outputs
      expect(result.nodeResults['input-1'].status).toBe('completed')
      expect(result.nodeResults['process-1'].status).toBe('completed')
      expect(result.nodeResults['output-1'].status).toBe('completed')

      // Check data flow
      expect(result.nodeResults['process-1'].output.processed).toBe(true)
    })

    it('should pass data correctly between nodes', async () => {
      const workflow: WorkflowDefinition = {
        workflowId: 'test-data-flow',
        name: 'Data Flow Test',
        version: 1,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        nodes: [
          {
            id: 'input-1',
            type: 'input.mock',
            name: 'Input',
            config: { data: { users: ['alice', 'bob', 'charlie'] } },
            inputSchema: null,
            outputSchema: null
          },
          {
            id: 'process-1',
            type: 'process.mock',
            name: 'Process',
            config: {},
            inputSchema: null,
            outputSchema: null
          },
          {
            id: 'output-1',
            type: 'output.mock',
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

      const context = ContextFactory.create({
        workflowId: 'test-data-flow',
        mode: 'test'
      })

      const result = await orchestrator.execute(workflow, context, {})

      expect(result.status).toBe('completed')
      expect(result.nodeResults['process-1'].output.users).toEqual(['alice', 'bob', 'charlie'])
      expect(result.nodeResults['process-1'].output.processed).toBe(true)
    })
  })

  describe('Parallel Workflow Execution', () => {
    it('should execute independent nodes in parallel', async () => {
      const workflow: WorkflowDefinition = {
        workflowId: 'test-parallel',
        name: 'Parallel Test',
        version: 1,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        nodes: [
          {
            id: 'input-1',
            type: 'input.mock',
            name: 'Input',
            config: { data: { value: 1 } },
            inputSchema: null,
            outputSchema: null
          },
          {
            id: 'process-1',
            type: 'process.mock',
            name: 'Process 1',
            config: {},
            inputSchema: null,
            outputSchema: null
          },
          {
            id: 'process-2',
            type: 'process.mock',
            name: 'Process 2',
            config: {},
            inputSchema: null,
            outputSchema: null
          },
          {
            id: 'output-1',
            type: 'output.mock',
            name: 'Output',
            config: {},
            inputSchema: null,
            outputSchema: null
          }
        ],
        edges: [
          { id: 'e1', source: 'input-1', target: 'process-1' },
          { id: 'e2', source: 'input-1', target: 'process-2' },
          { id: 'e3', source: 'process-1', target: 'output-1' },
          { id: 'e4', source: 'process-2', target: 'output-1' }
        ]
      }

      const validation = await workflowValidator.validate(workflow)
      expect(validation.valid).toBe(true)

      const context = ContextFactory.create({
        workflowId: 'test-parallel',
        mode: 'test'
      })

      const startTime = Date.now()
      const result = await orchestrator.execute(workflow, context, {})
      const executionTime = Date.now() - startTime

      expect(result.status).toBe('completed')
      expect(result.nodeResults['process-1'].status).toBe('completed')
      expect(result.nodeResults['process-2'].status).toBe('completed')

      // Parallel execution should be faster than sequential
      // Each mock block takes 50ms
      // Sequential: input(50) + process1(50) + process2(50) + output(50) = 200ms
      // Parallel: input(50) + max(process1, process2)(50) + output(50) = 150ms
      expect(executionTime).toBeLessThan(190)
    })
  })

  describe('Error Handling', () => {
    it('should stop workflow on node failure with stop strategy', async () => {
      const workflow: WorkflowDefinition = {
        workflowId: 'test-failure',
        name: 'Failure Test',
        version: 1,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        globals: {
          errorHandling: 'stop'
        },
        nodes: [
          {
            id: 'input-1',
            type: 'input.mock',
            name: 'Input',
            config: { data: {} },
            inputSchema: null,
            outputSchema: null
          },
          {
            id: 'fail-1',
            type: 'fail.mock',
            name: 'Failing Node',
            config: {},
            inputSchema: null,
            outputSchema: null
          },
          {
            id: 'output-1',
            type: 'output.mock',
            name: 'Output',
            config: {},
            inputSchema: null,
            outputSchema: null
          }
        ],
        edges: [
          { id: 'e1', source: 'input-1', target: 'fail-1' },
          { id: 'e2', source: 'fail-1', target: 'output-1' }
        ]
      }

      const context = ContextFactory.create({
        workflowId: 'test-failure',
        mode: 'test'
      })

      const result = await orchestrator.execute(workflow, context, {})

      expect(result.status).toBe('failed')
      expect(result.error).toBeDefined()
      expect(result.nodeResults['fail-1'].status).toBe('failed')
      expect(result.nodeResults['output-1']).toBeUndefined()
    })

    it('should continue workflow on node failure with continue strategy', async () => {
      const workflow: WorkflowDefinition = {
        workflowId: 'test-failure-continue',
        name: 'Failure Continue Test',
        version: 1,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        globals: {
          errorHandling: 'continue'
        },
        nodes: [
          {
            id: 'input-1',
            type: 'input.mock',
            name: 'Input',
            config: { data: {} },
            inputSchema: null,
            outputSchema: null
          },
          {
            id: 'fail-1',
            type: 'fail.mock',
            name: 'Failing Node',
            config: {},
            inputSchema: null,
            outputSchema: null
          },
          {
            id: 'process-1',
            type: 'process.mock',
            name: 'Process After Failure',
            config: {},
            inputSchema: null,
            outputSchema: null
          }
        ],
        edges: [
          { id: 'e1', source: 'input-1', target: 'fail-1' },
          { id: 'e2', source: 'fail-1', target: 'process-1' }
        ]
      }

      const context = ContextFactory.create({
        workflowId: 'test-failure-continue',
        mode: 'test'
      })

      const result = await orchestrator.execute(workflow, context, {})

      // With continue strategy, the workflow should complete
      // even though fail-1 failed
      expect(result.nodeResults['fail-1'].status).toBe('failed')
    })
  })

  describe('Retry Logic', () => {
    it('should retry failed nodes according to retry policy', async () => {
      // Create a block that fails initially then succeeds
      class FlakyBlock extends BaseBlockExecutor {
        private attempts = 0

        constructor() {
          super('flaky.mock')
        }

        async execute(config: any, input: any, context: any) {
          const startTime = Date.now()
          this.attempts++

          if (this.attempts < 3) {
            return {
              nodeId: 'flaky',
              status: 'failed' as const,
              input,
              output: null,
              error: new Error(`Attempt ${this.attempts} failed`),
              executionTime: Date.now() - startTime,
              retryCount: this.attempts - 1,
              startTime,
              endTime: Date.now(),
              metadata: {},
              logs: []
            }
          }

          return {
            nodeId: 'flaky',
            status: 'completed' as const,
            input,
            output: { success: true, attempt: this.attempts },
            executionTime: Date.now() - startTime,
            error: undefined,
            retryCount: this.attempts - 1,
            startTime,
            endTime: Date.now(),
            metadata: {},
            logs: []
          }
        }
      }

      registerBlock('flaky.mock', FlakyBlock, {
        name: 'Flaky Block',
        description: 'Block that fails before succeeding',
        category: 'custom'
      })

      const workflow: WorkflowDefinition = {
        workflowId: 'test-retry',
        name: 'Retry Test',
        version: 1,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        globals: {
          retryPolicy: {
            maxRetries: 3,
            initialDelay: 10,
            backoffMultiplier: 1
          }
        },
        nodes: [
          {
            id: 'flaky-1',
            type: 'flaky.mock',
            name: 'Flaky Node',
            config: {},
            inputSchema: null,
            outputSchema: null
          }
        ],
        edges: []
      }

      const context = ContextFactory.create({
        workflowId: 'test-retry',
        mode: 'test'
      })

      const result = await orchestrator.execute(workflow, context, {})

      expect(result.status).toBe('completed')
      expect(result.nodeResults['flaky-1'].status).toBe('completed')
      expect(result.nodeResults['flaky-1'].retryCount).toBeGreaterThan(0)
    })
  })

  describe('Progress Tracking', () => {
    it('should update progress during execution', async () => {
      const progressUpdates: any[] = []

      const workflow: WorkflowDefinition = {
        workflowId: 'test-progress',
        name: 'Progress Test',
        version: 1,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        nodes: [
          {
            id: 'input-1',
            type: 'input.mock',
            name: 'Input',
            config: { data: {} },
            inputSchema: null,
            outputSchema: null
          },
          {
            id: 'process-1',
            type: 'process.mock',
            name: 'Process',
            config: {},
            inputSchema: null,
            outputSchema: null
          },
          {
            id: 'output-1',
            type: 'output.mock',
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

      const context = ContextFactory.create({
        workflowId: 'test-progress',
        mode: 'test',
        progress: (progress, event) => {
          progressUpdates.push({ progress, event })
        }
      })

      await orchestrator.execute(workflow, context, {})

      expect(progressUpdates.length).toBeGreaterThan(0)

      // Check that progress increases
      const firstProgress = progressUpdates[0].progress
      const lastProgress = progressUpdates[progressUpdates.length - 1].progress
      expect(lastProgress).toBeGreaterThan(firstProgress)
    })
  })
})
