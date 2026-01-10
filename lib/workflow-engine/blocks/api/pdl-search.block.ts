/**
 * People Data Labs (PDL) Search Block
 *
 * Enriches contacts using People Data Labs API.
 * Finds professional data: LinkedIn, skills, work experience, job titles.
 *
 * Input: Array of contacts with name/email
 * Output: Array of contacts with PDL enrichment data
 *
 * Cost: ~$0.01-0.03 per lookup
 * Focus: B2B professional data
 *
 * IMPORTANT NOTES:
 * - PDL provides professional skills, LinkedIn profiles, and work experience
 * - Best for business (B2B) data
 * - Cache TTL: 30 days (professional data is very stable)
 * - In mock mode, returns realistic B2B sample data
 * - Use as fallback when FullContact fails
 */

import { BaseBlockExecutor } from '../../registry'
import { Caches, generateCacheKey } from '../../utils/cache'
import type { ExecutionContext } from '../../types'

// Types
export interface PDLSearchConfig {
  apiToken: string // {{secrets.pdl}}
  mode?: 'live' | 'mock' // Force mock mode
  enabled?: boolean // Enable/disable block (default: true)
  timeout?: number // Request timeout in ms (default: 30000)
  retryMax?: number // Max retries (default: 3)
}

export interface PDLSearchInput {
  contacts: Array<{
    original: Record<string, any>
    email?: string
    nome?: string
    country?: string
  }>
}

export interface PDLProfileData {
  found: boolean
  linkedin?: string
  skills?: string[]
  experience?: Array<{
    company: string
    title: string
    startDate: string
    endDate?: string
  }>
  education?: Array<{
    school: string
    degree: string
    major: string
  }>
  jobTitle?: string
  company?: string
  industry?: string
  location?: string
  error?: string
}

export interface PDLSearchOutput {
  contacts: Array<{
    original: Record<string, any>
    pdl?: PDLProfileData
    enrichmentMetadata?: {
      cost: number
      sources: string[]
      timestamp: string
      pdlUsed?: boolean
    }
  }>
  metadata: {
    totalInput: number
    totalProcessed: number
    profilesFound: number
    profilesNotFound: number
    totalCost: number
    avgCostPerContact: number
  }
}

/**
 * People Data Labs Search Block
 */
export class PDLSearchBlock extends BaseBlockExecutor {
  // DECLARE MOCK SUPPORT
  static supportsMock: boolean = true

  private cache = Caches.pdl()
  private costPerLookup = 0.02

  constructor() {
    super('api.pdlSearch')
  }

  async execute(
    config: PDLSearchConfig,
    input: PDLSearchInput,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      // Check for mock mode
      const shouldMock = config.mode === 'mock' || context.mode === 'demo' || context.mode === 'test'

      if (shouldMock) {
        this.log(context, 'info', '🎭 MOCK MODE: Simulating PDL search')
        return await this.executeMock(config, input, context, startTime)
      }

      this.log(context, 'info', 'Enriching contacts with People Data Labs', {
        contactsCount: input.contacts.length
      })

      // Validate input
      if (!input.contacts || !Array.isArray(input.contacts)) {
        throw new Error('Input must have contacts array')
      }

      // Validate API token
      if (!config.apiToken) {
        throw new Error('PDL API token is required in config.apiToken or secrets.pdl')
      }

      // Process contacts
      const results = await this.processContacts(config, input.contacts, context)

      const executionTime = Date.now() - startTime

      this.log(context, 'info', 'PDL enrichment completed', {
        totalProcessed: results.metadata.totalProcessed,
        profilesFound: results.metadata.profilesFound,
        totalCost: results.metadata.totalCost.toFixed(4)
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
      this.log(context, 'error', 'PDL enrichment failed', {
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
   * Process all contacts and search PDL profiles
   */
  private async processContacts(
    config: PDLSearchConfig,
    contacts: Array<any>,
    context: ExecutionContext
  ): Promise<PDLSearchOutput> {
    const results: PDLSearchOutput['contacts'] = []
    let profilesFound = 0
    let totalCost = 0

    for (const contact of contacts) {
      try {
        this.log(context, 'debug', 'Searching PDL for contact', {
          email: contact.email,
          nome: contact.nome
        })

        // Check cache first (unless disabled)
        const cacheKey = generateCacheKey('pdl', {
          email: contact.email?.toLowerCase(),
          nome: contact.nome?.toLowerCase().trim()
        })

        const cached = context.disableCache ? undefined : this.cache.get(cacheKey)

        if (cached) {
          this.log(context, 'debug', 'Cache hit', { cacheKey })
          results.push(cached)
          if (cached.pdl?.found) {
            profilesFound++
            totalCost += this.costPerLookup
          }
          continue
        }

        // Search PDL profile
        const profileData = await this.searchProfile(config, contact, context)

        // Store in cache
        if (!context.disableCache) {
          this.cache.set(cacheKey, profileData)
        }

        if (profileData.found) {
          profilesFound++
          totalCost += this.costPerLookup
        }

        results.push({
          original: contact.original,
          pdl: profileData,
          enrichmentMetadata: {
            cost: profileData.found ? this.costPerLookup : 0,
            sources: profileData.found ? ['pdl'] : [],
            timestamp: new Date().toISOString(),
            pdlUsed: profileData.found
          }
        })

      } catch (error) {
        this.log(context, 'warn', 'Failed to search PDL for contact', {
          email: contact.email,
          error: (error as Error).message
        })

        // Continue with other contacts even if one fails
        results.push({
          original: contact.original,
          pdl: {
            found: false,
            error: (error as Error).message
          },
          enrichmentMetadata: {
            cost: 0,
            sources: [],
            timestamp: new Date().toISOString(),
            pdlUsed: false
          }
        })
      }
    }

    return {
      contacts: results,
      metadata: {
        totalInput: contacts.length,
        totalProcessed: contacts.length,
        profilesFound,
        profilesNotFound: contacts.length - profilesFound,
        totalCost,
        avgCostPerContact: contacts.length > 0 ? totalCost / contacts.length : 0
      }
    }
  }

  /**
   * Search PDL profile using API
   * NOTE: This is a placeholder implementation
   * Real API integration to be implemented based on PDL API docs
   */
  private async searchProfile(
    config: PDLSearchConfig,
    contact: any,
    context: ExecutionContext
  ): Promise<PDLProfileData> {
    // Placeholder for real PDL API call
    // For now, return not found
    // TODO: Implement actual PDL API integration

    this.log(context, 'warn', 'PDL API not yet implemented, returning not found', {
      email: contact.email
    })

    return {
      found: false,
      error: 'PDL API integration not yet implemented'
    }
  }

  /**
   * Execute in mock mode - returns sample PDL data
   */
  private async executeMock(
    config: PDLSearchConfig,
    input: PDLSearchInput,
    context: ExecutionContext,
    startTime: number
  ) {
    await this.sleep(500) // Simulate API latency

    const mockContacts: PDLSearchOutput['contacts'] = input.contacts.map((contact, index) => {
      // 60% success rate in mock mode
      const found = index % 10 < 6

      if (found) {
        const mockProfiles = this.getMockPDLData(contact)
        return {
          original: contact.original,
          pdl: {
            found: true,
            ...mockProfiles
          },
          enrichmentMetadata: {
            cost: this.costPerLookup,
            sources: ['pdl'],
            timestamp: new Date().toISOString(),
            pdlUsed: true
          }
        }
      } else {
        return {
          original: contact.original,
          pdl: {
            found: false,
            error: 'Profile not found (mock)'
          },
          enrichmentMetadata: {
            cost: 0,
            sources: [],
            timestamp: new Date().toISOString(),
            pdlUsed: false
          }
        }
      }
    })

    const profilesFound = mockContacts.filter(c => c.pdl?.found).length
    const totalCost = profilesFound * this.costPerLookup

    const mockOutput: PDLSearchOutput = {
      contacts: mockContacts,
      metadata: {
        totalInput: input.contacts.length,
        totalProcessed: input.contacts.length,
        profilesFound,
        profilesNotFound: input.contacts.length - profilesFound,
        totalCost,
        avgCostPerContact: input.contacts.length > 0 ? totalCost / input.contacts.length : 0
      }
    }

    const executionTime = Date.now() - startTime

    this.log(context, 'info', '🎭 Mock: PDL enrichment completed', {
      totalProcessed: mockOutput.metadata.totalProcessed,
      profilesFound: mockOutput.metadata.profilesFound
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
   * Get realistic mock PDL data (B2B focus)
   */
  private getMockPDLData(contact: any): Omit<PDLProfileData, 'found' | 'error'> {
    const mockProfiles = [
      {
        linkedin: 'https://linkedin.com/in/giovanni-rossi',
        skills: ['Business Strategy', 'Management', 'Sales', 'Marketing', 'Leadership', 'Negotiation'],
        experience: [
          { company: 'Tech Solutions Srl', title: 'Business Development Manager', startDate: '2020-01' },
          { company: 'Digital Consulting', title: 'Sales Executive', startDate: '2017-06', endDate: '2019-12' }
        ],
        education: [
          { school: 'Università Bocconi', degree: 'Bachelor', major: 'Business Administration' }
        ],
        jobTitle: 'Business Development Manager',
        company: 'Tech Solutions Srl',
        industry: 'Technology',
        location: 'Milan, Italy'
      },
      {
        linkedin: 'https://linkedin.com/in/maria-bianchi',
        skills: ['Software Development', 'JavaScript', 'React', 'Node.js', 'Cloud', 'AWS', 'TypeScript'],
        experience: [
          { company: 'Innovation Labs', title: 'Senior Software Engineer', startDate: '2019-03' },
          { company: 'Startup Italia', title: 'Full Stack Developer', startDate: '2016-09', endDate: '2019-02' }
        ],
        education: [
          { school: 'Politecnico di Milano', degree: 'Master', major: 'Computer Engineering' }
        ],
        jobTitle: 'Senior Software Engineer',
        company: 'Innovation Labs',
        industry: 'Software',
        location: 'Milan, Italy'
      },
      {
        linkedin: 'https://linkedin.com/in/lucas-verdi',
        skills: ['Marketing', 'Digital Marketing', 'SEO', 'Content Strategy', 'Analytics', 'Social Media'],
        experience: [
          { company: 'Marketing Agency', title: 'Digital Marketing Manager', startDate: '2021-02' },
          { company: 'E-commerce Shop', title: 'Marketing Specialist', startDate: '2018-07', endDate: '2021-01' }
        ],
        education: [
          { school: 'Università degli Studi di Milano', degree: 'Bachelor', major: 'Marketing' }
        ],
        jobTitle: 'Digital Marketing Manager',
        company: 'Marketing Agency',
        industry: 'Marketing',
        location: 'Rome, Italy'
      },
      {
        linkedin: 'https://linkedin.com/in/sophie-martin',
        skills: ['UX Design', 'UI Design', 'User Research', 'Prototyping', 'Figma', 'Design Systems'],
        experience: [
          { company: 'Design Studio', title: 'Senior UX Designer', startDate: '2019-06' }
        ],
        education: [
          { school: 'Politecnico di Torino', degree: 'Master', major: 'Design' }
        ],
        jobTitle: 'Senior UX Designer',
        company: 'Design Studio',
        industry: 'Design',
        location: 'Turin, Italy'
      },
      {
        linkedin: 'https://linkedin.com/in/marco-ferrari',
        skills: ['Finance', 'Accounting', 'Financial Analysis', 'Excel', 'Budgeting', 'Reporting'],
        experience: [
          { company: 'Financial Services', title: 'Financial Analyst', startDate: '2018-03' }
        ],
        education: [
          { school: 'Università Bocconi', degree: 'Master', major: 'Finance' }
        ],
        jobTitle: 'Financial Analyst',
        company: 'Financial Services',
        industry: 'Finance',
        location: 'Milan, Italy'
      },
      {
        linkedin: 'https://linkedin.com-in/giulia-romano',
        skills: ['HR', 'Recruiting', 'Talent Acquisition', 'People Management', 'Organizational Development'],
        experience: [
          { company: 'HR Solutions', title: 'HR Manager', startDate: '2019-09' }
        ],
        education: [
          { school: 'Università degli Studi di Bologna', degree: 'Bachelor', major: 'Psychology' }
        ],
        jobTitle: 'HR Manager',
        company: 'HR Solutions',
        industry: 'Human Resources',
        location: 'Bologna, Italy'
      },
      {
        linkedin: 'https://linkedin.com/in/alessandro-conti',
        skills: ['Project Management', 'Agile', 'Scrum', 'JIRA', 'Risk Management', 'Stakeholder Management'],
        experience: [
          { company: 'Consulting Firm', title: 'Project Manager', startDate: '2020-05' }
        ],
        education: [
          { school: 'SDA Bocconi', degree: 'MBA', major: 'Business Administration' }
        ],
        jobTitle: 'Project Manager',
        company: 'Consulting Firm',
        industry: 'Consulting',
        location: 'Milan, Italy'
      },
      {
        linkedin: 'https://linkedin.com/in/elena-colombo',
        skills: ['Data Science', 'Python', 'Machine Learning', 'SQL', 'Tableau', 'Statistics'],
        experience: [
          { company: 'Data Analytics', title: 'Data Scientist', startDate: '2020-01' }
        ],
        education: [
          { school: 'Politecnico di Milano', degree: 'PhD', major: 'Computer Science' }
        ],
        jobTitle: 'Data Scientist',
        company: 'Data Analytics',
        industry: 'Data Analytics',
        location: 'Milan, Italy'
      }
    ]

    // Return random mock profile based on contact
    const hash = contact.email ? contact.email.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0) : 0
    const index = hash % mockProfiles.length

    return mockProfiles[index]
  }
}
