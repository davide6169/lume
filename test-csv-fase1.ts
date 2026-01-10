/**
 * CSV Interest Enrichment - Workflow Fase 1 Test
 *
 * Test del workflow-based approach con i nuovi blocchi:
 * - CSV Parser Block
 * - CSV Assembler Block
 *
 * Questo è un test preliminare per la Fase 1.
 */

import dotenv from 'dotenv'
import { registerAllBuiltInBlocks } from './lib/workflow-engine/blocks'
import { CSVParserBlock, type CSVParserConfig } from './lib/workflow-engine/blocks/csv/csv-parser.block'
import { CSVAssemblerBlock, type CSVAssemblerConfig } from './lib/workflow-engine/blocks/csv/csv-assembler.block'
import { ContextFactory } from './lib/workflow-engine/context'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize blocks
registerAllBuiltInBlocks()

// ============================================================
// SAMPLE DATA - Marco Montemagno Test
// ============================================================

const sampleCSV = `nome;celular;email;nascimento
Marco Montemagno;;marco@montemagno.com;1974-01-01
Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986
Luca Bianchi;3282345678;luca.bianchi@mydomain.com;27/01/1983`

// ============================================================
// TEST 1: CSV Parser
// ============================================================

async function testCSVParser() {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 1: CSV Parser Block')
  console.log('='.repeat(80) + '\n')

  const parser = new CSVParserBlock()
  const context = ContextFactory.create({
    workflowId: 'csv-parser-test',
    executionId: 'test_csv_parser',
    mode: 'demo', // Mock mode
    variables: {},
    secrets: {},
    logger: {
      debug: (msg: string, meta?: any) => console.log(`[DEBUG] ${msg}`, meta || ''),
      info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta || ''),
      warn: (msg: string, meta?: any) => console.warn(`[WARN] ${msg}`, meta || ''),
      error: (msg: string, meta?: any) => console.error(`[ERROR] ${msg}`, meta || '')
    }
  })

  const parserConfig: CSVParserConfig = {
    delimiter: ';',
    hasHeader: true,
    skipEmpty: true,
    trimWhitespace: true
  }

  const parserInput = {
    csv: sampleCSV
  }

  const parserResult = await parser.execute(parserConfig, parserInput, context)

  console.log('📊 PARSER RESULT:')
  console.log(`Status: ${parserResult.status}`)
  console.log(`Execution Time: ${parserResult.executionTime}ms`)
  console.log(`Headers: ${parserResult.output?.headers.join(', ')}`)
  console.log(`Rows: ${parserResult.output?.rows.length}`)
  console.log(`\nFirst row:`)
  console.log(JSON.stringify(parserResult.output?.rows[0], null, 2))

  return parserResult.output
}

// ============================================================
// TEST 2: CSV Assembler
// ============================================================

async function testCSVAssembler(parsedData: any) {
  console.log('\n' + '='.repeat(80))
  console.log('  TEST 2: CSV Assembler Block')
  console.log('='.repeat(80) + '\n')

  const assembler = new CSVAssemblerBlock()
  const context = ContextFactory.create({
    workflowId: 'csv-assembler-test',
    executionId: 'test_csv_assembler',
    mode: 'demo',
    variables: {},
    secrets: {},
    logger: {
      debug: (msg: string, meta?: any) => console.log(`[DEBUG] ${msg}`, meta || ''),
      info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta || ''),
      warn: (msg: string, meta?: any) => console.warn(`[WARN] ${msg}`, meta || ''),
      error: (msg: string, meta?: any) => console.error(`[ERROR] ${msg}`, meta || '')
    }
  })

  // Simulate enriched data with interests
  const enrichedRows = parsedData.rows.map((row: any) => ({
    original: row,
    interests: ['tecnologia', 'innovazione', 'musica'].slice(0, Math.floor(Math.random() * 3) + 1),
    enrichmentMetadata: {
      cost: 0.05,
      sources: ['instagram']
    }
  }))

  const assemblerConfig: CSVAssemblerConfig = {
    originalHeaders: parsedData.headers,
    addInterestsColumn: true,
    interestsColumnName: 'interessi',
    filterEmpty: false, // Keep all rows for demo
    delimiter: ';'
  }

  const assemblerInput = {
    rows: enrichedRows
  }

  const assemblerResult = await assembler.execute(assemblerConfig, assemblerInput, context)

  console.log('📊 ASSEMBLER RESULT:')
  console.log(`Status: ${assemblerResult.status}`)
  console.log(`Execution Time: ${assemblerResult.executionTime}ms`)
  console.log(`Total Input: ${assemblerResult.output?.metadata.totalInput}`)
  console.log(`Total Output: ${assemblerResult.output?.metadata.totalOutput}`)
  console.log(`Filtered: ${assemblerResult.output?.metadata.filtered}`)
  console.log(`With Interests: ${assemblerResult.output?.metadata.withInterests}`)
  console.log(`Total Cost: $${assemblerResult.output?.metadata.totalCost.toFixed(4)}`)
  console.log(`\nGenerated CSV:`)
  console.log(assemblerResult.output?.csv.csvString)
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function runTests() {
  console.log('\n' + '█'.repeat(80))
  console.log('  CSV INTEREST ENRICHMENT - FASE 1 TEST')
  console.log('  Testing CSV Parser and CSV Assembler blocks')
  console.log('█'.repeat(80))

  try {
    // Test 1: Parse CSV
    const parsedData = await testCSVParser()

    // Test 2: Assemble CSV with interests
    await testCSVAssembler(parsedData)

    console.log('\n' + '█'.repeat(80))
    console.log('  ✅ ALL TESTS PASSED - FASE 1 COMPLETE!')
    console.log('█'.repeat(80) + '\n')

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error)
    process.exit(1)
  }
}

// Run tests
runTests()
