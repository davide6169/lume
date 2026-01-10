/**
 * Mock Data Generator for API Blocks
 *
 * Generates realistic mock responses for testing without calling real APIs
 */

import type { Contact } from '@/types'

export class MockDataGenerator {
  // Mock companies
  private static readonly COMPANIES = [
    'TechCorp', 'InnovateLab', 'DataSystems', 'CloudNine',
    'FutureTech', 'DigitalSolutions', 'SmartTech', 'AI Dynamics'
  ]

  // Mock titles
  private static readonly TITLES = [
    'Software Engineer', 'Product Manager', 'Data Scientist',
    'CTO', 'CEO', 'Marketing Director', 'Sales Manager',
    'DevOps Engineer', 'UX Designer', 'Business Analyst'
  ]

  // Mock locations
  private static readonly LOCATIONS = [
    'San Francisco, CA', 'New York, NY', 'London, UK',
    'Berlin, Germany', 'Paris, France', 'Milan, Italy',
    'Rome, Italy', 'Madrid, Spain', 'Amsterdam, Netherlands'
  ]

  // Mock interests
  private static readonly INTERESTS = [
    'technology', 'software development', 'cloud computing', 'AI/ML',
    'data analytics', 'digital marketing', 'e-commerce', 'fintech',
    'saas', 'product management', 'ux design', 'mobile apps',
    'blockchain', 'iot', 'cybersecurity', 'devops'
  ]

  // Mock LLM responses
  private static readonly LLM_RESPONSES = {
    sentiment: [
      { sentiment: 'positive', confidence: 0.95, explanation: 'The text expresses positive sentiment with enthusiastic language.' },
      { sentiment: 'negative', confidence: 0.87, explanation: 'The text shows dissatisfaction and negative emotions.' },
      { sentiment: 'neutral', confidence: 0.92, explanation: 'The text is factual and neutral in tone.' }
    ],
    interests: [
      ['technology', 'software development', 'cloud computing'],
      ['digital marketing', 'e-commerce', 'saas'],
      ['AI/ML', 'data analytics', 'fintech'],
      ['product management', 'ux design', 'mobile apps']
    ],
    contacts: [
      { name: 'Mario Rossi', email: 'mario.rossi@example.com', phone: '+39 333 1234567' },
      { name: 'Giulia Bianchi', email: 'giulia.bianchi@example.com', phone: '+39 334 7654321' }
    ]
  }

  /**
   * Generate Apollo enrichment mock response
   */
  static generateApolloEnrichment(contacts: Contact[]): any {
    return {
      contacts: contacts.map((contact, index) => ({
        ...contact,
        enriched: true,
        enrichedAt: new Date().toISOString(),
        title: this.randomItem(this.TITLES),
        company: this.randomItem(this.COMPANIES),
        linkedinUrl: `https://linkedin.com/in/mock-${index}`,
        phone: this.generatePhone(),
        location: this.randomItem(this.LOCATIONS),
        employeeCount: Math.floor(Math.random() * 10000) + 50,
        revenue: Math.floor(Math.random() * 1000000000) + 1000000,
        industry: 'Technology'
      })),
      metadata: {
        totalContacts: contacts.length,
        successfulEnrichments: contacts.length,
        failedEnrichments: 0,
        cost: 0,
        currency: 'USD',
        mock: true
      }
    }
  }

  /**
   * Generate Hunter.io verification mock response
   */
  static generateHunterVerification(email: string): any {
    const domains = ['gmail.com', 'outlook.com', 'company.com', 'techcorp.io']
    const domain = email.split('@')[1] || this.randomItem(domains)

    return {
      email,
      status: Math.random() > 0.2 ? 'valid' : 'risky',
      score: Math.floor(Math.random() * 40) + 60,
      domain: {
        name: domain,
        disposable: false,
        webmail: domain === 'gmail.com' || domain === 'outlook.com'
      },
      mailbox: {
        exists: true,
        full: true
      },
      accept_all: false,
      mock: true
    }
  }

  /**
   * Generate Hunter.io finder mock response
   */
  static generateHunterFinder(domain: string): any {
    return {
      data: {
        domain,
        emails: [
          { email: `contact@${domain}`, confidence: 90, sources: [] },
          { email: `info@${domain}`, confidence: 80, sources: [] },
          { email: `support@${domain}`, confidence: 75, sources: [] }
        ],
        pattern: '{first}.{last}'
      },
      meta: {
        results: 3,
        limit: 10,
        offset: 0
      },
      mock: true
    }
  }

  /**
   * Generate OpenRouter LLM mock response
   */
  static generateOpenRouterResponse(messages: any[], model: string): any {
    const lastMessage = messages[messages.length - 1]?.content || ''

    // Generate contextual response
    let content = ''

    if (lastMessage.toLowerCase().includes('sentiment')) {
      const sentiment = this.randomItem(this.LLM_RESPONSES.sentiment)
      content = JSON.stringify(sentiment)
    } else if (lastMessage.toLowerCase().includes('interest')) {
      const interests = this.randomItem(this.LLM_RESPONSES.interests)
      content = `Based on the profile, the inferred interests are: ${interests.join(', ')}`
    } else if (lastMessage.toLowerCase().includes('contact')) {
      const contact = this.randomItem(this.LLM_RESPONSES.contacts)
      content = JSON.stringify(contact)
    } else {
      content = 'This is a mock response from the LLM. In production, this would contain the actual AI-generated content based on your input.'
    }

    const promptTokens = Math.floor(Math.random() * 500) + 100
    const completionTokens = Math.floor(Math.random() * 300) + 50

    return {
      content,
      model,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens
      },
      finishReason: 'stop',
      mock: true
    }
  }

  /**
   * Generate Mixedbread embeddings mock response
   */
  static generateMixedbreadEmbedding(text: string): any {
    const dimension = 768
    const embedding = Array.from({ length: dimension }, () => Math.random() * 2 - 1)

    return {
      embedding,
      dimension,
      model: 'mock-embeddings',
      mock: true
    }
  }

  /**
   * Generate Apify scraper mock response
   */
  static generateApifyScraperResults(actorId: string): any {
    return {
      items: [
        {
          id: '1',
          url: 'https://example.com/profile/1',
          name: 'Mock Profile 1',
          bio: 'Software engineer with experience in web development',
          followers: Math.floor(Math.random() * 10000) + 100,
          following: Math.floor(Math.random() * 1000) + 100,
          verified: Math.random() > 0.8
        },
        {
          id: '2',
          url: 'https://example.com/profile/2',
          name: 'Mock Profile 2',
          bio: 'Product manager passionate about user experience',
          followers: Math.floor(Math.random() * 10000) + 100,
          following: Math.floor(Math.random() * 1000) + 100,
          verified: Math.random() > 0.8
        }
      ],
      totalCount: 2,
      actorId,
      mock: true
    }
  }

  /**
   * Generate CSV interest enrichment mock response
   */
  static generateCSVInterestEnrichment(contacts: any[]): any {
    return {
      contacts: contacts.map((contact, index) => ({
        ...contact,
        interessi: this.randomItem(this.LLM_RESPONSES.interests).join(', '),
        enrichedAt: new Date().toISOString()
      })),
      metadata: {
        totalContacts: contacts.length,
        enrichedContacts: contacts.length,
        cost: 0,
        mock: true
      }
    }
  }

  /**
   * Generate lead enrichment mock response
   */
  static generateLeadEnrichment(leads: any[]): any {
    return {
      leads: leads.map((lead, index) => ({
        ...lead,
        score: Math.floor(Math.random() * 100) + 1,
        tier: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        interests: this.randomItem(this.LLM_RESPONSES.interests).join(', '),
        lastContacted: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        nextAction: ['Call', 'Email', 'LinkedIn', 'Meeting'][Math.floor(Math.random() * 4)]
      })),
      metadata: {
        totalLeads: leads.length,
        enrichedLeads: leads.length,
        mock: true
      }
    }
  }

  // Utility methods

  private static randomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }

  private static generatePhone(): string {
    const countries = [
      { prefix: '+39', format: 'XXX XXX XXXX' },  // Italy
      { prefix: '+1', format: 'XXX XXX XXXX' },   // US
      { prefix: '+44', format: 'XXXX XXXXXX' },   // UK
      { prefix: '+49', format: 'XXXX XXXXXXX' }   // Germany
    ]
    const country = this.randomItem(countries)
    const digits = country.format.replace(/X/g, () => Math.floor(Math.random() * 10).toString())
    return `${country.prefix} ${digits}`
  }

  /**
   * Generate mock timeline events for execution tracking
   */
  static generateMockTimelineEvents(nodeId: string, eventType: string): any[] {
    return [
      {
        event: eventType,
        event_type: eventType,
        node_id: nodeId,
        details: { message: 'Mock event: block executed successfully' },
        created_at: new Date().toISOString()
      }
    ]
  }

  /**
   * Generate delay to simulate API latency
   */
  static async simulateLatency(minMs: number = 100, maxMs: number = 500): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}
