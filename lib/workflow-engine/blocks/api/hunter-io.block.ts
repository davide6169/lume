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

// ============================================
// Email Finder Block
// ============================================

export interface HunterEmailFinderConfig {
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
      this.log(context, 'info', 'Executing Hunter Email Finder block', {
        contactsCount: config.contacts?.length || 0
      })

      // Validate config
      if (!config.apiToken) {
        throw new Error('Hunter API token is required')
      }
      if (!config.contacts || !Array.isArray(config.contacts)) {
        throw new Error('Contacts array is required')
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
          cost: successful * 0.002, // Approximate cost
          currency: 'USD'
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
          cost: output.metadata.cost
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
      this.log(context, 'info', 'Executing Hunter Email Verifier block', {
        emailsCount: config.emails?.length || 0
      })

      // Validate config
      if (!config.apiToken) {
        throw new Error('Hunter API token is required')
      }
      if (!config.emails || !Array.isArray(config.emails)) {
        throw new Error('Emails array is required')
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
          cost: emails.length * 0.0013, // Approximate cost
          currency: 'USD'
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
          cost: output.metadata.cost
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
