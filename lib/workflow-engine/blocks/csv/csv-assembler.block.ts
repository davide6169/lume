/**
 * CSV Assembler Block
 *
 * Assembles final CSV output with interests column.
 * Filters out rows without interests if configured.
 *
 * Input: Original headers + enriched rows with interests
 * Output: Complete CSV with added interests column
 *
 * Features:
 * - Add interests column to original headers
 * - Filter rows with empty interests
 * - Configurable interests column name
 * - Generate CSV string output
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'

// Types
export interface CSVAssemblerConfig {
  originalHeaders?: string[] // Original CSV headers
  addInterestsColumn?: boolean // Default: true
  interestsColumnName?: string // Default: 'interessi'
  filterEmpty?: boolean // Default: true
  delimiter?: string // Default: ';'
}

export interface CSVAssemblerInput {
  originalHeaders?: string[]
  rows: Array<{
    original: Record<string, any>
    interests?: string[] | string
    enrichmentMetadata?: {
      cost: number
      sources: string[]
    }
  }>
}

export interface CSVAssemblerOutput {
  csv: {
    headers: string[]
    rows: Array<Record<string, any>>
    csvString?: string // Optional: raw CSV string
  }
  metadata: {
    totalInput: number
    totalOutput: number
    filtered: number
    withInterests: number
    withoutInterests: number
    totalCost: number
    avgCostPerContact: number
  }
}

/**
 * CSV Assembler Block
 */
export class CSVAssemblerBlock extends BaseBlockExecutor {
  static supportsMock = true // Utility block - no API calls, works in all modes

  constructor() {
    super('csv.assembler')
  }

  async execute(
    config: CSVAssemblerConfig,
    input: CSVAssemblerInput,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      // Check for mock mode
      const shouldMock = config.mode === 'mock' || context.mode === 'demo' || context.mode === 'test'

      if (shouldMock) {
        this.log(context, 'info', '🎭 MOCK MODE: Simulating CSV assembly')
        return await this.executeMock(config, input, context, startTime)
      }

      this.log(context, 'info', 'Assembling CSV', {
        inputRows: input.rows.length,
        addInterestsColumn: config.addInterestsColumn !== false,
        filterEmpty: config.filterEmpty !== false
      })

      // Validate input
      if (!input.rows || !Array.isArray(input.rows)) {
        throw new Error('Input must have rows array')
      }

      // Assemble CSV
      const result = this.assembleCSV(input, config)

      const executionTime = Date.now() - startTime

      this.log(context, 'info', 'CSV assembled successfully', {
        totalInput: result.metadata.totalInput,
        totalOutput: result.metadata.totalOutput,
        filtered: result.metadata.filtered,
        withInterests: result.metadata.withInterests,
        totalCost: result.metadata.totalCost.toFixed(4)
      })

      return {
        status: 'completed',
        output: result,
        executionTime,
        error: undefined,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: result.metadata,
        logs: []
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'CSV assembly failed', {
        error: (error as Error).message
      })

      return {
        status: 'failed',
        output: null,
        executionTime,
        error: error as Error,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {},
        logs: []
      }
    }
  }

  /**
   * Assemble CSV with interests column
   */
  private assembleCSV(input: CSVAssemblerInput, config: CSVAssemblerConfig): CSVAssemblerOutput {
    const addInterestsColumn = config.addInterestsColumn !== false
    const filterEmpty = config.filterEmpty !== false
    const interestsColumnName = config.interestsColumnName || 'interessi'
    const delimiter = config.delimiter || ';'

    // Get original headers or infer from first row
    let headers = config.originalHeaders || []
    if (headers.length === 0 && input.rows.length > 0) {
      headers = Object.keys(input.rows[0].original)
    }

    // Add interests column if configured
    const outputHeaders = addInterestsColumn
      ? [...headers, interestsColumnName]
      : headers

    // Process rows
    const assembledRows: Array<Record<string, any>> = []
    let withInterests = 0
    let withoutInterests = 0
    let totalCost = 0

    input.rows.forEach((rowItem) => {
      const assembledRow: Record<string, any> = { ...rowItem.original }

      // Extract interests from multiple possible sources
      // Priority: merged interests > FullContact > PDL
      let interestsArray: string[] | undefined

      // 1. Check for merged interests (from llm-merge) - new structure
      if (rowItem.mergedInterests?.interests && Array.isArray(rowItem.mergedInterests.interests)) {
        interestsArray = rowItem.mergedInterests.interests
      }
      // 2. Check for direct interests field (from llm-merge) - old structure
      else if (rowItem.interests && Array.isArray(rowItem.interests)) {
        interestsArray = rowItem.interests
      }
      // 3. Check FullContact enrichment
      else if (rowItem.fullcontact?.interests && Array.isArray(rowItem.fullcontact.interests)) {
        interestsArray = rowItem.fullcontact.interests
      }
      // 4. Check PDL enrichment
      else if (rowItem.pdl?.interests && Array.isArray(rowItem.pdl.interests)) {
        interestsArray = rowItem.pdl.interests
      }

      // Convert to string
      let interestsString = ''
      if (interestsArray && interestsArray.length > 0) {
        interestsString = interestsArray.join(', ')
      } else if (typeof rowItem.interests === 'string') {
        interestsString = rowItem.interests
      }

      // Add interests column
      if (addInterestsColumn) {
        assembledRow[interestsColumnName] = interestsString
      }

      // Track stats
      if (interestsString && interestsString.trim().length > 0) {
        withInterests++
      } else {
        withoutInterests++
      }

      // Add enrichment metadata
      if (rowItem.enrichmentMetadata) {
        assembledRow.enrichment_cost = rowItem.enrichmentMetadata.cost
        totalCost += rowItem.enrichmentMetadata.cost
      }

      // Add to output (or skip if filtering empty)
      if (!filterEmpty || interestsString.trim().length > 0) {
        assembledRows.push(assembledRow)
      }
    })

    // Generate CSV string
    const csvString = this.generateCSVString(outputHeaders, assembledRows, delimiter)

    return {
      csv: {
        headers: outputHeaders,
        rows: assembledRows,
        csvString
      },
      metadata: {
        totalInput: input.rows.length,
        totalOutput: assembledRows.length,
        filtered: input.rows.length - assembledRows.length,
        withInterests,
        withoutInterests,
        totalCost,
        avgCostPerContact: input.rows.length > 0 ? totalCost / input.rows.length : 0
      }
    }
  }

  /**
   * Generate CSV string from headers and rows
   */
  private generateCSVString(headers: string[], rows: Array<Record<string, any>>, delimiter: string): string {
    const lines: string[] = []

    // Header row
    lines.push(headers.join(delimiter))

    // Data rows
    rows.forEach(row => {
      const values = headers.map(header => {
        const value = row[header]
        // Handle values that contain the delimiter
        if (typeof value === 'string' && value.includes(delimiter)) {
          return `"${value}"`
        }
        return value || ''
      })
      lines.push(values.join(delimiter))
    })

    return lines.join('\n')
  }

  /**
   * Execute in mock mode - uses real input data but simulates assembly latency
   * FIXED: Now processes actual input data instead of returning hardcoded values
   */
  private async executeMock(
    config: CSVAssemblerConfig,
    input: CSVAssemblerInput,
    context: ExecutionContext,
    startTime: number
  ) {
    await this.sleep(100) // Simulate assembly latency

    // Use real input data if available, fallback to sample data for testing
    const hasRealData = input.rows && input.rows.length > 0

    const result = hasRealData
      ? this.assembleCSV(input, config) // Process real data from workflow
      : this.generateSampleCSV(config) // Generate sample for standalone testing

    const executionTime = Date.now() - startTime

    this.log(context, 'info', '🎭 Mock: CSV assembled', {
      totalOutput: result.metadata.totalOutput,
      withInterests: result.metadata.withInterests,
      usingRealData: hasRealData
    })

    return {
      status: 'completed',
      output: result,
      executionTime,
      error: undefined,
      retryCount: 0,
      startTime,
      endTime: Date.now(),
      metadata: { ...result.metadata, mock: true },
      logs: []
    }
  }

  /**
   * Generate sample CSV for standalone testing (no real input data)
   */
  private generateSampleCSV(config: CSVAssemblerConfig): CSVAssemblerOutput {
    const interestsColumnName = config.interestsColumnName || 'interessi'
    const delimiter = config.delimiter || ';'

    const sampleRows = [
      {
        nome: 'Mario Rossi',
        celular: '3291234567',
        email: 'mario.rossi@mydomain.com',
        nascimento: '21/02/1986',
        [interestsColumnName]: 'calcio, tecnologia, viaggi'
      },
      {
        nome: 'Luca Bianchi',
        celular: '3282345678',
        email: 'luca.bianchi@mydomain.com',
        nascimento: '27/01/1983',
        [interestsColumnName]: 'musica, programmazione, lettura'
      }
    ]

    const headers = Object.keys(sampleRows[0])
    const csvString = this.generateCSVString(headers, sampleRows, delimiter)

    return {
      csv: {
        headers,
        rows: sampleRows,
        csvString
      },
      metadata: {
        totalInput: 2,
        totalOutput: 2,
        filtered: 0,
        withInterests: 2,
        withoutInterests: 0,
        totalCost: 0.10,
        avgCostPerContact: 0.05
      }
    }
  }

  /**
   * Sleep helper for mock delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
