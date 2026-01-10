/**
 * Get actor information and input schema
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const APIFY_API_KEY = process.env.APIFY_API_KEY

async function getActorInfo() {
  const baseUrl = 'https://api.apify.com/v2'
  const actor = 'supreme_coder/linkedin-profile-scraper'

  console.log(`Getting actor info for: ${actor}`)
  console.log('='.repeat(80))

  try {
    // Get actor details
    const response = await fetch(`${baseUrl}/actors/${actor}`, {
      headers: {
        'Authorization': `Bearer ${APIFY_API_KEY}`
      }
    })

    if (!response.ok) {
      console.log(`❌ Failed to get actor info: ${response.status}`)
      console.log(await response.text())
      return
    }

    const data = await response.json()
    const actorInfo = data.data

    console.log('✅ Actor Info:')
    console.log(JSON.stringify(actorInfo, null, 2))
    console.log('')

    // Check for input schema
    if (actorInfo.input) {
      console.log('Input Schema:')
      console.log(JSON.stringify(actorInfo.input, null, 2))
      console.log('')
    }

    // Try to get the actor's build info
    const buildsResponse = await fetch(`${baseUrl}/actors/${actor}/builds`, {
      headers: {
        'Authorization': `Bearer ${APIFY_API_KEY}`
      }
    })

    if (buildsResponse.ok) {
      const buildsData = await buildsResponse.json()
      console.log('Recent Builds:')
      console.log(JSON.stringify(buildsData.data?.items?.slice(0, 3), null, 2))
      console.log('')
    }

  } catch (error: any) {
    console.log(`❌ Exception: ${error.message}`)
  }
}

async function checkActorRuns() {
  const baseUrl = 'https://api.apify.com/v2'
  const actor = 'supreme_coder/linkedin-profile-scraper'
  const actorId = actor.replace('/', '~')

  console.log('='.repeat(80))
  console.log('Checking recent runs for this actor...')
  console.log('='.repeat(80))

  try {
    const response = await fetch(
      `${baseUrl}/actors/${actorId}/runs?limit=5&status=SUCCEEDED`,
      {
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`
        }
      }
    )

    if (!response.ok) {
      console.log(`❌ Failed to get runs: ${response.status}`)
      return
    }

    const data = await response.json()
    const runs = data.data?.items || []

    if (runs.length === 0) {
      console.log('No successful runs found for this actor.')
      console.log('This might indicate:')
      console.log('  1. Actor has never been run successfully')
      console.log('  2. Actor requires specific configuration')
      console.log('  3. Actor might be deprecated or broken')
      return
    }

    console.log(`✅ Found ${runs.length} successful runs\n`)

    for (const run of runs) {
      console.log(`Run ID: ${run.id}`)
      console.log(`  Status: ${run.status}`)
      console.log(`  Started: ${run.startedAt}`)
      console.log(`  Finished: ${run.finishedAt}`)

      // Try to get the input used
      if (run.input) {
        console.log(`  Input:`, JSON.stringify(run.input, null, 2))
      }
      console.log('')
    }

  } catch (error: any) {
    console.log(`❌ Exception: ${error.message}`)
  }
}

async function tryAlternativeActor() {
  const baseUrl = 'https://api.apify.com/v2'

  console.log('='.repeat(80))
  console.log('Trying alternative LinkedIn actors...')
  console.log('='.repeat(80))
  console.log('')

  const alternativeActors = [
    'apify/linkedin-profile-scraper',
    'apify/linkedin-scraper'
  ]

  for (const actor of alternativeActors) {
    console.log(`Checking actor: ${actor}`)

    try {
      const response = await fetch(`${baseUrl}/actors/${actor}`, {
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`
        }
      })

      if (response.ok) {
        console.log(`  ✅ Actor exists`)

        const data = await response.json()
        const actorInfo = data.data

        if (actorInfo.input) {
          console.log(`  Input schema available`)
        }
      } else {
        console.log(`  ❌ Actor not found: ${response.status}`)
      }
    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}`)
    }

    console.log('')
  }
}

async function main() {
  await getActorInfo()
  await checkActorRuns()
  await tryAlternativeActor()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
