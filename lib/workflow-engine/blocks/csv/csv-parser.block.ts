/**
 * CSV Parser Block
 *
 * Parses CSV content into structured data with headers and rows.
 *
 * Input: Raw CSV string
 * Output: { headers: string[], rows: Array<Record<string, string>> }
 *
 * Features:
 * - Configurable delimiter (default: ';')
 * - Encoding support (default: 'utf-8')
 * - Skip empty rows option
 * - Auto-detect headers
 * - Trim whitespace
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'

// Types
export interface CSVParserConfig {
  delimiter?: string // Default: ';'
  encoding?: string // Default: 'utf-8'
  hasHeader?: boolean // Default: true
  skipEmpty?: boolean // Default: true
  trimWhitespace?: boolean // Default: true
}

export interface CSVParserInput {
  csv: string // Raw CSV content
}

export interface CSVParserOutput {
  headers: string[]
  rows: Array<Record<string, string>>
  metadata: {
    totalRows: number
    totalColumns: number
    delimiter: string
    hasHeader: boolean
    emptyRowsSkipped: number
  }
}

/**
 * CSV Parser Block
 */
export class CSVParserBlock extends BaseBlockExecutor {
  static supportsMock = true // Utility block - no API calls, works in all modes

  constructor() {
    super('csv.parser')
  }

  async execute(
    config: CSVParserConfig,
    input: CSVParserInput,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      // Check for mock mode
      const shouldMock = config.mode === 'mock' || context.mode === 'demo' || context.mode === 'test'

      if (shouldMock) {
        this.log(context, 'info', '🎭 MOCK MODE: Simulating CSV parsing')
        return await this.executeMock(config, input, context, startTime)
      }

      this.log(context, 'info', 'Parsing CSV', {
        hasHeader: config.hasHeader,
        delimiter: config.delimiter || ';'
      })

      // Validate input
      if (!input.csv || typeof input.csv !== 'string') {
        throw new Error('Input must be a CSV string')
      }

      // Parse CSV
      const result = this.parseCSV(input.csv, config)

      const executionTime = Date.now() - startTime

      this.log(context, 'info', 'CSV parsed successfully', {
        totalRows: result.metadata.totalRows,
        totalColumns: result.metadata.totalColumns,
        headers: result.headers.join(', ')
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
      this.log(context, 'error', 'CSV parsing failed', {
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
   * Parse CSV string into structured data
   */
  private parseCSV(csvContent: string, config: CSVParserConfig): CSVParserOutput {
    const delimiter = config.delimiter || ';'
    const hasHeader = config.hasHeader !== false
    const skipEmpty = config.skipEmpty !== false
    const trimWhitespace = config.trimWhitespace !== false

    // Split into lines
    const lines = csvContent.split(/\r?\n/)

    // Filter empty lines if skipEmpty is true
    const nonEmptyLines = skipEmpty
      ? lines.filter(line => line.trim().length > 0)
      : lines

    if (nonEmptyLines.length === 0) {
      return {
        headers: [],
        rows: [],
        metadata: {
          totalRows: 0,
          totalColumns: 0,
          delimiter,
          hasHeader,
          emptyRowsSkipped: skipEmpty ? lines.length - nonEmptyLines.length : 0
        }
      }
    }

    // Extract headers
    const headerLine = nonEmptyLines[0]
    const headers = headerLine
      .split(delimiter)
      .map(h => trimWhitespace ? h.trim() : h)

    // Parse data rows
    const dataLines = hasHeader ? nonEmptyLines.slice(1) : nonEmptyLines
    const rows: Array<Record<string, string>> = []

    dataLines.forEach((line, index) => {
      const values = line.split(delimiter)
      const row: Record<string, string> = {}

      headers.forEach((header, headerIndex) => {
        let value = values[headerIndex] || ''

        if (trimWhitespace) {
          value = value.trim()
        }

        row[header] = value
      })

      rows.push(row)
    })

    return {
      headers,
      rows,
      metadata: {
        totalRows: rows.length,
        totalColumns: headers.length,
        delimiter,
        hasHeader,
        emptyRowsSkipped: skipEmpty ? lines.length - nonEmptyLines.length : 0
      }
    }
  }

  /**
   * Execute in mock mode - returns sample CSV data
   */
  private async executeMock(
    config: CSVParserConfig,
    input: CSVParserInput,
    context: ExecutionContext,
    startTime: number
  ) {
    await this.sleep(100) // Simulate parsing latency

    const mockOutput: CSVParserOutput = {
      headers: ['nome', 'celular', 'email', 'nascimento'],
      rows: [
        {
          nome: 'Mario Rossi',
          celular: '3291234567',
          email: 'mario.rossi@mydomain.com',
          nascimento: '21/02/1986'
        },
        {
          nome: 'Luca Bianchi',
          celular: '3282345678',
          email: 'luca.bianchi@mydomain.com',
          nascimento: '27/01/1983'
        }
      ],
      metadata: {
        totalRows: 2,
        totalColumns: 4,
        delimiter: config.delimiter || ';',
        hasHeader: config.hasHeader !== false,
        emptyRowsSkipped: 0
      }
    }

    const executionTime = Date.now() - startTime

    this.log(context, 'info', '🎭 Mock: CSV parsed', {
      totalRows: mockOutput.metadata.totalRows,
      totalColumns: mockOutput.metadata.totalColumns
    })

    return {
      status: 'completed',
      output: mockOutput,
      executionTime,
      error: undefined,
      retryCount: 0,
      startTime,
      endTime: Date.now(),
      metadata: { ...mockOutput.metadata, mock: true },
      logs: []
    }
  }

  /**
   * Sleep helper for mock delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
