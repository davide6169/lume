-- ============================================
-- Workflow Engine - Database Schema
-- Migration: 003_workflows_schema.sql
-- ============================================

-- ============================================
-- 1. Workflows Table
-- Stores workflow definitions and metadata
-- ============================================

CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  definition JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  category TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_executed_at TIMESTAMPTZ,

  -- Execution stats
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,

  -- Relationships
  created_by UUID REFERENCES auth.users(id),
  tenant_id UUID,

  -- Indexes
  CONSTRAINT workflows_workflow_id_key UNIQUE (workflow_id)
);

CREATE INDEX idx_workflows_workflow_id ON workflows(workflow_id);
CREATE INDEX idx_workflows_is_active ON workflows(is_active);
CREATE INDEX idx_workflows_category ON workflows(category);
CREATE INDEX idx_workflows_tags ON workflows USING GIN(tags);
CREATE INDEX idx_workflows_created_at ON workflows(created_at DESC);
CREATE INDEX idx_workflows_tenant_id ON workflows(tenant_id);

-- ============================================
-- 2. Workflow Executions Table
-- Stores workflow execution results
-- ============================================

CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL REFERENCES workflows(workflow_id) ON DELETE CASCADE,
  execution_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'skipped')),

  -- Input/Output
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  error_stack TEXT,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,

  -- Progress tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

  -- Metadata
  mode TEXT DEFAULT 'production' CHECK (mode IN ('production', 'demo', 'test')),
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Relationships
  source_audience_id UUID REFERENCES source_audiences(id) ON DELETE SET NULL,
  shared_audience_id UUID REFERENCES shared_audiences(id) ON DELETE SET NULL,
  tenant_id UUID,

  -- Constraints
  CONSTRAINT workflow_executions_execution_id_key UNIQUE (execution_id)
);

CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_execution_id ON workflow_executions(execution_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_started_at ON workflow_executions(started_at DESC);
CREATE INDEX idx_workflow_executions_source_audience_id ON workflow_executions(source_audience_id);
CREATE INDEX idx_workflow_executions_shared_audience_id ON workflow_executions(shared_audience_id);
CREATE INDEX idx_workflow_executions_tenant_id ON workflow_executions(tenant_id);

-- ============================================
-- 3. Block Executions Table
-- Stores detailed execution logs for each block
-- ============================================

CREATE TABLE IF NOT EXISTS block_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,

  -- Block identification
  node_id TEXT NOT NULL,
  block_type TEXT NOT NULL,
  block_name TEXT,

  -- Execution details
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'skipped')),

  -- Input/Output
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  error_stack TEXT,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,

  -- Retry tracking
  retry_count INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Relationships
  tenant_id UUID,

  -- Constraints
  CONSTRAINT block_executions_workflow_execution_id_node_id_unique UNIQUE (workflow_execution_id, node_id)
);

CREATE INDEX idx_block_executions_workflow_execution_id ON block_executions(workflow_execution_id);
CREATE INDEX idx_block_executions_node_id ON block_executions(node_id);
CREATE INDEX idx_block_executions_block_type ON block_executions(block_type);
CREATE INDEX idx_block_executions_status ON block_executions(status);
CREATE INDEX idx_block_executions_started_at ON block_executions(started_at DESC);
CREATE INDEX idx_block_executions_tenant_id ON block_executions(tenant_id);

-- ============================================
-- 4. Timeline Events Table
-- Stores granular timeline events for debugging
-- ============================================

CREATE TABLE IF NOT EXISTS workflow_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  block_execution_id UUID REFERENCES block_executions(id) ON DELETE SET NULL,

  -- Event details
  event TEXT NOT NULL,
  event_type TEXT,
  details JSONB DEFAULT '{}'::jsonb,

  -- Node context
  node_id TEXT,
  block_type TEXT,

  -- Error context
  error_message TEXT,

  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Relationships
  tenant_id UUID
);

CREATE INDEX idx_workflow_timeline_events_workflow_execution_id ON workflow_timeline_events(workflow_execution_id);
CREATE INDEX idx_workflow_timeline_events_block_execution_id ON workflow_timeline_events(block_execution_id);
CREATE INDEX idx_workflow_timeline_events_timestamp ON workflow_timeline_events(timestamp DESC);
CREATE INDEX idx_workflow_timeline_events_event_type ON workflow_timeline_events(event_type);
CREATE INDEX idx_workflow_timeline_events_tenant_id ON workflow_timeline_events(tenant_id);

-- ============================================
-- 5. Workflow Templates Table
-- Stores reusable workflow templates
-- ============================================

CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  definition JSONB NOT NULL,

  -- Metadata
  tags TEXT[],
  is_system_template BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  version TEXT DEFAULT '1.0.0',

  -- Author info
  author_name TEXT,
  author_email TEXT,

  -- Usage stats
  usage_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relationships
  created_by UUID REFERENCES auth.users(id),
  tenant_id UUID
);

CREATE INDEX idx_workflow_templates_template_id ON workflow_templates(template_id);
CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX idx_workflow_templates_is_public ON workflow_templates(is_public);
CREATE INDEX idx_workflow_templates_is_system_template ON workflow_templates(is_system_template);
CREATE INDEX idx_workflow_templates_tags ON workflow_templates USING GIN(tags);
CREATE INDEX idx_workflow_templates_tenant_id ON workflow_templates(tenant_id);

-- ============================================
-- 6. Functions and Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for workflows table
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for workflow_templates table
CREATE TRIGGER update_workflow_templates_updated_at
    BEFORE UPDATE ON workflow_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update workflow execution stats
CREATE OR REPLACE FUNCTION update_workflow_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE workflows
        SET
            total_executions = total_executions + 1,
            successful_executions = successful_executions + 1,
            last_executed_at = NEW.completed_at
        WHERE workflow_id = NEW.workflow_id;
    ELSIF NEW.status = 'failed' THEN
        UPDATE workflows
        SET
            total_executions = total_executions + 1,
            failed_executions = failed_executions + 1,
            last_executed_at = NEW.completed_at
        WHERE workflow_id = NEW.workflow_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update workflow stats on execution completion
CREATE TRIGGER update_workflow_stats_on_completion
    AFTER INSERT OR UPDATE OF status, completed_at
    ON workflow_executions
    FOR EACH ROW
    WHEN (NEW.status IN ('completed', 'failed') AND OLD.status != 'completed')
    EXECUTE FUNCTION update_workflow_stats();

-- ============================================
-- 7. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflows
CREATE POLICY "Users can view their own workflows"
    ON workflows FOR SELECT
    USING (tenant_id = (SELECT id FROM tenants WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own workflows"
    ON workflows FOR INSERT
    WITH CHECK (tenant_id = (SELECT id FROM tenants WHERE id = auth.uid()));

CREATE POLICY "Users can update their own workflows"
    ON workflows FOR UPDATE
    USING (tenant_id = (SELECT id FROM tenants WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own workflows"
    ON workflows FOR DELETE
    USING (tenant_id = (SELECT id FROM tenants WHERE id = auth.uid()));

-- RLS Policies for workflow_executions
CREATE POLICY "Users can view their own executions"
    ON workflow_executions FOR SELECT
    USING (tenant_id = (SELECT id FROM tenants WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own executions"
    ON workflow_executions FOR INSERT
    WITH CHECK (tenant_id = (SELECT id FROM tenants WHERE id = auth.uid()));

-- RLS Policies for block_executions
CREATE POLICY "Users can view their own block executions"
    ON block_executions FOR SELECT
    USING (tenant_id = (SELECT id FROM tenants WHERE id = auth.uid()));

-- RLS Policies for workflow_timeline_events
CREATE POLICY "Users can view their own timeline events"
    ON workflow_timeline_events FOR SELECT
    USING (tenant_id = (SELECT id FROM tenants WHERE id = auth.uid()));

-- RLS Policies for workflow_templates
CREATE POLICY "Everyone can view public templates"
    ON workflow_templates FOR SELECT
    USING (is_public = true OR tenant_id = (SELECT id FROM tenants WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own templates"
    ON workflow_templates FOR INSERT
    WITH CHECK (tenant_id = (SELECT id FROM tenants WHERE id = auth.uid()) OR is_system_template = true);

-- ============================================
-- 8. Insert System Templates
-- ============================================

INSERT INTO workflow_templates (
  template_id,
  name,
  description,
  category,
  definition,
  is_system_template,
  is_public,
  version
) VALUES
(
  'standard-lead-enrichment',
  'Standard Lead Enrichment',
  'Complete lead enrichment pipeline from social URLs to enriched contacts',
  'enrichment',
  '{
    "workflowId": "standard-lead-enrichment",
    "name": "Standard Lead Enrichment",
    "version": 1,
    "nodes": [
      {
        "id": "input",
        "type": "input",
        "name": "Source Audience Input"
      },
      {
        "id": "scrape",
        "type": "api.apify",
        "name": "Apify Scraper"
      },
      {
        "id": "extract",
        "type": "ai.contactExtraction",
        "name": "AI Contact Extraction"
      },
      {
        "id": "enrich",
        "type": "api.apollo",
        "name": "Apollo Enrichment"
      },
      {
        "id": "output",
        "type": "output",
        "name": "Database Output"
      }
    ],
    "edges": [
      {"source": "input", "target": "scrape"},
      {"source": "scrape", "target": "extract"},
      {"source": "extract", "target": "enrich"},
      {"source": "enrich", "target": "output"}
    ]
  }'::jsonb,
  true,
  true,
  '1.0.0'
),
(
  'ai-powered-enrichment',
  'AI-Powered Enrichment',
  'Advanced enrichment with AI contact extraction, interest inference, and sentiment analysis',
  'ai',
  '{
    "workflowId": "ai-powered-enrichment",
    "name": "AI-Powered Enrichment",
    "version": 1,
    "nodes": [
      {
        "id": "input",
        "type": "input",
        "name": "Social Media Comments"
      },
      {
        "id": "extract",
        "type": "ai.contactExtraction",
        "name": "AI Contact Extraction"
      },
      {
        "id": "interests",
        "type": "ai.interestInference",
        "name": "AI Interest Inference"
      },
      {
        "id": "sentiment",
        "type": "ai.sentimentAnalysis",
        "name": "AI Sentiment Analysis"
      },
      {
        "id": "enrich",
        "type": "api.apollo",
        "name": "Apollo Enrichment"
      },
      {
        "id": "output",
        "type": "output",
        "name": "Store Results"
      }
    ],
    "edges": [
      {"source": "input", "target": "extract"},
      {"source": "extract", "target": "interests"},
      {"source": "interests", "target": "sentiment"},
      {"source": "sentiment", "target": "enrich"},
      {"source": "enrich", "target": "output"}
    ]
  }'::jsonb,
  true,
  true,
  '1.0.0'
);

-- ============================================
-- 9. Add Comments for Documentation
-- ============================================

COMMENT ON TABLE workflows IS 'Stores workflow definitions with their configurations and metadata';
COMMENT ON TABLE workflow_executions IS 'Stores workflow execution results and tracking information';
COMMENT ON TABLE block_executions IS 'Stores detailed execution logs for each block in a workflow';
COMMENT ON TABLE workflow_timeline_events IS 'Stores granular timeline events for debugging and monitoring';
COMMENT ON TABLE workflow_templates IS 'Stores reusable workflow templates that can be used as starting points';

COMMENT ON COLUMN workflows.workflow_id IS 'Unique identifier for the workflow (e.g., "lead-enrichment-v1")';
COMMENT ON COLUMN workflows.definition IS 'Complete workflow definition as JSON (nodes, edges, config)';
COMMENT ON COLUMN workflow_executions.execution_id IS 'Unique execution identifier (e.g., "exec_1234567890_abc")';
COMMENT ON COLUMN workflow_executions.source_audience_id IS 'Optional link to source audience that triggered this workflow';
COMMENT ON COLUMN workflow_executions.shared_audience_id IS 'Optional link to resulting shared audience';
COMMENT ON COLUMN block_executions.retry_count IS 'Number of times this block was retried due to errors';
COMMENT ON COLUMN workflow_templates.is_system_template IS 'System templates are read-only templates provided by Lume';
COMMENT ON COLUMN workflow_templates.is_public IS 'Public templates can be used by all tenants';
