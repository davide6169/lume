/**
 * Direct test of CSV Interest Enrichment workflow (without database)
 */

import { WorkflowOrchestrator } from '../lib/workflow-engine/orchestrator'
import { ContextFactory } from '../lib/workflow-engine/context'
import { registerAllBuiltInBlocks } from '../lib/workflow-engine/blocks'
import { csvInterestEnrichmentWorkflowV3 } from '../lib/workflow-engine/workflows/csv-interest-enrichment-v3.workflow'

async function testWorkflow() {
  console.log('════════════════════════════════════════════════════════════')
  console.log('  CSV Interest Enrichment V3.2 - Direct Test')
  console.log('════════════════════════════════════════════════════════════')
  console.log()

  // Register all blocks
  registerAllBuiltInBlocks()
  console.log('✅ All blocks registered')
  console.log()

  // Create execution context in DEMO mode (mock, zero cost)
  const context = ContextFactory.create({
    workflowId: 'csv.interestEnrichment.v3',
    executionId: 'test_direct_' + Date.now(),
    mode: 'demo', // DEMO = mock mode, no API calls
    variables: {
      _enablePDL: false // Disable PDL secondary enrichment
    },
    secrets: {}, // No secrets needed in demo mode
    logger: {
      debug: (msg: string, meta?: any) => console.log(`  [DEBUG] ${msg}`, meta ? JSON.stringify(meta) : ''),
      info: (msg: string, meta?: any) => console.log(`  [INFO] ${msg}`, meta ? JSON.stringify(meta) : ''),
      warn: (msg: string, meta?: any) => console.log(`  [WARN] ⚠️  ${msg}`, meta ? JSON.stringify(meta) : ''),
      error: (msg: string, meta?: any) => console.log(`  [ERROR] ❌ ${msg}`, meta ? JSON.stringify(meta) : '')
    },
    progress: (progress, event) => {
      const bar = '█'.repeat(Math.floor(progress / 5))
      const empty = '░'.repeat(20 - Math.floor(progress / 5))
      process.stdout.write(`\r[${bar}${empty}] ${progress}%`)
      if (progress === 100) console.log('')
    }
  })

  // Input CSV data
  const input = {
    csv: `nome;celular;email;nascimento
Mario Rossi;;mario.rossi@example.com;1985-03-15
Giulia Bianchi;;giulia.b@email.com;1990-07-22
Marco Verdi;;marco.verdi@company.it;1988-11-30`
  }

  console.log('📥 Input CSV (3 contacts):')
  console.log('   - Mario Rossi <mario.rossi@example.com>')
  console.log('   - Giulia Bianchi <giulia.b@email.com>')
  console.log('   - Marco Verdi <marco.verdi@company.it>')
  console.log()

  console.log('⚙️  Configuration:')
  console.log('   - Mode: DEMO (mock, zero API cost)')
  console.log('   - PDL Secondary Enrichment: DISABLED')
  console.log('   - FullContact: MOCK')
  console.log()

  console.log('════════════════════════════════════════════════════════════')
  console.log('  Executing Workflow...')
  console.log('════════════════════════════════════════════════════════════')
  console.log()

  const startTime = Date.now()
  const orchestrator = new WorkflowOrchestrator()

  try {
    const result = await orchestrator.execute(csvInterestEnrichmentWorkflowV3, context, input)
    const executionTime = Date.now() - startTime

    console.log()
    console.log('════════════════════════════════════════════════════════════')
    console.log('  Execution Results')
    console.log('════════════════════════════════════════════════════════════')
    console.log()

    // Status
    if (result.status === 'completed') {
      console.log('✅ Status: COMPLETED')
    } else if (result.status === 'failed') {
      console.log('❌ Status: FAILED')
    } else if (result.status === 'partial') {
      console.log('⚠️  Status: PARTIAL')
    }

    console.log()
    console.log('📊 Execution Statistics:')
    console.log(`   - Total Time: ${executionTime}ms (${(executionTime / 1000).toFixed(2)}s)`)
    console.log(`   - Total Nodes: ${result.metadata?.totalNodes || 0}`)
    console.log(`   - Completed: ${result.metadata?.completedNodes || 0}`)
    console.log(`   - Failed: ${result.metadata?.failedNodes || 0}`)
    console.log(`   - Skipped: ${result.metadata?.skippedNodes || 0}`)

    console.log()
    console.log('💰 Cost Breakdown (MOCK - All zeros):')
    console.log(`   - FullContact: $0.00 (mock)`)
    console.log(`   - PDL: $0.00 (mock, disabled)`)
    console.log(`   - LLM Merge: $0.00 (mock)`)
    console.log(`   - TOTAL: $0.00`)

    // Output
    if (result.output) {
      console.log()
      console.log('📤 Output:')

      if (result.output.csv) {
        console.log()
        console.log('   Generated CSV:')
        console.log('   ' + '─'.repeat(60))
        const lines = result.output.csv.split('\n')
        lines.slice(0, 10).forEach(line => {
          console.log('   ' + line)
        })
        if (lines.length > 10) {
          console.log(`   ... (${lines.length - 10} more lines)`)
        }
        console.log('   ' + '─'.repeat(60))
      }

      if (result.output.rows) {
        console.log()
        console.log(`   Total rows: ${result.output.rows.length}`)
        console.log('   Sample enriched rows:')

        result.output.rows.slice(0, 2).forEach((row: any, idx: number) => {
          console.log()
          console.log(`   [Row ${idx + 1}]`)
          console.log(`     Name: ${row.original?.nome || 'N/A'}`)
          console.log(`     Email: ${row.original?.email || 'N/A'}`)
          if (row.interests) {
            console.log(`     Interests: ${Array.isArray(row.interests) ? row.interests.join(', ') : row.interests}`)
          }
          if (row.enrichmentMetadata) {
            console.log(`     Enrichment sources: ${Object.keys(row.enrichmentMetadata).join(', ')}`)
          }
        })
      }
    }

    // Error
    if (result.error) {
      console.log()
      console.log('❌ Error:')
      console.log(`   ${result.error.message}`)
      if (result.error.stack) {
        console.log()
        console.log('   Stack trace:')
        console.log(result.error.stack)
      }
    }

    console.log()
    console.log('════════════════════════════════════════════════════════════')

    if (result.status === 'completed') {
      console.log('✅ Test PASSED - Workflow executed successfully!')
    } else {
      console.log('⚠️  Test completed with status: ' + result.status)
    }

  } catch (error: any) {
    console.log()
    console.log('❌ Execution failed with exception:')
    console.error(error)
    console.log()
    console.log('Stack trace:')
    console.error(error.stack)
    process.exit(1)
  }
}

testWorkflow().catch(console.error)
