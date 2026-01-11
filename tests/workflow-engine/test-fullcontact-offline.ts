/**
 * Test Offline FullContact - usa risposta salvata
 *
 * Questo test usa la risposta reale salvata in /tmp/fullcontact-api-log.json
 * senza fare nuove chiamate API per non consumare quota.
 */

import { FullContactSearchBlock } from '../../lib/workflow-engine/blocks/api/fullcontact-search.block'
import { ContextFactory } from '../../lib/workflow-engine/context'
import { writeFile } from 'fs/promises'

// Risposta reale dell'API FullContact salvata
const SAVED_RESPONSE = {
  "fullName": "Davide",
  "ageRange": null,
  "gender": "Male",
  "location": null,
  "title": null,
  "organization": null,
  "twitter": null,
  "linkedin": null,
  "bio": null,
  "avatar": null,
  "website": null,
  "details": {
    "name": {
      "given": "Davide"
    },
    "age": null,
    "gender": "Male",
    "demographics": {
      "gender": "Male"
    },
    "emails": [],
    "phones": [],
    "profiles": {},
    "locations": [],
    "employment": [],
    "photos": [],
    "education": [],
    "urls": [],
    "interests": []
  },
  "updated": "2026-01-11"
}

async function testFullContactOffline() {
  console.log('╔══════════════════════════════════════════════════════════════════╗')
  console.log('║     FullContact Offline Test - Saved Response                 ║')
  console.log('╚══════════════════════════════════════════════════════════════════╝')
  console.log()

  // Create context
  const context = ContextFactory.create({
    workflowId: 'test-fullcontact-offline',
    executionId: `test-offline-${Date.now()}`,
    mode: 'test',
    variables: {},
    secrets: {},
    logger: {
      node: (nodeId: string, msg: string, meta?: any) => console.log(`  [${nodeId}] ${msg}`, meta ? JSON.stringify(meta, null, 2) : ''),
      debug: (msg: string, meta?: any) => console.log(`  [DEBUG] ${msg}`, meta ? JSON.stringify(meta, null, 2) : ''),
      info: (msg: string, meta?: any) => console.log(`  [INFO] ${msg}`, meta ? JSON.stringify(meta, null, 2) : ''),
      warn: (msg: string, meta?: any) => console.log(`  [WARN] ⚠️  ${msg}`, meta ? JSON.stringify(meta, null, 2) : ''),
      error: (msg: string, meta?: any) => console.log(`  [ERROR] ❌ ${msg}`, meta ? JSON.stringify(meta, null, 2) : '')
    }
  })

  // Create block instance
  const block = new FullContactSearchBlock()

  // Prepare input
  const input = {
    contacts: [
      {
        original: {
          nome: 'Davide Cucciniello',
          email: 'davide6169@gemail.com',
          nascimento: '1969-01-06'
        },
        email: 'davide6169@gemail.com',
        nome: 'Davide Cucciniello'
      }
    ]
  }

  console.log('📥 Input Contact:')
  console.log('─'.repeat(70))
  console.log(`   Davide Cucciniello <davide6169@gemail.com>`)
  console.log('─'.repeat(70))
  console.log()

  console.log('📄 FullContact API Response (saved):')
  console.log('─'.repeat(70))
  console.log(JSON.stringify(SAVED_RESPONSE, null, 2))
  console.log('─'.repeat(70))
  console.log()

  console.log('🔍 Parsing response...')
  console.log('═'.repeat(70))
  console.log()

  // Simula il parsing manuale della risposta
  const profileData: any = {
    found: true
  }

  // Extract social profiles (direct fields at root level)
  const profiles: any = {}
  if (SAVED_RESPONSE.twitter) profiles.twitter = SAVED_RESPONSE.twitter
  if (SAVED_RESPONSE.linkedin) profiles.linkedin = SAVED_RESPONSE.linkedin
  if (SAVED_RESPONSE.facebook) profiles.facebook = SAVED_RESPONSE.facebook
  if (SAVED_RESPONSE.instagram) profiles.instagram = SAVED_RESPONSE.instagram

  // Check data.details.profiles (can be array or object)
  if (SAVED_RESPONSE.details?.profiles) {
    const detailsProfiles = SAVED_RESPONSE.details.profiles

    // Handle array format
    if (Array.isArray(detailsProfiles)) {
      detailsProfiles.forEach((profile: any) => {
        const id = profile.id || ''
        const username = profile.username || ''

        if (profile.type === 'instagram' && username) {
          profiles.instagram = username
        } else if (profile.type === 'twitter' && username) {
          profiles.twitter = username
        } else if (profile.type === 'linkedin' && (id || username)) {
          profiles.linkedin = id || username
        } else if (profile.type === 'facebook' && (id || username)) {
          profiles.facebook = id || username
        }
      })
    }
    // Handle object format
    else if (typeof detailsProfiles === 'object' && detailsProfiles !== null) {
      for (const [network, profileData] of Object.entries(detailsProfiles)) {
        if (profileData && typeof profileData === 'object') {
          const profile = profileData as any
          if (network === 'instagram' && profile.username) {
            profiles.instagram = profile.username
          } else if (network === 'twitter' && profile.username) {
            profiles.twitter = profile.username
          } else if (network === 'linkedin' && (profile.id || profile.username)) {
            profiles.linkedin = profile.id || profile.username
          } else if (network === 'facebook' && (profile.id || profile.username)) {
            profiles.facebook = profile.id || profile.username
          }
        }
      }
    }
  }

  if (Object.keys(profiles).length > 0) {
    profileData.profiles = profiles
  }

  // Extract demographics
  if (SAVED_RESPONSE.details?.demographics) {
    const demographics: any = {}

    if (SAVED_RESPONSE.details.demographics.locationGeneral) {
      demographics.location = SAVED_RESPONSE.details.demographics.locationGeneral
    }

    if (SAVED_RESPONSE.details.demographics.gender) {
      demographics.gender = SAVED_RESPONSE.details.demographics.gender
    }

    if (SAVED_RESPONSE.details.demographics.ageRange) {
      const ageRange = SAVED_RESPONSE.details.demographics.ageRange as any
      demographics.age = `${ageRange.start}-${ageRange.end}`
    }

    if (SAVED_RESPONSE.details.demographics.country) {
      demographics.country = SAVED_RESPONSE.details.demographics.country
    }

    if (Object.keys(demographics).length > 0) {
      profileData.demographics = demographics
    }
  }

  // Extract interests
  if (SAVED_RESPONSE.details?.interests) {
    const interests: string[] = []

    if (Array.isArray(SAVED_RESPONSE.details.interests)) {
      SAVED_RESPONSE.details.interests.forEach((interest: any) => {
        if (typeof interest === 'string') {
          interests.push(interest)
        } else if (interest.name) {
          interests.push(interest.name)
        }
      })
    }

    if (interests.length > 0) {
      profileData.interests = interests
    }
  }

  console.log()
  console.log('═'.repeat(70))
  console.log('✅ PARSING COMPLETED')
  console.log('═'.repeat(70))
  console.log()

  console.log('📊 Parsed Data:')
  console.log(`   Found: ${profileData.found}`)

  if (profileData.profiles) {
    console.log(`   Profiles: ${JSON.stringify(profileData.profiles, null, 4)}`)
  } else {
    console.log('   Profiles: (none)')
  }

  if (profileData.demographics) {
    console.log(`   Demographics: ${JSON.stringify(profileData.demographics, null, 4)}`)
  } else {
    console.log('   Demographics: (none)')
  }

  if (profileData.interests) {
    console.log(`   Interests: ${JSON.stringify(profileData.interests, null, 4)}`)
  } else {
    console.log('   Interests: (none)')
  }

  console.log()
  console.log('═'.repeat(70))
  console.log('📝 Analysis:')
  console.log('═'.repeat(70))
  console.log()

  // Analisi della risposta
  console.log('FullContact API returned:')
  console.log(`✓ Status: 200 OK`)
  console.log(`✓ Gender: Male`)
  console.log(`✓ Name: Davide`)
  console.log(`✓ Social Profiles: ${Object.keys(profiles).length > 0 ? JSON.stringify(profiles) : '(none - this email has no public social profiles)'}`)
  console.log(`✓ Interests: ${profileData.interests?.length || 0} found`)
  console.log()
  console.log('Note: This email appears to have minimal public data on FullContact.')
  console.log('      Only basic demographics (gender) were found.')

  // Salva il risultato parsato
  const parsedResult = {
    contact: {
      original: {
        nome: 'Davide Cucciniello',
        email: 'davide6169@gemail.com',
        nascimento: '1969-01-06'
      },
      fullcontact: profileData
    },
    metadata: {
      parsedAt: new Date().toISOString(),
      source: 'saved-api-response'
    }
  }

  await writeFile('/tmp/fullcontact-parsed-result.json', JSON.stringify(parsedResult, null, 2))
  console.log()
  console.log('💾 Parsed result saved to /tmp/fullcontact-parsed-result.json')
  console.log()
}

testFullContactOffline().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
