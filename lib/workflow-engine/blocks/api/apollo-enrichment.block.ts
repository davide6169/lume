/**
 * Apollo Enrichment Block
 *
 * Enriches contact data using Apollo.io API.
 * Wraps the existing ApolloService.
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'
import type { Contact } from '@/types'

// Import the existing service
import { ApolloEnrichmentService } from '@/lib/services/apollo-enrichment'
import { MockDataGenerator } from '../../utils/mock-data-generator'

export interface ApolloEnrichmentConfig {
  mode?: 'live' | 'mock' // Force mock mode (default: live in production, mock in demo/test)
  apiToken: string // {{secrets.apollo}}
  contacts: Contact[] // {{input.contacts}}
  revealPersonalEmails?: boolean // Default: true
  revealPhoneNumbers?: boolean // Default: true
  batchSize?: number // Default: 10 (max)
}

/**
 * Apollo Enrichment Block Executor
 */
export class ApolloEnrichmentBlock extends BaseBlockExecutor {
  constructor() {
    super('api.apollo')
  }

  async execute(
    config: ApolloEnrichmentConfig,
    input: any,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      // 🎭 MOCK MODE: Check if we should use mock data
      const shouldMock = config.mode === 'mock' || context.mode === 'demo' || context.mode === 'test'

      this.log(context, 'info', `Executing Apollo Enrichment block in ${shouldMock ? 'MOCK' : 'LIVE'} mode`, {
        contactsCount: config.contacts?.length || 0
      })

      // Validate config
      if (!config.contacts || !Array.isArray(config.contacts)) {
        throw new Error('Contacts array is required')
      }

      // 🎭 MOCK MODE - skip API calls
      if (shouldMock) {
        this.log(context, 'info', '🎭 MOCK MODE: Simulating Apollo enrichment without API calls')

        // Simulate API latency
        await MockDataGenerator.simulateLatency(200, 800)

        const mockResult = MockDataGenerator.generateApolloEnrichment(config.contacts)

        this.log(context, 'info', 'Apollo Enrichment block completed (MOCK)', {
          executionTime: Date.now() - startTime,
          successful: mockResult.metadata.successfulEnrichments,
          cost: mockResult.metadata.cost
        })

        return {
          status: 'completed',
          output: mockResult,
          executionTime: Date.now() - startTime,
          error: undefined,
          retryCount: 0,
          startTime,
          endTime: Date.now(),
          metadata: {
            ...mockResult.metadata,
            mock: true
          },
          logs: []
        }
      }

      // LIVE MODE - Real API calls
      if (!config.apiToken) {
        throw new Error('Apollo API token is required (unless using mock mode)')
      }

      const service = new ApolloEnrichmentService(config.apiToken)
      const batchSize = Math.min(config.batchSize || 10, 10) // Max 10 for bulk API
      const contacts = config.contacts

      this.log(context, 'info', `Enriching ${contacts.length} contacts`, {
        batchSize
      })

      // Process in batches
      let successfulEnrichments = 0
      let failedEnrichments = 0
      const enrichedContacts: any[] = []

      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize)
        this.log(context, 'debug', `Processing batch ${Math.floor(i / batchSize) + 1}`, {
          batchSize: batch.length
        })

        // Convert contacts to enrichment requests
        const requests = batch.map(contact =>
          service.contactToEnrichmentRequest(contact)
        )

        try {
          // Call bulk enrichment API
          const result = await service.enrichPeopleBulk(requests)

          if (result.errors && result.errors.length > 0) {
            this.log(context, 'warn', 'Bulk enrichment had some errors', {
              errors: result.errors
            })
          }

          // Process results
          if (result.people) {
            for (const item of result.people) {
              if (item.response.person) {
                // Merge enriched data with original contact
                const originalContact = batch.find(c =>
                  this.matchContactToRequest(c, item.request)
                )

                if (originalContact) {
                  const enriched = this.mergeEnrichment(
                    originalContact,
                    item.response.person
                  )
                  enrichedContacts.push(enriched)
                  successfulEnrichments++
                }
              } else {
                // No enrichment data, keep original
                const originalContact = batch.find(c =>
                  this.matchContactToRequest(c, item.request)
                )
                if (originalContact) {
                  enrichedContacts.push(originalContact)
                  failedEnrichments++
                }
              }
            }
          }
        } catch (error) {
          this.log(context, 'error', `Batch ${Math.floor(i / batchSize) + 1} failed`, {
            error: (error as Error).message
          })
          // Add original contacts to output
          enrichedContacts.push(...batch)
          failedEnrichments += batch.length
        }

        // Update progress
        const progress = Math.round(((i + batchSize) / contacts.length) * 100)
        context.updateProgress(progress, {
          timestamp: new Date().toISOString(),
          event: 'enrichment_progress',
          details: {
            processed: Math.min(i + batchSize, contacts.length),
            total: contacts.length,
            successful: successfulEnrichments,
            failed: failedEnrichments
          }
        })
      }

      const executionTime = Date.now() - startTime

      const output = {
        contacts: enrichedContacts,
        metadata: {
          totalContacts: contacts.length,
          successfulEnrichments,
          failedEnrichments,
          cost: successfulEnrichments * 0.02, // $0.02 per enrichment
          currency: 'USD',
          mock: false
        }
      }

      this.log(context, 'info', 'Apollo Enrichment block completed', {
        executionTime,
        successful: successfulEnrichments,
        failed: failedEnrichments,
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
          successfulEnrichments,
          failedEnrichments,
          cost: output.metadata.cost,
          mock: false
        },
        logs: []
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'Apollo Enrichment block failed', {
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
   * Match contact to enrichment request
   */
  private matchContactToRequest(contact: Contact, request: any): boolean {
    if (request.email && contact.email) {
      return contact.email.toLowerCase() === request.email.toLowerCase()
    }
    if (request.first_name && request.last_name) {
      return contact.firstName?.toLowerCase() === request.first_name.toLowerCase() &&
             contact.lastName?.toLowerCase() === request.last_name.toLowerCase()
    }
    return false
  }

  /**
   * Merge enrichment data with original contact
   */
  private mergeEnrichment(contact: Contact, person: any): Contact {
    const merged = { ...contact }

    if (person.title) {
      merged.title = person.title
    }

    if (person.employment_history && person.employment_history.length > 0) {
      merged.company = person.employment_history[0].organization_name
    }

    if (person.linkedin_url) {
      merged.linkedinUrl = person.linkedin_url
    }

    if (person.contact && person.contact.phone_numbers && person.contact.phone_numbers.length > 0) {
      merged.phone = person.contact.phone_numbers[0].raw_number
    }

    if (person.city || person.state || person.country) {
      merged.location = [person.city, person.state, person.country]
        .filter(Boolean)
        .join(', ')
    }

    merged.enriched = true
    merged.enrichedAt = new Date().toISOString()

    return merged
  }
}
