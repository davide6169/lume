/**
 * CSV Interest Enrichment - ESEMPIO PRATICO
 *
 * BANCO DI PROVA del workflow engine
 *
 * INPUT CSV:
 * nome;celular;email;nascimento
 * Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986
 * Luca Bianchi;3282345678;luca.bianchi@mydomain.com;27/01/1983
 * Giuseppe Verdi;3273456789;giuseppe.verdi@mydomain.com;
 *
 * OUTPUT CSV (arricchito):
 * nome;celular;email;nascimento;interessi
 * Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986;chitarra elettrica, escursionismo montagna, fotografia paesaggi, viaggi in Italia
 * Luca Bianchi;3282345678;luca.bianchi@mydomain.com;27/01/1983;cinema italiano, regia teatrale, letteratura, arte contemporanea
 * Giuseppe Verdi;3273456789;giuseppe.verdi@mydomain.com;;opera lirica, musica classica, composizione, pianoforte, storia della musica
 *
 * NOTA: Il campo "interessi" viene aggiunto in fondo ed è vuoto se non troviamo dati bio
 */

import { CSVInterestEnrichmentBlock } from '../blocks/csv/csv-interest-enrichment.block'
import { ContextFactory } from '../context'

// ============================================================
// FUNZIONI HELPER PER CSV
// ============================================================

/**
 * Parse CSV content
 */
function parseCSV(csvContent: string): {
  headers: string[]
  rows: Array<any>
} {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(';').map(h => h.trim())

  const rows = lines.slice(1).map(line => {
    const values = line.split(';').map(v => v.trim())
    const row: any = {}

    headers.forEach((header, index) => {
      row[header] = values[index]
    })

    return row
  })

  return { headers, rows }
}

/**
 * Convert output back to CSV
 */
function toCSV(output: any): string {
  const headers = output.csv.headers
  const rows = output.csv.rows

  // Header row
  const headerRow = headers.join(';')

  // Data rows
  const dataRows = rows.map(row => {
    return headers.map(header => {
      const value = row[header]
      // Quote if contains comma or semicolon
      if (value && (value.includes(',') || value.includes(';') || value.includes(' '))) {
        return `"${value}"`
      }
      return value || ''
    }).join(';')
  })

  return [headerRow, ...dataRows].join('\n')
}

// ============================================================
// ESEMPIO DI INPUT
// ============================================================

const csvInput = `nome;celular;email;nascimento
Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986
Luca Bianchi;3282345678;luca.bianchi@mydomain.com;27/01/1983
Giuseppe Verdi;3273456789;giuseppe.verdi@mydomain.com;`

// ============================================================
// ESECUZIONE WORKFLOW
// ============================================================

async function runCSVInterestEnrichment() {
  console.log('\n' + '='.repeat(80))
  console.log('  CSV INTEREST ENRICHMENT - BANCO DI PROVA')
  console.log('='.repeat(80) + '\n')

  // Parse CSV
  const { headers, rows } = parseCSV(csvInput)

  console.log('📄 INPUT CSV:')
  console.log(headers.join(' ; '))
  rows.forEach((row, i) => {
    console.log(`${i + 1}. ${Object.values(row).join(' ; ')}`)
  })
  console.log()

  // Create block
  const block = new CSVInterestEnrichmentBlock()

  // Create context
  const context = ContextFactory.create({
    workflowId: 'csv-interest-enrichment',
    mode: 'demo',
    secrets: {
      apify: process.env.APIFY_TOKEN || 'your-apify-token',
      openrouter: process.env.OPENROUTER_API_KEY || 'your-openrouter-token'
    },
    progress: (progress, event) => {
      const details = event.details as any
      console.log(`  [${progress}%] ${event.event}`)
      if (details) {
        console.log(`     Processed: ${details.processed}/${details.total}`)
        console.log(`     With interests: ${details.contactsWithInterests}`)
        console.log(`     Without interests: ${details.contactsWithoutInterests}`)
        console.log(`     LinkedIn found: ${details.linkedinFound}`)
        console.log(`     Instagram found: ${details.instagramFound}`)
        console.log(`     Cost so far: $${details.totalCost}`)
      }
    }
  })

  // Prepare input
  const input = {
    csv: {
      headers,
      rows
    }
  }

  // Config
  const config = {
    apifyToken: '{{secrets.apify}}',
    openrouterToken: '{{secrets.openrouter}}',
    enableLinkedIn: true,
    enableInstagram: true,
    maxCostPerContact: 0.10
  }

  console.log('⚙️  CONFIGURAZIONE:')
  console.log('   LinkedIn: enabled')
  console.log('   Instagram: enabled')
  console.log('   Max cost per contact: $0.10')
  console.log()

  // Execute enrichment
  const result = await block.execute(config, input, context)

  // Check results
  if (result.status === 'completed') {
    console.log('\n' + '='.repeat(80))
    console.log('  ✅ ENRICHMENT COMPLETATO!')
    console.log('='.repeat(80) + '\n')

    const output = result.output
    const metadata = result.output.metadata

    // Show statistics
    console.log('📊 STATISTICHE:')
    console.log(`   Totali contatti input:   ${metadata.totalContacts}`)
    console.log(`   Con interessi:          ${metadata.contactsWithInterests}`)
    console.log(`   Senza interessi:        ${metadata.contactsWithoutInterests}`)
    console.log(`   Filtrati (no interessi): ${metadata.filteredContacts}`)
    console.log(`   Record output CSV:      ${metadata.outputRecords} ⭐`)
    console.log(`   Country rilevati:       ${metadata.countryDetected}`)
    console.log(`   LinkedIn trovati:       ${metadata.linkedinFound}`)
    console.log(`   Instagram trovati:      ${metadata.instagramFound}`)
    console.log(`   Costo totale:           $${metadata.totalCost.toFixed(4)}`)
    console.log(`   Costo medio per cont.:  $${metadata.avgCostPerContact.toFixed(4)}`)
    console.log()
    console.log('⚠️  NOTA: Il CSV di output contiene SOLO i record con interessi trovati')
    console.log()

    // Show enriched CSV
    console.log('📄 OUTPUT CSV (ARRICCHITO):')
    console.log(' ' + '-'.repeat(80))

    const csvOutput = toCSV(output)
    console.log(csvOutput)

    console.log(' ' + '-'.repeat(80))
    console.log()

    // Show detailed breakdown
    console.log('🔍 DETTAGLIO CONTATTI:')
    console.log(' ' + '-'.repeat(80))

    output.csv.rows.forEach((row: any, i: number) => {
      console.log(`\n${i + 1}. ${row.nome}`)
      console.log(`   Email: ${row.email}`)
      console.log(`   Phone: ${row.celular}`)
      console.log(`   Nascita: ${row.nascimento || 'N/A'}`)

      if (row.interessi && row.interesti.length > 0) {
        console.log(`   ✅ Interessi: ${row.interessi}`)
      } else {
        console.log(`   ⚠️  Interessi: (non disponibili - nessun profilo social trovato)`)
      }

      if (row.enrichment_cost) {
        console.log(`   💰 Costo: $${row.enrichment_cost}`)
      }
    })

    console.log('\n' + ' '.repeat(80))

    // Save to file
    const outputPath = './enriched-contacts.csv'
    const fs = require('fs')
    fs.writeFileSync(outputPath, csvOutput)
    console.log(`\n✅ CSV salvato in: ${outputPath}`)

  } else {
    console.log('\n❌ ENRICHMENT FALLITO:')
    console.log(`Error: ${result.error}`)
  }
}

// ============================================================
// RUN
// ============================================================

async function main() {
  try {
    await runCSVInterestEnrichment()
    console.log('\n✅ Esempio completato con successo!\n')
  } catch (error) {
    console.error('\n❌ Errore:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { runCSVInterestEnrichment, parseCSV, toCSV }
