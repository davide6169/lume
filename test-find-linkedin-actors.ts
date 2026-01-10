/**
 * Search for available LinkedIn actors
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const APIFY_API_KEY = process.env.APIFY_API_KEY

// Actor names from the analysis document
const actorCandidates = [
  // Original choice
  'supreme_coder/linkedin-profile-scraper',

  // Official API
  'apify/linkedin-scraping-api',
  'apify/linkedin-profile-scraper',

  // Alternatives from analysis
  'dev_fusion/linkedin-profile-scraper',
  'harvestapi/linkedin-profile-search',
  'bebity/best-cheapest-linkedin-profiles-scraper-pay-per-result',

  // Variations to try
  'curious_coder/linkedin-profile-scraper',
  'logical_scrapers/linkedin-profile-scraper-no-cookies'
]

async function testActor(actorName: string) {
  const baseUrl = 'https://api.apify.com/v2'
  const actorId = actorName.replace('/', '~')

  console.log(`Testing: ${actorName}`)

  try {
    // Test if actor exists
    const testResponse = await fetch(`${baseUrl}/acts/${actorId}/runs?limit=1`, {
      headers: {
        'Authorization': `Bearer ${APIFY_API_KEY}`
      }
    })

    if (testResponse.status === 404) {
      console.log('  ❌ Actor not found (404)')
      return { exists: false }
    }

    if (testResponse.status === 401 || testResponse.status === 403) {
      console.log('  ⚠️  Access denied (auth issue)')
      return { exists: true, noAccess: true }
    }

    if (!testResponse.ok) {
      console.log(`  ❌ Error: ${testResponse.status}`)
      return { exists: false }
    }

    // Actor exists, check for successful runs
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
      const total = runsData.data?.total || 0

      console.log(`  ✅ Actor exists!`)
      console.log(`     Successful runs: ${total}`)

      return { exists: true, successfulRuns: total }
    }

    console.log('  ✅ Actor exists!')
    return { exists: true }

  } catch (error: any) {
    console.log(`  ❌ Exception: ${error.message}`)
    return { exists: false, error: error.message }
  }
}

async function main() {
  console.log('='.repeat(80))
  console.log('SEARCHING FOR AVAILABLE LINKEDIN ACTORS')
  console.log('='.repeat(80))
  console.log('')

  const results: Array<{actor: string, result: any}> = []

  for (const actor of actorCandidates) {
    const result = await testActor(actor)
    results.push({ actor, result })
    console.log('')
  }

  // Summary
  console.log('='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))
  console.log('')

  const available = results.filter(r => r.result.exists)
  const withRuns = results.filter(r => r.result.exists && r.result.successfulRuns > 0)

  if (available.length === 0) {
    console.log('❌ No LinkedIn actors found with this API key!')
    console.log('')
    console.log('Possible reasons:')
    console.log('  1. API key might not have access to LinkedIn actors')
    console.log('  2. Subscription plan might not include these actors')
    console.log('  3. Actors might have been removed or renamed')
    console.log('')
    console.log('Recommendations:')
    console.log('  1. Check your Apify subscription plan')
    console.log('  2. Visit https://apify.com/store to verify actor names')
    console.log('  3. Contact Apify support')
  } else {
    console.log(`✅ Found ${available.length} available actor(s):\n`)
    available.forEach(r => {
      console.log(`  - ${r.actor}`)
      if (r.result.successfulRuns !== undefined) {
        console.log(`    Successful runs: ${r.result.successfulRuns}`)
      }
      if (r.result.noAccess) {
        console.log(`    ⚠️  Access denied`)
      }
      console.log('')
    })

    if (withRuns.length > 0) {
      console.log('✅ Actors with successful runs (these should work):\n')
      withRuns.forEach(r => {
        console.log(`  - ${r.actor} (${r.result.successfulRuns} runs)`)
      })
    } else {
      console.log('⚠️  No actors with successful runs found.')
      console.log('Even though actors exist, they may not have been tested yet.')
    }
  }

  console.log('')
  console.log('='.repeat(80))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
