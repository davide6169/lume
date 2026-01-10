/**
 * Check what fields dev_fusion actor returns
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const APIFY_API_KEY = process.env.APIFY_API_KEY

const datasetId = 'akCJs74jehxb9ptAA'

async function checkDataset() {
  const baseUrl = 'https://api.apify.com/v2'

  console.log('Fetching full dataset from dev_fusion actor...')
  console.log('='.repeat(80))
  console.log('')

  const response = await fetch(`${baseUrl}/datasets/${datasetId}/items?limit=100`, {
    headers: {
      'Authorization': `Bearer ${APIFY_API_KEY}`
    }
  })

  const data = await response.json()

  console.log('Raw response:')
  console.log(JSON.stringify(data, null, 2))
  console.log('')
  console.log('='.repeat(80))
}

checkDataset()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
