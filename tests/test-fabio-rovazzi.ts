/**
 * Test LIVE: Fabio Rovazzi Only
 *
 * Test Instagram e LinkedIn search per un solo contatto pubblico:
 * - Fabio Rovazzi (management@rovazzi.it)
 */

import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { InstagramSearchBlock } from './lib/workflow-engine/blocks/api/instagram-search.block'
import { LinkedInSearchBlock } from './lib/workflow-engine/blocks/api/linkedin-search.block'
import { ContextFactory } from './lib/workflow-engine/context'

// Check API keys
if (!process.env.APIFY_API_KEY) {
  console.error('❌ ERRORE: APIFY_API_KEY non trovata in .env.local')
  console.error('Assicurati di avere APIFY_API_KEY=sk-or-... nel file .env.local')
  process.exit(1)
}

console.log('✅ APIFY_API_KEY caricata correttamente')

// Setup
const context = ContextFactory.create({
  workflowId: 'test.csv.interestEnrichment',
  executionId: 'test_fabio_rovazzi',
  mode: 'production', // LIVE MODE - chiamate API reali!
  secrets: {
    apify: process.env.APIFY_API_KEY || '',
    openrouter: process.env.OPENROUTER_API_KEY || ''
  }
})

const instagramBlock = new InstagramSearchBlock()
const linkedinBlock = new LinkedInSearchBlock()

// Contatto da testare
const testContact = {
  original: {
    nome: 'Fabio Rovazzi',
    celular: '+393337654321',
    email: 'management@rovazzi.it',
    nascimento: '1993-01-01'
  },
  expected: {
    instagram: 'rovazzi',
    linkedin: 'fabio-rovazzi'
  }
}

console.log('='.repeat(80))
console.log('🧪 TEST LIVE: Fabio Rovazzi Only')
console.log('='.repeat(80))
console.log('')
console.log('⚠️  MODALITÀ LIVE - Verranno fatte chiamate API REALI ad Apify!')
console.log('💰 Costo stimato: ~$0.053 totali (Instagram + LinkedIn)')
console.log('')
console.log('⚙️  Ottimizzazioni attive:')
console.log('   - Instagram: includePosts=false (nessun post, solo bio)')
console.log('   - Instagram: username=lastname per artisti (rovazzi)')
console.log('   - LinkedIn: input corretto (urls instead of url)')
console.log('   - Timeout: 300 secondi per ricerca')
console.log('')
console.log('👤 Contatto da testare:')
console.log(`   Nome: ${testContact.original.nome}`)
console.log(`   Email: ${testContact.original.email}`)
console.log(`   Instagram atteso: @${testContact.expected.instagram}`)
console.log(`   LinkedIn atteso: linkedin.com/in/${testContact.expected.linkedin}`)
console.log('')
console.log('='.repeat(80))
console.log('')

async function runTest() {
  const startTime = Date.now()

  // Instagram Search
  console.log(`📸 Instagram Search per: ${testContact.original.nome}`)
  console.log(`   Username atteso: @${testContact.expected.instagram}`)
  console.log('')

  try {
    const instagramResult = await instagramBlock.execute(
      {
        apiToken: process.env.APIFY_API_KEY || '',
        actor: 'apify/instagram-scraper',
        mode: 'live',
        maxResults: 5,
        includePosts: false, // Disabilitato posts per velocizzare
        maxPosts: 0
      },
      {
        contacts: [testContact.original]
      },
      context
    )

    // Check if output exists
    if (!instagramResult.output || !instagramResult.output.contacts) {
      console.log('   ❌ OUTPUT NON VALIDO')
      if (instagramResult.error) {
        console.log(`   Errore: ${instagramResult.error.message}`)
      }
    } else {
      const contactData = instagramResult.output.contacts[0]

      if (contactData.instagram && contactData.instagram.found) {
        const profile = contactData.instagram
        console.log('   ✅ TROVATO!')
        console.log(`   Username: @${profile.username}`)
        console.log(`   Bio: ${profile.bio?.substring(0, 100)}${profile.bio && profile.bio.length > 100 ? '...' : ''}`)
        console.log(`   Followers: ${profile.followers?.toLocaleString() || 'N/A'}`)
        console.log(`   Following: ${profile.following?.toLocaleString() || 'N/A'}`)

        if (profile.posts && profile.posts.length > 0) {
          console.log(`   Posts: ${profile.posts.length} analizzati`)
          console.log('   Ultimi post:')
          profile.posts.slice(0, 2).forEach((post: any, idx: number) => {
            console.log(`     ${idx + 1}. ${post.caption?.substring(0, 60)}...`)
          })
        } else {
          console.log('   Posts: Nessun post analizzato')
        }
      } else {
        console.log('   ❌ NON TROVATO')
        console.log(`   Motivo: ${contactData.instagram?.error || 'Username non trovato'}`)
      }
    }
  } catch (error: any) {
    console.log('')
    console.log(`   ❌ ERRORE: ${error.message}`)
  }

  console.log('')
  console.log('─'.repeat(80))
  console.log('')

  // LinkedIn Search
  const isBusinessEmail = !testContact.original.email.includes('@gmail.com') &&
                         !testContact.original.email.includes('@yahoo.com') &&
                         !testContact.original.email.includes('@hotmail.com') &&
                         !testContact.original.email.includes('@outlook.com')

  if (isBusinessEmail) {
    console.log(`💼 LinkedIn Search per: ${testContact.original.nome}`)
    console.log(`   Email: ${testContact.original.email}`)
    console.log(`   Profile atteso: linkedin.com/in/${testContact.expected.linkedin}`)
    console.log('')

    try {
      const linkedinResult = await linkedinBlock.execute(
        {
          apiToken: process.env.APIFY_API_KEY || '',
          actor: 'supreme_coder/linkedin-profile-scraper',
          mode: 'live',
          maxResults: 1
        },
        {
          contacts: [testContact.original]
        },
        context
      )

      // Check if output exists
      if (!linkedinResult.output || !linkedinResult.output.contacts) {
        console.log('   ❌ OUTPUT NON VALIDO')
        if (linkedinResult.error) {
          console.log(`   Errore: ${linkedinResult.error.message}`)
        }
      } else {
        const contactData = linkedinResult.output.contacts[0]

        if (contactData.linkedin && contactData.linkedin.found) {
          const profile = contactData.linkedin
          console.log('   ✅ TROVATO!')
          console.log(`   Profile: ${profile.url}`)
          console.log(`   Headline: ${profile.headline?.substring(0, 100)}`)
          console.log(`   Location: ${profile.location || 'N/A'}`)
          console.log(`   Skills: ${profile.skills?.length || 0} trovate`)

          if (profile.skills && profile.skills.length > 0) {
            console.log('   Top skills:')
            profile.skills.slice(0, 5).forEach((skill: string, idx: number) => {
              console.log(`     ${idx + 1}. ${skill}`)
            })
          }

          if (profile.bio) {
            console.log(`   Bio: ${profile.bio.substring(0, 150)}...`)
          }
        } else {
          console.log('   ❌ NON TROVATO')
          console.log(`   Motivo: ${contactData.linkedin?.error || 'Profilo non trovato'}`)
        }
      }
    } catch (error: any) {
      console.log('')
      console.log(`   ❌ ERRORE: ${error.message}`)
    }
  } else {
    console.log(`💼 LinkedIn Search: SKIPPED (email personale)`)
  }

  // Riepilogo finale
  const executionTime = Date.now() - startTime

  console.log('')
  console.log('='.repeat(80))
  console.log('📊 RIEPILOGO FINALE')
  console.log('='.repeat(80))
  console.log('')
  console.log(`⏱️  Tempo totale: ${(executionTime / 1000).toFixed(2)} secondi`)
  console.log('')
  console.log(`👤 Contatto testato: ${testContact.original.nome}`)
  console.log(`   Email: ${testContact.original.email}`)
  console.log('')
  console.log('='.repeat(80))
}

// Esegui test
runTest()
  .then(() => {
    console.log('\n✅ Test completato!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test fallito:', error)
    process.exit(1)
  })
