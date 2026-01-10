/**
 * Test Singolo: Solo Instagram - Primo Contatto
 *
 * Test puntuale con SOLO il primo contatto (Rodrigo Antunes)
 * per verificare il funzionamento di Instagram search + interest inference
 */

import dotenv from 'dotenv'
import path from 'path'

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

console.log('✅ API keys caricate correttamente\n')

// Setup context
const context = ContextFactory.create({
  workflowId: 'test.instagramSingle',
  executionId: `test_instagram_single_${Date.now()}`,
  mode: 'production', // LIVE MODE - API REALI!
  secrets: {
    apify: process.env.APIFY_API_KEY || '',
    openrouter: process.env.OPENROUTER_API_KEY || ''
  }
})

// Initialize blocks
const instagramBlock = new InstagramSearchBlock()
const interestBlock = new InterestInferenceBlock()

// Single contact to test
const contact = {
  nome: 'Rodrigo Antunes',
  email: 'antunes_roata@hotmail.com',
  celular: '18981119378',
  nascimento: '21/02/1986',
  country: 'BR'
}

async function runSingleContactTest() {
  const startTime = Date.now()

  console.log('█'.repeat(80))
  console.log('  🧪 TEST SINGOLO: INSTAGRAM ONLY')
  console.log('█'.repeat(80))
  console.log('')
  console.log('⚠️  MODALITÀ LIVE - Chiamate API REALI!')
  console.log('')
  console.log('👤 CONTATTO DA TESTARE:')
  console.log(`   Nome: ${contact.nome}`)
  console.log(`   Email: ${contact.email}`)
  console.log(`   Celular: ${contact.celular}`)
  console.log(`   Nascimento: ${contact.nascimento}`)
  console.log(`   Country: ${contact.country}`)
  console.log('')
  console.log('─'.repeat(80))
  console.log('')

  // Step 1: Instagram Search
  console.log('📸 STEP 1: INSTAGRAM SEARCH')
  console.log('─'.repeat(80))
  console.log('')

  try {
    const instagramResult = await instagramBlock.execute(
      {
        apiToken: process.env.APIFY_API_KEY || '',
        actor: 'apify/instagram-scraper',
        mode: 'live',
        maxResults: 5,
        includePosts: true,
        maxPosts: 3
      },
      {
        contacts: [{
          original: contact,
          nome: contact.nome,
          email: contact.email,
          country: contact.country
        }]
      },
      context
    )

    if (instagramResult.status === 'completed' && instagramResult.output) {
      const contactData = instagramResult.output.contacts[0]
      const profile = contactData.instagram

      if (profile && profile.found) {
        const cost = contactData.enrichmentMetadata?.cost || 0

        console.log('✅ PROFILO INSTAGRAM TROVATO!')
        console.log('')
        console.log(`   Username: @${profile.username}`)
        console.log(`   Followers: ${(profile.followers || 0).toLocaleString()}`)
        console.log(`   Following: ${(profile.following || 0).toLocaleString()}`)
        console.log(`   Posts: ${(profile.postsCount || 0).toLocaleString()}`)
        console.log(`   Bio: ${profile.bio || 'N/A'}`)
        console.log(`   URL: ${profile.url || 'N/A'}`)
        console.log(`   Cost: $${cost.toFixed(3)}`)

        if (profile.posts && profile.posts.length > 0) {
          console.log('')
          console.log(`   📝 Posts analizzati: ${profile.posts.length}`)
          profile.posts.forEach((post: any, idx: number) => {
            console.log(`      ${idx + 1}. ${post.text?.substring(0, 80) || 'No text'}${post.text && post.text.length > 80 ? '...' : ''}`)
          })
        }

        console.log('')
        console.log('─'.repeat(80))
        console.log('')

        // Step 2: Interest Inference
        console.log('🧠 STEP 2: INTEREST INFERENCE (LLM)')
        console.log('─'.repeat(80))
        console.log('')

        const bioText = []
        if (profile.bio) bioText.push(profile.bio)
        if (profile.posts && profile.posts.length > 0) {
          const postsText = profile.posts
            .map((p: any) => p.text)
            .filter((t: string) => t)
            .join(' | ')
          if (postsText) bioText.push(postsText)
        }

        const interestInput = {
          original: contact,
          nome: contact.nome,
          bio: bioText.join('\n\n'),
          sources: ['instagram'],
          instagram: {
            username: profile.username,
            followers: profile.followers,
            bio: profile.bio
          }
        }

        console.log('Input per LLM:')
        console.log(`   Bio: ${interestInput.bio.substring(0, 200)}...`)
        console.log('')

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
          const llmCost = interestData.cost || 0

          console.log('✅ INTEREST INFERENCES COMPLETATO!')
          console.log('')

          if (interestData.interests && interestData.interests.length > 0) {
            console.log(`   Interessi trovati (${interestData.interests.length}):`)
            interestData.interests.forEach((interest: string, idx: number) => {
              console.log(`      ${idx + 1}. ${interest}`)
            })
          } else {
            console.log('   ⚠️  Nessun interesse estratto')
          }

          console.log('')
          console.log(`   LLM Cost: $${llmCost.toFixed(3)}`)
          console.log('')

          // Final report
          const totalCost = cost + llmCost
          const executionTime = Date.now() - startTime

          console.log('█'.repeat(80))
          console.log('  📊 REPORT FINALE')
          console.log('█'.repeat(80))
          console.log('')
          console.log(`⏱️  Tempo totale: ${(executionTime / 1000).toFixed(2)} secondi`)
          console.log('')
          console.log(`💰 Costi:`)
          console.log(`   Instagram: $${cost.toFixed(3)}`)
          console.log(`   LLM: $${llmCost.toFixed(3)}`)
          console.log(`   TOTALE: $${totalCost.toFixed(3)}`)
          console.log('')
          console.log(`✅ SUCCESS: Contatto "${contact.nome}" arricchito con successo!`)
          console.log('')
          console.log('📄 RIEPILOGO:')
          console.log(`   Instagram: @${profile.username}`)
          console.log(`   Followers: ${(profile.followers || 0).toLocaleString()}`)
          if (interestData.interests && interestData.interests.length > 0) {
            console.log(`   Interessi: ${interestData.interests.join(', ')}`)
          }
          console.log('')

        } else {
          console.log('❌ Interest inference fallito')
          console.log('')
        }

      } else {
        console.log('❌ PROFILO INSTAGRAM NON TROVATO')
        console.log(`   Motivo: ${profile?.error || 'Instagram username non trovato'}`)
        console.log('')
      }
    } else {
      console.log('❌ Instagram search fallito')
      console.log('')
    }

  } catch (error: any) {
    console.log('❌ ERRORE durante esecuzione:')
    console.log(`   ${error.message}`)
    console.log('')
  }

  console.log('█'.repeat(80))
}

// Run test
runSingleContactTest()
  .then(() => {
    console.log('\n✅ Test completato!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test fallito:', error)
    process.exit(1)
  })
