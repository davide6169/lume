/**
 * Test dev_fusion/linkedin-profile-scraper actor
 *
 * This actor includes email discovery according to the analysis document
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const APIFY_API_KEY = process.env.APIFY_API_KEY

async function testDevFusionActor() {
  const baseUrl = 'https://api.apify.com/v2'
  const actorId = 'dev_fusion~linkedin-profile-scraper'
  const testUrl = 'https://www.linkedin.com/in/billgates'

  console.log('='.repeat(80))
  console.log('TESTING dev_fusion/linkedin-profile-scraper')
  console.log('Features: LinkedIn profile + email discovery')
  console.log('='.repeat(80))
  console.log('')

  // Different input format variations to try
  const variations = [
    {
      name: 'urls (array)',
      body: { urls: [testUrl] }
    },
    {
      name: 'url (single)',
      body: { url: testUrl }
    },
    {
      name: 'profileUrl (single)',
      body: { profileUrl: testUrl }
    },
    {
      name: 'directUrls (array, like Instagram)',
      body: { directUrls: [testUrl] }
    },
    {
      name: 'startUrls (array)',
      body: { startUrls: [testUrl] }
    },
    {
      name: 'profiles (array of objects with url)',
      body: {
        profiles: [{ url: testUrl }]
      }
    }
  ]

  for (const variation of variations) {
    console.log(`${'─'.repeat(80)}`)
    console.log(`Testing: ${variation.name}`)
    console.log('')

    try {
      const response = await fetch(`${baseUrl}/acts/${actorId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(variation.body)
      })

      const responseData = await response.json()

      if (!response.ok) {
        const error = responseData.message || responseData.error?.message || JSON.stringify(responseData)
        console.log(`❌ Error: ${error}`)

        // Check if error message gives us hints about expected format
        if (error.includes('Field input.') || error.includes('required')) {
          console.log('   Hint: This tells us the expected field name!')
        }

        console.log('')
        continue
      }

      const run = responseData.data
      console.log(`✅ Run started!`)
      console.log(`   Run ID: ${run.id}`)
      console.log(`   Status: ${run.status}`)

      // Wait for completion
      const maxWaitTime = 60000
      const pollInterval = 2000
      const startTime = Date.now()

      console.log(`   Waiting for completion...`)

      while (Date.now() - startTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, pollInterval))

        const statusResponse = await fetch(`${baseUrl}/acts/${actorId}/runs/${run.id}`, {
          headers: {
            'Authorization': `Bearer ${APIFY_API_KEY}`
          }
        })

        const statusData = await statusResponse.json()
        const runStatus = statusData.data

        if (runStatus.status === 'SUCCEEDED') {
          console.log(`   ✅ Status: SUCCEEDED`)
          console.log(`   🎉 SUCCESS! Input format works: ${variation.name}`)

          const datasetId = runStatus.defaultDatasetId || runStatus.datasetId
          if (datasetId) {
            console.log(`   Dataset ID: ${datasetId}`)

            // Fetch dataset
            const datasetResponse = await fetch(`${baseUrl}/datasets/${datasetId}/items?limit=1`, {
              headers: {
                'Authorization': `Bearer ${APIFY_API_KEY}`
              }
            })

            const datasetData = await datasetResponse.json()
            const items = Array.isArray(datasetData) ? datasetData : (datasetData.items || [])

            if (items.length > 0) {
              const profile = items[0]
              console.log('')
              console.log(`   Profile data found:`)
              console.log(`   - Name: ${profile.firstName || profile.fullName || profile.name || 'N/A'}`)
              console.log(`   - Headline: ${profile.headline || profile.title || 'N/A'}`)
              if (profile.email) {
                console.log(`   - Email: ${profile.email}`)
              }
            }
          }

          console.log('')
          console.log('='.repeat(80))
          console.log('🎉 THIS ACTOR WORKS!')
          console.log('='.repeat(80))
          return { success: true, actor: 'dev_fusion', format: variation.name }
        }

        if (runStatus.status === 'FAILED') {
          console.log(`   ❌ Status: FAILED`)
          console.log(`   Error: ${runStatus.statusMessage || 'Unknown error'}`)
          break
        }

        process.stdout.write('.')
      }

      if (Date.now() - startTime >= maxWaitTime) {
        console.log(`   ⏳ Timeout after ${maxWaitTime}ms`)
      }

      console.log('')

    } catch (error: any) {
      console.log(`❌ Exception: ${error.message}`)
      console.log('')
    }
  }

  console.log('='.repeat(80))
  console.log('❌ No working format found for dev_fusion actor')
  console.log('='.repeat(80))
  return { success: false }
}

async function main() {
  await testDevFusionActor()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
