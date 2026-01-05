/**
 * API Test Definitions
 * Defines test scenarios for each API service with predefined payloads and expected outcomes
 */

export interface ApiTestScenario {
  id: string
  name: string
  description: string
  endpoint: string
  method: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: any
  expectedOutcome: {
    success: boolean
    statusCodes?: number[]
    contains?: string[]
    notContains?: string[]
  }
}

export interface ApiServiceTests {
  [serviceKey: string]: ApiTestScenario[]
}

/**
 * Test scenarios for each API service
 */
export const apiTestDefinitions: ApiServiceTests = {
  meta: [
    {
      id: 'get-page-info',
      name: 'Get Page Info',
      description: 'Retrieve basic information about a Facebook page',
      endpoint: 'https://graph.facebook.com/v18.0/20531316728',
      method: 'GET',
      expectedOutcome: {
        success: true,
        statusCodes: [200],
        contains: ['id', 'name'],
      },
    },
  ],

  openrouter: [
    {
      id: 'chat-completion',
      name: 'Chat Completion',
      description: 'Test AI chat completion with a simple prompt',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          {
            role: 'user',
            content: 'Say "API test successful" in exactly those words.',
          },
        ],
        max_tokens: 50,
      },
      expectedOutcome: {
        success: true,
        statusCodes: [200],
        contains: ['API test successful'],
      },
    },
    {
      id: 'list-models',
      name: 'List Available Models',
      description: 'Retrieve list of available AI models',
      endpoint: 'https://openrouter.ai/api/v1/models',
      method: 'GET',
      expectedOutcome: {
        success: true,
        statusCodes: [200],
        contains: ['data'],
      },
    },
  ],

  mixedbread: [
    {
      id: 'create-embedding',
      name: 'Create Embedding',
      description: 'Generate text embedding for a sample phrase',
      endpoint: 'https://api.mixedbread.ai/v1/embeddings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        model: 'mixedbread-ai/mxbai-embed-large-v1',
        input: 'API test phrase for embedding generation',
      },
      expectedOutcome: {
        success: true,
        statusCodes: [200],
        contains: ['data', 'embedding'],
      },
    },
  ],

  apollo: [
    {
      id: 'search-contacts',
      name: 'Search Contacts',
      description: 'Search for contacts with a simple query',
      endpoint: 'https://api.apollo.io/v1/mixed_people/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        q_keywords: 'test',
        page: 1,
        per_page: 1,
      },
      expectedOutcome: {
        success: true,
        statusCodes: [200],
        contains: ['people'],
      },
    },
  ],

  hunter: [
    {
      id: 'email-finder',
      name: 'Email Finder',
      description: 'Find email address for a domain',
      endpoint: 'https://api.hunter.io/v2/email-finder',
      method: 'GET',
      expectedOutcome: {
        success: true,
        statusCodes: [200],
        contains: ['data', 'email'],
      },
    },
    {
      id: 'email-verifier',
      name: 'Email Verifier',
      description: 'Verify if an email address is valid',
      endpoint: 'https://api.hunter.io/v2/email-verifier',
      method: 'GET',
      expectedOutcome: {
        success: true,
        statusCodes: [200],
        contains: ['data', 'status'],
      },
    },
  ],
}

/**
 * Get test scenarios for a specific service
 */
export function getTestScenarios(serviceKey: string): ApiTestScenario[] {
  return apiTestDefinitions[serviceKey] || []
}

/**
 * Get a specific test scenario by service and scenario ID
 */
export function getTestScenario(serviceKey: string, scenarioId: string): ApiTestScenario | undefined {
  const scenarios = getTestScenarios(serviceKey)
  return scenarios.find((s) => s.id === scenarioId)
}
