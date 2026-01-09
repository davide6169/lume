/**
 * CSV Interest Enrichment - WORKFLOW-BASED APPROACH
 *
 * 🎯 DEMONSTRATION: Workflow System vs Monolithic Block
 *
 * This example demonstrates the power of the workflow system by showing
 * how to compose multiple blocks to create a CSV enrichment pipeline.
 *
 * INPUT: CSV with columns (nome, celular, email, nascimento)
 * OUTPUT: CSV with added "interessi" column (comma-separated interests)
 * FILTERING: Only rows where at least one interest was found
 *
 * ============================================================================
 * MONOLITHIC APPROACH (OLD - csv-interest-enrichment-example.ts):
 * - Single CSVInterestEnrichmentBlock does EVERYTHING
 * - Hard to customize individual steps
 * - Difficult to reuse components
 * - Black-box execution
 *
 * WORKFLOW APPROACH (NEW - This Example):
 * - Compose 7+ independent blocks
 * - Each block is reusable in other workflows
 * - Easy to customize/modify individual steps
 * - Transparent execution with full visibility
 * ============================================================================
 *
 * Workflow Architecture:
 *
 *    Input CSV
 *       ↓
 *    Country Detection → Detect country from phone (IT, BR, MX, etc.)
 *       ↓                → Provides cultural context for LLM
 *    Filter Business
 *       ↓
 *    Apollo LinkedIn ────┐
 *    (business only)     │
 *                        ↓
 *    Instagram Search ───┤
 *                        ↓
 *                Merge Results
 *                        ↓
 *    Extract Interests → Country-contextualized LLM
 *                        ↓
 *    Filter Empty → Remove rows without interests
 *                        ↓
 *    Output CSV
 *
 * ============================================================================
 */

import { workflowValidator } from '../validator'
import { registerAllBuiltInBlocks } from '../blocks'
import { registerBlock } from '../registry'
import { StaticInputBlock, LoggerOutputBlock } from '../blocks'
import type { WorkflowDefinition } from '../types'

// Initialize blocks
registerAllBuiltInBlocks()
registerBlock('input.static', StaticInputBlock as any, {
  name: 'Static Input',
  description: 'Input block that returns static data from config',
  category: 'input',
  version: '1.0.0'
})

registerBlock('output.logger', LoggerOutputBlock as any, {
  name: 'Logger Output',
  description: 'Output block that logs data to console',
  category: 'output',
  version: '1.0.0'
})

// ============================================================
// CSV HELPER FUNCTIONS
// ============================================================

function parseCSV(csvContent: string): { headers: string[]; rows: any[] } {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(';').map(h => h.trim())

  const rows = lines.slice(1).map(line => {
    const values = line.split(';').map(v => v.trim())
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    return row
  })

  return { headers, rows }
}

// ============================================================
// SAMPLE INPUT DATA
// ============================================================

const sampleCSV = `nome;celular;email;nascimento
Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986
Luca Bianchi;3282345678;luca.bianchi@mydomain.com;27/01/1983
Giuseppe Verdi;3273456789;giuseppe.verdi@mydomain.com;
Marco Ferrari;+39 333 4445555;marco.ferrari@azienda.it;15/06/1990
Giulia Colombo;+39 334 5556666;giulia.colombo@impresa.it;08/03/1992`

// ============================================================
// WORKFLOW DEFINITION
// ============================================================

const csvInterestEnrichmentWorkflow: WorkflowDefinition = {
  $schema: 'https://lume.ai/workflow-schema.json',
  workflowId: 'csv-interest-enrichment-workflow',
  name: 'CSV Interest Enrichment (Workflow-Based)',
  version: 1,
  description: 'Enrich CSV with interests field using composed blocks. Demonstrates workflow system power vs monolithic approach.',
  metadata: {
    author: 'Lume Team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['csv', 'enrichment', 'interests', 'workflow-demo'],
    version: 1
  },
  nodes: [
    {
      id: 'input-csv',
      type: 'input.static',
      name: 'CSV Input',
      description: 'Load CSV with demographic data',
      config: { data: '{{input.csv}}' },
      inputSchema: { type: 'object' },
      outputSchema: { type: 'object' }
    },
    {
      id: 'detect-country',
      type: 'countries.config',
      name: 'Country Detection',
      description: 'Auto-detect country from phone number',
      config: {
        phoneField: 'celular',
        emailField: 'email',
        fallbackCountry: 'IT'
      },
      inputSchema: { type: 'array' },
      outputSchema: { type: 'array' }
    },
    {
      id: 'filter-business',
      type: 'filter',
      name: 'Filter Business Emails',
      description: 'Identify business emails for LinkedIn enrichment',
      config: {
        conditions: [
          { operator: 'and', conditions: [
            { field: 'email', operator: 'not_contains', value: '@gmail' },
            { field: 'email', operator: 'not_contains', value: '@yahoo' }
          ]}
        ],
        onFail: 'skip'
      },
      inputSchema: { type: 'array' },
      outputSchema: { type: 'array' }
    },
    {
      id: 'apollo-enrichment',
      type: 'api.apollo',
      name: 'LinkedIn Enrichment',
      description: 'Enrich with LinkedIn data via Apollo',
      config: {
        apiKey: '{{secrets.apollo}}',
        emailField: 'email'
      },
      inputSchema: { type: 'array' },
      outputSchema: { type: 'array' }
    },
    {
      id: 'instagram-search',
      type: 'api.apify',
      name: 'Instagram Search',
      description: 'Search Instagram profile',
      config: {
        apiToken: '{{secrets.apify}}',
        actor: 'apify/instagram-search-scraper'
      },
      inputSchema: { type: 'array' },
      outputSchema: { type: 'array' }
    },
    {
      id: 'extract-interests',
      type: 'ai.interestInference',
      name: 'Extract Interests',
      description: 'Extract interests using country-contextualized LLM',
      config: {
        apiToken: '{{secrets.openrouter}}',
        bioField: 'bio',
        countryField: 'country',
        model: 'google/gemma-2-27b-it:free',
        maxInterests: 10
      },
      inputSchema: { type: 'array' },
      outputSchema: { type: 'array' }
    },
    {
      id: 'filter-empty',
      type: 'filter',
      name: 'Remove Empty Interests',
      description: 'Keep only rows with interests',
      config: {
        conditions: [
          { field: 'interessi', operator: 'exists' },
          { field: 'interessi', operator: 'not_equals', value: '' }
        ],
        onFail: 'skip'
      },
      inputSchema: { type: 'array' },
      outputSchema: { type: 'array' }
    },
    {
      id: 'output-logger',
      type: 'output.logger',
      name: 'Output CSV',
      description: 'Output enriched CSV',
      config: {},
      inputSchema: { type: 'object' },
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-csv', target: 'detect-country' },
    { id: 'e2', source: 'detect-country', target: 'filter-business' },
    { id: 'e3', source: 'filter-business', target: 'apollo-enrichment' },
    { id: 'e4', source: 'detect-country', target: 'instagram-search' },
    { id: 'e5', source: 'instagram-search', target: 'extract-interests' },
    { id: 'e6', source: 'extract-interests', target: 'filter-empty' },
    { id: 'e7', source: 'filter-empty', target: 'output-logger' }
  ],
  globals: {
    timeout: 300,
    errorHandling: 'continue',
    maxParallelNodes: 3
  }
}

// ============================================================
// DEMONSTRATION
// ============================================================

async function demonstrateWorkflowApproach() {
  console.log('\n' + '='.repeat(80))
  console.log('  CSV INTEREST ENRICHMENT - WORKFLOW-BASED APPROACH')
  console.log('  Demonstrating the Power of Composed Blocks')
  console.log('='.repeat(80) + '\n')

  // Parse input
  const { headers, rows } = parseCSV(sampleCSV)

  console.log('📄 INPUT CSV:')
  console.log(`Headers: ${headers.join(', ')}`)
  console.log(`Rows: ${rows.length} contacts\n`)

  rows.forEach((row, i) => {
    console.log(`${i + 1}. ${row.nome} | ${row.email} | ${row.celular}`)
  })

  console.log('\n' + '─'.repeat(80) + '\n')

  // Validate workflow
  const validation = await workflowValidator.validate(csvInterestEnrichmentWorkflow)

  if (!validation.valid) {
    console.error('❌ Workflow validation failed:')
    validation.errors.forEach(err => {
      console.error(`   - ${err.message}`)
    })
    return
  }

  console.log('✅ Workflow Definition Valid!')
  console.log(`   Nodes: ${csvInterestEnrichmentWorkflow.nodes.length}`)
  console.log(`   Edges: ${csvInterestEnrichmentWorkflow.edges.length}\n`)

  // Show workflow architecture
  console.log('🏗️  WORKFLOW ARCHITECTURE:')
  console.log('─'.repeat(80))
  console.log(`
  1. Input CSV (input.static)
     ↓
  2. Country Detection (countries.config)
     → Detects country from phone (IT, BR, MX, etc.)
     → Provides cultural context for LLM
     ↓
  3. Filter Business Emails (filter)
     → Separates business vs personal emails
     ↓
     ├─→ 4a. Apollo LinkedIn (api.apollo)
     │       → For business emails only
     │
     └─→ 4b. Instagram Search (api.apify)
             → Gets bio and posts
             ↓
          5. Extract Interests (ai.interestInference)
             → Country-contextualized LLM
             ↓
          6. Filter Empty (filter)
             → Only rows with interests
             ↓
          7. Output CSV
`)

  // Show block reusability
  console.log('🧩 BLOCK REUSABILITY:')
  console.log('─'.repeat(80))
  console.log(`
These SAME blocks can be reused in OTHER workflows:

1. countries.config
   → Here: Detect country from phone
   → Also for: Localized content, Format validation, Business rules

2. filter
   → Here: Filter business emails
   → Also for: Data cleaning, Sentiment filtering, Lead scoring

3. api.apollo
   → Here: LinkedIn enrichment
   → Also for: B2B enrichment, Company lookup, Verification

4. ai.interestInference
   → Here: Extract interests from bio
   → Also for: Social analysis, Recommendations, Segmentation
`)

  // Comparison
  console.log('💡 WORKFLOW vs MONOLITHIC:')
  console.log('─'.repeat(80))
  console.log(`
MONOLITHIC (csv-interest-enrichment-example.ts):
  ┌────────────────────────────────────────────┐
  │  CSVInterestEnrichmentBlock                 │
  │  ❌ Single black-box does EVERYTHING        │
  │  ❌ Cannot customize individual steps       │
  │  ❌ Cannot reuse components                 │
  │  ❌ Hard to debug                           │
  │  ❌ Tightly coupled                         │
  └────────────────────────────────────────────┘

WORKFLOW (This Example):
  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
  │Input │→→│Country│→→│Filter│→→│ ...  │→
  └──────┘  └──────┘  └──────┘  └──────┘

  ✅ 7+ independent, reusable blocks
  ✅ Each step customizable
  ✅ Blocks reusable in other workflows
  ✅ Full visibility
  ✅ Composable architecture
`)

  // Key insight
  console.log('🎯 KEY INSIGHT:')
  console.log('─'.repeat(80))
  console.log(`
Instead of writing NEW code for each use case, REUSE blocks:

  Social Media Analysis:
    Input → Contact Extraction → Interest Inference → Output

  Lead Enrichment:
    Input → Country → Filter → Apollo → AI → Output

  Data Validation:
    Input → Country → Validate → Format → Output

⏱️  Time: Hours → Minutes
🐛  Fixes: Apply once, benefit everywhere
📚  Docs: Document once, reuse everywhere
`)

  console.log('='.repeat(80))
  console.log('  ✅ DEMONSTRATION COMPLETE')
  console.log('='.repeat(80))
  console.log(`
This is a CONCEPTUAL example demonstrating workflow architecture.

For EXECUTABLE examples, see:
  - block-reusability-examples.ts (demonstrates block reuse)
  - workflow-templates.ts (ready-to-use workflows)
  - csv-interest-enrichment-example.ts (monolithic comparison)

To EXECUTE this workflow:
  1. Configure API keys (secrets)
  2. Ensure all blocks are properly configured
  3. Use workflowOrchestrator.execute() with proper input
`)
}

// Run demonstration
async function main() {
  try {
    await demonstrateWorkflowApproach()
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export {
  csvInterestEnrichmentWorkflow,
  demonstrateWorkflowApproach,
  parseCSV
}
