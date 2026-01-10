/**
 * Trova profili LinkedIn pubblici esistenti
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const APIFY_API_KEY = process.env.APIFY_API_KEY

async function searchLinkedInProfiles() {
  const baseUrl = 'https://api.apify.com/v2'
  const actor = 'supreme_coder/linkedin-profile-scraper'
  const actorId = actor.replace('/', '~')

  // Lista di profili famosi da provare
  const profiles = [
    { name: 'Bill Gates', url: 'https://www.linkedin.com/in/billgates' },
    { name: 'Satya Nadella', url: 'https://www.linkedin.com/in/satyanadella' },
    { name: 'Jeff Weiner', url: 'https://www.linkedin.com/in/jeffweiner08' },
    { name: 'Sundar Pichai', url: 'https://www.linkedin.com/in/sundarpichai' },
    { name: 'Tim Cook', url: 'https://www.linkedin.com/in/timcook' },
    { name: 'Reid Hoffman', url: 'https://www.linkedin.com/in/reidhoffman' }
  ]

  console.log('🔍 Searching for existing LinkedIn profiles...\n')

  for (const profile of profiles) {
    console.log(`Testing ${profile.name}...`)
    console.log(`URL: ${profile.url}`)

    try {
      const response = await fetch(`${baseUrl}/acts/${actorId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          urls: [profile.url],
          resultsType: 'people',
          maxResults: 1
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.log(`❌ Error: ${data.message || data.error?.message}`)
        console.log('')
        continue
      }

      const run = data.data
      console.log(`✅ Run started: ${run.id}`)
      console.log(`   Status: ${run.status}`)

      // Wait a bit for the run to process
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Check run status
      const statusResponse = await fetch(`${baseUrl}/acts/${actorId}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`
        }
      })

      const statusData = await statusResponse.json()
      const runStatus = statusData.data

      console.log(`   Final Status: ${runStatus.status}`)
      console.log(`   Dataset ID: ${runStatus.defaultDatasetId || runStatus.datasetId || 'N/A'}`)

      // If succeeded, try to fetch dataset
      if (runStatus.status === 'SUCCEEDED' && (runStatus.defaultDatasetId || runStatus.datasetId)) {
        const datasetId = runStatus.defaultDatasetId || runStatus.datasetId

        const datasetResponse = await fetch(`${baseUrl}/datasets/${datasetId}/items?limit=1`, {
          headers: {
            'Authorization': `Bearer ${APIFY_API_KEY}`
          }
        })

        const datasetData = await datasetResponse.json()
        const items = Array.isArray(datasetData) ? datasetData : (datasetData.items || [])

        if (items.length > 0) {
          console.log(`   ✅ SUCCESS! Profile found!`)
          const profileData = items[0]
          console.log(`   - Name: ${profileData.fullName || profileData.name || 'N/A'}`)
          console.log(`   - Headline: ${profileData.headline || profileData.title || 'N/A'}`)
          console.log(`   - URL: ${profileData.url || profileData.profileUrl || 'N/A'}`)
          console.log(`\n🎉 This profile can be used for testing!\n`)
          return profile
        } else {
          console.log(`   ⚠️  Run succeeded but no profile data returned`)
        }
      } else if (runStatus.status === 'FAILED') {
        console.log(`   ❌ Run failed: ${runStatus.statusMessage || 'Unknown error'}`)
      }

      console.log('')

    } catch (error: any) {
      console.log(`❌ Exception: ${error.message}`)
      console.log('')
    }
  }

  console.log('❌ No valid LinkedIn profiles found in the list.')
}

searchLinkedInProfiles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
