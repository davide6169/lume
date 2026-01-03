import type {
  MetaGraphApiResponse,
  OpenRouterResponse,
  MixedbreadEmbeddingResponse,
  ApolloContactResponse,
  HunterEmailResponse,
  Contact,
} from '@/types'

// Demo data for source audiences
const demoSourceAudiences = [
  {
    id: crypto.randomUUID(),
    name: 'Tech Enthusiasts Facebook',
    type: 'facebook' as const,
    urls: [
      'https://www.facebook.com/groups/tech.enthousiasts',
      'https://www.facebook.com/technews.daily',
      'https://www.facebook.com/ai.innovation',
    ],
  },
  {
    id: crypto.randomUUID(),
    name: 'Fitness Brands Instagram',
    type: 'instagram' as const,
    urls: [
      'https://www.instagram.com/fitness.pro',
      'https://www.instagram.com/healthylifestyle',
      'https://www.instagram.com/workout.daily',
    ],
  },
]

// Demo contacts
const demoContacts: Contact[] = [
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+1234567890',
    city: 'New York',
    country: 'US',
    interests: ['Technology', 'AI', 'Machine Learning', 'Startups'],
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+0987654321',
    city: 'San Francisco',
    country: 'US',
    interests: ['Fitness', 'Health', 'Wellness', 'Nutrition'],
  },
  {
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@example.com',
    phone: '+1122334455',
    city: 'Los Angeles',
    country: 'US',
    interests: ['Technology', 'Gaming', 'Software Development'],
  },
  {
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@example.com',
    phone: '+5566778899',
    city: 'Chicago',
    country: 'US',
    interests: ['Marketing', 'Social Media', 'Content Creation'],
  },
  {
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@example.com',
    phone: '+9988776655',
    city: 'Seattle',
    country: 'US',
    interests: ['Fitness', 'Running', 'Marathons', 'Health Tech'],
  },
]

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Random cost generator
const randomCost = (min: number, max: number) => Math.random() * (max - min) + min

export class DemoModeService {
  private enabled: boolean

  constructor(enabled: boolean = true) {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  // Simulate Meta Graph API call
  async fetchFromMeta(url: string): Promise<MetaGraphApiResponse> {
    if (!this.enabled) throw new Error('Demo mode is not enabled')

    await delay(500 + Math.random() * 1000)

    // Simulate random errors (5% chance)
    if (Math.random() < 0.05) {
      return {
        data: [],
        error: {
          message: 'Rate limit exceeded (demo)',
          type: 'OAuthException',
          code: 4,
        },
      }
    }

    // Return demo posts/comments data
    return {
      data: [
        {
          id: crypto.randomUUID(),
          type: 'post',
          message: 'Great post! Very interesting content.',
          comments: {
            data: [
              { from: { name: 'John Smith', email: 'john.smith@example.com' } },
              { from: { name: 'Sarah Johnson', email: 'sarah.johnson@example.com' } },
            ],
          },
        },
        {
          id: crypto.randomUUID(),
          type: 'post',
          message: 'Thanks for sharing!',
          comments: {
            data: [
              { from: { name: 'Michael Chen', email: 'michael.chen@example.com' } },
            ],
          },
        },
      ],
    }
  }

  // Simulate OpenRouter LLM call
  async extractContacts(rawData: any): Promise<OpenRouterResponse> {
    if (!this.enabled) throw new Error('Demo mode is not enabled')

    await delay(1000 + Math.random() * 2000)

    // Return a random subset of demo contacts
    const numContacts = 2 + Math.floor(Math.random() * 4)
    const selectedContacts = demoContacts
      .sort(() => Math.random() - 0.5)
      .slice(0, numContacts)

    const contactsText = selectedContacts
      .map(
        (c) =>
          `Contact: ${c.firstName} ${c.lastName}, Email: ${c.email}, Phone: ${c.phone}, City: ${c.city}, Interests: ${c.interests?.join(', ')}`
      )
      .join('\n')

    return {
      choices: [
        {
          message: {
            role: 'assistant',
            content: `Extracted contacts:\n${contactsText}`,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 500 + Math.floor(Math.random() * 500),
        completion_tokens: 200 + Math.floor(Math.random() * 300),
        total_tokens: 700 + Math.floor(Math.random() * 800),
      },
    }
  }

  // Simulate Mixedbread embeddings call
  async generateEmbedding(text: string): Promise<MixedbreadEmbeddingResponse> {
    if (!this.enabled) throw new Error('Demo mode is not enabled')

    await delay(300 + Math.random() * 700)

    // Generate a random embedding vector of 1536 dimensions
    const embedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)

    return {
      embeddings: [embedding],
      model: 'mxbai-embed-large-v1',
      usage: {
        prompt_tokens: text.length / 4,
        total_tokens: text.length / 4,
      },
    }
  }

  // Simulate Apollo.io call
  async enrichContact(email: string): Promise<ApolloContactResponse> {
    if (!this.enabled) throw new Error('Demo mode is not enabled')

    await delay(400 + Math.random() * 600)

    // Find matching demo contact or return random data
    const demoContact = demoContacts.find((c) => c.email === email)

    if (demoContact) {
      return {
        person: {
          first_name: demoContact.firstName,
          last_name: demoContact.lastName,
          email: demoContact.email,
          phone: demoContact.phone,
          city: demoContact.city,
          country: demoContact.country,
          title: 'Software Engineer',
          organization: 'Tech Company Inc.',
        },
      }
    }

    // Random success rate (80%)
    if (Math.random() < 0.8) {
      return {
        person: {
          first_name: 'Jane',
          last_name: 'Doe',
          email: email,
          phone: '+1234567890',
          city: 'Boston',
          country: 'US',
          title: 'Marketing Manager',
          organization: 'Marketing Corp',
        },
      }
    }

    return {}
  }

  // Simulate Hunter.io call
  async verifyEmail(email: string): Promise<HunterEmailResponse> {
    if (!this.enabled) throw new Error('Demo mode is not enabled')

    await delay(300 + Math.random() * 500)

    // Random verification results
    const statuses = ['valid', 'valid', 'valid', 'accept_all', 'unknown']

    return {
      data: {
        email,
        status: statuses[Math.floor(Math.random() * statuses.length)] as any,
        score: Math.floor(Math.random() * 40) + 60,
        domain: email.split('@')[1],
        sources: [
          {
            domain: email.split('@')[1],
            uri: `https://${email.split('@')[1]}`,
            extracted_on: new Date().toISOString(),
          },
        ],
      },
    }
  }

  // Get demo contacts for a source audience
  async getDemoContacts(urlCount: number): Promise<Contact[]> {
    if (!this.enabled) throw new Error('Demo mode is not enabled')

    await delay(1000)

    // Return 3-5 contacts per URL
    const numContacts = urlCount * (3 + Math.floor(Math.random() * 3))
    return demoContacts
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(numContacts, demoContacts.length))
  }

  // Calculate demo costs
  calculateCosts(numUrls: number, numContacts: number): {
    service: string
    operation: string
    cost: number
  }[] {
    const costs = [
      {
        service: 'openrouter',
        operation: 'Contact extraction',
        cost: numUrls * randomCost(0.0001, 0.001),
      },
      {
        service: 'mixedbread',
        operation: 'Embeddings generation',
        cost: numContacts * randomCost(0.00001, 0.0001),
      },
      {
        service: 'apollo',
        operation: 'Contact enrichment',
        cost: numContacts * randomCost(0.01, 0.05),
      },
      {
        service: 'hunter',
        operation: 'Email verification',
        cost: numContacts * randomCost(0.001, 0.005),
      },
      {
        service: 'supabase',
        operation: 'Database operations',
        cost: randomCost(0.0001, 0.001),
      },
    ]

    return costs
  }

  // Get demo source audiences
  getDemoSourceAudiences() {
    return demoSourceAudiences
  }
}

// Singleton instance
let demoModeService: DemoModeService | null = null

export function getDemoModeService(): DemoModeService {
  if (!demoModeService) {
    demoModeService = new DemoModeService()
  }
  return demoModeService
}

export function setDemoModeEnabled(enabled: boolean) {
  demoModeService = new DemoModeService(enabled)
}
