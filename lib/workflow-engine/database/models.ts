/**
 * Database Models - Workflow Engine
 *
 * TypeScript types corresponding to database schema
 * These represent the tables created in migration 003_workflows_schema.sql
 */

/**
 * Workflow database model
 */
export interface WorkflowDB {
  id: string
  workflow_id: string
  name: string
  description?: string
  version: number
  definition: any // WorkflowDefinition as JSON
  is_active: boolean
  category?: string
  tags?: string[]
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  last_executed_at?: string
  total_executions: number
  successful_executions: number
  failed_executions: number
  created_by?: string
  tenant_id?: string
}

/**
 * Workflow execution database model
 */
export interface WorkflowExecutionDB {
  id: string
  workflow_id: string
  execution_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'skipped'
  input_data?: any
  output_data?: any
  error_message?: string
  error_stack?: string
  started_at: string
  completed_at?: string
  execution_time_ms?: number
  progress_percentage: number
  mode: 'production' | 'demo' | 'test'
  metadata: Record<string, any>
  source_audience_id?: string
  shared_audience_id?: string
  tenant_id?: string
}

/**
 * Block execution database model
 */
export interface BlockExecutionDB {
  id: string
  workflow_execution_id: string
  node_id: string
  block_type: string
  block_name?: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'skipped'
  input_data?: any
  output_data?: any
  error_message?: string
  error_stack?: string
  started_at: string
  completed_at?: string
  execution_time_ms?: number
  retry_count: number
  metadata: Record<string, any>
  tenant_id?: string
}

/**
 * Timeline event database model
 */
export interface TimelineEventDB {
  id: string
  workflow_execution_id: string
  block_execution_id?: string
  event: string
  event_type?: string
  details: Record<string, any>
  node_id?: string
  block_type?: string
  error_message?: string
  timestamp: string
  tenant_id?: string
}

/**
 * Workflow template database model
 */
export interface WorkflowTemplateDB {
  id: string
  template_id: string
  name: string
  description?: string
  category?: string
  definition: any // WorkflowDefinition as JSON
  tags?: string[]
  is_system_template: boolean
  is_public: boolean
  version: string
  author_name?: string
  author_email?: string
  usage_count: number
  created_at: string
  updated_at: string
  created_by?: string
  tenant_id?: string
}

/**
 * Input types for database operations
 */

export type CreateWorkflowInput = Omit<WorkflowDB, 'id' | 'created_at' | 'updated_at' | 'last_executed_at' | 'total_executions' | 'successful_executions' | 'failed_executions'>

export type UpdateWorkflowInput = Partial<Omit<WorkflowDB, 'id' | 'created_at' | 'workflow_id'>>

export type CreateWorkflowExecutionInput = Omit<WorkflowExecutionDB, 'id' | 'started_at'>

export type CreateBlockExecutionInput = Omit<BlockExecutionDB, 'id' | 'started_at'>

export type CreateTimelineEventInput = Omit<TimelineEventDB, 'id' | 'timestamp'>

export type CreateWorkflowTemplateInput = Omit<WorkflowTemplateDB, 'id' | 'created_at' | 'updated_at' | 'usage_count'>

/**
 * Query options and filters
 */
export interface WorkflowQueryOptions {
  is_active?: boolean
  category?: string
  tags?: string[]
  limit?: number
  offset?: number
  order_by?: 'created_at' | 'updated_at' | 'name' | 'total_executions'
  order_direction?: 'ASC' | 'DESC'
}

export interface ExecutionQueryOptions {
  workflow_id?: string
  status?: string
  mode?: 'production' | 'demo' | 'test'
  source_audience_id?: string
  shared_audience_id?: string
  limit?: number
  offset?: number
  order_by?: 'started_at' | 'completed_at' | 'execution_time_ms'
  order_direction?: 'ASC' | 'DESC'
}

export interface TemplateQueryOptions {
  category?: string
  is_public?: boolean
  is_system_template?: boolean
  tags?: string[]
  limit?: number
  offset?: number
  order_by?: 'created_at' | 'updated_at' | 'usage_count' | 'name'
  order_direction?: 'ASC' | 'DESC'
}

/**
 * Pagination response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  count: number
  has_more: boolean
  limit: number
  offset: number
}
