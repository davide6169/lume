/**
 * Email Classifier Block
 *
 * Classifies email addresses as business or personal.
 * Uses a list of known personal domains to determine email type.
 *
 * Input: Array of contacts with email field
 * Output: Array of contacts with emailType field added
 *
 * Features:
 * - Configurable personal domains list
 * - Domain extraction and classification
 * - Fallback to business for unknown domains
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'

// Types
export interface EmailClassifierConfig {
  personalDomains?: string[] // List of personal email domains
  emailField?: string // Field name containing email (default: 'email')
  outputField?: string // Field name for classification result (default: 'emailType')
}

export interface EmailClassifierInput {
  contacts: Array<Record<string, any>>
}

export interface EmailClassifierOutput {
  contacts: Array<{
    original: Record<string, any>
    email?: string
    emailType?: 'business' | 'personal'
    domain?: string
    confidence?: 'high' | 'medium' | 'low'
  }>
  metadata: {
    totalInput: number
    totalProcessed: number
    businessEmails: number
    personalEmails: number
    unknownDomains: number
  }
}

/**
 * Default personal email domains
 */
const DEFAULT_PERSONAL_DOMAINS = [
  'gmail.com',
  'gmail.com.br',
  'gmail.com.mx',
  'gmail.com.ar',
  'yahoo.com',
  'yahoo.com.br',
  'yahoo.com.mx',
  'yahoo.com.ar',
  'hotmail.com',
  'hotmail.com.br',
  'hotmail.com.mx',
  'outlook.com',
  'libero.it',
  'tin.it',
  'virgilio.it',
  'alice.it',
  'mail.com',
  'protonmail.com',
  'icloud.com',
  'me.com'
]

/**
 * Email Classifier Block
 */
export class EmailClassifierBlock extends BaseBlockExecutor {
  static supportsMock = true // Utility block - no API calls, works in all modes

  constructor() {
    super('transform.emailClassify')
  }

  async execute(
    config: EmailClassifierConfig,
    input: EmailClassifierInput,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      // Check for mock mode
      const shouldMock = context.mode === 'demo' || context.mode === 'test'

      if (shouldMock) {
        this.log(context, 'info', '🎭 MOCK MODE: Simulating email classification')
        return await this.executeMock(config, input, context, startTime)
      }

      this.log(context, 'info', 'Classifying emails', {
        contactsCount: input.contacts.length,
        personalDomains: config.personalDomains?.length || DEFAULT_PERSONAL_DOMAINS.length
      })

      // Validate input
      if (!input.contacts || !Array.isArray(input.contacts)) {
        throw new Error('Input must have contacts array')
      }

      // Classify emails
      const result = this.classifyEmails(input, config)

      const executionTime = Date.now() - startTime

      this.log(context, 'info', 'Email classification completed', {
        totalProcessed: result.metadata.totalProcessed,
        businessEmails: result.metadata.businessEmails,
        personalEmails: result.metadata.personalEmails,
        unknownDomains: result.metadata.unknownDomains
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
      this.log(context, 'error', 'Email classification failed', {
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
   * Classify all emails
   */
  private classifyEmails(
    input: EmailClassifierInput,
    config: EmailClassifierConfig
  ): EmailClassifierOutput {
    const emailField = config.emailField || 'email'
    const personalDomains = config.personalDomains || DEFAULT_PERSONAL_DOMAINS
    const personalDomainSet = new Set(personalDomains.map(d => d.toLowerCase()))

    const contacts: EmailClassifierOutput['contacts'] = []
    let businessEmails = 0
    let personalEmails = 0
    let unknownDomains = 0

    for (const contact of input.contacts) {
      const email = contact[emailField]

      if (!email || typeof email !== 'string') {
        // No email - skip or mark as unknown
        contacts.push({
          original: contact,
          email,
          emailType: undefined,
          domain: undefined,
          confidence: 'low'
        })
        continue
      }

      const classification = this.classifyEmail(email, personalDomainSet)

      if (classification.emailType === 'business') {
        businessEmails++
      } else if (classification.emailType === 'personal') {
        personalEmails++
      }

      if (classification.confidence === 'low') {
        unknownDomains++
      }

      contacts.push({
        original: contact,
        email,
        ...classification
      })
    }

    return {
      contacts,
      metadata: {
        totalInput: input.contacts.length,
        totalProcessed: input.contacts.length,
        businessEmails,
        personalEmails,
        unknownDomains
      }
    }
  }

  /**
   * Classify a single email
   */
  private classifyEmail(
    email: string,
    personalDomainSet: Set<string>
  ): { emailType: 'business' | 'personal'; domain: string; confidence: 'high' | 'medium' | 'low' } {
    // Extract domain
    const domain = email.split('@')[1]?.toLowerCase()

    if (!domain) {
      return {
        emailType: 'business', // Fallback
        domain: 'unknown',
        confidence: 'low'
      }
    }

    // Check if it's a personal domain
    if (personalDomainSet.has(domain)) {
      return {
        emailType: 'personal',
        domain,
        confidence: 'high'
      }
    }

    // Check for common business domain patterns
    if (this.looksLikeBusinessDomain(domain)) {
      return {
        emailType: 'business',
        domain,
        confidence: 'high'
      }
    }

    // Unknown domain - assume business
    return {
      emailType: 'business',
      domain,
      confidence: 'medium'
    }
  }

  /**
   * Check if domain looks like a business domain
   */
  private looksLikeBusinessDomain(domain: string): boolean {
    // Common business domain patterns
    const businessPatterns = [
      /\.co\./,          // .co.uk, .co.it, etc.
      /\.com\.[a-z]{2}$/, // .com.br, .com.mx, etc.
      /^(www\.)?[^@]+\.(?:biz|info|net|org|company|tech|io|ai)$/
    ]

    return businessPatterns.some(pattern => pattern.test(domain))
  }

  /**
   * Execute in mock mode - returns sample classifications
   */
  private async executeMock(
    config: EmailClassifierConfig,
    input: EmailClassifierInput,
    context: ExecutionContext,
    startTime: number
  ) {
    await this.sleep(100) // Simulate processing latency

    const emailField = config.emailField || 'email'

    const mockContacts: EmailClassifierOutput['contacts'] = input.contacts.map((contact, index) => {
      const email = contact[emailField]
      const domain = email?.split('@')[1]?.toLowerCase() || 'unknown.com'

      // Alternate between business and personal for demo
      const isPersonal = index % 2 === 0

      return {
        original: contact,
        email,
        emailType: isPersonal ? 'personal' : 'business',
        domain,
        confidence: 'high' as const
      }
    })

    const businessEmails = mockContacts.filter(c => c.emailType === 'business').length
    const personalEmails = mockContacts.filter(c => c.emailType === 'personal').length

    const mockOutput: EmailClassifierOutput = {
      contacts: mockContacts,
      metadata: {
        totalInput: input.contacts.length,
        totalProcessed: input.contacts.length,
        businessEmails,
        personalEmails,
        unknownDomains: 0
      }
    }

    const executionTime = Date.now() - startTime

    this.log(context, 'info', '🎭 Mock: Email classification completed', {
      totalProcessed: mockOutput.metadata.totalProcessed,
      businessEmails: mockOutput.metadata.businessEmails,
      personalEmails: mockOutput.metadata.personalEmails
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
