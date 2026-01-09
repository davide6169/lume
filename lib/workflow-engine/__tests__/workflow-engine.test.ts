/**
 * Workflow Engine - Foundation Tests
 *
 * Tests for Sprint 1.1: Foundation
 * - Type definitions
 * - Workflow validator
 * - Block registry
 * - Execution context
 * - Variable interpolation
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  WorkflowDefinition,
  BlockType,
  ExecutionContext
} from '../types'
import { WorkflowValidator } from '../validator'
import {
  BlockRegistry,
  registerBlock,
  createBlockExecutor,
  BaseBlockExecutor
} from '../registry'
import {
  ContextManager,
  ContextFactory,
  VariableInterpolator,
  DefaultLogger
} from '../context'
import { StaticInputBlock } from '../blocks/input/static-input.block'
import { LoggerOutputBlock } from '../blocks/output/logger-output.block'
import { FieldMappingBlock } from '../blocks/transform/field-mapping.block'

describe('Workflow Engine - Sprint 1.1 Foundation', () => {
  describe('Type Definitions', () => {
    it('should define BlockType enum', () => {
      expect(BlockType.INPUT).toBe('input')
      expect(BlockType.API).toBe('api')
      expect(BlockType.AI).toBe('ai')
      expect(BlockType.OUTPUT).toBe('output')
    })

    it('should create valid workflow definition', () => {
      const workflow: WorkflowDefinition = {
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
            type: BlockType.INPUT,
            name: 'Input',
            config: {},
            inputSchema: null,
            outputSchema: null
          },
          {
            id: 'output-1',
            type: BlockType.OUTPUT,
            name: 'Output',
            config: {},
            inputSchema: null,
            outputSchema: null
          }
        ],
        edges: [
          {
            id: 'e1',
            source: 'input-1',
            target: 'output-1'
          }
        ]
      }

      expect(workflow.workflowId).toBe('test-workflow')
      expect(workflow.nodes).toHaveLength(2)
      expect(workflow.edges).toHaveLength(1)
    })
  })

  describe('Workflow Validator', () => {
    let validator: WorkflowValidator

    beforeEach(() => {
      validator = new WorkflowValidator()
    })

    it('should validate a correct workflow', async () => {
      const workflow: WorkflowDefinition = {
        workflowId: 'valid-workflow',
        name: 'Valid Workflow',
        version: 1,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        nodes: [
          {
            id: 'input-1',
            type: BlockType.INPUT,
            name: 'Input',
            config: { data: { test: true } },
            inputSchema: null,
            outputSchema: {
              type: 'object',
              properties: {
                test: { type: 'boolean' }
              }
            }
          },
          {
            id: 'output-1',
            type: BlockType.OUTPUT,
            name: 'Output',
            config: {},
            inputSchema: null,
            outputSchema: null
          }
        ],
        edges: [
          {
            id: 'e1',
            source: 'input-1',
            target: 'output-1'
          }
        ]
      }

      const result = await validator.validate(workflow)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing required fields', async () => {
      const workflow = {
        name: 'Invalid Workflow'
      } as any

      const result = await validator.validate(workflow)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.path === 'workflowId')).toBe(true)
    })

    it('should detect duplicate node IDs', async () => {
      const workflow: WorkflowDefinition = {
        workflowId: 'duplicate-test',
        name: 'Duplicate Test',
        version: 1,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        nodes: [
          {
            id: 'node-1',
            type: BlockType.INPUT,
            name: 'Node 1',
            config: {},
            inputSchema: null,
            outputSchema: null
          },
          {
            id: 'node-1', // Duplicate!
            type: BlockType.OUTPUT,
            name: 'Node 2',
            config: {},
            inputSchema: null,
            outputSchema: null
          }
        ],
        edges: []
      }

      const result = await validator.validate(workflow)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.includes('Duplicate'))).toBe(true)
    })

    it('should detect cycles in DAG', async () => {
      const workflow: WorkflowDefinition = {
        workflowId: 'cycle-test',
        name: 'Cycle Test',
        version: 1,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        nodes: [
          {
            id: 'node-1',
            type: BlockType.INPUT,
            name: 'Node 1',
            config: {},
            inputSchema: null,
            outputSchema: null
          },
          {
            id: 'node-2',
            type: BlockType.API,
            name: 'Node 2',
            config: {},
            inputSchema: null,
            outputSchema: null
          }
        ],
        edges: [
          {
            id: 'e1',
            source: 'node-1',
            target: 'node-2'
          },
          {
            id: 'e2',
            source: 'node-2',
            target: 'node-1' // Cycle!
          }
        ]
      }

      const result = await validator.validate(workflow)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.type === 'dag')).toBe(true)
    })

    it('should detect invalid edge references', async () => {
      const workflow: WorkflowDefinition = {
        workflowId: 'edge-test',
        name: 'Edge Test',
        version: 1,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        nodes: [
          {
            id: 'node-1',
            type: BlockType.INPUT,
            name: 'Node 1',
            config: {},
            inputSchema: null,
            outputSchema: null
          }
        ],
        edges: [
          {
            id: 'e1',
            source: 'node-1',
            target: 'non-existent' // Invalid!
          }
        ]
      }

      const result = await validator.validate(workflow)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.type === 'connection')).toBe(true)
    })
  })

  describe('Block Registry', () => {
    let registry: BlockRegistry

    beforeEach(() => {
      registry = new BlockRegistry()
    })

    it('should register and create blocks', () => {
      class TestBlock extends BaseBlockExecutor {
        constructor() {
          super('test')
        }
        async execute(config: any, input: any, context: any) {
          return { status: 'completed', output: input }
        }
      }

      registry.register('test', TestBlock, {
        name: 'Test Block',
        description: 'A test block',
        category: 'custom'
      })

      expect(registry.has('test')).toBe(true)
      expect(registry.list()).toContain('test')

      const block = registry.create('test')
      expect(block).toBeInstanceOf(TestBlock)
    })

    it('should throw error for duplicate registration', () => {
      class TestBlock extends BaseBlockExecutor {
        constructor() {
          super('test')
        }
        async execute(config: any, input: any, context: any) {
          return { status: 'completed', output: input }
        }
      }

      registry.register('test', TestBlock)

      expect(() => {
        registry.register('test', TestBlock)
      }).toThrow('Block type already registered')
    })

    it('should return null for unknown block type', () => {
      const block = registry.create('unknown')
      expect(block).toBeNull()
    })

    it('should store and retrieve metadata', () => {
      class TestBlock extends BaseBlockExecutor {
        constructor() {
          super('test')
        }
        async execute(config: any, input: any, context: any) {
          return { status: 'completed', output: input }
        }
      }

      registry.register('test', TestBlock, {
        name: 'Test Block',
        description: 'Test description',
        category: 'custom',
        version: '1.0.0'
      })

      const metadata = registry.getMetadata('test')
      expect(metadata).toBeDefined()
      expect(metadata?.name).toBe('Test Block')
      expect(metadata?.category).toBe('custom')
    })
  })

  describe('Execution Context', () => {
    it('should create context with factory', () => {
      const context = ContextFactory.create({
        workflowId: 'test-workflow',
        mode: 'test'
      })

      expect(context.workflowId).toBe('test-workflow')
      expect(context.mode).toBe('test')
      expect(context.executionId).toBeDefined()
      expect(context.startTime).toBeDefined()
    })

    it('should manage variables', () => {
      const context = ContextFactory.create({
        workflowId: 'test-workflow',
        variables: {
          initial: 'value'
        }
      })

      expect(context.getVariable('initial')).toBe('value')

      context.setVariable('new', 'value2')
      expect(context.getVariable('new')).toBe('value2')

      context.setVariables({
        batch1: 'val1',
        batch2: 'val2'
      })

      expect(context.getVariable('batch1')).toBe('val1')
    })

    it('should manage node results', () => {
      const context = ContextFactory.create({
        workflowId: 'test-workflow'
      })

      const result = {
        nodeId: 'node-1',
        status: 'completed' as const,
        input: { test: true },
        output: { result: 'success' },
        executionTime: 100,
        retryCount: 0,
        startTime: Date.now(),
        endTime: Date.now(),
        metadata: {},
        logs: []
      }

      context.setNodeResult('node-1', result)

      expect(context.hasNodeResult('node-1')).toBe(true)
      expect(context.getNodeResult('node-1')).toEqual(result)
      expect(context.getNodeOutput('node-1')).toEqual({ result: 'success' })
    })

    it('should track elapsed time', () => {
      const context = ContextFactory.create({
        workflowId: 'test-workflow'
      })

      const elapsed = context.getElapsedTime()
      expect(elapsed).toBeGreaterThanOrEqual(0)
      expect(elapsed).toBeLessThan(100) // Should be very fast
    })
  })

  describe('Variable Interpolation', () => {
    it('should interpolate input variables', () => {
      const context = ContextFactory.create({
        workflowId: 'test-workflow'
      })

      const inputData = {
        user: {
          name: 'John',
          email: 'john@example.com'
        }
      }

      const template = 'Hello {{input.user.name}}'
      const result = VariableInterpolator.interpolate(template, context, inputData)

      expect(result).toBe('Hello John')
    })

    it('should interpolate workflow variables', () => {
      const context = ContextFactory.create({
        workflowId: 'test-workflow',
        variables: {
          apiKey: 'secret-key-123',
          baseUrl: 'https://api.example.com'
        }
      })

      const template = '{{variables.baseUrl}}/users?key={{variables.apiKey}}'
      const result = VariableInterpolator.interpolate(template, context, {})

      expect(result).toBe('https://api.example.com/users?key=secret-key-123')
    })

    it('should interpolate node outputs', () => {
      const context = ContextFactory.create({
        workflowId: 'test-workflow'
      })

      // Mock node result
      const result = {
        nodeId: 'previous-node',
        status: 'completed' as const,
        input: {},
        output: {
          extracted: {
            email: 'test@example.com'
          }
        },
        executionTime: 100,
        retryCount: 0,
        startTime: Date.now(),
        endTime: Date.now(),
        metadata: {},
        logs: []
      }

      context.setNodeResult('previous-node', result)

      const template = 'Email: {{nodes.previous-node.output.extracted.email}}'
      const interpolated = VariableInterpolator.interpolate(template, context, {})

      expect(interpolated).toBe('Email: test@example.com')
    })

    it('should interpolate objects recursively', () => {
      const context = ContextFactory.create({
        workflowId: 'test-workflow',
        variables: {
          apiKey: 'key-123'
        }
      })

      const config = {
        endpoint: 'https://api.example.com',
        headers: {
          Authorization: 'Bearer {{variables.apiKey}}',
          'Content-Type': 'application/json'
        },
        query: {
          limit: 10
        }
      }

      const result = VariableInterpolator.interpolateObject(config, context, {})

      expect(result.headers.Authorization).toBe('Bearer key-123')
      expect(result.endpoint).toBe('https://api.example.com')
    })

    it('should extract variable references', () => {
      const template = 'Hello {{input.name}}, your key is {{variables.apiKey}}'
      const refs = VariableInterpolator.extractVariables(template)

      expect(refs).toEqual(['input.name', 'variables.apiKey'])
    })
  })

  describe('Block Execution Integration', () => {
    let registry: BlockRegistry

    beforeEach(() => {
      registry = new BlockRegistry()

      // Register test blocks
      registry.register('input.static', StaticInputBlock)
      registry.register('output.logger', LoggerOutputBlock)
      registry.register('transform.fieldMapping', FieldMappingBlock)
    })

    it('should execute static input block', async () => {
      const block = registry.create('input.static')!
      const context = ContextFactory.create({
        workflowId: 'test-workflow',
        mode: 'test'
      })

      const result = await block.execute(
        { data: { message: 'Hello, World!' } },
        null,
        context
      )

      expect(result.status).toBe('completed')
      expect(result.output).toEqual({ message: 'Hello, World!' })
    })

    it('should execute transform block', async () => {
      const block = registry.create('transform.fieldMapping')!
      const context = ContextFactory.create({
        workflowId: 'test-workflow',
        mode: 'test'
      })

      const inputData = [
        { id: 1, firstName: 'John', lastName: 'Doe' },
        { id: 2, firstName: 'Jane', lastName: 'Smith' }
      ]

      const result = await block.execute(
        {
          operations: [
            {
              type: 'map',
              field: 'firstName',
              targetField: 'name'
            }
          ]
        },
        inputData,
        context
      )

      expect(result.status).toBe('completed')
      expect(result.output[0]).toHaveProperty('name', 'John')
    })
  })
})
