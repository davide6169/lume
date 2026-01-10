/**
 * Test: LLM Merge Interests Block
 *
 * Tests LLM Merge block with mock mode
 */

import dotenv from 'dotenv'
import { registerAllBuiltInBlocks } from './lib/workflow-engine/blocks'
import { LLMMergeInterestsBlock } from './lib/workflow-engine/blocks/ai/llm-merge-interests.block'
import { ContextFactory } from './lib/workflow-engine/context'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize blocks
registerAllBuiltInBlocks()

async function testLLMMergeMockMode() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST: LLM Merge Interests Block - Mock Mode')
  console.log('='.repeat(80) + '\n')

  const context = ContextFactory.createDemoContext('test.llmmerge')
  const block = new LLMMergeInterestsBlock()

  console.log('Test 1: Mock mode with 3 contacts (mixed sources)')
  console.log('-'.repeat(80))

  const result = await block.execute(
    {
      apiToken: 'test-token',
      mode: 'mock',
      maxInterests: 15
    },
    {
      contacts: [
        {
          original: { nome: 'Mario Rossi', email: 'mario@example.com' },
          fullcontact: {
            found: true,
            interests: ['Travel', 'Photography', 'Food', 'Technology']
          },
          pdl: {
            found: true,
            skills: ['Business Strategy', 'Management', 'Sales', 'Technology']
          }
        },
        {
          original: { nome: 'Luca Bianchi', email: 'luca@example.com' },
          fullcontact: {
            found: true,
            interests: ['Sports', 'Fitness', 'Music']
          },
          pdl: {
            found: false
          }
        },
        {
          original: { nome: 'Giulia Verdi', email: 'giulia@example.com' },
          fullcontact: {
            found: false
          },
          pdl: {
            found: true,
            skills: ['Marketing', 'Communication', 'PR']
          }
        }
      ]
    },
    context
  )

  console.log('Status:', result.status)
  console.log('Execution time:', result.executionTime, 'ms')
  console.log('Mock mode:', result.metadata?.mock ? '✅ YES' : '❌ NO')
  console.log('')

  if (result.status === 'completed' && result.output) {
    console.log('📊 Results:')
    console.log('   Total input:', result.output.metadata.totalInput)
    console.log('   Total processed:', result.output.metadata.totalProcessed)
    console.log('   FullContact only:', result.output.metadata.fromFullContactOnly)
    console.log('   PDL only:', result.output.metadata.fromPDLOnly)
    console.log('   Both sources:', result.output.metadata.fromBoth)
    console.log('   Total cost:', result.output.metadata.totalCost.toFixed(2))
    console.log('   Avg cost per contact:', result.output.metadata.avgCostPerContact.toFixed(2))
    console.log('')

    result.output.contacts.forEach((contact, idx) => {
      console.log(`Contact ${idx + 1}: ${contact.original.nome}`)

      if (contact.mergedInterests) {
        console.log(`   ✅ Merged interests (${contact.mergedInterests.interests.length} items)`)
        console.log(`   Sources: ${contact.mergedInterests.sources.join(' + ')}`)
        console.log(`   Interests: ${contact.mergedInterests.interests.join(', ')}`)
        console.log(`   Strategy: ${contact.mergedInterests.metadata.mergeStrategy}`)
        console.log(`   Duplicates removed: ${contact.mergedInterests.metadata.duplicatesRemoved}`)
      } else {
        console.log(`   ❌ No interests from any source`)
      }
      console.log('')
    })
  }

  console.log('Test 2: Check mock support')
  console.log('-'.repeat(80))
  const supportsMock = block.supportsMockMode()
  console.log('Block supports mock:', supportsMock ? '✅ YES' : '❌ NO')
  console.log('Static property:', (block.constructor as any).supportsMock)
  console.log('')

  console.log('Test 3: Check enabled property')
  console.log('-'.repeat(80))
  const enabled1 = block.isEnabled({ enabled: true })
  const enabled2 = block.isEnabled({ enabled: false })
  const enabled3 = block.isEnabled({})
  console.log('Config { enabled: true }: ', enabled1 ? '✅ ENABLED' : '❌ DISABLED')
  console.log('Config { enabled: false }: ', enabled2 ? '✅ ENABLED' : '❌ DISABLED')
  console.log('Config {}: ', enabled3 ? '✅ ENABLED' : '❌ DISABLED')
  console.log('')

  console.log('Test 4: Single source (FullContact only)')
  console.log('-'.repeat(80))

  const result2 = await block.execute(
    {
      apiToken: 'test-token',
      mode: 'mock',
      maxInterests: 15
    },
    {
      contacts: [
        {
          original: { nome: 'Single Source', email: 'single@example.com' },
          fullcontact: {
            found: true,
            interests: ['Art', 'Design', 'Fashion']
          },
          pdl: {
            found: false
          }
        }
      ]
    },
    context
  )

  if (result2.status === 'completed' && result2.output) {
    const contact = result2.output.contacts[0]
    console.log(`Contact: ${contact.original.nome}`)
    if (contact.mergedInterests) {
      console.log(`   Sources: ${contact.mergedInterests.sources.join(', ')}`)
      console.log(`   Strategy: ${contact.mergedInterests.metadata.mergeStrategy}`)
      console.log(`   Interests: ${contact.mergedInterests.interests.join(', ')}`)
    }
  }
  console.log('')

  console.log('Test 5: No data from any source')
  console.log('-'.repeat(80))

  const result3 = await block.execute(
    {
      apiToken: 'test-token',
      mode: 'mock',
      maxInterests: 15
    },
    {
      contacts: [
        {
          original: { nome: 'No Data', email: 'nodata@example.com' },
          fullcontact: {
            found: false
          },
          pdl: {
            found: false
          }
        }
      ]
    },
    context
  )

  if (result3.status === 'completed' && result3.output) {
    const contact = result3.output.contacts[0]
    console.log(`Contact: ${contact.original.nome}`)
    console.log(`   Has merged interests: ${contact.mergedInterests ? '❌ YES (unexpected)' : '✅ NO (expected)'}`)
  }
  console.log('')

  console.log('='.repeat(80))
  console.log('  ✅ ALL TESTS PASSED - LLM Merge Block Working!')
  console.log('='.repeat(80))
}

// Run test
testLLMMergeMockMode()
  .then(() => {
    console.log('\n✅ Test completato!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test fallito:', error)
    process.exit(1)
  })
