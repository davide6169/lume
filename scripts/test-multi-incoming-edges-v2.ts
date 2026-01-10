/**
 * Test per verificare il comportamento dell'orchestrator con multipli incoming edges
 * Versione 2: Verifica che i dati vengano mergiati correttamente (non sovrascritti)
 */

import { WorkflowOrchestrator } from '../lib/workflow-engine/orchestrator'
import { ContextFactory } from '../lib/workflow-engine/context'
import { registerAllBuiltInBlocks } from '../lib/workflow-engine/blocks'

async function testMultipleIncomingEdges() {
  console.log('🔍 Testing orchestrator behavior with multiple incoming edges\n')
  console.log('Testing that data from multiple sources is MERGED, not overwritten\n')

  registerAllBuiltInBlocks()

  // Test 1: Simple objects with different keys - should merge all keys
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Test 1: Simple objects with different keys')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const testWorkflow1 = {
    workflowId: 'test.multi-incoming.1',
    name: 'Test Multiple Incoming Edges - Different Keys',
    version: '1.0',
    nodes: [
      {
        id: 'source-a',
        type: 'input.static',
        name: 'Source A',
        config: { data: { valueA: 'A', countA: 1 } }
      },
      {
        id: 'source-b',
        type: 'input.static',
        name: 'Source B',
        config: { data: { valueB: 'B', countB: 2 } }
      },
      {
        id: 'consumer',
        type: 'output.logger',
        name: 'Consumer (merges A and B)',
        config: { format: 'json' }
      }
    ],
    edges: [
      { id: 'e1', source: 'source-a', target: 'consumer' },
      { id: 'e2', source: 'source-b', target: 'consumer' }
    ],
    globals: {}
  }

  const context1 = ContextFactory.create({
    workflowId: 'test.multi-incoming.1',
    executionId: 'test_1',
    mode: 'demo',
    variables: {},
    secrets: {},
    logger: {
      debug: (msg: string) => console.log(`  [DEBUG] ${msg}`),
      info: (msg: string) => console.log(`  [INFO] ${msg}`),
      warn: (msg: string) => console.log(`  [WARN] ⚠️  ${msg}`),
      error: (msg: string) => console.log(`  [ERROR] ❌ ${msg}`)
    }
  })

  try {
    const orchestrator1 = new WorkflowOrchestrator()
    const result1 = await orchestrator1.execute(testWorkflow1, context1, {})

    console.log('\n✅ Test 1 Status:', result1.status)
    if (result1.output?.consumer) {
      const output = result1.output.consumer
      console.log('Output received by consumer:', JSON.stringify(output, null, 2))

      // Verify both A and B data are present
      const hasValueA = output.valueA === 'A'
      const hasValueB = output.valueB === 'B'
      const hasCountA = output.countA === 1
      const hasCountB = output.countB === 2

      if (hasValueA && hasValueB && hasCountA && hasCountB) {
        console.log('✅ Test 1 PASSED - All keys from both sources present!')
      } else {
        console.log('❌ Test 1 FAILED - Some keys missing:')
        console.log(`  valueA: ${hasValueA ? '✅' : '❌'}`)
        console.log(`  valueB: ${hasValueB ? '✅' : '❌'}`)
        console.log(`  countA: ${hasCountA ? '✅' : '❌'}`)
        console.log(`  countB: ${hasCountB ? '✅' : '❌'}`)
      }
    }
  } catch (error) {
    console.log('❌ Test 1 FAILED with error:', error)
  }

  // Test 2: Overlapping keys - should use deep merge (not overwrite)
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Test 2: Overlapping keys with nested objects')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const testWorkflow2 = {
    workflowId: 'test.multi-incoming.2',
    name: 'Test Multiple Incoming Edges - Overlapping Keys',
    version: '1.0',
    nodes: [
      {
        id: 'source-a',
        type: 'input.static',
        name: 'Source A',
        config: {
          data: {
            contacts: [{ id: 1, name: 'Alice', from: 'A' }],
            metadata: { source: 'A', count: 1 }
          }
        }
      },
      {
        id: 'source-b',
        type: 'input.static',
        name: 'Source B',
        config: {
          data: {
            contacts: [{ id: 2, name: 'Bob', from: 'B' }],
            metadata: { processed: true }
          }
        }
      },
      {
        id: 'consumer',
        type: 'output.logger',
        name: 'Consumer (merges with deep merge)',
        config: { format: 'json' }
      }
    ],
    edges: [
      { id: 'e1', source: 'source-a', target: 'consumer' },
      { id: 'e2', source: 'source-b', target: 'consumer' }
    ],
    globals: {}
  }

  const context2 = ContextFactory.create({
    workflowId: 'test.multi-incoming.2',
    executionId: 'test_2',
    mode: 'demo',
    variables: {},
    secrets: {},
    logger: {
      debug: (msg: string) => console.log(`  [DEBUG] ${msg}`),
      info: (msg: string) => console.log(`  [INFO] ${msg}`),
      warn: (msg: string) => console.log(`  [WARN] ⚠️  ${msg}`),
      error: (msg: string) => console.log(`  [ERROR] ❌ ${msg}`)
    }
  })

  try {
    const orchestrator2 = new WorkflowOrchestrator()
    const result2 = await orchestrator2.execute(testWorkflow2, context2, {})

    console.log('\n✅ Test 2 Status:', result2.status)
    if (result2.output?.consumer) {
      const output = result2.output.consumer
      console.log('Output received by consumer:', JSON.stringify(output, null, 2))

      // Verify deep merge behavior
      const contactsLength = output.contacts?.length || 0
      const hasBothContacts = contactsLength === 2
      const hasMetadataSource = output.metadata?.source === 'A'
      const hasMetadataProcessed = output.metadata?.processed === true

      console.log('\nVerification:')
      console.log(`  Contacts array length: ${contactsLength} (expected: 2) - ${hasBothContacts ? '✅' : '❌'}`)
      console.log(`  Metadata.source: ${output.metadata?.source || 'MISSING'} (expected: A) - ${hasMetadataSource ? '✅' : '❌'}`)
      console.log(`  Metadata.processed: ${output.metadata?.processed || 'MISSING'} (expected: true) - ${hasMetadataProcessed ? '✅' : '❌'}`)

      if (hasBothContacts && hasMetadataSource && hasMetadataProcessed) {
        console.log('\n✅ Test 2 PASSED - Deep merge worked correctly!')
      } else {
        console.log('\n❌ Test 2 FAILED - Deep merge did not work as expected')
      }
    }
  } catch (error) {
    console.log('❌ Test 2 FAILED with error:', error)
  }

  // Test 3: Arrays with same ID - should merge by ID (smart merge)
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Test 3: Arrays with same ID (Smart Merge)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const testWorkflow3 = {
    workflowId: 'test.multi-incoming.3',
    name: 'Test Multiple Incoming Edges - Smart Merge by ID',
    version: '1.0',
    nodes: [
      {
        id: 'source-a',
        type: 'input.static',
        name: 'Source A',
        config: {
          data: {
            contacts: [
              { id: 1, name: 'Alice', emailType: 'business' },
              { id: 2, name: 'Bob', emailType: 'personal' }
            ]
          }
        }
      },
      {
        id: 'source-b',
        type: 'input.static',
        name: 'Source B',
        config: {
          data: {
            contacts: [
              { id: 1, name: 'Alice', normalized: { firstName: 'Alice', lastName: 'Smith' } },
              { id: 3, name: 'Charlie', normalized: { firstName: 'Charlie', lastName: 'Brown' } }
            ]
          }
        }
      },
      {
        id: 'consumer',
        type: 'output.logger',
        name: 'Consumer (smart merges by ID)',
        config: { format: 'json' }
      }
    ],
    edges: [
      { id: 'e1', source: 'source-a', target: 'consumer' },
      { id: 'e2', source: 'source-b', target: 'consumer' }
    ],
    globals: {}
  }

  const context3 = ContextFactory.create({
    workflowId: 'test.multi-incoming.3',
    executionId: 'test_3',
    mode: 'demo',
    variables: {},
    secrets: {},
    logger: {
      debug: (msg: string) => console.log(`  [DEBUG] ${msg}`),
      info: (msg: string) => console.log(`  [INFO] ${msg}`),
      warn: (msg: string) => console.log(`  [WARN] ⚠️  ${msg}`),
      error: (msg: string) => console.log(`  [ERROR] ❌ ${msg}`)
    }
  })

  try {
    const orchestrator3 = new WorkflowOrchestrator()
    const result3 = await orchestrator3.execute(testWorkflow3, context3, {})

    console.log('\n✅ Test 3 Status:', result3.status)
    if (result3.output?.consumer) {
      const output = result3.output.consumer
      console.log('Output received by consumer:', JSON.stringify(output, null, 2))

      // Verify smart merge behavior
      const contacts = output.contacts || []
      const alice = contacts.find((c: any) => c.id === 1)
      const bob = contacts.find((c: any) => c.id === 2)
      const charlie = contacts.find((c: any) => c.id === 3)

      console.log('\nVerification:')
      console.log(`  Total contacts: ${contacts.length} (expected: 3) - ${contacts.length === 3 ? '✅' : '❌'}`)
      console.log(`  Alice (id=1):`)
      console.log(`    Has emailType: ${alice?.emailType || 'MISSING'} - ${alice?.emailType ? '✅' : '❌'}`)
      console.log(`    Has normalized: ${alice?.normalized ? 'YES' : 'NO'} - ${alice?.normalized ? '✅' : '❌'}`)
      console.log(`  Bob (id=2): Has emailType: ${bob?.emailType || 'MISSING'} - ${bob?.emailType ? '✅' : '❌'}`)
      console.log(`  Charlie (id=3): Has normalized: ${charlie?.normalized ? 'YES' : 'NO'} - ${charlie?.normalized ? '✅' : '❌'}`)

      if (contacts.length === 3 && alice?.emailType && alice?.normalized && bob?.emailType && charlie?.normalized) {
        console.log('\n✅ Test 3 PASSED - Smart merge by ID worked correctly!')
      } else {
        console.log('\n❌ Test 3 FAILED - Smart merge did not work as expected')
      }
    }
  } catch (error) {
    console.log('❌ Test 3 FAILED with error:', error)
  }

  console.log('\n\n🎉 All tests completed!')
}

testMultipleIncomingEdges().catch(console.error)
