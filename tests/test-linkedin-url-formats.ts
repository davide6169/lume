/**
 * Test different URL formats for supreme_coder/linkedin-profile-scraper
 *
 * Tests various URL format variations to find the correct one
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const APIFY_API_KEY = process.env.APIFY_API_KEY

// Different URL format variations to test
const urlVariations = [
  {
    name: 'URL 1: https://www.linkedin.com/in/billgates',
    url: 'https://www.linkedin.com/in/billgates'
  },
  {
    name: 'URL 2: https://linkedin.com/in/billgates (no www)',
    url: 'https://linkedin.com/in/billgates'
  },
  {
    name: 'URL 3: https://www.linkedin.com/in/billgates/',
    url: 'https://www.linkedin.com/in/billgates/'
  },
  {
    name: 'URL 4: https://linkedin.com/in/billgates/ (no www, with trailing slash)',
    url: 'https://linkedin.com/in/billgates/'
  },
  {
    name: 'URL 5: http://www.linkedin.com/in/billgates (http instead of https)',
    url: 'http://www.linkedin.com/in/billgates'
  },
  {
    name: 'URL 6: https://www.linkedin.com/in/satyanadella (different profile)',
    url: 'https://www.linkedin.com/in/satyanadella'
  }
]

async function testUrlFormat(variation: typeof urlVariations[0], index: number) {
  const baseUrl = 'https://api.apify.com/v2'
  const actor = 'supreme_coder/linkedin-profile-scraper'
  const actorId = actor.replace('/', '~')

  console.log(`\n${'='.repeat(80)}`)
  console.log(`TEST ${index + 1}: ${variation.name}`)
  console.log(`${'='.repeat(80)}`)
  console.log(`URL: ${variation.url}`)
  console.log('')

  try {
    const requestBody = {
      urls: [variation.url],
      resultsType: 'people',
      maxResults: 1
    }

    const response = await fetch(`${baseUrl}/acts/${actorId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${APIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()

    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}`)
      console.log(`Error: ${data.message || JSON.stringify(data)}`)

      // Try to extract more detailed error info
      if (data.error) {
        console.log(`Error details:`, JSON.stringify(data.error, null, 2))
      }
      return { success: false, error: data.message || data.error?.message }
    }

    const run = data.data
    console.log(`✅ Run started successfully!`)
    console.log(`   Run ID: ${run.id}`)
    console.log(`   Status: ${run.status}`)

    // Wait for completion
    const maxWaitTime = 60000 // 1 minute
    const pollInterval = 2000
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))

      const statusResponse = await fetch(`${baseUrl}/acts/${actorId}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`
        }
      })

      const statusData = await statusResponse.json()
      const runStatus = statusData.data

      console.log(`   Status: ${runStatus.status}`)

      if (runStatus.status === 'SUCCEEDED' || runStatus.status === 'FAILED') {
        console.log(`   Final Status: ${runStatus.status}`)

        if (runStatus.status === 'SUCCEEDED') {
          console.log(`   Dataset ID: ${runStatus.defaultDatasetId || runStatus.datasetId || 'N/A'}`)
          console.log(`\n   🎉 SUCCESS! This URL format works!`)

          // Try to fetch dataset
          const datasetId = runStatus.defaultDatasetId || runStatus.datasetId
          if (datasetId) {
            const datasetResponse = await fetch(`${baseUrl}/datasets/${datasetId}/items?limit=1`, {
              headers: {
                'Authorization': `Bearer ${APIFY_API_KEY}`
              }
            })

            const datasetData = await datasetResponse.json()
            const items = Array.isArray(datasetData) ? datasetData : (datasetData.items || [])

            if (items.length > 0) {
              console.log(`   Profile data found!`)
              const profile = items[0]
              console.log(`   - Name: ${profile.fullName || profile.name || 'N/A'}`)
              console.log(`   - Headline: ${profile.headline || profile.title || 'N/A'}`)
            }
          }

          return { success: true, runId: run.id, url: variation.url }
        } else {
          console.log(`   ❌ Run failed: ${runStatus.statusMessage || 'Unknown error'}`)
          return { success: false, error: runStatus.statusMessage }
        }
      }
    }

    console.log(`   ⏳ Timeout after ${maxWaitTime}ms`)
    return { success: false, error: 'Timeout' }

  } catch (error: any) {
    console.log(`❌ Exception: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runAllTests() {
  console.log('='.repeat(80))
  console.log('TESTING URL FORMAT VARIATIONS')
  console.log('Actor: supreme_coder/linkedin-profile-scraper')
  console.log('='.repeat(80))

  const results: Array<{url: string, success: boolean, error?: string, runId?: string}> = []

  for (let i = 0; i < urlVariations.length; i++) {
    const result = await testUrlFormat(urlVariations[i], i)
    results.push({ url: urlVariations[i].url, ...result })

    // Small delay between tests
    if (i < urlVariations.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }

  // Summary
  console.log('\n')
  console.log('='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))
  console.log('')

  const workingFormats = results.filter(r => r.success)

  if (workingFormats.length > 0) {
    console.log(`✅ Found ${workingFormats.length} working URL format(s):\n`)
    workingFormats.forEach((result, index) => {
      console.log(`${index + 1}. ${result.url}`)
      console.log(`   Run ID: ${result.runId}`)
      console.log('')
    })
  } else {
    console.log('❌ No working URL format found. All variations failed.\n')
  }

  console.log('All results:')
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${index + 1}. ${result.url}`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  console.log('\n')
}

runAllTests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
