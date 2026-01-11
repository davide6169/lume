/**
 * Test reale FullContact API - Singolo Contatto
 *
 * Testa l'API reale di FullContact con un solo contatto
 * Richiede FULLCONTACT_API_KEY in .env.local
 */

// Carica variabili d'ambiente da .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

import { WorkflowOrchestrator } from '../../lib/workflow-engine/orchestrator'
import { ContextFactory } from '../../lib/workflow-engine/context'
import { registerAllBuiltInBlocks } from '../../lib/workflow-engine/blocks'
import { csvInterestEnrichmentWorkflowV3 } from '../../lib/workflow-engine/workflows/csv-interest-enrichment-v3.workflow'

// CSV con un solo contatto (IL TUO)
const SINGLE_CONTACT_CSV = `nome;celular;email;nascimento
Davide Cucciniello;;davide6169@gemail.com;1969-01-06`

async function testFullContactRealSingle() {
  console.log('╔══════════════════════════════════════════════════════════════════╗')
  console.log('║     FullContact API Real Test - Single Contact                 ║')
  console.log('╚══════════════════════════════════════════════════════════════════╝')
  console.log()

  // Register blocks
  registerAllBuiltInBlocks()

  // Get API key from environment
  const fullcontactApiKey = process.env.FULLCONTACT_API_KEY

  if (!fullcontactApiKey || fullcontactApiKey === 'your-api-key-here') {
    console.error('❌ FULLCONTACT_API_KEY non trovata!')
    console.error('')
    console.error('Per favore:')
    console.error('1. Ottieni una API KEY da https://www.fullcontact.com/')
    console.error('2. Aggiungi al file .env.local:')
    console.error('   FULLCONTACT_API_KEY=la-tua-api-key-qui')
    console.error('3. Riavvia il terminale')
    console.log()
    process.exit(1)
  }

  // Configure workflow - LIVE MODE
  const workflow = csvInterestEnrichmentWorkflowV3

  // Create context with LIVE mode
  const context = ContextFactory.create({
    workflowId: workflow.workflowId,
    executionId: `test-real-single-${Date.now()}`,
    mode: 'live',  // LIVE MODE - Usa API reali!
    variables: {},
    secrets: {
      FULLCONTACT_API_KEY: fullcontactApiKey,
      PDL_API_KEY: 'mock-key', // Non usato
      OPENROUTER_API_KEY: 'mock-key' // Non usato
    },
    logger: {
      node: (nodeId: string, msg: string, meta?: any) => console.log(`  [${nodeId}] ${msg}`, meta ? JSON.stringify(meta, null, 2) : ''),
      debug: (msg: string, meta?: any) => console.log(`  [DEBUG] ${msg}`, meta ? JSON.stringify(meta, null, 2) : ''),
      info: (msg: string, meta?: any) => console.log(`  [INFO] ${msg}`, meta ? JSON.stringify(meta, null, 2) : ''),
      warn: (msg: string, meta?: any) => console.log(`  [WARN] ⚠️  ${msg}`, meta ? JSON.stringify(meta, null, 2) : ''),
      error: (msg: string, meta?: any) => console.log(`  [ERROR] ❌ ${msg}`, meta ? JSON.stringify(meta, null, 2) : '')
    }
  })

  // Show configuration
  console.log('⚙️  Configuration:')
  console.log('   Mode: LIVE (real API calls)')
  console.log('   FullContact: ENABLED (real API)')
  console.log('   API KEY: ' + fullcontactApiKey.substring(0, 10) + '...' + fullcontactApiKey.substring(fullcontactApiKey.length - 4))
  console.log()

  // Show input
  console.log('📥 Input Contact:')
  console.log('─'.repeat(70))
  const lines = SINGLE_CONTACT_CSV.split('\n')
  const [nome, , email, nascimento] = lines[1].split(';')
  console.log(`   ${nome} <${email}> (${nascimento})`)
  console.log('─'.repeat(70))
  console.log()

  // Execute workflow
  console.log('🚀 Starting FullContact API Call...')
  console.log('═'.repeat(70))
  console.log()

  const startTime = Date.now()
  const orchestrator = new WorkflowOrchestrator()

  try {
    const result = await orchestrator.execute(workflow, context, {
      csv: SINGLE_CONTACT_CSV
    })

    const executionTime = Date.now() - startTime

    console.log()
    console.log('═'.repeat(70))
    console.log('✅ FULLCONTACT API CALL COMPLETED')
    console.log('═'.repeat(70))
    console.log()

    // Show execution results
    console.log('📊 Execution Results:')
    console.log(`   Status: ${result.status}`)
    console.log(`   Total Time: ${executionTime}ms (${(executionTime / 1000).toFixed(2)}s)`)

    // Show cost
    if (result.metadata && result.metadata.totalCost !== undefined) {
      console.log(`   Cost: $${result.metadata.totalCost.toFixed(4)}`)
    }
    console.log()

    // Show output
    if (result.output && result.output['csv-assemble']) {
      const output = result.output['csv-assemble']

      if (output.csv?.csvString) {
        console.log('📤 Output CSV:')
        console.log('─'.repeat(70))
        console.log(output.csv.csvString)
        console.log('─'.repeat(70))
        console.log()
      }

      if (output.csv?.rows && output.csv.rows.length > 0) {
        const contact = output.csv.rows[0]
        console.log('👤 Enriched Contact:')
        console.log('─'.repeat(70))
        console.log(`   Name: ${contact.nome || 'N/A'}`)
        console.log(`   Email: ${contact.email || 'N/A'}`)

        if (contact.interessi) {
          console.log(`   Interests: ${contact.interessi}`)
        }

        // Show raw FullContact data if available
        if (contact.fullcontact) {
          console.log()
          console.log('📡 FullContact Raw Data:')
          if (contact.fullcontact.profiles) {
            console.log(`   Profiles: ${JSON.stringify(contact.fullcontact.profiles, null, 2)}`)
          }
          if (contact.fullcontact.demographics) {
            console.log(`   Demographics: ${JSON.stringify(contact.fullcontact.demographics, null, 2)}`)
          }
          if (contact.fullcontact.interests) {
            console.log(`   Raw Interests: ${JSON.stringify(contact.fullcontact.interests, null, 2)}`)
          }
        }
        console.log('─'.repeat(70))
      }
    }

    console.log()
    console.log('═'.repeat(70))
    console.log('🎯 TEST COMPLETED SUCCESSFULLY')
    console.log('═'.repeat(70))

  } catch (error) {
    console.log()
    console.log('═'.repeat(70))
    console.log('❌ TEST FAILED')
    console.log('═'.repeat(70))
    console.error(error)
    console.log()

    if ((error as any).message?.includes('401')) {
      console.error('API KEY non valida! Controlla la tua FULLCONTACT_API_KEY')
    } else if ((error as any).message?.includes('404')) {
      console.error('Email non trovata in FullContact (profilo inesistente)')
    } else if ((error as any).message?.includes('429')) {
      console.error('Rate limit superato! Hai troppe richieste.')
    }

    process.exit(1)
  }
}

// Run test
testFullContactRealSingle().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
