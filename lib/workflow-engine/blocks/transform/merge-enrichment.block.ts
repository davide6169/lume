/**
 * Merge Enrichment Block
 *
 * Combines enrichment data from multiple sources (FullContact, PDL)
 * into unified bio data structure for interest inference.
 *
 * Features:
 * - Prioritizes FullContact (B2C) over PDL (B2B)
 * - Deep merge strategy to combine data
 * - Creates unified bioText for LLM processing
 * - Tracks data sources
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'

export interface MergeEnrichmentConfig {
  mergeStrategy?: 'deepMerge' | 'replace' | 'combine'
  prioritizeFullContact?: boolean
  fallbackFields?: string[] // Fields to use from PDL if FullContact missing
  enabled?: boolean
}

export interface MergeEnrichmentInput {
  contacts: Array<{
    original: Record<string, any>
    fullcontact?: {
      found: boolean
      profiles?: {
        instagram?: string
        twitter?: string
        linkedin?: string
        facebook?: string
      }
      demographics?: {
        age?: string
        gender?: string
        location?: string
        country?: string
      }
      interests?: string[]
    }
    pdl?: {
      found: boolean
      linkedin?: string
      skills?: string[]
      experience?: Array<{
        company: string
        title: string
        startDate: string
        endDate?: string
      }>
      jobTitle?: string
      company?: string
      industry?: string
    }
    enrichmentMetadata?: {
      cost: number
      sources: string[]
      fullcontactFailed?: boolean
    }
  }>
}

export interface MergedEnrichmentData {
  sources: string[] // ['fullcontact'] or ['pdl'] or ['fullcontact', 'pdl']
  bioText: string // Combined bio for LLM
  interests: string[] // Interests from any source
  socialProfiles: {
    instagram?: string
    linkedin?: string
    twitter?: string
    facebook?: string
  }
  professional?: {
    skills?: string[]
    experience?: any[]
    jobTitle?: string
    company?: string
    industry?: string
  }
  demographics?: {
    age?: string
    gender?: string
    location?: string
    country?: string
  }
}

export interface MergeEnrichmentOutput {
  contacts: Array<{
    original: Record<string, any>
    bioData?: MergedEnrichmentData
    enrichmentMetadata?: {
      cost: number
      sources: string[]
      timestamp: string
    }
  }>
  metadata: {
    totalInput: number
    totalProcessed: number
    withFullContact: number
    withPDL: number
    withBoth: number
    totalCost: number
  }
}

/**
 * Merge Enrichment Block
 */
export class MergeEnrichmentBlock extends BaseBlockExecutor {
  static supportsMock: boolean = true

  constructor() {
    super('transform.mergeEnrichment')
  }

  async execute(
    config: MergeEnrichmentConfig,
    input: MergeEnrichmentInput,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      this.log(context, 'info', 'Merging enrichment data from multiple sources', {
        contactsCount: input.contacts.length,
        mergeStrategy: config.mergeStrategy || 'deepMerge',
        prioritizeFullContact: config.prioritizeFullContact !== false
      })

      const results = await this.mergeContacts(config, input.contacts, context)

      const executionTime = Date.now() - startTime

      this.log(context, 'info', 'Enrichment data merged', {
        totalProcessed: results.metadata.totalProcessed,
        withFullContact: results.metadata.withFullContact,
        withPDL: results.metadata.withPDL,
        withBoth: results.metadata.withBoth
      })

      return {
        status: 'completed',
        output: results,
        executionTime,
        error: undefined,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: results.metadata,
        logs: []
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'Merge enrichment failed', {
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
   * Merge enrichment data for all contacts
   */
  private async mergeContacts(
    config: MergeEnrichmentConfig,
    contacts: Array<any>,
    context: ExecutionContext
  ): Promise<MergeEnrichmentOutput> {
    const results: MergeEnrichmentOutput['contacts'] = []
    let withFullContact = 0
    let withPDL = 0
    let withBoth = 0
    let totalCost = 0

    for (const contact of contacts) {
      const hasFullContact = contact.fullcontact?.found === true
      const hasPDL = contact.pdl?.found === true

      if (hasFullContact) withFullContact++
      if (hasPDL) withPDL++
      if (hasFullContact && hasPDL) withBoth++

      const mergedData = this.mergeContactData(
        config,
        contact,
        hasFullContact,
        hasPDL
      )

      totalCost += (contact.enrichmentMetadata?.cost || 0)

      results.push({
        original: contact.original,
        bioData: mergedData,
        enrichmentMetadata: {
          cost: contact.enrichmentMetadata?.cost || 0,
          sources: mergedData.sources,
          timestamp: new Date().toISOString()
        }
      })
    }

    return {
      contacts: results,
      metadata: {
        totalInput: contacts.length,
        totalProcessed: contacts.length,
        withFullContact,
        withPDL,
        withBoth,
        totalCost
      }
    }
  }

  /**
   * Merge data from FullContact and PDL for single contact
   */
  private mergeContactData(
    config: MergeEnrichmentConfig,
    contact: any,
    hasFullContact: boolean,
    hasPDL: boolean
  ): MergedEnrichmentData {
    const sources: string[] = []
    const bioParts: string[] = []
    const interests: string[] = []
    const socialProfiles: any = {}
    const professional: any = {}
    const demographics: any = {}

    // FullContact data (primary, B2C)
    if (hasFullContact && contact.fullcontact) {
      sources.push('fullcontact')

      const fc = contact.fullcontact

      // Social profiles
      if (fc.profiles?.instagram) socialProfiles.instagram = fc.profiles.instagram
      if (fc.profiles?.twitter) socialProfiles.twitter = fc.profiles.twitter
      if (fc.profiles?.linkedin) socialProfiles.linkedin = fc.profiles.linkedin
      if (fc.profiles?.facebook) socialProfiles.facebook = fc.profiles.facebook

      // Demographics
      if (fc.demographics) {
        Object.assign(demographics, fc.demographics)
      }

      // Interests
      if (fc.interests && Array.isArray(fc.interests)) {
        interests.push(...fc.interests)
      }

      // Build bio text
      if (fc.profiles?.instagram) {
        bioParts.push(`Instagram: @${fc.profiles.instagram}`)
      }

      if (fc.demographics?.location) {
        bioParts.push(`Location: ${fc.demographics.location}`)
      }

      if (fc.interests && fc.interests.length > 0) {
        bioParts.push(`Interests: ${fc.interests.join(', ')}`)
      }
    }

    // PDL data (fallback, B2B)
    if (hasPDL && contact.pdl) {
      sources.push('pdl')

      const pdl = contact.pdl

      // Social profiles (fallback if not from FullContact)
      if (!socialProfiles.linkedin && pdl.linkedin) {
        socialProfiles.linkedin = pdl.linkedin
      }

      // Professional data
      if (pdl.skills && pdl.skills.length > 0) {
        professional.skills = pdl.skills
        bioParts.push(`Skills: ${pdl.skills.slice(0, 5).join(', ')}`)
      }

      if (pdl.experience && pdl.experience.length > 0) {
        professional.experience = pdl.experience
        const exp = pdl.experience[0]
        bioParts.push(`Works at: ${exp.company} as ${exp.title}`)
      }

      if (pdl.jobTitle) {
        professional.jobTitle = pdl.jobTitle
        bioParts.push(`Job Title: ${pdl.jobTitle}`)
      }

      if (pdl.company) {
        professional.company = pdl.company
      }

      if (pdl.industry) {
        professional.industry = pdl.industry
        bioParts.push(`Industry: ${pdl.industry}`)
      }
    }

    // Combine bio parts into bio text
    const bioText = bioParts.join('. ')

    return {
      sources,
      bioText,
      interests,
      socialProfiles,
      professional: Object.keys(professional).length > 0 ? professional : undefined,
      demographics: Object.keys(demographics).length > 0 ? demographics : undefined
    }
  }

  /**
   * Mock mode - returns merged mock data
   */
  private async executeMock(
    config: MergeEnrichmentConfig,
    input: MergeEnrichmentInput,
    context: ExecutionContext,
    startTime: number
  ) {
    await this.sleep(200) // Simulate processing

    const mockContacts: MergeEnrichmentOutput['contacts'] = input.contacts.map(contact => {
      // 60% FullContact only, 20% PDL only, 20% both
      const rand = Math.random()
      const hasFullContact = rand < 0.8
      const hasPDL = rand >= 0.6

      const sources: string[] = []
      if (hasFullContact) sources.push('fullcontact')
      if (hasPDL) sources.push('pdl')

      return {
        original: contact.original,
        bioData: {
          sources,
          bioText: hasFullContact
            ? 'Instagram: @mock_user. Location: Milan, Italy. Interests: Technology, Travel, Photography'
            : 'Skills: Business Strategy, Management, Sales. Works at: TechCorp as Manager. Industry: Technology',
          interests: hasFullContact ? ['Technology', 'Travel', 'Photography'] : [],
          socialProfiles: {
            instagram: hasFullContact ? 'mock_user' : undefined,
            linkedin: hasPDL ? 'https://linkedin.com/in/mock' : undefined
          },
          professional: hasPDL ? {
            skills: ['Business Strategy', 'Management', 'Sales'],
            jobTitle: 'Manager',
            company: 'TechCorp',
            industry: 'Technology'
          } : undefined,
          demographics: hasFullContact ? {
            age: '25-34',
            gender: 'Male',
            location: 'Milan, Italy'
          } : undefined
        },
        enrichmentMetadata: {
          cost: 0,
          sources,
          timestamp: new Date().toISOString()
        }
      }
    })

    const withFullContact = mockContacts.filter(c => c.bioData?.sources.includes('fullcontact')).length
    const withPDL = mockContacts.filter(c => c.bioData?.sources.includes('pdl')).length
    const withBoth = mockContacts.filter(c => c.bioData?.sources.length === 2).length

    const mockOutput: MergeEnrichmentOutput = {
      contacts: mockContacts,
      metadata: {
        totalInput: input.contacts.length,
        totalProcessed: input.contacts.length,
        withFullContact,
        withPDL,
        withBoth,
        totalCost: 0
      }
    }

    const executionTime = Date.now() - startTime

    this.log(context, 'info', '🎭 Mock: Merge enrichment completed', {
      totalProcessed: mockOutput.metadata.totalProcessed
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
}
