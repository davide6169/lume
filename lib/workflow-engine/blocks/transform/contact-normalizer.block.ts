/**
 * Contact Normalizer Block
 *
 * Normalizes contact data by extracting name parts, cleaning phone numbers,
 * and standardizing data formats.
 *
 * Input: Array of raw contact records
 * Output: Array of normalized contacts with standardized fields
 *
 * Features:
 * - Extract first name and last name
 * - Clean phone numbers (remove spaces, parentheses, etc.)
 * - Normalize email to lowercase
 * - Standardize date formats
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'

// Types
export interface ContactNormalizerConfig {
  nameField?: string // Field containing full name (default: 'nome')
  firstNameField?: string // Output field for first name (default: 'firstName')
  lastNameField?: string // Output field for last name (default: 'lastName')
  phoneField?: string // Field containing phone (default: 'celular')
  emailField?: string // Field containing email (default: 'email')
  birthDateField?: string // Field containing birth date (default: 'nascimento')
}

export interface ContactNormalizerInput {
  contacts: Array<Record<string, any>>
}

export interface ContactNormalizerOutput {
  contacts: Array<{
    original: Record<string, any>
    normalized: {
      firstName?: string
      lastName?: string
      fullName?: string
      phone?: string
      phoneClean?: string
      email?: string
      emailLower?: string
      birthDate?: string
      birthDateISO?: string
    }
  }>
  metadata: {
    totalInput: number
    totalProcessed: number
    normalizedNames: number
    normalizedPhones: number
    normalizedEmails: number
    normalizedDates: number
  }
}

/**
 * Contact Normalizer Block
 */
export class ContactNormalizerBlock extends BaseBlockExecutor {
  static supportsMock = true // Utility block - no API calls, works in all modes

  constructor() {
    super('transform.contactNormalize')
  }

  async execute(
    config: ContactNormalizerConfig,
    input: ContactNormalizerInput,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      // Check for mock mode
      const shouldMock = context.mode === 'demo' || context.mode === 'test'

      if (shouldMock) {
        this.log(context, 'info', '🎭 MOCK MODE: Simulating contact normalization')
        return await this.executeMock(config, input, context, startTime)
      }

      this.log(context, 'info', 'Normalizing contacts', {
        contactsCount: input.contacts.length
      })

      // Validate input
      if (!input.contacts || !Array.isArray(input.contacts)) {
        throw new Error('Input must have contacts array')
      }

      // Normalize contacts
      const result = this.normalizeContacts(input, config)

      const executionTime = Date.now() - startTime

      this.log(context, 'info', 'Contact normalization completed', {
        totalProcessed: result.metadata.totalProcessed,
        normalizedNames: result.metadata.normalizedNames,
        normalizedPhones: result.metadata.normalizedPhones,
        normalizedEmails: result.metadata.normalizedEmails
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
      this.log(context, 'error', 'Contact normalization failed', {
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
   * Normalize all contacts
   */
  private normalizeContacts(
    input: ContactNormalizerInput,
    config: ContactNormalizerConfig
  ): ContactNormalizerOutput {
    const nameField = config.nameField || 'nome'
    const firstNameField = config.firstNameField || 'firstName'
    const lastNameField = config.lastNameField || 'lastName'
    const phoneField = config.phoneField || 'celular'
    const emailField = config.emailField || 'email'
    const birthDateField = config.birthDateField || 'nascimento'

    const contacts: ContactNormalizerOutput['contacts'] = []
    let normalizedNames = 0
    let normalizedPhones = 0
    let normalizedEmails = 0
    let normalizedDates = 0

    for (const contact of input.contacts) {
      const normalized: any = {}

      // Normalize name
      const fullName = contact[nameField]
      if (fullName && typeof fullName === 'string') {
        const nameParts = this.extractNameParts(fullName)
        normalized[firstNameField] = nameParts.firstName
        normalized[lastNameField] = nameParts.lastName
        normalized.fullName = fullName.trim()
        if (nameParts.firstName || nameParts.lastName) {
          normalizedNames++
        }
      }

      // Normalize phone
      const phone = contact[phoneField]
      if (phone && typeof phone === 'string') {
        normalized.phone = phone
        normalized.phoneClean = this.cleanPhone(phone)
        if (normalized.phoneClean) {
          normalizedPhones++
        }
      }

      // Normalize email
      const email = contact[emailField]
      if (email && typeof email === 'string') {
        normalized.email = email
        normalized.emailLower = email.toLowerCase().trim()
        normalizedEmails++
      }

      // Normalize birth date
      const birthDate = contact[birthDateField]
      if (birthDate && typeof birthDate === 'string') {
        normalized.birthDate = birthDate
        normalized.birthDateISO = this.parseDate(birthDate)
        if (normalized.birthDateISO) {
          normalizedDates++
        }
      }

      contacts.push({
        original: contact,
        normalized
      })
    }

    return {
      contacts,
      metadata: {
        totalInput: input.contacts.length,
        totalProcessed: input.contacts.length,
        normalizedNames,
        normalizedPhones,
        normalizedEmails,
        normalizedDates
      }
    }
  }

  /**
   * Extract first name and last name from full name
   */
  private extractNameParts(fullName: string): { firstName?: string; lastName?: string } {
    const trimmed = fullName.trim()

    // Split by spaces
    const parts = trimmed.split(/\s+/)

    if (parts.length === 0) {
      return { firstName: undefined, lastName: undefined }
    }

    if (parts.length === 1) {
      return { firstName: parts[0], lastName: undefined }
    }

    // First word is first name
    const firstName = parts[0]

    // Last word is last name
    const lastName = parts[parts.length - 1]

    // Everything in between is middle name (ignore for now)
    return { firstName, lastName }
  }

  /**
   * Clean phone number - remove non-numeric chars
   */
  private cleanPhone(phone: string): string | undefined {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/[^\d+]/g, '')

    // Must have at least 7 digits to be valid
    if (cleaned.replace(/\+/g, '').length < 7) {
      return undefined
    }

    return cleaned
  }

  /**
   * Parse date to ISO format
   */
  private parseDate(dateStr: string): string | undefined {
    try {
      // Try common formats
      const formats = [
        /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
        /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
        /(\d{2})-(\d{2})-(\d{4})/,  // DD-MM-YYYY
        /(\d{2})\/(\d{2})\/(\d{2})/  // DD/MM/YY
      ]

      for (const format of formats) {
        const match = dateStr.match(format)
        if (match) {
          let [, a, b, c] = match

          // Determine if format is YYYY-MM-DD or DD/MM/YYYY
          if (format.source.includes('\\d{4}-')) {
            // YYYY-MM-DD
            return `${a}-${b}-${c}`
          } else if (c?.length === 4) {
            // DD/MM/YYYY or DD-MM-YYYY
            return `${c}-${a}-${b}`
          } else {
            // DD/MM/YY - assume 1900s for now
            const year = parseInt(c || '00')
            const fullYear = year > 50 ? `19${year}` : `20${year}`
            return `${fullYear}-${a}-${b}`
          }
        }
      }

      // Try native Date parsing
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }

      return undefined
    } catch (error) {
      return undefined
    }
  }

  /**
   * Execute in mock mode - returns sample normalized contacts
   */
  private async executeMock(
    config: ContactNormalizerConfig,
    input: ContactNormalizerInput,
    context: ExecutionContext,
    startTime: number
  ) {
    await this.sleep(100) // Simulate processing latency

    const nameField = config.nameField || 'nome'
    const firstNameField = config.firstNameField || 'firstName'
    const lastNameField = config.lastNameField || 'lastName'
    const phoneField = config.phoneField || 'celular'
    const emailField = config.emailField || 'email'
    const birthDateField = config.birthDateField || 'nascimento'

    const mockContacts: ContactNormalizerOutput['contacts'] = input.contacts.map((contact) => {
      const fullName = contact[nameField]
      const nameParts = fullName ? this.extractNameParts(fullName) : {}

      return {
        original: contact,
        normalized: {
          [firstNameField]: nameParts.firstName || 'Mario',
          [lastNameField]: nameParts.lastName || 'Rossi',
          fullName: fullName || 'Mario Rossi',
          phone: contact[phoneField] || '+39 329 1234567',
          phoneClean: contact[phoneField] ? this.cleanPhone(contact[phoneField]) : '+393291234567',
          email: contact[emailField] || 'test@example.com',
          emailLower: contact[emailField] ? contact[emailField].toLowerCase().trim() : 'test@example.com',
          birthDate: contact[birthDateField] || '01/01/1980',
          birthDateISO: '1980-01-01'
        }
      }
    })

    const mockOutput: ContactNormalizerOutput = {
      contacts: mockContacts,
      metadata: {
        totalInput: input.contacts.length,
        totalProcessed: input.contacts.length,
        normalizedNames: mockContacts.filter(c => c.normalized[firstNameField]).length,
        normalizedPhones: mockContacts.filter(c => c.normalized.phoneClean).length,
        normalizedEmails: mockContacts.filter(c => c.normalized.emailLower).length,
        normalizedDates: mockContacts.filter(c => c.normalized.birthDateISO).length
      }
    }

    const executionTime = Date.now() - startTime

    this.log(context, 'info', '🎭 Mock: Contact normalization completed', {
      totalProcessed: mockOutput.metadata.totalProcessed,
      normalizedNames: mockOutput.metadata.normalizedNames,
      normalizedPhones: mockOutput.metadata.normalizedPhones
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
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
