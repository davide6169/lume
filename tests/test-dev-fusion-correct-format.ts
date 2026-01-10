/**
 * Test dev_fusion with correct parameter: profileUrls
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const APIFY_API_KEY = process.env.APIFY_API_KEY

async function testDevFusionWithProfileUrls() {
  const baseUrl = 'https://api.apify.com/v2'
  const actorId = 'dev_fusion~linkedin-profile-scraper'

  const testProfiles = [
    { name: 'Bill Gates', url: 'https://www.linkedin.com/in/billgates' },
    { name: 'Satya Nadella', url: 'https://www.linkedin.com/in/satyanadella' }
  ]

  console.log('='.repeat(80))
  console.log('TESTING dev_fusion WITH profileUrls PARAMETER')
  console.log('='.repeat(80))
  console.log('')

  for (const profile of testProfiles) {
    console.log(`${'─'.repeat(80)}`)
    console.log(`Testing: ${profile.name}`)
    console.log(`URL: ${profile.url}`)
    console.log('')

    try {
      const requestBody = {
        profileUrls: [profile.url]
      }

      console.log('Request body:')
      console.log(JSON.stringify(requestBody, null, 2))
      console.log('')

      const response = await fetch(`${baseUrl}/acts/${actorId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.log(`❌ HTTP ${response.status}`)
        console.log(`Error: ${responseData.message || JSON.stringify(responseData)}`)
        console.log('')
        continue
      }

      const run = responseData.data
      console.log(`✅ Run started!`)
      console.log(`   Run ID: ${run.id}`)
      console.log(`   Status: ${run.status}`)

      // Wait for completion
      const maxWaitTime = 90000 // 90 seconds
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

        if (runStatus.status === 'SUCCEEDED' || runStatus.status === 'FAILED') {
          console.log('')
          console.log(`   Status: ${runStatus.status}`)

          if (runStatus.status === 'SUCCEEDED') {
            console.log(`   ✅ SUCCESS!`)
            console.log(`   Dataset ID: ${runStatus.defaultDatasetId || runStatus.datasetId || 'N/A'}`)

            const datasetId = runStatus.defaultDatasetId || runStatus.datasetId
            if (datasetId) {
              // Fetch dataset
              const datasetResponse = await fetch(`${baseUrl}/datasets/${datasetId}/items?limit=1`, {
                headers: {
                  'Authorization': `Bearer ${APIFY_API_KEY}`
                }
              })

              const datasetData = await datasetResponse.json()
              const items = Array.isArray(datasetData) ? datasetData : (datasetData.items || [])

              if (items.length > 0) {
                const item = items[0]
                console.log('')
                console.log(`   Profile Data:`)
                console.log(`   - Name: ${item.firstName || item.fullName || item.name || 'N/A'}`)
                console.log(`   - Headline: ${item.headline || item.title || 'N/A'}`)
                console.log(`   - Location: ${item.location || 'N/A'}`)
                if (item.email) {
                  console.log(`   - Email: ${item.email}`)
                }
                if (item.company) {
                  console.log(`   - Company: ${item.company}`)
                }
              }
            }

            console.log('')
            console.log(`   🎉🎉🎉 THIS ACTOR WORKS! 🎉🎉🎉`)
            console.log('')
            console.log('='.repeat(80))
            console.log('🎉 SUCCESS - LINKEDIN SCRAPER WORKING!')
            console.log('='.repeat(80))
            console.log('')
            console.log('Details:')
            console.log(`  Actor: dev_fusion/linkedin-profile-scraper`)
            console.log(`  Input parameter: profileUrls (array)`)
            console.log(`  Features: LinkedIn profile + email discovery`)
            console.log(`  Cost: ~$5/1000 (estimated)`)
            console.log('')

            return {
              success: true,
              actor: 'dev_fusion/linkedin-profile-scraper',
              parameter: 'profileUrls',
              profile: profile.name
            }
          } else {
            console.log(`   ❌ Failed: ${runStatus.statusMessage || 'Unknown error'}`)
          }

          break
        }

        process.stdout.write('.')
      }

      if (Date.now() - startTime >= maxWaitTime) {
        console.log('')
        console.log(`   ⏳ Timeout after ${maxWaitTime}ms`)
      }

      console.log('')

    } catch (error: any) {
      console.log(`❌ Exception: ${error.message}`)
      console.log('')
    }

    // Delay between profiles
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  console.log('='.repeat(80))
  console.log('❌ Test completed - check results above')
  console.log('='.repeat(80))
  return { success: false }
}

async function main() {
  await testDevFusionWithProfileUrls()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
