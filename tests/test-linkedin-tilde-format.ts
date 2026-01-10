/**
 * Test LinkedIn actor with tilde format
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const APIFY_API_KEY = process.env.APIFY_API_KEY

async function checkActorFormats() {
  const baseUrl = 'https://api.apify.com/v2'

  // Different formats to try
  const formats = [
    'supreme_coder/linkedin-profile-scraper',
    'supreme_coder~linkedin-profile-scraper',
    'apify~supreme_coder~linkedin-profile-scraper'
  ]

  for (const format of formats) {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`Trying format: ${format}`)
    console.log('='.repeat(80))

    try {
      // Try actor endpoint
      const actorResponse = await fetch(`${baseUrl}/actors/${format}`, {
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`
        }
      })

      if (actorResponse.ok) {
        const data = await actorResponse.json()
        console.log('✅ Actor endpoint works')
        console.log(`  Name: ${data.data?.name || 'N/A'}`)
        console.log(`  Username: ${data.data?.username || 'N/A'}`)
      } else {
        console.log(`❌ Actor endpoint: ${actorResponse.status}`)
      }

      // Try runs endpoint
      const runsResponse = await fetch(`${baseUrl}/acts/${format}/runs?limit=1`, {
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`
        }
      })

      if (runsResponse.ok) {
        console.log('✅ Runs endpoint works')
      } else {
        console.log(`❌ Runs endpoint: ${runsResponse.status}`)
      }

    } catch (error: any) {
      console.log(`❌ Exception: ${error.message}`)
    }
  }
}

async function main() {
  console.log('Testing different actor path formats')
  console.log('='.repeat(80))

  await checkActorFormats()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
