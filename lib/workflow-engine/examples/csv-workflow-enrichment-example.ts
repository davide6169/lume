/**
 * CSV Interest Enrichment - WORKFLOW-BASED APPROACH
 *
 * 🎯 DEMONSTRATION: Workflow System vs Monolithic Block
 *
 * This example demonstrates how to compose multiple blocks to create
 * a CSV enrichment pipeline, showcasing the power of the workflow system
 * compared to a single monolithic block.
 *
 * INPUT: CSV with columns (nome, celular, email, nascimento)
 * OUTPUT: CSV with added "interessi" column (comma-separated interests)
 * FILTERING: Only rows where at least one interest was found
 *
 * ============================================================================
 * MONOLITHIC APPROACH (OLD):
 * - Single CSVInterestEnrichmentBlock does EVERYTHING
 * - Hard to customize individual steps
 * - Difficult to reuse components
 * - Black-box execution
 *
 * WORKFLOW APPROACH (NEW):
 * - Compose 7+ independent blocks
 * - Each block is reusable in other workflows
 * - Easy to customize/modify individual steps
 * - Transparent execution with full visibility
 * ============================================================================
 *
 * Workflow Architecture:
 *
 *    ┌─────────────┐
 *    │ 1. Input    │  Load CSV data
 *    │   CSV       │
 *    └──────┬──────┘
 *           │
 *           ▼
 *    ┌─────────────┐
 *    │ 2. Country  │  Detect country from phone (IT, BR, MX, etc.)
 *    │  Detection  │  → Provides cultural context for LLM
 *    └──────┬──────┘
 *           │
 *           ▼
 *    ┌─────────────┐
 *    │ 3. Filter   │  Separate business vs personal emails
 *    │  Email Type │  → Business emails get LinkedIn enrichment
 *    └──────┬──────┘
 *           │
 *           ├───→ [Business Email Path] ───┐
 *           │                              │
 *           │                         ┌────▼────┐
 *           │                         │ 4a.     │  Enrich with LinkedIn
 *           │                         │ Apollo  │  (for business emails only)
 *           │                         └────┬────┘
 *           │                              │
 *           └──────────────────────────────┘
 *                                        │
 *           ┌────────────────────────────┘
 *           │
 *           ▼
 *    ┌─────────────┐
 *    │ 5. Search   │  Search Instagram profile
 *    │ Instagram   │  → Get bio and posts for interest extraction
 *    └──────┬──────┘
 *           │
 *           ▼
 *    ┌─────────────┐
 *    │ 6. Extract  │  Use LLM to extract interests from bio
 *    │  Interests  │  → Country-contextualized prompts
 *    │   (AI)      │  → Italian-optimized model
 *    └──────┬──────┘
 *           │
 *           ▼
 *    ┌─────────────┐
 *    │ 7. Filter   │  Remove rows without interests
 *    │ No Interests│  → Only keep enriched rows
 *    └──────┬──────┘
 *           │
 *           ▼
 *    ┌─────────────┐
 *    │ 8. Output   │  Write enriched CSV
 *    │   CSV       │  → Only rows with interests
 *    └─────────────┘
 *
 * ============================================================================
 */

import { workflowOrchestrator } from '../orchestrator'
import { workflowValidator } from '../validator'
import { ContextFactory } from '../context'
import type { WorkflowDefinition } from '../types'

// ============================================================
// CSV HELPER FUNCTIONS
// ============================================================

/**
 * Parse CSV with semicolon separator
 */
function parseCSV(csvContent: string): {
  headers: string[]
  rows: Array<any>
} {
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

/**
 * Convert enriched data back to CSV
 */
function toCSV(headers: string[], rows: any[]): string {
  // Add "interessi" header if not present
  const outputHeaders = headers.includes('interessi')
    ? headers
    : [...headers, 'interessi']

  // Header row
  const headerRow = outputHeaders.join(';')

  // Data rows
  const dataRows = rows.map(row => {
    return outputHeaders.map(header => {
      const value = row[header]
      // Quote if contains comma, semicolon, or spaces
      if (value && (value.includes(',') || value.includes(';') || value.includes(' '))) {
        return `"${value}"`
      }
      return value || ''
    }).join(';')
  })

  return [headerRow, ...dataRows].join('\n')
}

// ============================================================
// WORKFLOW DEFINITION
// ============================================================

/**
 * CSV Interest Enrichment Workflow
 *
 * This workflow demonstrates composing multiple blocks to create
 * a powerful enrichment pipeline.
 */
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
    // ============================================================
    // NODE 1: Input - Load CSV Data
    // ============================================================
    {
      id: 'input-csv',
      type: 'input',
      name: 'CSV Input',
      description: 'Load CSV with demographic data',
      config: {
        source: 'static'
      },
      inputSchema: {
        type: 'object',
        properties: {
          csv: {
            type: 'object',
            properties: {
              headers: { type: 'array' },
              rows: { type: 'array' }
            }
          }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          headers: { type: 'array' },
          rows: { type: 'array' }
        }
      }
    },

    // ============================================================
    // NODE 2: Country Detection
    // ============================================================
    {
      id: 'detect-country',
      type: 'countries.config',
      name: 'Country Detection',
      description: 'Auto-detect country from phone number for cultural context',
      config: {
        phoneField: 'celular',  // Italian CSV column name
        emailField: 'email',    // Fallback to email domain
        fallbackCountry: 'IT'   // Default to Italy
      },
      inputSchema: {
        type: 'array'
      },
      outputSchema: {
        type: 'array'
      }
    },

    // ============================================================
    // NODE 3: Filter Business Emails
    // ============================================================
    {
      id: 'filter-business',
      type: 'filter',
      name: 'Filter Business Emails',
      description: 'Identify business emails for LinkedIn enrichment',
      config: {
        conditions: [
          {
            operator: 'and',
            conditions: [
              { field: 'email', operator: 'not_contains', value: '@gmail' },
              { field: 'email', operator: 'not_contains', value: '@yahoo' },
              { field: 'email', operator: 'not_contains', value: '@hotmail' },
              { field: 'email', operator: 'not_contains', value: '@libero' },
              { field: 'email', operator: 'not_contains', value: '@virgilio' }
            ]
          }
        ],
        onFail: 'skip'  // Don't fail, just skip non-matching rows
      },
      inputSchema: {
        type: 'array'
      },
      outputSchema: {
        type: 'array'
      }
    },

    // ============================================================
    // NODE 4: Apollo LinkedIn Enrichment (for business emails)
    // ============================================================
    {
      id: 'apollo-enrichment',
      type: 'api.apollo',
      name: 'LinkedIn Enrichment',
      description: 'Enrich with LinkedIn data via Apollo (business emails only)',
      config: {
        apiKey: '{{secrets.apollo}}',
        emailField: 'email'
      },
      inputSchema: {
        type: 'array'
      },
      outputSchema: {
        type: 'array'
      }
    },

    // ============================================================
    // NODE 5: Instagram Search
    // ============================================================
    {
      id: 'instagram-search',
      type: 'api.apify',
      name: 'Instagram Profile Search',
      description: 'Search Instagram profile to get bio and posts',
      config: {
        apiToken: '{{secrets.apify}}',
        actor: 'apify/instagram-search-scraper',
        input: {
          search: '{{nodes.input-csv.output.rows[].nome}}'
        }
      },
      inputSchema: {
        type: 'array'
      },
      outputSchema: {
        type: 'array'
      }
    },

    // ============================================================
    // NODE 6: AI Interest Inference
    // ============================================================
    {
      id: 'extract-interests',
      type: 'ai.interestInference',
      name: 'AI Interest Extraction',
      description: 'Extract interests from Instagram bio/posts using country-contextualized LLM',
      config: {
        apiToken: '{{secrets.openrouter}}',
        bioField: 'bio',
        postsField: 'posts',
        countryField: 'country',  // Uses country from node 2 for cultural context
        model: 'google/gemma-2-27b-it:free',  // Optimized for Italian content
        maxInterests: 10,
        temperature: 0.5
      },
      inputSchema: {
        type: 'array'
      },
      outputSchema: {
        type: 'array'
      }
    },

    // ============================================================
    // NODE 7: Filter Rows Without Interests
    // ============================================================
    {
      id: 'filter-empty-interests',
      type: 'filter',
      name: 'Remove Empty Interests',
      description: 'Keep only rows where interests were found',
      config: {
        conditions: [
          {
            field: 'interessi',
            operator: 'exists'
          },
          {
            field: 'interessi',
            operator: 'not_equals',
            value: ''
          }
        ],
        onFail: 'skip'
      },
      inputSchema: {
        type: 'array'
      },
      outputSchema: {
        type: 'array'
      }
    },

    // ============================================================
    // NODE 8: Output - Logger
    // ============================================================
    {
      id: 'output-logger',
      type: 'output',
      name: 'Output Results',
      description: 'Log enriched CSV results',
      config: {
        format: 'csv'
      },
      inputSchema: {
        type: 'object'
      },
      outputSchema: null
    }
  ],

  // ============================================================
  // EDGES: Connect the blocks
  // ============================================================
  edges: [
    // Input → Country Detection
    {
      id: 'edge-input-country',
      source: 'input-csv',
      target: 'detect-country'
    },

    // Country Detection → Filter Business
    {
      id: 'edge-country-filter',
      source: 'detect-country',
      target: 'filter-business'
    },

    // Filter Business → Apollo (parallel path)
    {
      id: 'edge-filter-apollo',
      source: 'filter-business',
      target: 'apollo-enrichment'
    },

    // Country Detection → Instagram (parallel path - all emails)
    // NOTE: In real implementation, we'd use a merge block here
    {
      id: 'edge-country-instagram',
      source: 'detect-country',
      target: 'instagram-search'
    },

    // Instagram → Interest Extraction
    {
      id: 'edge-instagram-ai',
      source: 'instagram-search',
      target: 'extract-interests'
    },

    // Interest Extraction → Filter Empty
    {
      id: 'edge-ai-filter',
      source: 'extract-interests',
      target: 'filter-empty-interests'
    },

    // Filter Empty → Output
    {
      id: 'edge-filter-output',
      source: 'filter-empty-interests',
      target: 'output-logger'
    }
  ],

  globals: {
    timeout: 300,  // 5 minutes max
    errorHandling: 'continue',  // Continue on error, log it
    maxParallelNodes: 3  // Run up to 3 nodes in parallel
  }
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
// DEMONSTRATION FUNCTION
// ============================================================

async function demonstrateWorkflowBasedEnrichment() {
  console.log('\n' + '='.repeat(80))
  console.log('  CSV INTEREST ENRICHMENT - WORKFLOW-BASED APPROACH')
  console.log('  Demonstrating the Power of Composed Blocks')
  console.log('='.repeat(80) + '\n')

  // ============================================================
  // STEP 1: Parse Input CSV
  // ============================================================
  console.log('📄 STEP 1: Parse Input CSV')
  console.log('─'.repeat(80))
  const { headers, rows } = parseCSV(sampleCSV)

  console.log(`Headers: ${headers.join(', ')}`)
  console.log(`Rows: ${rows.length} contacts`)
  console.log()

  rows.forEach((row, i) => {
    console.log(`${i + 1}. ${row.nome}`)
    console.log(`   Email: ${row.email}`)
    console.log(`   Phone: ${row.celular}`)
    console.log(`   DOB: ${row.nascimento || 'N/A'}`)
  })
  console.log()

  // ============================================================
  // STEP 2: Validate Workflow
  // ============================================================
  console.log('🔍 STEP 2: Validate Workflow Definition')
  console.log('─'.repeat(80))

  const validation = workflowValidator.validate(csvInterestEnrichmentWorkflow)

  if (!validation.valid) {
    console.error('❌ Workflow validation failed:')
    validation.errors.forEach(err => {
      console.error(`   - ${err.message} (${err.nodeId || 'global'})`)
    })
    return
  }

  console.log('✅ Workflow is valid!')
  console.log(`   Nodes: ${csvInterestEnrichmentWorkflow.nodes.length}`)
  console.log(`   Edges: ${csvInterestEnrichmentWorkflow.edges.length}`)

  if (validation.warnings.length > 0) {
    console.log()
    console.log('⚠️  Warnings:')
    validation.warnings.forEach(warn => {
      console.log(`   - ${warn.message}`)
    })
  }
  console.log()

  // ============================================================
  // STEP 3: Create Execution Context
  // ============================================================
  console.log('⚙️  STEP 3: Create Execution Context')
  console.log('─'.repeat(80))

  const context = ContextFactory.create({
    workflowId: 'csv-interest-enrichment-workflow',
    mode: 'demo',
    secrets: {
      apify: process.env.APIFY_TOKEN || 'demo-token',
      apollo: process.env.APOLLO_API_KEY || 'demo-token',
      openrouter: process.env.OPENROUTER_API_KEY || 'demo-token'
    },
    progress: (progress, event) => {
      const details = event.details as any
      console.log(`  [${progress}%] ${event.event}`)

      if (event.nodeId) {
        console.log(`     Node: ${event.nodeId}`)
      }

      if (details) {
        if (details.processed !== undefined) {
          console.log(`     Processed: ${details.processed}/${details.total || '?'}`)
        }
        if (details.contactsWithInterests !== undefined) {
          console.log(`     With interests: ${details.contactsWithInterests}`)
        }
      }
    }
  })

  console.log('✅ Context created')
  console.log(`   Mode: ${context.mode}`)
  console.log(`   Secrets: ${Object.keys(context.secrets).length} API keys configured`)
  console.log()

  // ============================================================
  // STEP 4: Execute Workflow
  // ============================================================
  console.log('🚀 STEP 4: Execute Workflow')
  console.log('─'.repeat(80))
  console.log('Workflow Architecture:')
  console.log()
  console.log('  1. Input CSV')
  console.log('     ↓')
  console.log('  2. Country Detection (from phone)')
  console.log('     ↓')
  console.log('  3. Filter Business Emails')
  console.log('     ↓')
  console.log('  4. Apollo LinkedIn (business only) ───┐')
  console.log('                                        │')
  console.log('  5. Instagram Search ──────────────────┤')
  console.log('                                        ├──→ 6. Merge Results')
  console.log('                                        │      ↓')
  console.log('                                        │  7. Extract Interests (AI)')
  console.log('                                        │      ↓')
  console.log('                                        └──→ 8. Filter Empty Interests')
  console.log('                                               ↓')
  console.log('                                            9. Output CSV')
  console.log()
  console.log('Executing...')
  console.log()

  const startTime = Date.now()

  try {
    const result = await workflowOrchestrator.execute(
      csvInterestEnrichmentWorkflow,
      context,
      {
        csv: { headers, rows }
      }
    )

    const executionTime = Date.now() - startTime

    // ============================================================
    // STEP 5: Display Results
    // ============================================================
    console.log()
    console.log('='.repeat(80))
    console.log('  ✅ WORKFLOW EXECUTION COMPLETED!')
    console.log('='.repeat(80) + '\n')

    console.log('📊 EXECUTION SUMMARY:')
    console.log(`   Status: ${result.status}`)
    console.log(`   Execution Time: ${executionTime}ms (${(executionTime / 1000).toFixed(2)}s)`)
    console.log(`   Total Nodes: ${result.metadata.totalNodes}`)
    console.log(`   Completed Nodes: ${result.metadata.completedNodes}`)
    console.log(`   Failed Nodes: ${result.metadata.failedNodes}`)
    console.log(`   Skipped Nodes: ${result.metadata.skippedNodes}`)
    console.log()

    // ============================================================
    // STEP 6: Show Node Results
    // ============================================================
    console.log('🔍 NODE EXECUTION DETAILS:')
    console.log('─'.repeat(80))

    Object.entries(result.nodeResults).forEach(([nodeId, nodeResult]) => {
      const node = csvInterestEnrichmentWorkflow.nodes.find(n => n.id === nodeId)
      const nodeName = node?.name || nodeId

      console.log(`\n${nodeId} → ${nodeName}`)
      console.log(`   Status: ${nodeResult.status}`)
      console.log(`   Time: ${nodeResult.executionTime}ms`)

      if (nodeResult.output) {
        // Show count of items processed
        if (Array.isArray(nodeResult.output)) {
          console.log(`   Output: ${nodeResult.output.length} items`)
        } else if (nodeResult.output.csv?.rows) {
          console.log(`   Output: ${nodeResult.output.csv.rows.length} rows`)
        }
      }

      if (nodeResult.error) {
        console.log(`   Error: ${nodeResult.error.message}`)
      }

      if (nodeResult.retryCount > 0) {
        console.log(`   Retries: ${nodeResult.retryCount}`)
      }
    })
    console.log()

    // ============================================================
    // STEP 7: Show Final Output
    // ============================================================
    console.log('📄 OUTPUT CSV (ENRICHED):')
    console.log('─'.repeat(80))

    if (result.output && result.output.csv) {
      const enrichedCSV = toCSV(
        result.output.csv.headers,
        result.output.csv.rows
      )

      console.log()
      console.log(enrichedCSV)
      console.log()

      // Show statistics
      const inputCount = rows.length
      const outputCount = result.output.csv.rows.length
      const filteredCount = inputCount - outputCount

      console.log('─'.repeat(80))
      console.log()
      console.log('📊 FINAL STATISTICS:')
      console.log(`   Input records:     ${inputCount}`)
      console.log(`   Output records:    ${outputCount} ⭐ (only with interests)`)
      console.log(`   Filtered out:      ${filteredCount} (no interests found)`)
      console.log(`   Enrichment rate:   ${((outputCount / inputCount) * 100).toFixed(1)}%`)
      console.log()
    }

    // ============================================================
    // STEP 8: Comparison with Monolithic Approach
    // ============================================================
    console.log('💡 WORKFLOW vs MONOLITHIC BLOCK:')
    console.log('─'.repeat(80))
    console.log()
    console.log('MONOLITHIC APPROACH (CSVInterestEnrichmentBlock):')
    console.log('  ❌ Single black-box block')
    console.log('  ❌ Cannot customize individual steps')
    console.log('  ❌ Cannot reuse components in other workflows')
    console.log('  ❌ Hard to debug and troubleshoot')
    console.log('  ❌ Tightly coupled logic')
    console.log()
    console.log('WORKFLOW APPROACH (This Example):')
    console.log('  ✅ 7+ independent, reusable blocks')
    console.log('  ✅ Each step is customizable')
    console.log('  ✅ Blocks can be reused in other workflows')
    console.log('  ✅ Full visibility into execution')
    console.log('  ✅ Loosely coupled, composable architecture')
    console.log()
    console.log('KEY INSIGHT:')
    console.log('  The SAME blocks used here (Country Config, Filter, Apollo, AI, etc.)')
    console.log('  can be REUSED in completely different workflows:')
    console.log('  - Lead enrichment pipeline')
    console.log('  - Social media analysis')
    console.log('  - Content personalization')
    console.log('  - Data validation workflows')
    console.log()
    console.log('  This is the power of workflow-based architecture!')
    console.log()

  } catch (error) {
    console.log()
    console.log('❌ WORKFLOW EXECUTION FAILED:')
    console.log(`Error: ${(error as Error).message}`)
    console.log()
  }
}

// ============================================================
// RUN DEMONSTRATION
// ============================================================

async function main() {
  try {
    await demonstrateWorkflowBasedEnrichment()
    console.log('✅ Demonstration completed!\n')
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
  demonstrateWorkflowBasedEnrichment,
  parseCSV,
  toCSV
}
