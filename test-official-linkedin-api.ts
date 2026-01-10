/**
 * Test official Apify LinkedIn scraping API
 *
 * The official API: apify/linkedin-scraping-api
 * Cost: $10/1000 profiles (more expensive but should work)
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const APIFY_API_KEY = process.env.APIFY_API_KEY

async function testOfficialLinkedInAPI() {
  const baseUrl = 'https://api.apify.com/v2'
  const actor = 'apify/linkedin-scraping-api'
  const actorId = 'apify~linkedin-scraping-api'

  const testProfiles = [
    'https://www.linkedin.com/in/billgates',
    'https://www.linkedin.com/in/satyanadella'
  ]

  console.log('='.repeat(80))
  console.log('TESTING OFFICIAL APIFY LINKEDIN SCRAPING API')
  console.log('Actor: apify/linkedin-scraping-api')
  console.log('Cost: $10/1000 profiles (vs $3/1000 for supreme_coder)')
  console.log('='.repeat(80))
  console.log('')

  for (const profileUrl of testProfiles) {
    console.log(`${'─'.repeat(80)}`)
    console.log(`Testing: ${profileUrl}`)
    console.log('')

    try {
      // Try different input formats for the official API
      const inputVariations = [
        {
          name: 'Format 1: urls (array)',
          body: {
            urls: [profileUrl]
          }
        },
        {
          name: 'Format 2: url (single)',
          body: {
            url: profileUrl
          }
        },
        {
          name: 'Format 3: startUrls (array)',
          body: {
            startUrls: [profileUrl]
          }
        }
      ]

      for (const variation of inputVariations) {
        console.log(`  ${variation.name}...`)

        const response = await fetch(`${baseUrl}/acts/${actorId}/runs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${APIFY_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(variation.body)
        })

        const responseData = await response.json()

        if (response.ok) {
          const run = responseData.data
          console.log(`    ✅ Run started!`)
          console.log(`    Run ID: ${run.id}`)

          // Wait and check status
          await new Promise(resolve => setTimeout(resolve, 5000))

          const statusResponse = await fetch(`${baseUrl}/acts/${actorId}/runs/${run.id}`, {
            headers: {
              'Authorization': `Bearer ${APIFY_API_KEY}`
            }
          })

          const statusData = await statusResponse.json()
          const runStatus = statusData.data

          console.log(`    Status: ${runStatus.status}`)

          if (runStatus.status === 'SUCCEEDED') {
            const datasetId = runStatus.defaultDatasetId || runStatus.datasetId
            console.log(`    Dataset ID: ${datasetId}`)

            // Fetch dataset
            if (datasetId) {
              const datasetResponse = await fetch(`${baseUrl}/datasets/${datasetId}/items?limit=1`, {
                headers: {
                  'Authorization': `Bearer ${APIFY_API_KEY}`
                }
              })

              const datasetData = await datasetResponse.json()
              const items = Array.isArray(datasetData) ? datasetData : (datasetData.items || [])

              if (items.length > 0) {
                const profile = items[0]
                console.log(`    ✅ Profile found!`)
                console.log(`    Name: ${profile.firstName || profile.fullName || profile.name || 'N/A'}`)
                console.log(`    Headline: ${profile.headline || profile.title || 'N/A'}`)
                console.log('')
                console.log(`    🎉 SUCCESS! Input format: ${variation.name}`)
                return { success: true, format: variation.name, profile }
              }
            }
          } else if (runStatus.status === 'FAILED') {
            console.log(`    ❌ Failed: ${runStatus.statusMessage || 'Unknown error'}`)
          }

          console.log('')
          break // Stop trying other formats for this profile if one worked

        } else {
          const error = responseData.message || responseData.error?.message || responseData.error
          console.log(`    ❌ ${error}`)
        }
      }

    } catch (error: any) {
      console.log(`  ❌ Exception: ${error.message}`)
    }

    console.log('')
  }

  console.log('='.repeat(80))
}

async function checkActorStats() {
  const baseUrl = 'https://api.apify.com/v2'
  const actorId = 'apify~linkedin-scraping-api'

  console.log('')
  console.log('='.repeat(80))
  console.log('Checking official API stats...')
  console.log('='.repeat(80))
  console.log('')

  try {
    // Check for successful runs
    const runsResponse = await fetch(
      `${baseUrl}/acts/${actorId}/runs?limit=1&status=SUCCEEDED`,
      {
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`
        }
      }
    )

    if (runsResponse.ok) {
      const runsData = await runsResponse.json()
      const runCount = runsData.data?.total || runsData.data?.items?.length || 0

      if (runCount > 0) {
        console.log(`✅ Actor has ${runCount} successful runs`)
        console.log('This actor should work!')
      } else {
        console.log('⚠️  Actor has 0 successful runs')
        console.log('Still might work, but no usage history')
      }
    } else {
      console.log(`❌ Could not check runs: ${runsResponse.status}`)
    }
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`)
  }
}

async function main() {
  await checkActorStats()
  await testOfficialLinkedInAPI()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
