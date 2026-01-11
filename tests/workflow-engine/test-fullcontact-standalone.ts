/**
 * Test standalone FullContact API
 *
 * Chiama direttamente il blocco FullContact senza workflow
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { FullContactSearchBlock } from '../../lib/workflow-engine/blocks/api/fullcontact-search.block'
import { ContextFactory } from '../../lib/workflow-engine/context'

async function testFullContactStandalone() {
  console.log('╔══════════════════════════════════════════════════════════════════╗')
  console.log('║     FullContact API Standalone Test                            ║')
  console.log('╚══════════════════════════════════════════════════════════════════╝')
  console.log()

  // Get API key from environment
  const fullcontactApiKey = process.env.FULLCONTACT_API_KEY

  if (!fullcontactApiKey || fullcontactApiKey === 'your-api-key-here') {
    console.error('❌ FULLCONTACT_API_KEY non trovata!')
    console.error('Aggiungi al file .env.local:')
    console.error('   FULLCONTACT_API_KEY=la-tua-api-key-qui')
    process.exit(1)
  }

  console.log('⚙️  Configuration:')
  console.log('   Mode: LIVE (real API calls)')
  console.log('   API KEY: ' + fullcontactApiKey.substring(0, 10) + '...' + fullcontactApiKey.substring(fullcontactApiKey.length - 4))
  console.log()

  // Create context
  const context = ContextFactory.create({
    workflowId: 'test-fullcontact-standalone',
    executionId: `test-standalone-${Date.now()}`,
    mode: 'live',
    variables: {},
    secrets: {
      FULLCONTACT_API_KEY: fullcontactApiKey
    },
    logger: {
      node: (nodeId: string, msg: string, meta?: any) => console.log(`  [${nodeId}] ${msg}`, meta ? JSON.stringify(meta, null, 2) : ''),
      debug: (msg: string, meta?: any) => console.log(`  [DEBUG] ${msg}`, meta ? JSON.stringify(meta, null, 2) : ''),
      info: (msg: string, meta?: any) => console.log(`  [INFO] ${msg}`, meta ? JSON.stringify(meta, null, 2) : ''),
      warn: (msg: string, meta?: any) => console.log(`  [WARN] ⚠️  ${msg}`, meta ? JSON.stringify(meta, null, 2) : ''),
      error: (msg: string, meta?: any) => console.log(`  [ERROR] ❌ ${msg}`, meta ? JSON.stringify(meta, null, 2) : '')
    }
  })

  // Create block instance
  const block = new FullContactSearchBlock()

  // Prepare input
  const input = {
    contacts: [
      {
        original: {
          nome: 'Davide Cucciniello',
          email: 'davide6169@gemail.com',
          nascimento: '1969-01-06'
        },
        email: 'davide6169@gemail.com',
        nome: 'Davide Cucciniello'
      }
    ]
  }

  // Prepare config (use real API key directly since we're calling block directly)
  const config = {
    apiToken: fullcontactApiKey,
    mode: 'live' as const,
    timeout: 30000
  }

  console.log('📥 Input Contact:')
  console.log('─'.repeat(70))
  console.log(`   Davide Cucciniello <davide6169@gemail.com>`)
  console.log('─'.repeat(70))
  console.log()

  console.log('🚀 Calling FullContact API...')
  console.log('═'.repeat(70))
  console.log()

  try {
    const result = await block.execute(config, input, context)

    console.log()
    console.log('═'.repeat(70))
    console.log('✅ FULLCONTACT API CALL COMPLETED')
    console.log('═'.repeat(70))
    console.log()

    console.log('📊 Result:')
    console.log(`   Status: ${result.status}`)
    console.log(`   Execution Time: ${result.executionTime}ms`)

    if (result.output) {
      const contact = result.output.contacts[0]
      console.log()
      console.log('👤 Enriched Contact:')
      console.log(`   Found: ${contact.fullcontact?.found || false}`)

      if (contact.fullcontact?.profiles) {
        console.log(`   Profiles: ${JSON.stringify(contact.fullcontact.profiles, null, 2)}`)
      }

      if (contact.fullcontact?.demographics) {
        console.log(`   Demographics: ${JSON.stringify(contact.fullcontact.demographics, null, 2)}`)
      }

      if (contact.fullcontact?.interests) {
        console.log(`   Interests: ${JSON.stringify(contact.fullcontact.interests, null, 2)}`)
      }

      if (contact.fullcontact?.error) {
        console.log(`   Error: ${contact.fullcontact.error}`)
      }
    }

    console.log()
    console.log('═'.repeat(70))
    console.log('📁 Check /tmp/fullcontact-api-log.json for full request/response')
    console.log('═'.repeat(70))

  } catch (error) {
    console.log()
    console.log('═'.repeat(70))
    console.log('❌ TEST FAILED')
    console.log('═'.repeat(70))
    console.error(error)
    process.exit(1)
  }
}

testFullContactStandalone().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
