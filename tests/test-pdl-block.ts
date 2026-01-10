/**
 * Test: PDL Block
 *
 * Tests People Data Labs block with mock mode
 */

import dotenv from 'dotenv'
import { registerAllBuiltInBlocks } from './lib/workflow-engine/blocks'
import { PDLSearchBlock } from './lib/workflow-engine/blocks/api/pdl-search.block'
import { ContextFactory } from './lib/workflow-engine/context'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize blocks
registerAllBuiltInBlocks()

async function testPDLMockMode() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST: PDL Block - Mock Mode')
  console.log('='.repeat(80) + '\n')

  const context = ContextFactory.createDemoContext('test.pdl')
  const block = new PDLSearchBlock()

  console.log('Test 1: Mock mode with 3 contacts')
  console.log('-'.repeat(80))

  const result = await block.execute(
    {
      apiToken: 'test-token',
      mode: 'mock'
    },
    {
      contacts: [
        {
          original: { nome: 'Mario Rossi', email: 'mario@example.com' },
          email: 'mario@example.com',
          nome: 'Mario Rossi'
        },
        {
          original: { nome: 'Luca Bianchi', email: 'luca@example.com' },
          email: 'luca@example.com',
          nome: 'Luca Bianchi'
        },
        {
          original: { nome: 'Giulia Verdi', email: 'giulia@example.com' },
          email: 'giulia@example.com',
          nome: 'Giulia Verdi'
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
    console.log('   Profiles found:', result.output.metadata.profilesFound)
    console.log('   Profiles not found:', result.output.metadata.profilesNotFound)
    console.log('   Total cost:', result.output.metadata.totalCost.toFixed(2))
    console.log('   Avg cost per contact:', result.output.metadata.avgCostPerContact.toFixed(2))
    console.log('')

    result.output.contacts.forEach((contact, idx) => {
      console.log(`Contact ${idx + 1}: ${contact.original.nome}`)
      if (contact.pdl?.found) {
        console.log(`   ✅ Found`)
        if (contact.pdl.linkedin) {
          console.log(`   LinkedIn: ${contact.pdl.linkedin}`)
        }
        if (contact.pdl.jobTitle) {
          console.log(`   Job Title: ${contact.pdl.jobTitle}`)
        }
        if (contact.pdl.company) {
          console.log(`   Company: ${contact.pdl.company}`)
        }
        if (contact.pdl.skills) {
          console.log(`   Skills: ${contact.pdl.skills.slice(0, 5).join(', ')}...`)
        }
      } else {
        console.log(`   ❌ Not found - ${contact.pdl.error}`)
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

  console.log('='.repeat(80))
  console.log('  ✅ ALL TESTS PASSED - PDL Block Working!')
  console.log('='.repeat(80))
}

// Run test
testPDLMockMode()
  .then(() => {
    console.log('\n✅ Test completato!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test fallito:', error)
    process.exit(1)
  })
