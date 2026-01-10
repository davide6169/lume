/**
 * Test different input formats for supreme_coder/linkedin-profile-scraper
 *
 * Tests various parameter names to find the correct input format
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const APIFY_API_KEY = process.env.APIFY_API_KEY

// Test URL - Bill Gates LinkedIn profile (definitely exists)
const testProfile = 'https://www.linkedin.com/in/billgates'

// Different input format variations to test
const inputVariations = [
  {
    name: 'Variation 1: urls (array)',
    body: {
      urls: [testProfile],
      resultsType: 'people',
      maxResults: 1
    }
  },
  {
    name: 'Variation 2: directUrls (array, like Instagram)',
    body: {
      directUrls: [testProfile],
      resultsType: 'people',
      maxResults: 1
    }
  },
  {
    name: 'Variation 3: startUrls (array)',
    body: {
      startUrls: [testProfile],
      resultsType: 'people',
      maxResults: 1
    }
  },
  {
    name: 'Variation 4: url (single, not array)',
    body: {
      url: testProfile,
      resultsType: 'people',
      maxResults: 1
    }
  },
  {
    name: 'Variation 5: profileUrl (single, not array)',
    body: {
      profileUrl: testProfile,
      resultsType: 'people',
      maxResults: 1
    }
  },
  {
    name: 'Variation 6: profileUrls (array)',
    body: {
      profileUrls: [testProfile],
      resultsType: 'people',
      maxResults: 1
    }
  },
  {
    name: 'Variation 7: urls only (minimal)',
    body: {
      urls: [testProfile]
    }
  },
  {
    name: 'Variation 8: directUrls only (minimal)',
    body: {
      directUrls: [testProfile]
    }
  }
]

async function testInputFormat(variation: typeof inputVariations[0], index: number) {
  const baseUrl = 'https://api.apify.com/v2'
  const actor = 'supreme_coder/linkedin-profile-scraper'
  const actorId = actor.replace('/', '~')

  console.log(`\n${'='.repeat(80)}`)
  console.log(`TEST ${index + 1}: ${variation.name}`)
  console.log(`${'='.repeat(80)}`)
  console.log('Request body:')
  console.log(JSON.stringify(variation.body, null, 2))
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

    const data = await response.json()

    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}`)
      console.log(`Error: ${data.message || JSON.stringify(data)}`)
      return { success: false, error: data.message || data.error?.message }
    }

    const run = data.data
    console.log(`✅ Run started successfully!`)
    console.log(`   Run ID: ${run.id}`)
    console.log(`   Status: ${run.status}`)

    // Wait a bit and check status
    await new Promise(resolve => setTimeout(resolve, 3000))

    const statusResponse = await fetch(`${baseUrl}/acts/${actorId}/runs/${run.id}`, {
      headers: {
        'Authorization': `Bearer ${APIFY_API_KEY}`
      }
    })

    const statusData = await statusResponse.json()
    const runStatus = statusData.data

    console.log(`   Final Status: ${runStatus.status}`)

    if (runStatus.status === 'SUCCEEDED') {
      console.log(`   Dataset ID: ${runStatus.defaultDatasetId || runStatus.datasetId || 'N/A'}`)
      console.log(`\n   🎉 SUCCESS! This input format works!`)
      return { success: true, runId: run.id, format: variation.name }
    } else if (runStatus.status === 'FAILED') {
      console.log(`   ❌ Run failed: ${runStatus.statusMessage || 'Unknown error'}`)
      return { success: false, error: runStatus.statusMessage }
    } else {
      console.log(`   ⏳ Still running...`)
      return { success: false, error: 'Timeout' }
    }

  } catch (error: any) {
    console.log(`❌ Exception: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runAllTests() {
  console.log('='.repeat(80))
  console.log('TESTING INPUT FORMAT VARIATIONS')
  console.log('Actor: supreme_coder/linkedin-profile-scraper')
  console.log(`Profile: ${testProfile}`)
  console.log('='.repeat(80))

  const results: Array<{format: string, success: boolean, error?: string, runId?: string}> = []

  for (let i = 0; i < inputVariations.length; i++) {
    const result = await testInputFormat(inputVariations[i], i)
    results.push({ format: inputVariations[i].name, ...result })

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Summary
  console.log('\n')
  console.log('='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))
  console.log('')

  const workingFormats = results.filter(r => r.success)

  if (workingFormats.length > 0) {
    console.log(`✅ Found ${workingFormats.length} working format(s):\n`)
    workingFormats.forEach((result, index) => {
      console.log(`${index + 1}. ${result.format}`)
      console.log(`   Run ID: ${result.runId}`)
      console.log('')
    })
  } else {
    console.log('❌ No working format found. All variations failed.\n')
  }

  console.log('All results:')
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${index + 1}. ${result.format}`)
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
