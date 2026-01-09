/**
 * AI Contact Extraction Block
 *
 * Extracts structured contact information from unstructured text
 * using OpenRouter LLM with specialized prompt engineering.
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'
import { OpenRouterService } from '@/lib/services/openrouter'

export interface ContactExtractionConfig {
  apiToken: string // {{secrets.openrouter}}
  text: string // Text to extract contacts from
  model?: string // Default: "mistralai/mistral-7b-instruct:free"
  batchSize?: number // If extracting from multiple texts
  minFields?: number // Minimum fields to consider valid (default: 2)
}

/**
 * AI Contact Extraction Block Executor
 */
export class ContactExtractionBlock extends BaseBlockExecutor {
  constructor() {
    super('ai.contactExtraction')
  }

  async execute(
    config: ContactExtractionConfig,
    input: any,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      this.log(context, 'info', 'Executing AI Contact Extraction block', {
        model: config.model || 'mistralai/mistral-7b-instruct:free',
        textLength: config.text?.length || 0
      })

      // Validate config
      if (!config.apiToken) {
        throw new Error('OpenRouter API token is required')
      }
      if (!config.text) {
        throw new Error('Text is required for contact extraction')
      }

      const service = new OpenRouterService(config.apiToken)
      const model = config.model || 'mistralai/mistral-7b-instruct:free'
      const minFields = config.minFields || 2

      this.log(context, 'debug', 'Extracting contacts from text', {
        textLength: config.text.length,
        minFields
      })

      // Use existing extractContacts method from OpenRouterService
      const contacts = await service.extractContacts(config.text, model)

      // Filter contacts by minimum field count
      const validContacts = contacts.filter((contact: any) => {
        const fieldCount = Object.values(contact).filter(v => v !== undefined && v !== null && v !== '').length
        return fieldCount >= minFields
      })

      this.log(context, 'info', 'Contact extraction completed', {
        totalExtracted: contacts.length,
        validContacts: validContacts.length,
        filteredOut: contacts.length - validContacts.length
      })

      const executionTime = Date.now() - startTime

      const output = {
        contacts: validContacts,
        metadata: {
          totalExtracted: contacts.length,
          validContacts: validContacts.length,
          filteredOut: contacts.length - validContacts.length,
          minFields,
          model,
          textLength: config.text.length
        }
      }

      return {
        status: 'completed',
        output,
        executionTime,
        error: undefined,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {
          totalExtracted: contacts.length,
          validContacts: validContacts.length
        },
        logs: []
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'AI Contact Extraction block failed', {
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
   * Extract contacts from array of texts (e.g., multiple comments)
   */
  async executeBatch(
    texts: string[],
    config: ContactExtractionConfig,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      this.log(context, 'info', 'Executing batch contact extraction', {
        textsCount: texts.length,
        model: config.model || 'mistralai/mistral-7b-instruct:free'
      })

      const service = new OpenRouterService(config.apiToken)
      const model = config.model || 'mistralai/mistral-7b-instruct:free'
      const minFields = config.minFields || 2

      // Combine texts and extract all contacts at once
      const combinedText = texts.join('\n\n---\n\n')
      const contacts = await service.extractContacts(combinedText, model)

      // Filter by minimum fields
      const validContacts = contacts.filter((contact: any) => {
        const fieldCount = Object.values(contact).filter(v => v !== undefined && v !== null && v !== '').length
        return fieldCount >= minFields
      })

      const executionTime = Date.now() - startTime

      this.log(context, 'info', 'Batch extraction completed', {
        inputTexts: texts.length,
        totalExtracted: contacts.length,
        validContacts: validContacts.length
      })

      return {
        status: 'completed',
        output: {
          contacts: validContacts,
          metadata: {
            inputTexts: texts.length,
            totalExtracted: contacts.length,
            validContacts: validContacts.length
          }
        },
        executionTime,
        error: undefined,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {},
        logs: []
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'Batch extraction failed', {
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
