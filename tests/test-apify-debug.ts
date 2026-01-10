/**
 * Debug Apify Instagram Response
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const APIFY_API_KEY = process.env.APIFY_API_KEY || ''

async function checkApifyRun(runId: string) {
  const baseUrl = 'https://api.apify.com/v2'

  console.log(`🔍 Checking Apify run: ${runId}`)
  console.log('')

  // Get run details
  const runResponse = await fetch(`${baseUrl}/acts/apify~instagram-scraper/runs/${runId}`, {
    headers: {
      'Authorization': `Bearer ${APIFY_API_KEY}`
    }
  })

  const runData = await runResponse.json()
  console.log('📊 Run Status:')
  console.log(JSON.stringify(runData.data, null, 2))
  console.log('')

  // Get dataset if exists
  const datasetId = runData.data.datasetId || runData.data.defaultDatasetId
  if (datasetId) {
    console.log(`✅ Dataset ID: ${datasetId}`)

    const datasetResponse = await fetch(
      `${baseUrl}/datasets/${datasetId}/items?limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`
        }
      }
    )

    const datasetData = await datasetResponse.json()
    console.log(`📦 Dataset Items (${datasetData.items?.length || 0}):`)
    console.log(JSON.stringify(datasetData, null, 2))
  } else {
    console.log('❌ No dataset returned')
  }
}

// Check the last run from the test
checkApifyRun('zg99Eo582zk4rpnCE')
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
