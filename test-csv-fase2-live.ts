/**
 * Test LIVE: CSV Interest Enrichment - Fase 2
 *
 * Test Instagram e LinkedIn search con 3 contatti pubblici italiani:
 * 1. Marco Montemagno (marco@montemagno.com)
 * 2. Chiara Ferragni (business email)
 * 3. Fabio Rovazzi (business email)
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
  executionId: 'test_live_phase2_3contacts',
  mode: 'production', // LIVE MODE - chiamate API reali!
  secrets: {
    apify: process.env.APIFY_API_KEY || '',
    openrouter: process.env.OPENROUTER_API_KEY || ''
  }
})

const instagramBlock = new InstagramSearchBlock()
const linkedinBlock = new LinkedInSearchBlock()

// 3 contatti pubblici italiani
const testContacts = [
  {
    original: {
      nome: 'Marco Montemagno',
      celular: '+393331234567',
      email: 'marco@montemagno.com',
      nascimento: '1974-01-01'
    },
    expected: {
      instagram: 'marcomontemagno',
      linkedin: 'marcomontemagno'
    }
  },
  {
    original: {
      nome: 'Chiara Ferragni',
      celular: '',
      email: 'info@chiaraferagni.com', // Business email
      nascimento: '1987-05-07'
    },
    expected: {
      instagram: 'chiaraferragni',
      linkedin: 'chiara-ferragni'
    }
  },
  {
    original: {
      nome: 'Fabio Rovazzi',
      celular: '+393337654321',
      email: 'management@rovazzi.it', // Business email
      nascimento: '1993-01-01'
    },
    expected: {
      instagram: 'rovazzi',
      linkedin: 'fabio-rovazzi'
    }
  }
]

console.log('='.repeat(80))
console.log('🧪 TEST LIVE - FASE 2: Instagram & LinkedIn Search (3 Contatti Pubblici)')
console.log('='.repeat(80))
console.log('')
console.log('⚠️  MODALITÀ LIVE - Verranno fatte chiamate API REALI ad Apify!')
console.log('💰 Costo stimato: ~$0.159 totali (3 × Instagram + 2 × LinkedIn)')
console.log('⚙️  Ottimizzazioni attive:')
console.log('   - Instagram: maxPosts=2 (ridotto per evitare timeout)')
console.log('   - LinkedIn: input corretto (urls instead of url)')
console.log('   - Timeout: 300 secondi per ricerca')
console.log('')
console.log('⚠️  NOTA: Se ricevi errore "Monthly usage hard limit exceeded",')
console.log('   il piano Apify ha raggiunto il limite mensile.')
console.log('')
console.log('📋 Contatti da testare:')
console.log('   1. Marco Montemagno (marco@montemagno.com)')
console.log('      Instagram: @marcomontemagno')
console.log('      LinkedIn: linkedin.com/in/marcomontemagno')
console.log('')
console.log('   2. Chiara Ferragni (info@chiaraferagni.com)')
console.log('      Instagram: @chiaraferragni')
console.log('      LinkedIn: linkedin.com/in/chiara-ferragni')
console.log('')
console.log('   3. Fabio Rovazzi (management@rovazzi.it)')
console.log('      Instagram: @rovazzi')
console.log('      LinkedIn: linkedin.com/in/fabio-rovazzi')
console.log('')
console.log('='.repeat(80))
console.log('')

async function runTest() {
  const startTime = Date.now()
  let instagramCost = 0
  let linkedinCost = 0
  let instagramFound = 0
  let linkedinFound = 0

  // Per ogni contatto
  for (let i = 0; i < testContacts.length; i++) {
    const contact = testContacts[i]
    const contactNum = i + 1

    console.log(`\n${'─'.repeat(80)}`)
    console.log(`👤 CONTATTO ${contactNum}: ${contact.original.nome}`)
    console.log(`   Email: ${contact.original.email}`)
    console.log(`${'─'.repeat(80)}\n`)

    // Instagram Search
    console.log(`📸 Instagram Search per: ${contact.original.nome}`)
    console.log(`   Username atteso: @${contact.expected.instagram}`)

    try {
      const instagramResult = await instagramBlock.execute(
        {
          apiToken: process.env.APIFY_API_KEY || '',
          actor: 'apify/instagram-scraper',
          mode: 'live',
          maxResults: 5,
          includePosts: true,
          maxPosts: 2 // Ridotto da 6 a 2 per evitare timeout
        },
        {
          contacts: [contact.original]
        },
        context
      )

      // Check if output exists
      if (!instagramResult.output || !instagramResult.output.contacts) {
        console.log('')
        console.log('   ❌ OUTPUT NON VALIDO')
        if (instagramResult.error) {
          console.log(`   Errore: ${instagramResult.error.message}`)
        }
      } else {
        const contactData = instagramResult.output.contacts[0]

        if (contactData.instagram && contactData.instagram.found) {
          instagramFound++
          const profile = contactData.instagram
          console.log('')
          console.log('   ✅ TROVATO!')
          console.log(`   Username: @${profile.username}`)
          console.log(`   Bio: ${profile.bio?.substring(0, 100)}${profile.bio && profile.bio.length > 100 ? '...' : ''}`)
          console.log(`   Followers: ${profile.followers?.toLocaleString() || 'N/A'}`)
          console.log(`   Posts: ${profile.posts?.length || 0} analizzati`)

          if (profile.posts && profile.posts.length > 0) {
            console.log('   Ultimi post:')
            profile.posts.slice(0, 3).forEach((post: any, idx: number) => {
              console.log(`     ${idx + 1}. ${post.caption?.substring(0, 60)}...`)
            })
          }

          instagramCost += 0.050
        } else {
          console.log('')
          console.log('   ❌ NON TROVATO')
          console.log(`   Motivo: ${contactData.instagram?.error || 'Username non trovato'}`)
        }
      }
    } catch (error: any) {
      console.log('')
      console.log(`   ❌ ERRORE: ${error.message}`)
    }

    console.log('')

    // LinkedIn Search (solo per email business)
    const isBusinessEmail = !contact.original.email.includes('@gmail.com') &&
                           !contact.original.email.includes('@yahoo.com') &&
                           !contact.original.email.includes('@hotmail.com') &&
                           !contact.original.email.includes('@outlook.com')

    if (isBusinessEmail) {
      console.log(`💼 LinkedIn Search per: ${contact.original.nome}`)
      console.log(`   Email: ${contact.original.email}`)
      console.log(`   Profile atteso: linkedin.com/in/${contact.expected.linkedin}`)

      try {
        const linkedinResult = await linkedinBlock.execute(
          {
            apiToken: process.env.APIFY_API_KEY || '',
            actor: 'supreme_coder/linkedin-profile-scraper',
            mode: 'live',
            maxResults: 1
          },
          {
            contacts: [contact.original]
          },
          context
        )

        // Check if output exists
        if (!linkedinResult.output || !linkedinResult.output.contacts) {
          console.log('')
          console.log('   ❌ OUTPUT NON VALIDO')
          if (linkedinResult.error) {
            console.log(`   Errore: ${linkedinResult.error.message}`)
          }
        } else {
          const contactData = linkedinResult.output.contacts[0]

          if (contactData.linkedin && contactData.linkedin.found) {
            linkedinFound++
            const profile = contactData.linkedin
            console.log('')
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

            linkedinCost += 0.003
          } else {
            console.log('')
            console.log('   ❌ NON TROVATO')
            console.log(`   Motivo: ${contactData.linkedin?.error || 'Profilo non trovato'}`)
          }
        }
      } catch (error: any) {
        console.log('')
        console.log(`   ❌ ERRORE: ${error.message}`)
      }

      console.log('')
    } else {
      console.log(`💼 LinkedIn Search: SKIPPED (email personale)`)
      console.log('')
    }
  }

  // Riepilogo finale
  const executionTime = Date.now() - startTime
  const totalCost = instagramCost + linkedinCost

  console.log('\n' + '='.repeat(80))
  console.log('📊 RIEPILOGO FINALE')
  console.log('='.repeat(80))
  console.log('')
  console.log(`⏱️  Tempo totale: ${(executionTime / 1000).toFixed(2)} secondi`)
  console.log('')
  console.log('📸 Instagram:')
  console.log(`   Trovati: ${instagramFound}/3`)
  console.log(`   Costo: $${instagramCost.toFixed(3)}`)
  console.log('')
  console.log('💼 LinkedIn:')
  console.log(`   Trovati: ${linkedinFound}/2 (solo email business)`)
  console.log(`   Costo: $${linkedinCost.toFixed(3)}`)
  console.log('')
  console.log('💰 Costo totale:')
  console.log(`   $${totalCost.toFixed(3)} USD`)
  console.log('')
  console.log('✅ SUCCESS RATE:')
  const totalSearches = 3 + 2 // 3 Instagram + 2 LinkedIn (business emails)
  const totalFound = instagramFound + linkedinFound
  const successRate = (totalFound / totalSearches * 100).toFixed(1)
  console.log(`   ${totalFound}/${totalSearches} (${successRate}%)`)
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
