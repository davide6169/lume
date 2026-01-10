/**
 * Direct PostgreSQL migration for workflow engine tables
 */

import { config } from 'dotenv'
import pg from 'pg'
const { Client } = pg

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Extract project ref from Supabase URL
// Format: https://bbxongytwkvntipmneyi.supabase.co
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!projectRef) {
  console.error('Could not extract project ref from Supabase URL')
  process.exit(1)
}

// Construct PostgreSQL connection string
// The database password for Supabase is usually in the service role key or needs to be retrieved
// Let's try using the pooler connection
const connectionString = `postgresql://postgres.${projectRef}:${supabaseKey}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

async function runMigration() {
  const client = new Client({ connectionString })

  try {
    console.log('🔄 Connecting to Supabase PostgreSQL...')
    await client.connect()
    console.log('✅ Connected!')

    // SQL to create tables
    const sql = `
-- Create workflows table
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_executed_at TIMESTAMPTZ,
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0
);

-- Create workflow_executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL,
  execution_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'skipped')),
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  error_stack TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  progress_percentage INTEGER DEFAULT 0,
  progress_event TEXT,
  mode TEXT DEFAULT 'production' CHECK (mode IN ('production', 'demo', 'test')),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create block_executions table
CREATE TABLE IF NOT EXISTS block_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_id UUID NOT NULL,
  node_id TEXT NOT NULL,
  block_type TEXT NOT NULL,
  block_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'skipped')),
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  error_stack TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflows_workflow_id ON workflows(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_execution_id ON workflow_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_block_executions_workflow_execution_id ON block_executions(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_block_executions_block_type ON block_executions(block_type);

-- Disable RLS for CLI/service operations
ALTER TABLE workflows DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions DISABLE ROW LEVEL SECURITY;
ALTER TABLE block_executions DISABLE ROW LEVEL SECURITY;
`

    console.log('🔄 Creating tables and indexes...')
    await client.query(sql)
    console.log('✅ Tables created successfully!')

    // Verify tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('workflows', 'workflow_executions', 'block_executions')
      ORDER BY table_name;
    `)

    console.log('\n✅ Verified tables:')
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`)
    })

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)

    if (error.message.includes('password') || error.code === '28P01') {
      console.log('\n💡 The service role key is not the database password.')
      console.log('📝 Please get the database password from:')
      console.log('   Supabase Dashboard > Project Settings > Database > Connection String')
    }

    throw error
  } finally {
    await client.end()
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ Migration completed successfully!')
    console.log('\n💡 You can now use the workflow CLI:')
    console.log('   npm run workflow -- list')
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error.message)
    console.log('\n📝 Manual steps:')
    console.log('1. Get database password from Supabase Dashboard')
    console.log('2. Run the SQL from supabase/migrations/003_workflows_schema.sql manually')
    process.exit(1)
  })
