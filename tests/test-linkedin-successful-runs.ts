/**
 * Check successful runs for LinkedIn actor to understand the correct input format
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const APIFY_API_KEY = process.env.APIFY_API_KEY

async function checkSuccessfulRuns() {
  const baseUrl = 'https://api.apify.com/v2'
  const actorId = 'supreme_coder~linkedin-profile-scraper'

  console.log('Checking successful runs for supreme_coder/linkedin-profile-scraper')
  console.log('='.repeat(80))
  console.log('')

  // Check for successful runs
  const response = await fetch(
    `${baseUrl}/acts/${actorId}/runs?limit=10&status=SUCCEEDED`,
    {
      headers: {
        'Authorization': `Bearer ${APIFY_API_KEY}`
      }
    }
  )

  if (!response.ok) {
    console.log(`❌ Failed to get runs: ${response.status}`)
    const text = await response.text()
    console.log(text)
    return
  }

  const data = await response.json()
  const runs = data.data?.items || []

  console.log(`Found ${runs.length} successful runs\n`)

  if (runs.length === 0) {
    console.log('❌ No successful runs found!')
    console.log('')
    console.log('This means:')
    console.log('  1. The actor has never been run successfully with this API key')
    console.log('  2. OR the actor may be broken/deprecated')
    console.log('  3. OR the actor requires specific configuration we don\'t have')
    console.log('')
    console.log('Recommendations:')
    console.log('  1. Try the official Apify LinkedIn scraping API')
    console.log('  2. Check the Apify store for alternative LinkedIn actors')
    console.log('  3. Contact Apify support about this actor')
    return
  }

  // Analyze the successful runs
  console.log('Analyzing successful runs to find input pattern...\n')

  for (let i = 0; i < Math.min(runs.length, 5); i++) {
    const run = runs[i]
    console.log(`${'─'.repeat(80)}`)
    console.log(`Run ${i + 1}: ${run.id}`)
    console.log(`  Started: ${run.startedAt}`)
    console.log(`  Finished: ${run.finishedAt}`)
    console.log(`  Status: ${run.status}`)

    if (run.input) {
      console.log(`  Input:`)
      console.log('  ' + JSON.stringify(run.input, null, 2).split('\n').join('\n  '))
    }

    if (run.statusMessage) {
      console.log(`  Message: ${run.statusMessage}`)
    }

    console.log('')
  }

  // Try to identify common patterns
  console.log('='.repeat(80))
  console.log('ANALYSIS')
  console.log('='.repeat(80))
  console.log('')

  const inputFields = new Set<string>()
  for (const run of runs) {
    if (run.input) {
      Object.keys(run.input).forEach(key => inputFields.add(key))
    }
  }

  console.log('Common input fields found:')
  inputFields.forEach(field => {
    console.log(`  - ${field}`)
  })
  console.log('')

  // Check if any run used URL-based input
  const urlRuns = runs.filter(r => r.input && (r.input.urls || r.input.url || r.input.directUrls || r.input.startUrls))

  if (urlRuns.length > 0) {
    console.log(`✅ Found ${urlRuns.length} runs with URL input`)
    console.log('')
    console.log('Example input from successful run:')
    console.log(JSON.stringify(urlRuns[0].input, null, 2))
  } else {
    console.log('⚠️  No runs found with URL-based input')
    console.log('')
    console.log('The actor might use different input parameters.')
  }
}

async function checkActorDocumentation() {
  const baseUrl = 'https://api.apify.com/v2'
  const actorId = 'supreme_coder~linkedin-profile-scraper'

  console.log('')
  console.log('='.repeat(80))
  console.log('Checking for actor documentation...')
  console.log('='.repeat(80))
  console.log('')

  try {
    // Try to get the actor's latest build
    const buildsResponse = await fetch(`${baseUrl}/acts/${actorId}/builds?limit=1&status=READY`, {
      headers: {
        'Authorization': `Bearer ${APIFY_API_KEY}`
      }
    })

    if (buildsResponse.ok) {
      const buildData = await buildsResponse.json()
      const build = buildData.data?.items?.[0]

      if (build) {
        console.log('Latest build info:')
        console.log(`  Build number: ${build.buildNumber}`)
        console.log(`  Status: ${build.status}`)
        console.log(`  Created at: ${build.createdAt}`)
      }
    }
  } catch (error: any) {
    console.log(`❌ Error checking builds: ${error.message}`)
  }
}

async function main() {
  await checkSuccessfulRuns()
  await checkActorDocumentation()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
