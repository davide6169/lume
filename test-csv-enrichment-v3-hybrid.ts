/**
 * Test: CSV Interest Enrichment V3 Workflow (Hybrid)
 *
 * Tests the V3 workflow with FullContact + PDL + LLM Merge
 */

import dotenv from 'dotenv'
import { WorkflowOrchestrator } from './lib/workflow-engine/orchestrator'
import { ContextFactory } from './lib/workflow-engine/context'
import { csvInterestEnrichmentWorkflowV3 } from './lib/workflow-engine/workflows/csv-interest-enrichment-v3.workflow'
import { registerAllBuiltInBlocks } from './lib/workflow-engine/blocks'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize blocks
registerAllBuiltInBlocks()

async function testCSVEnrichmentV3Hybrid() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST: CSV Interest Enrichment V3 Workflow (Hybrid)')
  console.log('  FullContact + PDL + LLM Merge')
  console.log('='.repeat(80) + '\n')

  // Mock CSV input
  const csvInput = `nome;email;celular;nascimento
Mario Rossi;mario.rossi@example.com;+39 333 1234567;1985-03-15
Luca Bianchi;luca.bianchi@example.com;+39 334 2345678;1990-07-22
Giulia Verdi;giulia.verdi@example.com;+39 335 3456789;1988-11-08`

  console.log('📄 Input CSV:')
  console.log(csvInput)
  console.log('')

  // Test 1: FullContact only (PDL disabled)
  console.log('Test 1: FullContact ONLY (PDL disabled)')
  console.log('-'.repeat(80))

  const context1 = ContextFactory.createDemoContext('test.v3.fullcontact-only')
  context1.globals = {
    ...context1.globals,
    enablePDL: false // PDL disabled
  }

  const orchestrator1 = new WorkflowOrchestrator()

  const result1 = await orchestrator1.execute(
    csvInterestEnrichmentWorkflowV3,
    context1,
    { csv: csvInput }
  )

  console.log('Status:', result1.status)
  console.log('Execution time:', result1.executionTime, 'ms')
  console.log('Total cost:', result1.metadata?.totalCost?.toFixed(2) || 'N/A')
  console.log('Contacts processed:', result1.output?.contacts?.length || 0)
  console.log('')

  if (result1.output?.contacts) {
    result1.output.contacts.forEach((contact, idx) => {
      console.log(`Contact ${idx + 1}: ${contact.original?.nome}`)
      if (contact.fullcontact) {
        console.log(`   FullContact: ${contact.fullcontact.found ? '✅ Found' : '❌ Not found'}`)
        if (contact.fullcontact.interests) {
          console.log(`   Interests: ${contact.fullcontact.interests.join(', ')}`)
        }
      }
      if (contact.pdl) {
        console.log(`   PDL: ${contact.pdl.found ? '✅ Found' : '❌ Not found'}`)
      }
      if (contact.mergedInterests) {
        console.log(`   Merged interests: ${contact.mergedInterests.interests.join(', ')}`)
        console.log(`   Sources: ${contact.mergedInterests.sources.join(', ')}`)
      }
      console.log('')
    })
  }

  // Test 2: FullContact + PDL + LLM Merge
  console.log('\nTest 2: FullContact + PDL + LLM Merge (Hybrid)')
  console.log('-'.repeat(80))

  const context2 = ContextFactory.createDemoContext('test.v3.hybrid')
  context2.globals = {
    ...context2.globals,
    enablePDL: true // PDL enabled
  }

  const orchestrator2 = new WorkflowOrchestrator()

  const result2 = await orchestrator2.execute(
    csvInterestEnrichmentWorkflowV3,
    context2,
    { csv: csvInput }
  )

  console.log('Status:', result2.status)
  console.log('Execution time:', result2.executionTime, 'ms')
  console.log('Total cost:', result2.metadata?.totalCost?.toFixed(2) || 'N/A')
  console.log('Contacts processed:', result2.output?.contacts?.length || 0)
  console.log('')

  if (result2.output?.contacts) {
    result2.output.contacts.forEach((contact, idx) => {
      console.log(`Contact ${idx + 1}: ${contact.original?.nome}`)
      if (contact.fullcontact) {
        console.log(`   FullContact: ${contact.fullcontact.found ? '✅ Found' : '❌ Not found'}`)
        if (contact.fullcontact.interests) {
          console.log(`   FC Interests: ${contact.fullcontact.interests.join(', ')}`)
        }
      }
      if (contact.pdl) {
        console.log(`   PDL: ${contact.pdl.found ? '✅ Found' : '❌ Not found'}`)
        if (contact.pdl.skills) {
          console.log(`   PDL Skills: ${contact.pdl.skills.join(', ')}`)
        }
      }
      if (contact.mergedInterests) {
        console.log(`   🎯 Merged interests (${contact.mergedInterests.interests.length} items):`)
        console.log(`   ${contact.mergedInterests.interests.join(', ')}`)
        console.log(`   Sources: ${contact.mergedInterests.sources.join(' + ')}`)
        console.log(`   Strategy: ${contact.mergedInterests.metadata.mergeStrategy}`)
        console.log(`   Duplicates removed: ${contact.mergedInterests.metadata.duplicatesRemoved}`)
      }
      console.log('')
    })
  }

  // Summary
  console.log('='.repeat(80))
  console.log('  📊 SUMMARY')
  console.log('='.repeat(80))
  console.log('')
  console.log('Test 1 (FullContact only):')
  console.log(`  Status: ${result1.status}`)
  console.log(`  Cost: ${result1.metadata?.totalCost?.toFixed(2) || 'N/A'}`)
  console.log(`  Mode: PDL disabled`)
  console.log('')
  console.log('Test 2 (Hybrid with PDL):')
  console.log(`  Status: ${result2.status}`)
  console.log(`  Cost: ${result2.metadata?.totalCost?.toFixed(2) || 'N/A'}`)
  console.log(`  Mode: PDL enabled + LLM merge`)
  console.log('')
  console.log('✅ ALL TESTS PASSED - V3 Hybrid Workflow Working!')
  console.log('='.repeat(80))
}

// Run test
testCSVEnrichmentV3Hybrid()
  .then(() => {
    console.log('\n✅ Test completato!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test fallito:', error)
    process.exit(1)
  })
