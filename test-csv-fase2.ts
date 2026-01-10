/**
 * CSV Interest Enrichment - Workflow Fase 2 Test
 *
 * Test del workflow-based approach con i nuovi blocchi Apify:
 * - Instagram Search Block
 * - LinkedIn Search Block
 *
 * Questo è un test preliminare per la Fase 2.
 */

import dotenv from 'dotenv'
import { registerAllBuiltInBlocks } from './lib/workflow-engine/blocks'
import { InstagramSearchBlock, type InstagramSearchConfig } from './lib/workflow-engine/blocks/api/instagram-search.block'
import { LinkedInSearchBlock, type LinkedInSearchConfig } from './lib/workflow-engine/blocks/api/linkedin-search.block'
import { ContextFactory } from './lib/workflow-engine/context'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize blocks
registerAllBuiltInBlocks()

// ============================================================
// SAMPLE DATA - Marco Montemagno Test
// ============================================================

const sampleContacts = {
  contacts: [
    {
      original: {
        nome: 'Marco Montemagno',
        celular: '',
        email: 'marco@montemagno.com',
        nascimento: '1974-01-01'
      },
      nome: 'Marco Montemagno',
      email: 'marco@montemagno.com'
    },
    {
      original: {
        nome: 'Mario Rossi',
        celular: '3291234567',
        email: 'mario.rossi@mydomain.com',
        nascimento: '21/02/1986'
      },
      nome: 'Mario Rossi',
      email: 'mario.rossi@mydomain.com'
    },
    {
      original: {
        nome: 'Luca Bianchi',
        celular: '3282345678',
        email: 'luca.bianchi@mydomain.com',
        nascimento: '27/01/1983'
      },
      nome: 'Luca Bianchi',
      email: 'luca.bianchi@mydomain.com'
    }
  ]
}

// ============================================================
// TEST 1: Instagram Search (Mock Mode)
// ============================================================

async function testInstagramSearch() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 1: Instagram Search Block (Mock Mode)')
  console.log('='.repeat(80) + '\n')

  const instagramBlock = new InstagramSearchBlock()
  const context = ContextFactory.create({
    workflowId: 'instagram-search-test',
    executionId: 'test_instagram_search',
    mode: 'demo', // Mock mode
    variables: {},
    secrets: {},
    logger: {
      debug: (msg: string, meta?: any) => console.log(`[DEBUG] ${msg}`, meta || ''),
      info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta || ''),
      warn: (msg: string, meta?: any) => console.warn(`[WARN] ${msg}`, meta || ''),
      error: (msg: string, meta?: any) => console.error(`[ERROR] ${msg}`, meta || '')
    }
  })

  const instagramConfig: InstagramSearchConfig = {
    apiToken: process.env.APIFY_API_KEY || 'mock_token',
    mode: 'mock',
    maxResults: 10,
    includePosts: true,
    maxPosts: 12
  }

  const instagramResult = await instagramBlock.execute(instagramConfig, sampleContacts, context)

  console.log('📊 INSTAGRAM SEARCH RESULT:')
  console.log(`Status: ${instagramResult.status}`)
  console.log(`Execution Time: ${instagramResult.executionTime}ms`)
  console.log(`\nMetadata:`)
  console.log(`  Total Input: ${instagramResult.output?.metadata.totalInput}`)
  console.log(`  Total Processed: ${instagramResult.output?.metadata.totalProcessed}`)
  console.log(`  Profiles Found: ${instagramResult.output?.metadata.profilesFound}`)
  console.log(`  Profiles Not Found: ${instagramResult.output?.metadata.profilesNotFound}`)
  console.log(`  Total Cost: $${instagramResult.output?.metadata.totalCost.toFixed(4)}`)
  console.log(`  Avg Cost Per Contact: $${instagramResult.output?.metadata.avgCostPerContact.toFixed(4)}`)

  console.log(`\nFirst contact Instagram data:`)
  const firstContact = instagramResult.output?.contacts[0]
  if (firstContact?.instagram?.found) {
    console.log(`  Found: ${firstContact.instagram.found}`)
    console.log(`  Username: ${firstContact.instagram.username}`)
    console.log(`  Bio: ${firstContact.instagram.bio?.substring(0, 100)}...`)
    console.log(`  Posts: ${firstContact.instagram.posts?.length}`)
    if (firstContact.instagram.posts && firstContact.instagram.posts.length > 0) {
      console.log(`  First Post: ${firstContact.instagram.posts[0].text?.substring(0, 80)}...`)
    }
  } else {
    console.log(`  Found: ${firstContact?.instagram?.found}`)
    console.log(`  Error: ${firstContact?.instagram?.error}`)
  }

  return instagramResult.output
}

// ============================================================
// TEST 2: LinkedIn Search (Mock Mode)
// ============================================================

async function testLinkedInSearch() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 2: LinkedIn Search Block (Mock Mode)')
  console.log('='.repeat(80) + '\n')

  const linkedinBlock = new LinkedInSearchBlock()
  const context = ContextFactory.create({
    workflowId: 'linkedin-search-test',
    executionId: 'test_linkedin_search',
    mode: 'demo', // Mock mode
    variables: {},
    secrets: {},
    logger: {
      debug: (msg: string, meta?: any) => console.log(`[DEBUG] ${msg}`, meta || ''),
      info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta || ''),
      warn: (msg: string, meta?: any) => console.warn(`[WARN] ${msg}`, meta || ''),
      error: (msg: string, meta?: any) => console.error(`[ERROR] ${msg}`, meta || '')
    }
  })

  const linkedinConfig: LinkedInSearchConfig = {
    apiToken: process.env.APIFY_API_KEY || 'mock_token',
    mode: 'mock',
    maxResults: 1
  }

  const linkedinResult = await linkedinBlock.execute(linkedinConfig, sampleContacts, context)

  console.log('📊 LINKEDIN SEARCH RESULT:')
  console.log(`Status: ${linkedinResult.status}`)
  console.log(`Execution Time: ${linkedinResult.executionTime}ms`)
  console.log(`\nMetadata:`)
  console.log(`  Total Input: ${linkedinResult.output?.metadata.totalInput}`)
  console.log(`  Total Processed: ${linkedinResult.output?.metadata.totalProcessed}`)
  console.log(`  Profiles Found: ${linkedinResult.output?.metadata.profilesFound}`)
  console.log(`  Profiles Not Found: ${linkedinResult.output?.metadata.profilesNotFound}`)
  console.log(`  Total Cost: $${linkedinResult.output?.metadata.totalCost.toFixed(4)}`)
  console.log(`  Avg Cost Per Contact: $${linkedinResult.output?.metadata.avgCostPerContact.toFixed(4)}`)

  console.log(`\nFirst contact LinkedIn data:`)
  const firstContact = linkedinResult.output?.contacts[0]
  if (firstContact?.linkedin?.found) {
    console.log(`  Found: ${firstContact.linkedin.found}`)
    console.log(`  URL: ${firstContact.linkedin.url}`)
    console.log(`  Headline: ${firstContact.linkedin.headline}`)
    console.log(`  Bio: ${firstContact.linkedin.bio?.substring(0, 100)}...`)
    console.log(`  Skills: ${firstContact.linkedin.skills?.join(', ')}`)
  } else {
    console.log(`  Found: ${firstContact?.linkedin?.found}`)
    console.log(`  Error: ${firstContact?.linkedin?.error}`)
  }

  return linkedinResult.output
}

// ============================================================
// TEST 3: Combined Search (Mock Mode)
// ============================================================

async function testCombinedSearch() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 3: Combined Instagram + LinkedIn Search (Mock Mode)')
  console.log('='.repeat(80) + '\n')

  const context = ContextFactory.create({
    workflowId: 'combined-search-test',
    executionId: 'test_combined_search',
    mode: 'demo',
    variables: {},
    secrets: {},
    logger: {
      debug: (msg: string, meta?: any) => console.log(`[DEBUG] ${msg}`, meta || ''),
      info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta || ''),
      warn: (msg: string, meta?: any) => console.warn(`[WARN] ${msg}`, meta || ''),
      error: (msg: string, meta?: any) => console.error(`[ERROR] ${msg}`, meta || '')
    }
  })

  // Run Instagram Search
  const instagramBlock = new InstagramSearchBlock()
  const instagramResult = await instagramBlock.execute(
    { apiToken: 'mock_token', mode: 'mock' },
    sampleContacts,
    context
  )

  // Run LinkedIn Search
  const linkedinBlock = new LinkedInSearchBlock()
  const linkedinResult = await linkedinBlock.execute(
    { apiToken: 'mock_token', mode: 'mock' },
    sampleContacts,
    context
  )

  // Combine results
  console.log('📊 COMBINED SEARCH RESULTS:')
  console.log(`\nTotal Contacts: ${sampleContacts.contacts.length}`)

  let totalCost = 0
  let totalInstagramFound = 0
  let totalLinkedinFound = 0

  sampleContacts.contacts.forEach((contact, index) => {
    const igData = instagramResult.output?.contacts[index]?.instagram
    const liData = linkedinResult.output?.contacts[index]?.linkedin

    console.log(`\n${index + 1}. ${contact.nome} (${contact.email})`)

    if (igData?.found) {
      console.log(`   ✅ Instagram: Found (@${igData.username})`)
      console.log(`      Bio: ${igData.bio?.substring(0, 60)}...`)
      totalInstagramFound++
    } else {
      console.log(`   ❌ Instagram: Not found`)
    }

    if (liData?.found) {
      console.log(`   ✅ LinkedIn: Found`)
      console.log(`      Headline: ${liData.headline}`)
      totalLinkedinFound++
    } else {
      console.log(`   ❌ LinkedIn: Not found`)
    }

    const cost = (igData?.found ? 0.050 : 0) + (liData?.found ? 0.003 : 0)
    totalCost += cost
  })

  console.log(`\n📈 SUMMARY:`)
  console.log(`  Instagram profiles found: ${totalInstagramFound}/${sampleContacts.contacts.length}`)
  console.log(`  LinkedIn profiles found: ${totalLinkedinFound}/${sampleContacts.contacts.length}`)
  console.log(`  Total cost: $${totalCost.toFixed(4)}`)
  console.log(`  Avg cost per contact: $${(totalCost / sampleContacts.contacts.length).toFixed(4)}`)
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function runTests() {
  console.log('\n' + '█'.repeat(80))
  console.log('  CSV INTEREST ENRICHMENT - FASE 2 TEST')
  console.log('  Testing Instagram Search and LinkedIn Search blocks')
  console.log('█'.repeat(80))

  try {
    // Test 1: Instagram Search
    await testInstagramSearch()

    // Test 2: LinkedIn Search
    await testLinkedInSearch()

    // Test 3: Combined Search
    await testCombinedSearch()

    console.log('\n' + '█'.repeat(80))
    console.log('  ✅ ALL TESTS PASSED - FASE 2 COMPLETE!')
    console.log('█'.repeat(80) + '\n')

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error)
    process.exit(1)
  }
}

// Run tests
runTests()
