/**
 * Workflow Orchestrator
 *
 * Executes workflow DAGs with parallel node execution, state management,
 * and progress tracking.
 */

import {
  WorkflowDefinition,
  NodeDefinition,
  EdgeDefinition,
  ExecutionStatus,
  ExecutionContext,
  ExecutionResult,
  WorkflowExecutionResult,
  NodeExecutionState,
  ExecutionPlan,
  TimelineEvent,
  BlockExecutor
} from './types'
import { createBlockExecutor } from './registry'

/**
 * Workflow Orchestrator
 * Manages execution of workflow DAGs with parallel processing
 */
export class WorkflowOrchestrator {
  private abortController: AbortController | null = null

  /**
   * Execute a complete workflow
   */
  async execute(
    workflow: WorkflowDefinition,
    context: ExecutionContext,
    input: any
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now()

    this.log(context, 'info', `Starting workflow execution: ${workflow.workflowId}`, {
      workflowId: workflow.workflowId,
      version: workflow.version,
      nodeCount: workflow.nodes.length
    })

    try {
      // Create execution plan
      const plan = this.createExecutionPlan(workflow)
      this.log(context, 'info', 'Execution plan created', {
        layers: plan.executionOrder.length,
        estimatedTime: plan.estimatedTime
      })

      // Initialize abort controller for cancellation
      this.abortController = new AbortController()

      // Store input in context
      context.setVariable('_input', input)

      // Execute workflow layers
      for (let layerIndex = 0; layerIndex < plan.executionOrder.length; layerIndex++) {
        const layer = plan.executionOrder[layerIndex]

        // Check if aborted
        if (this.abortController.signal.aborted) {
          throw new Error('Workflow execution cancelled')
        }

        this.log(context, 'info', `Executing layer ${layerIndex + 1}/${plan.executionOrder.length}`, {
          nodeCount: layer.length,
          nodes: layer
        })

        // Execute nodes in this layer in parallel
        await this.executeLayer(workflow, layer, plan.nodeStates, context)

        // Update progress
        const progress = Math.round(((layerIndex + 1) / plan.executionOrder.length) * 100)
        context.updateProgress(progress, {
          timestamp: new Date().toISOString(),
          event: 'layer_completed',
          details: {
            layer: layerIndex + 1,
            totalLayers: plan.executionOrder.length,
            nodesCompleted: layer.length
          }
        })
      }

      // Build final result
      const endTime = Date.now()
      const executionTime = endTime - startTime

      // Get output from output nodes
      const outputNodes = workflow.nodes.filter(n => n.type === 'output')
      const outputs: any = {}

      for (const outputNode of outputNodes) {
        const result = context.getNodeResult(outputNode.id)
        if (result) {
          outputs[outputNode.id] = result.output
        }
      }

      // Build timeline
      const timeline = this.buildTimeline(context)

      const result: WorkflowExecutionResult = {
        executionId: context.executionId,
        workflowId: workflow.workflowId,
        status: ExecutionStatus.COMPLETED,
        input,
        output: outputs,
        startTime,
        endTime,
        executionTime,
        nodeResults: context.getAllNodeResults(),
        timeline,
        metadata: this.calculateMetadata(plan.nodeStates)
      }

      this.log(context, 'info', 'Workflow execution completed', {
        executionTime,
        status: result.status,
        metadata: result.metadata
      })

      return result
    } catch (error) {
      const endTime = Date.now()
      const executionTime = endTime - startTime

      this.log(context, 'error', 'Workflow execution failed', {
        error: error instanceof Error ? error.message : String(error),
        executionTime
      })

      return {
        executionId: context.executionId,
        workflowId: workflow.workflowId,
        status: ExecutionStatus.FAILED,
        input,
        output: null,
        error: error as Error,
        startTime,
        endTime,
        executionTime,
        nodeResults: context.getAllNodeResults(),
        timeline: this.buildTimeline(context),
        metadata: {
          totalNodes: workflow.nodes.length,
          completedNodes: Array.from(context.nodeResults.values()).filter(
            r => r.status === ExecutionStatus.COMPLETED
          ).length,
          failedNodes: Array.from(context.nodeResults.values()).filter(
            r => r.status === ExecutionStatus.FAILED
          ).length,
          skippedNodes: 0
        }
      }
    } finally {
      this.abortController = null
      context.cleanup()
    }
  }

  /**
   * Cancel workflow execution
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  /**
   * Create execution plan with topological sort
   */
  private createExecutionPlan(workflow: WorkflowDefinition): ExecutionPlan {
    // Build adjacency list and in-degree count
    const adjacencyList = this.buildAdjacencyList(workflow)
    const inDegree = this.calculateInDegrees(workflow)

    // Topological sort using Kahn's algorithm
    const executionOrder: string[][] = []
    const queue: string[] = []
    const nodeStates = new Map<string, NodeExecutionState>()

    // Initialize node states and find nodes with no dependencies
    for (const node of workflow.nodes) {
      nodeStates.set(node.id, {
        nodeId: node.id,
        status: ExecutionStatus.PENDING,
        dependencies: this.getNodeDependencies(workflow, node.id),
        dependents: this.getNodeDependents(workflow, node.id),
        retryCount: 0
      })

      if (inDegree.get(node.id) === 0) {
        queue.push(node.id)
      }
    }

    // Process nodes in layers
    while (queue.length > 0) {
      const layerSize = queue.length
      const currentLayer: string[] = []

      // Process all nodes in current layer
      for (let i = 0; i < layerSize; i++) {
        const nodeId = queue.shift()!
        currentLayer.push(nodeId)

        // Reduce in-degree for dependents
        const dependents = nodeStates.get(nodeId)!.dependents
        for (const dependentId of dependents) {
          const newInDegree = (inDegree.get(dependentId) || 0) - 1
          inDegree.set(dependentId, newInDegree)

          if (newInDegree === 0) {
            queue.push(dependentId)
          }
        }
      }

      executionOrder.push(currentLayer)
    }

    // Check for cycles (should not happen if validation passed)
    if (executionOrder.flat().length !== workflow.nodes.length) {
      throw new Error('Cycle detected in workflow DAG')
    }

    // Estimate time (simple heuristic: 100ms per node)
    const estimatedTime = workflow.nodes.length * 100

    return {
      executionOrder,
      nodeStates,
      estimatedTime,
      estimatedCost: 0
    }
  }

  /**
   * Execute a layer of nodes in parallel
   */
  private async executeLayer(
    workflow: WorkflowDefinition,
    layerNodeIds: string[],
    nodeStates: Map<string, NodeExecutionState>,
    context: ExecutionContext
  ): Promise<void> {
    // Execute all nodes in layer in parallel
    const executions = layerNodeIds.map(nodeId =>
      this.executeNode(workflow, nodeId, nodeStates, context)
    )

    // Wait for all nodes in layer to complete
    await Promise.all(executions)
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    workflow: WorkflowDefinition,
    nodeId: string,
    nodeStates: Map<string, NodeExecutionState>,
    context: ExecutionContext
  ): Promise<void> {
    const node = workflow.nodes.find(n => n.id === nodeId)!
    const nodeState = nodeStates.get(nodeId)!

    this.log(context, 'debug', `Executing node: ${nodeId}`, {
      nodeType: node.type,
      nodeName: node.name
    })

    // Update node state
    nodeState.status = ExecutionStatus.RUNNING

    try {
      // Gather input from dependencies
      const input = this.gatherNodeInput(workflow, node, context)

      // Validate input if schema exists
      if (node.inputSchema) {
        const executor = createBlockExecutor(node.type)
        const isValid = await executor.validateInput(input, node.inputSchema)

        if (!isValid) {
          throw new Error(`Input validation failed for node ${nodeId}`)
        }
      }

      // Create block executor
      const executor = createBlockExecutor(node.type)

      // Execute block with timeout and retry
      const timeout = node.timeout || workflow.globals?.timeout || 60000
      const retryConfig = node.retryConfig || workflow.globals?.retryPolicy

      let result: ExecutionResult

      if (retryConfig) {
        result = await this.executeWithRetry(
          executor,
          node.config,
          input,
          context,
          timeout,
          retryConfig.maxRetries,
          retryConfig.initialDelay,
          retryConfig.backoffMultiplier
        )
      } else {
        result = await this.executeWithTimeout(
          executor,
          node.config,
          input,
          context,
          timeout
        )
      }

      // Validate output if schema exists
      if (node.outputSchema && result.status === ExecutionStatus.COMPLETED) {
        const isValid = await executor.validateOutput(result.output, node.outputSchema)

        if (!isValid) {
          throw new Error(`Output validation failed for node ${nodeId}`)
        }
      }

      // Store result
      context.setNodeResult(nodeId, result)
      nodeState.result = result
      nodeState.status = result.status

      this.log(context, 'info', `Node completed: ${nodeId}`, {
        status: result.status,
        executionTime: result.executionTime
      })

      // Handle node failure based on error handling strategy
      if (result.status === ExecutionStatus.FAILED) {
        const errorHandling = workflow.globals?.errorHandling || 'stop'

        if (errorHandling === 'stop') {
          throw result.error || new Error(`Node ${nodeId} failed`)
        }
        // If 'continue', mark as failed but don't throw
      }
    } catch (error) {
      const executionTime = Date.now() - (context.startTime || Date.now())

      const failedResult: ExecutionResult = {
        nodeId,
        status: ExecutionStatus.FAILED,
        input: null,
        output: null,
        error: error as Error,
        executionTime,
        retryCount: nodeState.retryCount,
        startTime: Date.now() - executionTime,
        endTime: Date.now(),
        metadata: {},
        logs: []
      }

      context.setNodeResult(nodeId, failedResult)
      nodeState.result = failedResult
      nodeState.status = ExecutionStatus.FAILED

      this.log(context, 'error', `Node failed: ${nodeId}`, {
        error: error instanceof Error ? error.message : String(error)
      })

      throw error
    }
  }

  /**
   * Gather input for a node from its dependencies
   */
  private gatherNodeInput(
    workflow: WorkflowDefinition,
    node: NodeDefinition,
    context: ExecutionContext
  ): any {
    // Find incoming edges
    const incomingEdges = workflow.edges.filter(e => e.target === node.id)

    if (incomingEdges.length === 0) {
      // No dependencies, use workflow input
      return context.getVariable('_input') || {}
    }

    if (incomingEdges.length === 1) {
      // Single dependency, use that node's output
      const sourceNodeId = incomingEdges[0].source
      const sourceResult = context.getNodeResult(sourceNodeId)

      if (!sourceResult) {
        throw new Error(`Source node ${sourceNodeId} has not been executed`)
      }

      return sourceResult.output
    }

    // Multiple dependencies (merge node)
    const mergedInput: any = {}
    for (const edge of incomingEdges) {
      const sourceNodeId = edge.source
      const sourceResult = context.getNodeResult(sourceNodeId)

      if (!sourceResult) {
        throw new Error(`Source node ${sourceNodeId} has not been executed`)
      }

      // Merge using the port name as key
      const portName = edge.sourcePort || 'out'
      mergedInput[portName] = sourceResult.output
    }

    return mergedInput
  }

  /**
   * Execute block with timeout
   */
  private async executeWithTimeout(
    executor: BlockExecutor,
    config: any,
    input: any,
    context: ExecutionContext,
    timeout: number
  ): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<ExecutionResult>((_, reject) =>
        setTimeout(() => reject(new Error(`Execution timeout after ${timeout}ms`)), timeout)
      )

      // Execute with timeout
      const result = await Promise.race([
        executor.execute(config, input, context),
        timeoutPromise
      ])

      return {
        ...result,
        startTime,
        endTime: Date.now()
      }
    } catch (error) {
      return {
        nodeId: 'unknown',
        status: ExecutionStatus.FAILED,
        input,
        output: null,
        error: error as Error,
        executionTime: Date.now() - startTime,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {},
        logs: []
      }
    }
  }

  /**
   * Execute block with retry logic
   */
  private async executeWithRetry(
    executor: BlockExecutor,
    config: any,
    input: any,
    context: ExecutionContext,
    timeout: number,
    maxRetries: number,
    initialDelay: number,
    backoffMultiplier: number
  ): Promise<ExecutionResult> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.executeWithTimeout(executor, config, input, context, timeout)

        if (result.status === ExecutionStatus.COMPLETED) {
          result.retryCount = attempt
          return result
        }

        lastError = result.error
      } catch (error) {
        lastError = error as Error
      }

      // Retry with backoff if not last attempt
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(backoffMultiplier, attempt)
        this.log(context, 'warn', `Retrying after ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries
        })
        await this.sleep(delay)
      }
    }

    // All retries failed
    return {
      nodeId: 'unknown',
      status: ExecutionStatus.FAILED,
      input,
      output: null,
      error: lastError || new Error('Max retries exceeded'),
      executionTime: 0,
      retryCount: maxRetries,
      startTime: Date.now(),
      endTime: Date.now(),
      metadata: {},
      logs: []
    }
  }

  /**
   * Build adjacency list for the workflow graph
   */
  private buildAdjacencyList(workflow: WorkflowDefinition): Map<string, string[]> {
    const adjList = new Map<string, string[]>()

    for (const node of workflow.nodes) {
      adjList.set(node.id, [])
    }

    for (const edge of workflow.edges) {
      const neighbors = adjList.get(edge.source) || []
      neighbors.push(edge.target)
      adjList.set(edge.source, neighbors)
    }

    return adjList
  }

  /**
   * Calculate in-degrees for all nodes
   */
  private calculateInDegrees(workflow: WorkflowDefinition): Map<string, number> {
    const inDegree = new Map<string, number>()

    // Initialize all nodes with 0
    for (const node of workflow.nodes) {
      inDegree.set(node.id, 0)
    }

    // Count incoming edges
    for (const edge of workflow.edges) {
      const currentDegree = inDegree.get(edge.target) || 0
      inDegree.set(edge.target, currentDegree + 1)
    }

    return inDegree
  }

  /**
   * Get node dependencies (incoming edges)
   */
  private getNodeDependencies(workflow: WorkflowDefinition, nodeId: string): string[] {
    return workflow.edges
      .filter(e => e.target === nodeId)
      .map(e => e.source)
  }

  /**
   * Get node dependents (outgoing edges)
   */
  private getNodeDependents(workflow: WorkflowDefinition, nodeId: string): string[] {
    return workflow.edges
      .filter(e => e.source === nodeId)
      .map(e => e.target)
  }

  /**
   * Build timeline from context events
   */
  private buildTimeline(context: ExecutionContext): TimelineEvent[] {
    // Timeline events would be stored in context during execution
    // For now, return empty array
    return []
  }

  /**
   * Calculate execution metadata
   */
  private calculateMetadata(nodeStates: Map<string, NodeExecutionState>): {
    totalNodes: number
    completedNodes: number
    failedNodes: number
    skippedNodes: number
  } {
    let completed = 0
    let failed = 0
    let skipped = 0

    const states = Array.from(nodeStates.values())
    for (const state of states) {
      if (state.status === ExecutionStatus.COMPLETED) completed++
      else if (state.status === ExecutionStatus.FAILED) failed++
      else if (state.status === ExecutionStatus.SKIPPED) skipped++
    }

    return {
      totalNodes: nodeStates.size,
      completedNodes: completed,
      failedNodes: failed,
      skippedNodes: skipped
    }
  }

  /**
   * Log message
   */
  private log(
    context: ExecutionContext,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    meta?: any
  ): void {
    const logger = context?.logger
    if (logger && typeof logger[level] === 'function') {
      logger[level](message, meta)
    } else {
      console.log(`[Orchestrator] ${message}`, meta || '')
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Global orchestrator instance
 */
export const workflowOrchestrator = new WorkflowOrchestrator()
