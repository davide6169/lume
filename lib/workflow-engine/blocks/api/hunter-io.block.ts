/**
 * Hunter.io Blocks
 *
 * Email Finder and Email Verifier blocks using Hunter.io API.
 * Wraps the existing Hunter.io service.
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'

// Import the existing service
import { HunterIoService } from '@/lib/services/hunter-io'
import { MockDataGenerator } from '../../utils/mock-data-generator'

// ============================================
// Email Finder Block
// ============================================

export interface HunterEmailFinderConfig {
  mode?: 'live' | 'mock' // Force mock mode (default: live in production, mock in demo/test)
  apiToken: string // {{secrets.hunter}}
  contacts: Array<{
    firstName?: string
    lastName?: string
    company?: string
    domain?: string
  }> // {{input.contacts}}
}

/**
 * Hunter.io Email Finder Block
 * Finds email addresses for contacts without email
 */
export class HunterEmailFinderBlock extends BaseBlockExecutor {
  constructor() {
    super('api.hunter.finder')
  }

  async execute(
    config: HunterEmailFinderConfig,
    input: any,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      // 🎭 MOCK MODE: Check if we should use mock data
      const shouldMock = config.mode === 'mock' || context.mode === 'demo' || context.mode === 'test'

      this.log(context, 'info', `Executing Hunter Email Finder block in ${shouldMock ? 'MOCK' : 'LIVE'} mode`, {
        contactsCount: config.contacts?.length || 0
      })

      // Validate config
      if (!config.contacts || !Array.isArray(config.contacts)) {
        throw new Error('Contacts array is required')
      }

      // 🎭 MOCK MODE
      if (shouldMock) {
        this.log(context, 'info', '🎭 MOCK MODE: Simulating Hunter Email Finder')

        await MockDataGenerator.simulateLatency(150, 500)

        const results = config.contacts.map(contact => {
          // Skip if already has email
          if ('email' in contact && contact.email) {
            return contact
          }
          // Generate mock email
          const domain = contact.domain || contact.company?.toLowerCase().replace(/\s+/g, '') || 'example.com'
          return {
            ...contact,
            email: `${(contact.firstName || 'info').toLowerCase()}.${(contact.lastName || 'contact').toLowerCase()}@${domain}`,
            score: Math.floor(Math.random() * 20) + 80,
            source: 'hunter.io-mock'
          }
        })

        return {
          status: 'completed',
          output: {
            contacts: results,
            metadata: { totalContacts: config.contacts.length, successful: config.contacts.length, failed: 0, cost: 0, mock: true }
          },
          executionTime: Date.now() - startTime,
          error: undefined,
          retryCount: 0,
          startTime,
          endTime: Date.now(),
          metadata: { mock: true },
          logs: []
        }
      }

      // LIVE MODE - Real API calls
      if (!config.apiToken) {
        throw new Error('Hunter API token is required (unless using mock mode)')
      }

      const service = new HunterIoService(config.apiToken)
      const contacts = config.contacts

      this.log(context, 'info', `Finding emails for ${contacts.length} contacts`)

      let successful = 0
      let failed = 0
      const results: any[] = []

      // Process each contact
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i]

        // Skip if already has email
        if ('email' in contact && contact.email) {
          results.push(contact)
          continue
        }

        try {
          this.log(context, 'debug', `Finding email for contact ${i + 1}`, {
            firstName: contact.firstName,
            lastName: contact.lastName,
            company: contact.company
          })

          const result = await service.findEmail({
            first_name: contact.firstName || '',
            last_name: contact.lastName || '',
            domain: contact.domain || ''
          })

          if (result && result.data && result.data.email) {
            results.push({
              ...contact,
              email: result.data.email,
              score: result.data.score,
              source: 'hunter.io'
            })
            successful++
          } else {
            results.push(contact)
            failed++
          }
        } catch (error) {
          this.log(context, 'warn', `Failed to find email for contact ${i + 1}`, {
            error: (error as Error).message
          })
          results.push(contact)
          failed++
        }
      }

      const executionTime = Date.now() - startTime

      const output = {
        contacts: results,
        metadata: {
          totalContacts: contacts.length,
          successful,
          failed,
          cost: successful * 0.002,
          currency: 'USD',
          mock: false
        }
      }

      this.log(context, 'info', 'Hunter Email Finder block completed', {
        executionTime,
        successful,
        failed,
        cost: output.metadata.cost
      })

      return {
        status: 'completed',
        output,
        executionTime,
        error: undefined,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {
          successful,
          failed,
          cost: output.metadata.cost,
          mock: false
        },
        logs: []
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'Hunter Email Finder block failed', {
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
}

// ============================================
// Email Verifier Block
// ============================================

export interface HunterEmailVerifierConfig {
  mode?: 'live' | 'mock' // Force mock mode (default: live in production, mock in demo/test)
  apiToken: string // {{secrets.hunter}}
  emails: string[] // {{input.emails}} or {{input.contacts[].email}}
}

/**
 * Hunter.io Email Verifier Block
 * Verifies email deliverability
 */
export class HunterEmailVerifierBlock extends BaseBlockExecutor {
  constructor() {
    super('api.hunter.verifier')
  }

  async execute(
    config: HunterEmailVerifierConfig,
    input: any,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      // 🎭 MOCK MODE: Check if we should use mock data
      const shouldMock = config.mode === 'mock' || context.mode === 'demo' || context.mode === 'test'

      this.log(context, 'info', `Executing Hunter Email Verifier block in ${shouldMock ? 'MOCK' : 'LIVE'} mode`, {
        emailsCount: config.emails?.length || 0
      })

      // Validate config
      if (!config.emails || !Array.isArray(config.emails)) {
        throw new Error('Emails array is required')
      }

      // 🎭 MOCK MODE
      if (shouldMock) {
        this.log(context, 'info', '🎭 MOCK MODE: Simulating Hunter Email Verifier')

        await MockDataGenerator.simulateLatency(100, 300)

        const results = config.emails.map(email => MockDataGenerator.generateHunterVerification(email))

        const valid = results.filter(r => r.status === 'valid').length
        const risky = results.filter(r => r.status === 'risky').length
        const invalid = results.filter(r => r.status !== 'valid' && r.status !== 'risky').length

        return {
          status: 'completed',
          output: {
            emails: results,
            metadata: { totalEmails: config.emails.length, valid, risky, invalid, cost: 0, mock: true }
          },
          executionTime: Date.now() - startTime,
          error: undefined,
          retryCount: 0,
          startTime,
          endTime: Date.now(),
          metadata: { mock: true },
          logs: []
        }
      }

      // Real API mode
      if (!config.apiToken) {
        throw new Error('Hunter API token is required (unless using mock mode)')
      }

      const service = new HunterIoService(config.apiToken)
      const emails = config.emails

      this.log(context, 'info', `Verifying ${emails.length} emails`)

      let valid = 0
      let invalid = 0
      let risky = 0
      const results: any[] = []

      // Process each email
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i]

        try {
          this.log(context, 'debug', `Verifying email ${i + 1}`, {
            email
          })

          const result = await service.verifyEmail({ email })

          results.push({
            email,
            status: result.data.status,
            score: result.data.score,
            regexp: result.data.regexp,
            mxRecords: result.data.mx_records
          })

          if (result.data.status === 'valid') {
            valid++
          } else if (result.data.status === 'invalid' || result.data.status === 'unknown') {
            risky++
          } else {
            invalid++
          }
        } catch (error) {
          this.log(context, 'warn', `Failed to verify email ${i + 1}`, {
            email,
            error: (error as Error).message
          })
          results.push({
            email,
            status: 'error',
            error: (error as Error).message
          })
          invalid++
        }
      }

      const executionTime = Date.now() - startTime

      const output = {
        emails: results,
        metadata: {
          totalEmails: emails.length,
          valid,
          risky,
          invalid,
          cost: emails.length * 0.0013,
          currency: 'USD',
          mock: false
        }
      }

      this.log(context, 'info', 'Hunter Email Verifier block completed', {
        executionTime,
        valid,
        risky,
        invalid,
        cost: output.metadata.cost
      })

      return {
        status: 'completed',
        output,
        executionTime,
        error: undefined,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {
          valid,
          risky,
          invalid,
          cost: output.metadata.cost,
          mock: false
        },
        logs: []
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'Hunter Email Verifier block failed', {
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
}
