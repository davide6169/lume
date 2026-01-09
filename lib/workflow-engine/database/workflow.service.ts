/**
 * Workflow Service - Database Operations
 *
 * Handles CRUD operations for workflows, executions, and templates
 * using Supabase client
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type {
  WorkflowDB,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  WorkflowQueryOptions,
  PaginatedResponse
} from './models'

export class WorkflowService {
  private supabase: SupabaseClient
  private tenantId: string | null

  constructor(supabaseUrl: string, supabaseKey: string, tenantId?: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.tenantId = tenantId || null
  }

  // ============================================
  // Workflow CRUD Operations
  // ============================================

  /**
   * Create a new workflow
   */
  async createWorkflow(input: CreateWorkflowInput): Promise<WorkflowDB> {
    const dbInput = {
      ...input,
      tenant_id: this.tenantId
    }

    const { data, error } = await this.supabase
      .from('workflows')
      .insert(dbInput)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create workflow: ${error.message}`)
    }

    return data as WorkflowDB
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(id: string): Promise<WorkflowDB | null> {
    const { data, error } = await this.supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to get workflow: ${error.message}`)
    }

    return data as WorkflowDB
  }

  /**
   * Get workflow by workflow_id
   */
  async getWorkflowByWorkflowId(workflowId: string): Promise<WorkflowDB | null> {
    const { data, error } = await this.supabase
      .from('workflows')
      .select('*')
      .eq('workflow_id', workflowId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to get workflow: ${error.message}`)
    }

    return data as WorkflowDB
  }

  /**
   * List workflows with filters
   */
  async listWorkflows(options: WorkflowQueryOptions = {}): Promise<PaginatedResponse<WorkflowDB>> {
    let query = this.supabase
      .from('workflows')
      .select('*', { count: 'exact' })

    // Apply filters
    if (options.is_active !== undefined) {
      query = query.eq('is_active', options.is_active)
    }

    if (options.category) {
      query = query.eq('category', options.category)
    }

    if (options.tags && options.tags.length > 0) {
      query = query.contains('tags', options.tags)
    }

    if (this.tenantId) {
      query = query.eq('tenant_id', this.tenantId)
    }

    // Ordering
    const orderBy = options.order_by || 'created_at'
    const orderDirection = options.order_direction || 'DESC'
    query = query.order(orderBy, { ascending: orderDirection === 'ASC' })

    // Pagination
    const limit = Math.min(options.limit || 50, 100)
    const offset = options.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to list workflows: ${error.message}`)
    }

    return {
      data: (data || []) as WorkflowDB[],
      count: count || 0,
      has_more: (count || 0) > offset + limit,
      limit,
      offset
    }
  }

  /**
   * Update workflow
   */
  async updateWorkflow(id: string, input: UpdateWorkflowInput): Promise<WorkflowDB> {
    const { data, error } = await this.supabase
      .from('workflows')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update workflow: ${error.message}`)
    }

    return data as WorkflowDB
  }

  /**
   * Update workflow by workflow_id
   */
  async updateWorkflowByWorkflowId(workflowId: string, input: UpdateWorkflowInput): Promise<WorkflowDB> {
    const { data, error } = await this.supabase
      .from('workflows')
      .update(input)
      .eq('workflow_id', workflowId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update workflow: ${error.message}`)
    }

    return data as WorkflowDB
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('workflows')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete workflow: ${error.message}`)
    }
  }

  /**
   * Delete workflow by workflow_id
   */
  async deleteWorkflowByWorkflowId(workflowId: string): Promise<void> {
    const { error } = await this.supabase
      .from('workflows')
      .delete()
      .eq('workflow_id', workflowId)

    if (error) {
      throw new Error(`Failed to delete workflow: ${error.message}`)
    }
  }

  // ============================================
  // Workflow Statistics
  // ============================================

  /**
   * Increment workflow execution stats
   * Note: This is handled automatically by the database trigger 'update_workflow_stats_on_completion'
   * This method is kept for backward compatibility but does nothing
   */
  async incrementWorkflowStats(workflowId: string, success: boolean): Promise<void> {
    // Stats are automatically updated by the database trigger
    // This method is a no-op kept for backward compatibility
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(workflowId: string): Promise<{
    total_executions: number
    successful_executions: number
    failed_executions: number
    success_rate: number
  }> {
    const { data, error } = await this.supabase
      .from('workflows')
      .select('total_executions, successful_executions, failed_executions')
      .eq('workflow_id', workflowId)
      .single()

    if (error) {
      throw new Error(`Failed to get workflow stats: ${error.message}`)
    }

    const stats = data as any
    return {
      total_executions: stats.total_executions || 0,
      successful_executions: stats.successful_executions || 0,
      failed_executions: stats.failed_executions || 0,
      success_rate: stats.total_executions > 0
        ? (stats.successful_executions / stats.total_executions) * 100
        : 0
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Check if workflow exists
   */
  async workflowExists(workflowId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('workflows')
      .select('id')
      .eq('workflow_id', workflowId)
      .limit(1)

    if (error) {
      throw new Error(`Failed to check workflow existence: ${error.message}`)
    }

    return (data || []).length > 0
  }

  /**
   * Activate/deactivate workflow
   */
  async setWorkflowActive(workflowId: string, isActive: boolean): Promise<WorkflowDB> {
    return this.updateWorkflowByWorkflowId(workflowId, {
      is_active: isActive
    })
  }

  /**
   * Clone workflow (create new version)
   */
  async cloneWorkflow(workflowId: string, newName: string): Promise<WorkflowDB> {
    const existing = await this.getWorkflowByWorkflowId(workflowId)
    if (!existing) {
      throw new Error(`Workflow not found: ${workflowId}`)
    }

    const cloned = await this.createWorkflow({
      workflow_id: `${workflowId}-clone-${Date.now()}`,
      name: newName,
      description: existing.description,
      version: existing.version + 1,
      definition: existing.definition,
      is_active: existing.is_active,
      category: existing.category,
      tags: existing.tags,
      metadata: {
        ...existing.metadata,
        cloned_from: workflowId,
        cloned_at: new Date().toISOString()
      }
    })

    return cloned
  }
}
