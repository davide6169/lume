/**
 * Execution Tracking Service
 *
 * Tracks workflow executions, block executions, and timeline events
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type {
  WorkflowExecutionDB,
  CreateWorkflowExecutionInput,
  ExecutionQueryOptions,
  BlockExecutionDB,
  CreateBlockExecutionInput,
  TimelineEventDB,
  CreateTimelineEventInput
} from './models'

export class ExecutionTrackingService {
  private supabase: SupabaseClient
  private tenantId: string | null

  constructor(supabaseUrl: string, supabaseKey: string, tenantId?: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.tenantId = tenantId || null
  }

  // ============================================
  // Workflow Execution Operations
  // ============================================

  /**
   * Create a new workflow execution
   */
  async createExecution(input: CreateWorkflowExecutionInput): Promise<WorkflowExecutionDB> {
    const dbInput = {
      ...input,
      tenant_id: this.tenantId
    }

    const { data, error } = await this.supabase
      .from('workflow_executions')
      .insert(dbInput)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create execution: ${error.message}`)
    }

    return data as WorkflowExecutionDB
  }

  /**
   * Get execution by ID
   */
  async getExecutionById(id: string): Promise<WorkflowExecutionDB | null> {
    const { data, error } = await this.supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get execution: ${error.message}`)
    }

    return data as WorkflowExecutionDB
  }

  /**
   * Get execution by execution_id
   */
  async getExecutionByExecutionId(executionId: string): Promise<WorkflowExecutionDB | null> {
    const { data, error } = await this.supabase
      .from('workflow_executions')
      .select('*')
      .eq('execution_id', executionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get execution: ${error.message}`)
    }

    return data as WorkflowExecutionDB
  }

  /**
   * List executions with filters
   */
  async listExecutions(options: ExecutionQueryOptions = {}): Promise<WorkflowExecutionDB[]> {
    let query = this.supabase
      .from('workflow_executions')
      .select('*')

    // Apply filters
    if (options.workflow_id) {
      query = query.eq('workflow_id', options.workflow_id)
    }

    if (options.status) {
      query = query.eq('status', options.status)
    }

    if (options.mode) {
      query = query.eq('mode', options.mode)
    }

    if (options.source_audience_id) {
      query = query.eq('source_audience_id', options.source_audience_id)
    }

    if (options.shared_audience_id) {
      query = query.eq('shared_audience_id', options.shared_audience_id)
    }

    if (this.tenantId) {
      query = query.eq('tenant_id', this.tenantId)
    }

    // Ordering
    const orderBy = options.order_by || 'started_at'
    const orderDirection = options.order_direction || 'DESC'
    query = query.order(orderBy, { ascending: orderDirection === 'ASC' })

    // Limit
    const limit = Math.min(options.limit || 50, 100)
    query = query.limit(limit)

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to list executions: ${error.message}`)
    }

    return (data || []) as WorkflowExecutionDB[]
  }

  /**
   * Update execution status and progress
   */
  async updateExecution(
    executionId: string,
    updates: Partial<Omit<WorkflowExecutionDB, 'id' | 'workflow_id' | 'execution_id' | 'started_at'>>
  ): Promise<WorkflowExecutionDB> {
    // Calculate execution time if completing
    if (updates.status === 'completed' || updates.status === 'failed') {
      if (!updates.completed_at) {
        updates.completed_at = new Date().toISOString()
      }
    }

    const { data, error } = await this.supabase
      .from('workflow_executions')
      .update(updates)
      .eq('execution_id', executionId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update execution: ${error.message}`)
    }

    return data as WorkflowExecutionDB
  }

  /**
   * Update execution progress
   */
  async updateProgress(executionId: string, progress: number): Promise<void> {
    await this.updateExecution(executionId, {
      progress_percentage: progress
    })
  }

  /**
   * Set execution status
   */
  async setExecutionStatus(
    executionId: string,
    status: WorkflowExecutionDB['status'],
    error?: { message: string; stack?: string }
  ): Promise<void> {
    const updates: Partial<WorkflowExecutionDB> = {
      status
    }

    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString()
    }

    if (error) {
      updates.error_message = error.message
      updates.error_stack = error.stack
    }

    await this.updateExecution(executionId, updates)
  }

  // ============================================
  // Block Execution Operations
  // ============================================

  /**
   * Create a block execution record
   */
  async createBlockExecution(input: CreateBlockExecutionInput): Promise<BlockExecutionDB> {
    const dbInput = {
      ...input,
      tenant_id: this.tenantId
    }

    const { data, error } = await this.supabase
      .from('block_executions')
      .insert(dbInput)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create block execution: ${error.message}`)
    }

    return data as BlockExecutionDB
  }

  /**
   * Update block execution
   */
  async updateBlockExecution(
    blockExecutionId: string,
    updates: Partial<Omit<BlockExecutionDB, 'id' | 'workflow_execution_id' | 'started_at'>>
  ): Promise<BlockExecutionDB> {
    // Calculate execution time if completing
    if (updates.status === 'completed' || updates.status === 'failed') {
      if (!updates.completed_at) {
        updates.completed_at = new Date().toISOString()
      }
    }

    const { data, error } = await this.supabase
      .from('block_executions')
      .update(updates)
      .eq('id', blockExecutionId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update block execution: ${error.message}`)
    }

    return data as BlockExecutionDB
  }

  /**
   * Get block executions for a workflow execution
   */
  async getBlockExecutions(workflowExecutionId: string): Promise<BlockExecutionDB[]> {
    const { data, error } = await this.supabase
      .from('block_executions')
      .select('*')
      .eq('workflow_execution_id', workflowExecutionId)
      .order('started_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to get block executions: ${error.message}`)
    }

    return (data || []) as BlockExecutionDB[]
  }

  /**
   * Get block execution by node ID
   */
  async getBlockExecutionByNodeId(
    workflowExecutionId: string,
    nodeId: string
  ): Promise<BlockExecutionDB | null> {
    const { data, error } = await this.supabase
      .from('block_executions')
      .select('*')
      .eq('workflow_execution_id', workflowExecutionId)
      .eq('node_id', nodeId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get block execution: ${error.message}`)
    }

    return data as BlockExecutionDB
  }

  // ============================================
  // Timeline Events Operations
  // ============================================

  /**
   * Create a timeline event
   */
  async createTimelineEvent(input: CreateTimelineEventInput): Promise<TimelineEventDB> {
    const dbInput = {
      ...input,
      tenant_id: this.tenantId
    }

    const { data, error } = await this.supabase
      .from('workflow_timeline_events')
      .insert(dbInput)
      .select()
      .single()

    if (error) {
      // Don't throw error for timeline events, just log
      console.warn('[ExecutionTracking] Failed to create timeline event:', error.message)
      return null as any
    }

    return data as TimelineEventDB
  }

  /**
   * Get timeline events for a workflow execution
   */
  async getTimelineEvents(workflowExecutionId: string): Promise<TimelineEventDB[]> {
    const { data, error } = await this.supabase
      .from('workflow_timeline_events')
      .select('*')
      .eq('workflow_execution_id', workflowExecutionId)
      .order('timestamp', { ascending: true })

    if (error) {
      throw new Error(`Failed to get timeline events: ${error.message}`)
    }

    return (data || []) as TimelineEventDB[]
  }

  /**
   * Get timeline events for a block execution
   */
  async getTimelineEventsForBlock(blockExecutionId: string): Promise<TimelineEventDB[]> {
    const { data, error } = await this.supabase
      .from('workflow_timeline_events')
      .select('*')
      .eq('block_execution_id', blockExecutionId)
      .order('timestamp', { ascending: true })

    if (error) {
      throw new Error(`Failed to get timeline events: ${error.message}`)
    }

    return (data || []) as TimelineEventDB[]
  }

  // ============================================
  // Batch Operations
  // ============================================

  /**
   * Create multiple timeline events in batch
   */
  async createTimelineEventsBatch(events: CreateTimelineEventInput[]): Promise<void> {
    const dbEvents = events.map(event => ({
      ...event,
      tenant_id: this.tenantId
    }))

    const { error } = await this.supabase
      .from('workflow_timeline_events')
      .insert(dbEvents)

    if (error) {
      console.warn('[ExecutionTracking] Failed to create timeline events batch:', error.message)
    }
  }

  /**
   * Update multiple block executions in batch
   */
  async updateBlockExecutionsBatch(
    updates: Array<{ id: string } & Partial<Omit<BlockExecutionDB, 'id' | 'workflow_execution_id' | 'started_at'>>>
  ): Promise<void> {
    // Supabase doesn't support batch updates directly, so we do them sequentially
    for (const update of updates) {
      try {
        await this.supabase
          .from('block_executions')
          .update(update)
          .eq('id', update.id)
      } catch (error) {
        console.warn(`[ExecutionTracking] Failed to update block execution ${update.id}:`, error)
      }
    }
  }

  // ============================================
  // Cleanup Operations
  // ============================================

  /**
   * Delete old executions (for maintenance)
   */
  async deleteOldExecutions(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    // First count the executions to be deleted
    const { count: countToDelete } = await this.supabase
      .from('workflow_executions')
      .select('id', { count: 'exact', head: true })
      .lt('started_at', cutoffDate.toISOString())

    // Then delete them
    const { error } = await this.supabase
      .from('workflow_executions')
      .delete()
      .lt('started_at', cutoffDate.toISOString())

    if (error) {
      throw new Error(`Failed to delete old executions: ${error.message}`)
    }

    return countToDelete || 0
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(workflowId?: string): Promise<{
    total: number
    completed: number
    failed: number
    running: number
    avg_execution_time_ms: number
  }> {
    let query = this.supabase
      .from('workflow_executions')
      .select('status, execution_time_ms')

    if (workflowId) {
      query = query.eq('workflow_id', workflowId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get execution stats: ${error.message}`)
    }

    const executions = (data || []) as any[]
    const total = executions.length
    const completed = executions.filter(e => e.status === 'completed').length
    const failed = executions.filter(e => e.status === 'failed').length
    const running = executions.filter(e => e.status === 'running').length

    const completedExecutions = executions.filter(e => e.status === 'completed')
    const avgTime = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / completedExecutions.length
      : 0

    return {
      total,
      completed,
      failed,
      running,
      avg_execution_time_ms: Math.round(avgTime)
    }
  }
}
