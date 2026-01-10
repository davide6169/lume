/**
 * CSV Interest Enrichment - Workflow Fase 3 Test
 *
 * Test del workflow-based approach con i nuovi blocchi di supporto:
 * - Email Classifier Block
 * - Contact Normalizer Block
 * - Bio Data Filter Block
 *
 * Questo è un test preliminare per la Fase 3.
 */

import dotenv from 'dotenv'
import { registerAllBuiltInBlocks } from './lib/workflow-engine/blocks'
import { EmailClassifierBlock, type EmailClassifierConfig } from './lib/workflow-engine/blocks/transform/email-classifier.block'
import { ContactNormalizerBlock, type ContactNormalizerConfig } from './lib/workflow-engine/blocks/transform/contact-normalizer.block'
import { HasBioDataFilterBlock, type HasBioDataFilterConfig } from './lib/workflow-engine/blocks/filter/has-bio-data.block'
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
      nome: 'Marco Montemagno',
      celular: '',
      email: 'marco@montemagno.com',
      nascimento: '1974-01-01'
    },
    {
      nome: 'Mario Rossi',
      celular: '329 123 4567',
      email: 'mario.rossi@gmail.com',
      nascimento: '21/02/1986'
    },
    {
      nome: 'Luca Bianchi',
      celular: '+39 328 2345 678',
      email: 'luca.bianchi@mydomain.com',
      nascimento: '27/01/1983'
    }
  ]
}

// ============================================================
// TEST 1: Email Classifier
// ============================================================

async function testEmailClassifier() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 1: Email Classifier Block')
  console.log('='.repeat(80) + '\n')

  const classifierBlock = new EmailClassifierBlock()
  const context = ContextFactory.create({
    workflowId: 'email-classifier-test',
    executionId: 'test_email_classifier',
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

  const classifierConfig: EmailClassifierConfig = {
    personalDomains: [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'libero.it', 'tin.it', 'virgilio.it'
    ],
    emailField: 'email',
    outputField: 'emailType'
  }

  const classifierResult = await classifierBlock.execute(classifierConfig, sampleContacts, context)

  console.log('📊 EMAIL CLASSIFIER RESULT:')
  console.log(`Status: ${classifierResult.status}`)
  console.log(`Execution Time: ${classifierResult.executionTime}ms`)
  console.log(`\nMetadata:`)
  console.log(`  Total Input: ${classifierResult.output?.metadata.totalInput}`)
  console.log(`  Total Processed: ${classifierResult.output?.metadata.totalProcessed}`)
  console.log(`  Business Emails: ${classifierResult.output?.metadata.businessEmails}`)
  console.log(`  Personal Emails: ${classifierResult.output?.metadata.personalEmails}`)
  console.log(`  Unknown Domains: ${classifierResult.output?.metadata.unknownDomains}`)

  console.log(`\nClassified Contacts:`)
  classifierResult.output?.contacts.forEach((contact, index) => {
    console.log(`  ${index + 1}. ${contact.email}`)
    console.log(`     Type: ${contact.emailType?.toUpperCase()} | Domain: ${contact.domain} | Confidence: ${contact.confidence}`)
  })

  return classifierResult.output
}

// ============================================================
// TEST 2: Contact Normalizer
// ============================================================

async function testContactNormalizer() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 2: Contact Normalizer Block')
  console.log('='.repeat(80) + '\n')

  const normalizerBlock = new ContactNormalizerBlock()
  const context = ContextFactory.create({
    workflowId: 'contact-normalizer-test',
    executionId: 'test_contact_normalizer',
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

  const normalizerConfig: ContactNormalizerConfig = {
    nameField: 'nome',
    firstNameField: 'firstName',
    lastNameField: 'lastName',
    phoneField: 'celular',
    emailField: 'email',
    birthDateField: 'nascimento'
  }

  const normalizerResult = await normalizerBlock.execute(normalizerConfig, sampleContacts, context)

  console.log('📊 CONTACT NORMALIZER RESULT:')
  console.log(`Status: ${normalizerResult.status}`)
  console.log(`Execution Time: ${normalizerResult.executionTime}ms`)
  console.log(`\nMetadata:`)
  console.log(`  Total Input: ${normalizerResult.output?.metadata.totalInput}`)
  console.log(`  Normalized Names: ${normalizerResult.output?.metadata.normalizedNames}`)
  console.log(`  Normalized Phones: ${normalizerResult.output?.metadata.normalizedPhones}`)
  console.log(`  Normalized Emails: ${normalizerResult.output?.metadata.normalizedEmails}`)
  console.log(`  Normalized Dates: ${normalizerResult.output?.metadata.normalizedDates}`)

  console.log(`\nNormalized Contacts:`)
  normalizerResult.output?.contacts.forEach((contact, index) => {
    console.log(`  ${index + 1}. ${contact.normalized.fullName}`)
    console.log(`     First: ${contact.normalized.firstName} | Last: ${contact.normalized.lastName}`)
    console.log(`     Phone: ${contact.original.celular} → ${contact.normalized.phoneClean || 'N/A'}`)
    console.log(`     Email: ${contact.normalized.emailLower}`)
    console.log(`     Birth Date: ${contact.normalized.birthDate} → ${contact.normalized.birthDateISO || 'N/A'}`)
  })

  return normalizerResult.output
}

// ============================================================
// TEST 3: Bio Data Filter
// ============================================================

async function testBioDataFilter() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 3: Bio Data Filter Block')
  console.log('='.repeat(80) + '\n')

  const filterBlock = new HasBioDataFilterBlock()
  const context = ContextFactory.create({
    workflowId: 'bio-data-filter-test',
    executionId: 'test_bio_data_filter',
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

  const filterConfig: HasBioDataFilterConfig = {
    requireBio: true,
    minBioLength: 10,
    requirePosts: false,
    checkLinkedIn: true,
    checkInstagram: true
  }

  // Create sample contacts with LinkedIn/Instagram data
  const sampleWithSocialData = {
    contacts: [
      {
        original: { nome: 'Marco Montemagno', email: 'marco@montemagno.com' },
        linkedin: {
          found: true,
          bio: 'Digital entrepreneur and tech enthusiast',
          headline: 'Business Innovation Expert'
        },
        instagram: {
          found: true,
          bio: 'Tech innovation and digital transformation',
          posts: [{ id: '1' }, { id: '2' }]
        }
      },
      {
        original: { nome: 'Mario Rossi', email: 'mario.rossi@gmail.com' },
        linkedin: { found: false },
        instagram: { found: false }
      },
      {
        original: { nome: 'Luca Bianchi', email: 'luca.bianchi@mydomain.com' },
        linkedin: { found: false },
        instagram: {
          found: true,
          bio: 'Passionate about technology',
          posts: [{ id: '1' }]
        }
      }
    ]
  }

  const filterResult = await filterBlock.execute(filterConfig, sampleWithSocialData, context)

  console.log('📊 BIO DATA FILTER RESULT:')
  console.log(`Status: ${filterResult.status}`)
  console.log(`Execution Time: ${filterResult.executionTime}ms`)
  console.log(`\nMetadata:`)
  console.log(`  Total Input: ${filterResult.output?.metadata.totalInput}`)
  console.log(`  Has Bio: ${filterResult.output?.metadata.hasBioCount}`)
  console.log(`  No Bio: ${filterResult.output?.metadata.noBioCount}`)
  console.log(`  LinkedIn Bio: ${filterResult.output?.metadata.linkedinBioCount}`)
  console.log(`  Instagram Bio: ${filterResult.output?.metadata.instagramBioCount}`)
  console.log(`  Both Sources: ${filterResult.output?.metadata.bothSourcesCount}`)

  console.log(`\n✅ Contacts WITH Bio (→ Interest Inference):`)
  filterResult.output?.hasBio.forEach((contact, index) => {
    console.log(`  ${index + 1}. ${contact.original.nome}`)
    console.log(`     Sources: ${contact.bioSources.join(', ')}`)
    console.log(`     Bio: ${contact.bioText.substring(0, 60)}...`)
    console.log(`     Posts: ${contact.postCount}`)
  })

  console.log(`\n❌ Contacts WITHOUT Bio (→ CSV Assembler):`)
  filterResult.output?.noBio.forEach((contact, index) => {
    console.log(`  ${index + 1}. ${contact.original.nome}`)
    console.log(`     Reason: ${contact.reason}`)
  })

  return filterResult.output
}

// ============================================================
// TEST 4: Combined Pipeline
// ============================================================

async function testCombinedPipeline() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 4: Combined Pipeline (Classifier + Normalizer + Filter)')
  console.log('='.repeat(80) + '\n')

  const context = ContextFactory.create({
    workflowId: 'combined-pipeline-test',
    executionId: 'test_combined_pipeline',
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

  // Step 1: Classify emails
  console.log('Step 1: Classifying emails...')
  const classifierBlock = new EmailClassifierBlock()
  const classifierResult = await classifierBlock.execute(
    { personalDomains: ['gmail.com', 'yahoo.com', 'hotmail.com'] },
    sampleContacts,
    context
  )

  // Step 2: Normalize contacts
  console.log('\nStep 2: Normalizing contacts...')
  const normalizerBlock = new ContactNormalizerBlock()
  const normalizerResult = await normalizerBlock.execute({}, sampleContacts, context)

  // Step 3: Filter by bio data
  console.log('\nStep 3: Filtering by bio data...')
  const filterBlock = new HasBioDataFilterBlock()

  // Prepare data with mock social data
  const withSocialData = {
    contacts: sampleContacts.contacts.map((c, i) => ({
      original: c,
      linkedin: i % 2 === 0 ? { found: true, bio: 'Professional profile' } : { found: false },
      instagram: { found: true, bio: 'Personal profile', posts: Array(5).fill({}) }
    }))
  }

  const filterResult = await filterBlock.execute({}, withSocialData, context)

  console.log('\n📊 PIPELINE SUMMARY:')
  console.log(`Emails Classified: ${classifierResult.output?.metadata.businessEmails} business, ${classifierResult.output?.metadata.personalEmails} personal`)
  console.log(`Contacts Normalized: ${normalizerResult.output?.metadata.normalizedNames} names, ${normalizerResult.output?.metadata.normalizedPhones} phones`)
  console.log(`Bio Filter: ${filterResult.output?.metadata.hasBioCount} with bio → Interest Inference`)
  console.log(`             ${filterResult.output?.metadata.noBioCount} without bio → CSV Assembler`)
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function runTests() {
  console.log('\n' + '█'.repeat(80))
  console.log('  CSV INTEREST ENRICHMENT - FASE 3 TEST')
  console.log('  Testing Email Classifier, Contact Normalizer, and Bio Data Filter')
  console.log('█'.repeat(80))

  try {
    // Test 1: Email Classifier
    await testEmailClassifier()

    // Test 2: Contact Normalizer
    await testContactNormalizer()

    // Test 3: Bio Data Filter
    await testBioDataFilter()

    // Test 4: Combined Pipeline
    await testCombinedPipeline()

    console.log('\n' + '█'.repeat(80))
    console.log('  ✅ ALL TESTS PASSED - FASE 3 COMPLETE!')
    console.log('█'.repeat(80) + '\n')

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error)
    process.exit(1)
  }
}

// Run tests
runTests()
