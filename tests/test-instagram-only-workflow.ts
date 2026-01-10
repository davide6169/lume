/**
 * Test Workflow: Solo Instagram (NO LinkedIn)
 *
 * Obiettivo: Verificare se Instagram è sufficiente per il use case di CSV enrichment
 * senza dover usare LinkedIn (che richiede piano paid Apify)
 *
 * Input: CSV con 10 contatti brasiliani
 * Output: CSV enrichito con interessi (da Instagram bio/posts)
 */

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { InstagramSearchBlock } from './lib/workflow-engine/blocks/api/instagram-search.block'
import { InterestInferenceBlock } from './lib/workflow-engine/blocks/ai/interest-inference.block'
import { ContextFactory } from './lib/workflow-engine/context'

// Check API keys
if (!process.env.APIFY_API_KEY) {
  console.error('❌ ERRORE: APIFY_API_KEY non trovata in .env.local')
  process.exit(1)
}

if (!process.env.OPENROUTER_API_KEY) {
  console.error('❌ ERRORE: OPENROUTER_API_KEY non trovata in .env.local')
  process.exit(1)
}

console.log('✅ API keys caricate correttamente')

// Setup context
const context = ContextFactory.create({
  workflowId: 'test.instagramOnly',
  executionId: `test_instagram_${Date.now()}`,
  mode: 'production', // LIVE MODE
  secrets: {
    apify: process.env.APIFY_API_KEY || '',
    openrouter: process.env.OPENROUTER_API_KEY || ''
  }
})

// Initialize blocks
const instagramBlock = new InstagramSearchBlock()
const interestBlock = new InterestInferenceBlock()

/**
 * Parse CSV file
 */
function parseCSV(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())

  const headers = lines[0].split(';').map(h => h.trim())
  const contacts = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';').map(v => v.trim())
    const contact: any = {}

    headers.forEach((header, index) => {
      contact[header] = values[index] || ''
    })

    contacts.push(contact)
  }

  return { headers, contacts }
}

/**
 * Format contact for Instagram block
 */
function formatContactForInstagram(contact: any) {
  return {
    original: contact,
    nome: contact.nome,
    email: contact.email,
    country: 'BR' // Brasiliani
  }
}

/**
 * Format Instagram result for interest inference
 */
function formatInstagramForInterestInference(
  contact: any,
  instagramResult: any
) {
  const bioText = []

  if (instagramResult.bio) {
    bioText.push(instagramResult.bio)
  }

  if (instagramResult.posts && instagramResult.posts.length > 0) {
    const postsText = instagramResult.posts
      .map((p: any) => p.text)
      .filter((t: string) => t)
      .join(' | ')

    if (postsText) {
      bioText.push(postsText)
    }
  }

  return {
    original: contact,
    nome: contact.nome,
    bio: bioText.join('\n\n'),
    sources: instagramResult.found ? ['instagram'] : [],
    instagram: instagramResult.found ? {
      username: instagramResult.username,
      followers: instagramResult.followers,
      bio: instagramResult.bio
    } : undefined
  }
}

/**
 * Main test function
 */
async function runInstagramOnlyWorkflow() {
  const startTime = Date.now()

  console.log('='.repeat(80))
  console.log('🧪 TEST WORKFLOW: SOLO INSTAGRAM')
  console.log('='.repeat(80))
  console.log('')
  console.log('⚠️  MODALITÀ LIVE - Chiamate API REALI!')
  console.log('💰 Costo stimato: ~$0.050 per contatto (Instagram)')
  console.log('📊 Contatti da testare: 10')
  console.log('')

  // Parse CSV
  const csvPath = path.resolve(process.cwd(), 'test-contacts-only-instagram.csv')
  const { headers, contacts } = parseCSV(csvPath)

  console.log(`📄 CSV caricato: ${contacts.length} contatti`)
  console.log('')

  // Stats
  let instagramFound = 0
  let instagramNotFound = 0
  let interestsExtracted = 0
  let totalCost = 0
  const results: any[] = []

  // Process each contact
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i]
    const contactNum = i + 1

    console.log('─'.repeat(80))
    console.log(`👤 Contatto ${contactNum}/${contacts.length}: ${contact.nome}`)
    console.log(`   Email: ${contact.email}`)
    console.log('')

    // Step 1: Instagram Search
    console.log(`   📸 Instagram Search...`)

    try {
      const instagramResult = await instagramBlock.execute(
        {
          apiToken: process.env.APIFY_API_KEY || '',
          actor: 'apify/instagram-scraper',
          mode: 'live',
          maxResults: 5,
          includePosts: true, // Includiamo posts per better interest extraction
          maxPosts: 3
        },
        {
          contacts: [formatContactForInstagram(contact)]
        },
        context
      )

      if (instagramResult.status === 'completed' && instagramResult.output) {
        const contactData = instagramResult.output.contacts[0]
        const profile = contactData.instagram

        if (profile && profile.found) {
          instagramFound++
          totalCost += contactData.enrichmentMetadata?.cost || 0.050

          console.log(`      ✅ TROVATO!`)
          console.log(`      Username: @${profile.username}`)
          console.log(`      Followers: ${(profile.followers || 0).toLocaleString()}`)
          console.log(`      Bio: ${profile.bio?.substring(0, 80) || 'N/A'}${profile.bio && profile.bio.length > 80 ? '...' : ''}`)

          if (profile.posts && profile.posts.length > 0) {
            console.log(`      Posts: ${profile.posts.length} analizzati`)
          }

          // Step 2: Interest Inference
          console.log('')
          console.log(`   🧠 Interest Inference (LLM)...`)

          const interestInput = formatInstagramForInterestInference(contact, profile)

          const interestResult = await interestBlock.execute(
            {
              apiToken: process.env.OPENROUTER_API_KEY || '',
              model: 'google/gemma-2-27b-it',
              maxTokens: 100
            },
            {
              contacts: [interestInput]
            },
            context
          )

          if (interestResult.status === 'completed' && interestResult.output) {
            const interestData = interestResult.output.contacts[0]

            if (interestData.interests && interestData.interests.length > 0) {
              interestsExtracted++
              totalCost += interestData.cost || 0.010

              console.log(`      ✅ Interessi estratti!`)
              console.log(`      Interessi: ${interestData.interests.join(', ')}`)
            } else {
              console.log(`      ⚠️  Nessun interesse estratto`)
            }

            // Save result
            results.push({
              ...contact,
              instagram_username: profile.username,
              instagram_followers: profile.followers,
              instagram_bio: profile.bio?.substring(0, 100) || '',
              interests: interestData.interests?.join(', ') || ''
            })
          } else {
            console.log(`      ❌ Interest inference fallito`)
            results.push({
              ...contact,
              instagram_username: profile.username,
              instagram_followers: profile.followers,
              instagram_bio: profile.bio?.substring(0, 100) || '',
              interests: ''
            })
          }

        } else {
          instagramNotFound++
          console.log(`      ❌ NON TROVATO`)
          console.log(`      Motivo: ${profile?.error || 'Instagram username non trovato'}`)

          results.push({
            ...contact,
            instagram_username: '',
            instagram_followers: '',
            instagram_bio: '',
            interests: ''
          })
        }
      } else {
        instagramNotFound++
        console.log(`      ❌ Instagram search fallito`)
      }

    } catch (error: any) {
      instagramNotFound++
      console.log(`      ❌ Errore: ${error.message}`)

      results.push({
        ...contact,
        instagram_username: '',
        instagram_followers: '',
        instagram_bio: '',
        interests: ''
      })
    }

    console.log('')

    // Small delay between contacts
    if (i < contacts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // Final report
  const executionTime = Date.now() - startTime

  console.log('='.repeat(80))
  console.log('📊 REPORT FINALE')
  console.log('='.repeat(80))
  console.log('')
  console.log(`⏱️  Tempo totale: ${(executionTime / 1000).toFixed(2)} secondi`)
  console.log('')
  console.log(`📸 Instagram:`)
  console.log(`   ✅ Trovati: ${instagramFound}/${contacts.length} (${((instagramFound / contacts.length) * 100).toFixed(1)}%)`)
  console.log(`   ❌ Non trovati: ${instagramNotFound}/${contacts.length} (${((instagramNotFound / contacts.length) * 100).toFixed(1)}%)`)
  console.log('')
  console.log(`🧠 Interest Inference:`)
  console.log(`   ✅ Estratti: ${interestsExtracted}/${instagramFound} (${instagramFound > 0 ? ((interestsExtracted / instagramFound) * 100).toFixed(1) : 0}%)`)
  console.log('')
  console.log(`💰 Costi:`)
  console.log(`   Totale: $${totalCost.toFixed(3)}`)
  console.log(`   Per contatto: $${(totalCost / contacts.length).toFixed(3)}`)
  console.log('')

  // Success rate analysis
  console.log('='.repeat(80))
  console.log('📈 ANALISI SUCCESS RATE')
  console.log('='.repeat(80))
  console.log('')

  if (instagramFound >= 7) {
    console.log('✅ Instagram ALONE è SUFFICIENTE!')
    console.log(`   ${instagramFound}/10 contatti trovati su Instagram`)
    console.log('   LinkedIn non sarebbe indispensabile per questo use case')
  } else if (instagramFound >= 5) {
    console.log('⚠️  Instagram è QUASI sufficiente')
    console.log(`   ${instagramFound}/10 contatti trovati su Instagram`)
    console.log('   LinkedIn aggiungerebbe valore per ~30-40% dei contatti')
  } else {
    console.log('❌ Instagram da solo NON è sufficiente')
    console.log(`   Solo ${instagramFound}/10 contatti trovati su Instagram`)
    console.log('   LinkedIn sarebbe necessario per coprire più contatti')
  }

  console.log('')
  console.log('='.repeat(80))
  console.log('📄 RISULTATI DETTAGLIATI')
  console.log('='.repeat(80))
  console.log('')

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.nome}`)
    if (result.instagram_username) {
      console.log(`   Instagram: @${result.instagram_username} (${(result.instagram_followers || 0).toLocaleString()} followers)`)
      if (result.interests) {
        console.log(`   Interessi: ${result.interests}`)
      }
    } else {
      console.log(`   Instagram: Non trovato`)
    }
    console.log('')
  })

  // Save results to CSV
  const outputHeaders = [...headers, 'instagram_username', 'instagram_followers', 'instagram_bio', 'interests']
  const outputCSV = [
    outputHeaders.join(';'),
    ...results.map(r =>
      outputHeaders.map(h => r[h] || '').join(';')
    )
  ].join('\n')

  const outputPath = path.resolve(process.cwd(), 'test-contacts-instagram-only-output.csv')
  fs.writeFileSync(outputPath, outputCSV)

  console.log('='.repeat(80))
  console.log(`✅ CSV output salvato: test-contacts-instagram-only-output.csv`)
  console.log('='.repeat(80))
}

// Run test
runInstagramOnlyWorkflow()
  .then(() => {
    console.log('\n✅ Test completato!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test fallito:', error)
    process.exit(1)
  })
