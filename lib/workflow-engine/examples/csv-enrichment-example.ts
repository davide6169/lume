/**
 * CSV Enrichment Example - End-to-End
 *
 * Questo esempio mostra come arricchire un CSV di contatti
 * aggiungendo interessi usando il LeadEnrichmentBlock.
 *
 * CSV Input (formato italiano):
 * nome;celular;email;nascimento
 * Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986
 * Luca Bianchi;3282345678;luca.bianchi@mydomain.com;27/01/1983
 * Giuseppe Verdi;3273456789;giuseppe.verdi@myomain.com;
 *
 * Output:
 * - CSV arricchito con interessi
 * - File JSON con dati completi
 */

import { LeadEnrichmentBlock } from '../blocks/enrichment/lead-enrichment.block'
import { ContextFactory } from '../context'
import { writeFileSync, readFileSync } from 'fs'
import * as fs from 'fs'

// ============================================================
// STEP 1: Leggere il CSV
// ============================================================

function parseCSV(csvContent: string): Array<{
  nome: string
  celular: string
  email: string
  nascimento: string
}> {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(';').map(h => h.trim())

  return lines.slice(1).map(line => {
    const values = line.split(';').map(v => v.trim())
    const contact: any = {}

    headers.forEach((header, index) => {
      contact[header] = values[index]
    })

    return contact
  })
}

// ============================================================
// STEP 2: Convertire CSV in formato LeadEnrichmentInput
// ============================================================

function convertToEnrichmentInput(
  csvContacts: Array<{
    nome: string
    celular: string
    email: string
    nascimento: string
  }>
) {
  return {
    contacts: csvContacts.map(csvContact => {
      // Estrai nome e cognome
      const nameParts = csvContact.nome.split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ')

      // Formatta data di nascita (da DD/MM/YYYY a YYYY-MM-DD)
      let birthDate = undefined
      if (csvContact.nascimento) {
        const parts = csvContact.nascimento.split('/')
        if (parts.length === 3) {
          birthDate = `${parts[2]}-${parts[1]}-${parts[0]}`
        }
      }

      // Formatta numero di telefono (aggiungi +39 se mancante)
      let phone = csvContact.celular
      if (phone && !phone.startsWith('+')) {
        phone = `+39${phone}`
      }

      return {
        email: csvContact.email,
        firstName: firstName,
        lastName: lastName,
        fullName: csvContact.nome,
        phone: phone,
        birthDate: birthDate
      }
    })
  }
}

// ============================================================
// STEP 3: Eseguire l'enrichment
// ============================================================

async function enrichContacts(input: any) {
  // Create context
  const context = ContextFactory.create({
    workflowId: 'csv-enrichment',
    mode: 'production',
    secrets: {
      // NOTA: Apollo non funziona per email personali come @gmail, @yahoo
      // Poiché tutti i contatti hanno @mydomain.com (business email), Apollo proverà
      apollo: process.env.APOLLO_API_KEY || 'your-apollo-token',
      openrouter: process.env.OPENROUTER_API_KEY || 'your-openrouter-token'
    },
    progress: (progress, event) => {
      console.log(`  [${progress}%] ${event.event}`)
    }
  })

  // Execute enrichment
  const block = new LeadEnrichmentBlock()
  const config = {
    apolloToken: '{{secrets.apollo}}',
    openrouterToken: '{{secrets.openrouter}}',
    enableApollo: true,  // Proverà per @mydomain.com (business)
    enableInterestInference: true,
    defaultCountry: 'IT'  // Default: Italia
  }

  const result = await block.execute(config, input, context)

  return result
}

// ============================================================
// STEP 4: Generare CSV arricchito
// ============================================================

function generateEnrichedCSV(enrichedContacts: any[]) {
  // Header
  const headers = [
    'nome',
    'celular',
    'email',
    'nascimento',
    'eta',
    'paese',
    'linkedin',
    'interessi',
    'costo_enrichment'
  ]

  // Rows
  const rows = enrichedContacts.map(contact => {
    // Formatta interessi come lista separata da virgole
    const interestsList = contact.interests
      ? contact.interests.map((i: any) => i.topic).join(', ')
      : ''

    // Formatta LinkedIn
    const linkedin = contact.linkedin?.found
      ? contact.linkedin.url
      : ''

    return [
      contact.fullName || '',
      contact.phone || '',
      contact.email || '',
      contact.birthDate || '',
      contact.age || '',
      contact.country?.name || '',
      linkedin,
      interestsList,
      contact.enrichmentCost || ''
    ].map(v => `"${v}"`).join(';')
  })

  return headers.join(';') + '\n' + rows.join('\n')
}

// ============================================================
// ESEMPIO COMPLETO
// ============================================================

async function csvEnrichmentExample() {
  console.log('\n' + '='.repeat(80))
  console.log('  CSV ENRICHMENT EXAMPLE - END-TO-END')
  console.log('='.repeat(80) + '\n')

  // ========================================================
  // STEP 1: Leggere il CSV
  // ========================================================
  console.log('📄 STEP 1: Leggere il CSV\n')

  const csvContent = `nome;celular;email;nascimento
Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986
Luca Bianchi;3282345678;luca.bianchi@mydomain.com;27/01/1983
Giuseppe Verdi;3273456789;giuseppe.verdi@mydomain.com;`

  console.log('CSV Input:')
  console.log(csvContent)
  console.log()

  const csvContacts = parseCSV(csvContent)
  console.log(`✅ Parsati ${csvContacts.length} contatti dal CSV\n`)

  // ========================================================
  // STEP 2: Convertire in formato enrichment
  // ========================================================
  console.log('🔄 STEP 2: Convertire in formato enrichment\n')

  const enrichmentInput = convertToEnrichmentInput(csvContacts)

  console.log('Contatti convertiti:')
  enrichmentInput.contacts.forEach((c: any, i: number) => {
    console.log(`  ${i + 1}. ${c.fullName}`)
    console.log(`     Email: ${c.email}`)
    console.log(`     Phone: ${c.phone}`)
    console.log(`     Birth Date: ${c.birthDate}`)
    console.log(`     Age: ${c.age || 'N/A'}`)
    console.log()
  })

  // ========================================================
  // STEP 3: Eseguire l'enrichment
  // ========================================================
  console.log('⚙️  STEP 3: Eseguire l\'enrichment (3 strategie)\n')
  console.log('Strategie attive:')
  console.log('  1. 🌎 Country Detection (da prefisso telefonico +39)')
  console.log('  2. 💼 LinkedIn via Apollo (solo email business)')
  console.log('  3. ❤️  LLM Interest Inference (prompt per Italia)')
  console.log()

  const result = await enrichContacts(enrichmentInput)

  if (result.status !== 'completed') {
    console.error('❌ Enrichment fallito:', result.error)
    return
  }

  const output = result.output
  console.log('\n✅ Enrichment completato!\n')

  // ========================================================
  // STEP 4: Mostrare risultati dettagliati
  // ========================================================
  console.log('📊 RISULTATI DETTAGLIATI:')
  console.log(' ' + '='.repeat(80) + '\n')

  output.contacts.forEach((contact: any, i: number) => {
    console.log(`${i + 1}. ${contact.fullName} (${contact.email})`)
    console.log(`   Età: ${contact.age || 'N/A'} anni`)
    console.log(`   Phone: ${contact.phone}`)

    // Country
    if (contact.country) {
      console.log(`   🌎 Paese: ${contact.country.name} (${contact.country.code})`)
      console.log(`      Regione: ${contact.country.region}`)
      console.log(`      Lingua: ${contact.country.language}`)
      console.log(`      Rilevato da: ${contact.country.detectionMethod} (confidenza: ${contact.country.confidence})`)
    }

    // LinkedIn
    if (contact.linkedin) {
      if (contact.linkedin.found) {
        console.log(`   💼 LinkedIn: ${contact.linkedin.url}`)
        console.log(`      Titolo: ${contact.linkedin.title || 'N/A'}`)
        console.log(`      Azienda: ${contact.linkedin.company || 'N/A'}`)
      } else {
        console.log(`   💼 LinkedIn: Non trovato (email ${contact.linkedin.emailType})`)
      }
    }

    // Interessi
    if (contact.interests && contact.interests.length > 0) {
      console.log(`   ❤️  Interessi (${contact.interests.length}):`)
      contact.interests.forEach((interest: any) => {
        console.log(`      • ${interest.topic} (${interest.category}) - ${(interest.confidence * 100).toFixed(0)}%`)
      })
    }

    console.log(`   💰 Costo enrichment: $${(contact.enrichmentCost || 0).toFixed(4)}`)
    console.log()
  })

  // ========================================================
  // STEP 5: Generare CSV arricchito
  // ========================================================
  console.log('📄 STEP 5: Generare CSV arricchito\n')

  const enrichedCSV = generateEnrichedCSV(output.contacts)

  console.log('CSV Arricchito:')
  console.log(' ' + '-'.repeat(80))
  console.log(enrichedCSV)
  console.log(' ' + '-'.repeat(80))
  console.log()

  // Salva CSV su file
  const outputPath = './enriched-contacts.csv'
  writeFileSync(outputPath, enrichedCSV)
  console.log(`✅ CSV salvato in: ${outputPath}\n`)

  // ========================================================
  // STEP 6: Summary
  // ========================================================
  console.log('📋 RIASSUNTO:\n')

  const metadata = output.metadata
  console.log(`   Totali contatti:        ${metadata.totalContacts}`)
  console.log(`   Paese rilevato:         ${metadata.countryDetected} (100%)`)
  console.log(`   Email business:         ${metadata.businessEmails}`)
  console.log(`   Email personali:        ${metadata.personalEmails}`)
  console.log(`   LinkedIn trovati:       ${metadata.linkedinFound} / ${metadata.businessEmails}`)
  console.log(`   Totale interessi:       ${metadata.totalInterests}`)
  console.log(`   Media interessi/cont.:  ${metadata.avgInterestsPerContact.toFixed(1)}`)
  console.log(`   Costo totale:           $${metadata.totalCost.toFixed(4)} USD`)
  console.log(`   └─ Apollo (LinkedIn):        $${metadata.costBreakdown.apollo.toFixed(4)}`)
  console.log(`   └─ OpenRouter (LLM):        $${metadata.costBreakdown.openrouter.toFixed(4)}`)
  console.log()
  console.log('💡 Costo per contatto: $' + (metadata.totalCost / metadata.totalContacts).toFixed(4))
  console.log()

  // Salva anche JSON completo
  const jsonPath = './enriched-contacts.json'
  writeFileSync(jsonPath, JSON.stringify(output, null, 2))
  console.log(`✅ JSON completo salvato in: ${jsonPath}\n`)

  console.log('='.repeat(80))
  console.log('✅ ENRICHMENT COMPLETATO!')
  console.log('='.repeat(80) + '\n')
}

// ============================================================
// RUN EXAMPLE
// ============================================================

async function main() {
  try {
    await csvEnrichmentExample()
  } catch (error) {
    console.error('\n❌ Errore durante l\'enrichment:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { csvEnrichmentExample, parseCSV, convertToEnrichmentInput, generateEnrichedCSV }
