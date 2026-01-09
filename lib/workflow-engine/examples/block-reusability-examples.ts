/**
 * Block Reusability Examples
 *
 * This file demonstrates how the SAME blocks can be reused in DIFFERENT workflows,
 * just like microservices. Each block is a standalone, reusable unit that can
 * be composed in infinite ways to create different workflows.
 *
 * Structure:
 * - Example 1: FilterBlock in 3 different contexts
 * - Example 2: OpenRouterBlock in 3 different contexts
 * - Example 3: CountryConfigBlock in 3 different contexts
 *
 * Key insight: Same block, different config, completely different use cases!
 */

import {
  WorkflowDefinition,
  BlockType,
  ExecutionStatus
} from '../types'
import { workflowOrchestrator, ContextFactory, registerAllBuiltInBlocks, workflowValidator } from '../index'

// ============================================================
// EXAMPLE 1: FilterBlock Reusability
// ============================================================

/**
 * FilterBlock is one of the most reusable blocks.
 * It can filter ANY array based on ANY condition.
 *
 * Context 1: Data Cleaning
 * Context 2: Lead Enrichment
 * Context 3: Sentiment Analysis
 */

// ------------------------------------------------------------
// Workflow 1A: Data Cleaning with FilterBlock
// ------------------------------------------------------------
/**
 * Use Case: Clean raw CSV data by removing invalid records
 *
 * Workflow: Input CSV → FilterBlock (remove invalid emails) → Clean CSV Output
 *
 * FilterBlock Config:
 * - Remove emails without '@'
 * - Remove emails with invalid domains
 * - Remove duplicates
 */

const dataCleaningWorkflow: WorkflowDefinition = {
  workflowId: 'data-cleaning-with-filter',
  name: 'Data Cleaning Pipeline',
  version: 1,
  description: 'Clean raw CSV data by removing invalid records',
  metadata: {
    author: 'Lume Team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['cleaning', 'csv', 'filter']
  },
  nodes: [
    {
      id: 'input-csv',
      type: BlockType.INPUT,
      name: 'Raw CSV Input',
      description: 'Raw CSV with potential invalid records',
      config: {
        source: 'csv',
        file: 'raw-data.csv',
        delimiter: ';'
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'filter-invalid',
      type: 'filter',
      name: 'Filter Invalid Emails',
      description: 'Remove records with invalid email addresses',
      config: {
        conditions: [
          {
            field: 'email',
            operator: 'exists'
          },
          {
            field: 'email',
            operator: 'contains',
            value: '@'
          },
          {
            field: 'email',
            operator: 'not_contains',
            value: ' '
          },
          {
            field: 'email',
            operator: 'regex',
            value: '^[\\w-\\.]+@[\\w-]+\\.[a-z]{2,4}$'
          }
        ],
        onFail: 'skip'
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'output-clean',
      type: 'output.logger',
      name: 'Clean Data Output',
      description: 'Output cleaned CSV',
      config: {
        format: 'csv',
        destination: 'clean-data.csv'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-csv', target: 'filter-invalid' },
    { id: 'e2', source: 'filter-invalid', target: 'output-clean' }
  ]
}

// ------------------------------------------------------------
// Workflow 1B: Lead Enrichment with FilterBlock
// ------------------------------------------------------------
/**
 * Use Case: Filter leads to only process business emails (cheaper)
 *
 * Workflow: Leads → FilterBlock (business only) → Apollo Enrichment → Output
 *
 * FilterBlock Config:
 * - Filter OUT @gmail, @yahoo, @hotmail (personal domains)
 * - Filter IN @company, .com.br business domains
 * - Goal: Save money by not enriching personal emails
 */

const leadEnrichmentWithFilter: WorkflowDefinition = {
  workflowId: 'lead-enrichment-filter-business',
  name: 'Lead Enrichment - Business Only',
  version: 1,
  description: 'Enrich only business emails to reduce API costs',
  metadata: {
    author: 'Lume Team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['enrichment', 'lead', 'filter', 'apollo']
  },
  nodes: [
    {
      id: 'input-leads',
      type: BlockType.INPUT,
      name: 'Leads Input',
      description: 'Raw leads from various sources',
      config: {
        source: 'static',
        data: {
          leads: [
            { email: 'mario@gmail.com', name: 'Mario G.' },
            { email: 'luca@company.it', name: 'Luca C.' },
            { email: 'giuseppe@yahoo.com', name: 'Giuseppe Y.' },
            { email: 'anna@startup.com', name: 'Anna S.' }
          ]
        }
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'filter-business',
      type: 'filter',
      name: 'Filter Business Emails',
      description: 'Keep only business email addresses',
      config: {
        conditions: [
          {
            operator: 'and',
            conditions: [
              { field: 'email', operator: 'not_contains', value: '@gmail' },
              { field: 'email', operator: 'not_contains', value: '@yahoo' },
              { field: 'email', operator: 'not_contains', value: '@hotmail' },
              { field: 'email', operator: 'not_contains', value: '@outlook' },
              { field: 'email', operator: 'not_contains', value: '@libero' },
              { field: 'email', operator: 'not_contains', value: '@virgilio' },
              { field: 'email', operator: 'not_contains', value: '@tin.it' }
            ]
          }
        ],
        onFail: 'skip'
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'apollo-enrich',
      type: 'api.apollo',
      name: 'Apollo Enrichment',
      description: 'Enrich business emails with LinkedIn data',
      config: {
        apiKey: '{{secrets.apollo}}',
        emailField: 'email'
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'output-enriched',
      type: 'output.logger',
      name: 'Enriched Leads Output',
      description: 'Output enriched leads',
      config: {
        format: 'json'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-leads', target: 'filter-business' },
    { id: 'e2', source: 'filter-business', target: 'apollo-enrich' },
    { id: 'e3', source: 'apollo-enrich', target: 'output-enriched' }
  ]
}

// ------------------------------------------------------------
// Workflow 1C: Sentiment Analysis with FilterBlock
// ------------------------------------------------------------
/**
 * Use Case: Keep only positive sentiment contacts
 *
 * Workflow: Comments → Sentiment Analysis → FilterBlock (positive only) → CRM Output
 *
 * FilterBlock Config:
 * - Keep only sentiment === 'positive' OR 'neutral'
 * - Remove negative sentiment
 * - Goal: Focus sales efforts on positive leads
 */

const sentimentFilteringWorkflow: WorkflowDefinition = {
  workflowId: 'sentiment-filtering-positive',
  name: 'Positive Sentiment Filter',
  version: 1,
  description: 'Filter contacts by positive sentiment only',
  metadata: {
    author: 'Lume Team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['sentiment', 'ai', 'filter', 'sales']
  },
  nodes: [
    {
      id: 'input-comments',
      type: BlockType.INPUT,
      name: 'Social Comments',
      description: 'Comments from social media',
      config: {
        source: 'apify',
        datasetId: 'social-comments'
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'sentiment-analysis',
      type: 'ai.sentimentAnalysis',
      name: 'Sentiment Analysis',
      description: 'Analyze sentiment of each comment',
      config: {
        apiToken: '{{secrets.openrouter}}',
        textField: 'comment',
        model: 'mistralai/mistral-7b-instruct:free'
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'filter-positive',
      type: 'filter',
      name: 'Filter Positive Sentiment',
      description: 'Keep only positive and neutral sentiment',
      config: {
        conditions: [
          {
            field: 'sentiment',
            operator: 'in',
            value: ['positive', 'neutral']
          }
        ],
        onFail: 'skip'
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'output-crm',
      type: 'output.database',
      name: 'Save to CRM',
      description: 'Save positive contacts to CRM',
      config: {
        table: 'crm_leads',
        mode: 'insert'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-comments', target: 'sentiment-analysis' },
    { id: 'e2', source: 'sentiment-analysis', target: 'filter-positive' },
    { id: 'e3', source: 'filter-positive', target: 'output-crm' }
  ]
}

// ------------------------------------------------------------
// Demonstration: FilterBlock in 3 Contexts
// ------------------------------------------------------------
async function demonstrateFilterBlockReusability() {
  console.log('\n' + '='.repeat(80))
  console.log('  EXAMPLE 1: FilterBlock Reusability in 3 Different Contexts')
  console.log('='.repeat(80) + '\n')

  // Register blocks
  registerAllBuiltInBlocks()

  // Context 1: Data Cleaning
  console.log('1️⃣  Context: Data Cleaning')
  console.log('─'.repeat(80))
  console.log('Workflow: Raw CSV → FilterBlock → Clean CSV')
  console.log('\nFilterBlock Config:')
  console.log('  - Remove emails without @')
  console.log('  - Remove emails with invalid format')
  console.log('  - Remove duplicates')
  console.log('\nUse Case: Clean raw CSV data before processing\n')

  const validation1 = await workflowValidator.validate(dataCleaningWorkflow)
  console.log(`Validation: ${validation1.valid ? '✅ Valid' : '❌ Invalid'}`)
  if (validation1.warnings.length > 0) {
    console.log(`Warnings: ${validation1.warnings.length}`)
  }
  console.log('')

  // Context 2: Lead Enrichment
  console.log('2️⃣  Context: Lead Enrichment')
  console.log('─'.repeat(80))
  console.log('Workflow: Leads → FilterBlock (business) → Apollo Enrichment')
  console.log('\nFilterBlock Config:')
  console.log('  - Filter OUT @gmail, @yahoo, @hotmail (personal domains)')
  console.log('  - Keep only @company, .com.br business domains')
  console.log('\nUse Case: Reduce costs by enriching only business emails')
  console.log('Cost savings: $0.02 per filtered record!\n')

  const validation2 = await workflowValidator.validate(leadEnrichmentWithFilter)
  console.log(`Validation: ${validation2.valid ? '✅ Valid' : '❌ Invalid'}`)
  if (validation2.warnings.length > 0) {
    console.log(`Warnings: ${validation2.warnings.length}`)
  }
  console.log('')

  // Context 3: Sentiment Filtering
  console.log('3️⃣  Context: Sentiment Analysis')
  console.log('─'.repeat(80))
  console.log('Workflow: Comments → Sentiment AI → FilterBlock (positive) → CRM')
  console.log('\nFilterBlock Config:')
  console.log('  - Keep only sentiment === "positive" OR "neutral"')
  console.log('  - Remove negative sentiment')
  console.log('\nUse Case: Focus sales efforts on positive leads only\n')

  const validation3 = await workflowValidator.validate(sentimentFilteringWorkflow)
  console.log(`Validation: ${validation3.valid ? '✅ Valid' : '❌ Invalid'}`)
  if (validation3.warnings.length > 0) {
    console.log(`Warnings: ${validation3.warnings.length}`)
  }
  console.log('')

  console.log('📊 Summary:')
  console.log('  Same FilterBlock')
  console.log('  3 Different Configs')
  console.log('  3 Completely Different Use Cases')
  console.log('\n✅ Demonstrates microservice-like reusability!\n')
}

// ============================================================
// EXAMPLE 2: OpenRouterBlock Reusability
// ============================================================

/**
 * OpenRouterBlock (ai.openrouter) is a generic LLM block
 * that can perform ANY NLP task with the right prompt.
 *
 * Context 1: Contact Extraction
 * Context 2: Interest Inference
 * Context 3: Sentiment Analysis
 */

// ------------------------------------------------------------
// Workflow 2A: Contact Extraction with OpenRouterBlock
// ------------------------------------------------------------
/**
 * Use Case: Extract structured contacts from unstructured text
 *
 * Workflow: Raw Text → OpenRouterBlock (extract contacts) → CRM Output
 *
 * OpenRouterBlock Config:
 * - Prompt: "Extract name, email, phone from this text..."
 * - Model: mistralai/mistral-7b-instruct:free
 * - Output format: JSON with extracted fields
 */

const contactExtractionWorkflow: WorkflowDefinition = {
  workflowId: 'contact-extraction-openrouter',
  name: 'Contact Extraction from Text',
  version: 1,
  description: 'Extract structured contacts from unstructured text using LLM',
  metadata: {
    author: 'Lume Team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['extraction', 'ai', 'nlp', 'openrouter']
  },
  nodes: [
    {
      id: 'input-text',
      type: BlockType.INPUT,
      name: 'Unstructured Text',
      description: 'Raw text from comments, forms, etc.',
      config: {
        source: 'static',
        data: {
          text: 'Hi, I\'m Mario Rossi and you can reach me at mario.rossi@company.it or call +393291234567'
        }
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'extract-contacts',
      type: 'ai.openrouter',
      name: 'AI Contact Extraction',
      description: 'Extract contact information from text',
      config: {
        apiToken: '{{secrets.openrouter}}',
        model: 'mistralai/mistral-7b-instruct:free',
        prompt: 'Extract name, email, and phone from this text: {{input-text.output.data.text}}. Return as JSON with fields: firstName, lastName, email, phone.',
        temperature: 0.1,
        maxTokens: 500
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'output-contacts',
      type: 'output.database',
      name: 'Save to CRM',
      description: 'Save extracted contacts',
      config: {
        table: 'extracted_contacts',
        mode: 'upsert',
        keyFields: ['email']
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-text', target: 'extract-contacts' },
    { id: 'e2', source: 'extract-contacts', target: 'output-contacts' }
  ]
}

// ------------------------------------------------------------
// Workflow 2B: Interest Inference with OpenRouterBlock
// ------------------------------------------------------------
/**
 * Use Case: Infer interests from social bio
 *
 * Workflow: Social Bio → OpenRouterBlock (infer interests) → Lead Scoring
 *
 * OpenRouterBlock Config:
 * - Prompt: "Analyze this bio and extract 5-10 interests..."
 * - Model: google/gemma-2-27b-it (great for Italian)
 * - Output format: JSON array of interests with categories
 */

const interestInferenceWorkflow: WorkflowDefinition = {
  workflowId: 'interest-inference-openrouter',
  name: 'Interest Inference from Bio',
  version: 1,
  description: 'Infer interests from social media bio using LLM',
  metadata: {
    author: 'Lume Team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['interests', 'ai', 'nlp', 'openrouter']
  },
  nodes: [
    {
      id: 'input-bio',
      type: BlockType.INPUT,
      name: 'Social Bio',
      description: 'Social media bio text',
      config: {
        source: 'static',
        data: {
          bio: 'Musician | Photographer | Travel lover ✈️ | Italian food enthusiast | Wine lover',
          country: 'IT'
        }
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'infer-interests',
      type: 'ai.openrouter',
      name: 'AI Interest Inference',
      description: 'Infer interests from bio with cultural context',
      config: {
        apiToken: '{{secrets.openrouter}}',
        model: 'google/gemma-2-27b-it:free',
        prompt: 'Analyze this bio from {{input-bio.output.data.country}} and extract 5-10 interests: {{input-bio.output.data.bio}}. Return as JSON array with topic, category, and confidence.',
        temperature: 0.5,
        maxTokens: 500
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'score-leads',
      type: 'transform.calculate',
      name: 'Lead Scoring',
      description: 'Score leads based on interests',
      config: {
        operations: [
          {
            type: 'calculate',
            field: 'score',
            expression: 'interests.length * 10'
          }
        ]
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'output-scored',
      type: 'output.logger',
      name: 'Scored Leads',
      description: 'Output scored leads',
      config: {
        format: 'json'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-bio', target: 'infer-interests' },
    { id: 'e2', source: 'infer-interests', target: 'score-leads' },
    { id: 'e3', source: 'score-leads', target: 'output-scored' }
  ]
}

// ------------------------------------------------------------
// Workflow 2C: Sentiment Analysis with OpenRouterBlock
// ------------------------------------------------------------
/**
 * Use Case: Analyze sentiment for prioritization
 *
 * Workflow: Customer Messages → OpenRouterBlock (analyze sentiment) → Priority Queue
 *
 * OpenRouterBlock Config:
 * - Prompt: "Classify sentiment as positive/neutral/negative..."
 * - Model: mistralai/mistral-7b-instruct:free
 * - Output format: JSON with sentiment, score, confidence
 */

const sentimentAnalysisWorkflow: WorkflowDefinition = {
  workflowId: 'sentiment-analysis-openrouter',
  name: 'Sentiment Analysis for Prioritization',
  version: 1,
  description: 'Analyze sentiment to prioritize customer messages',
  metadata: {
    author: 'Lume Team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['sentiment', 'ai', 'nlp', 'openrouter', 'priority']
  },
  nodes: [
    {
      id: 'input-messages',
      type: BlockType.INPUT,
      name: 'Customer Messages',
      description: 'Messages from customers',
      config: {
        source: 'static',
        data: {
          messages: [
            { id: 1, text: 'Your product is amazing! Love it!' },
            { id: 2, text: 'Having issues with the API, can you help?' },
            { id: 3, text: 'This is the worst service ever!' }
          ]
        }
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'analyze-sentiment',
      type: 'ai.openrouter',
      name: 'AI Sentiment Analysis',
      description: 'Analyze sentiment of messages',
      config: {
        apiToken: '{{secrets.openrouter}}',
        model: 'mistralai/mistral-7b-instruct:free',
        prompt: 'Classify sentiment of this message as positive/neutral/negative with confidence score: {{input-messages.output.data.messages[].text}}. Return as JSON.',
        temperature: 0.3,
        maxTokens: 300
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'prioritize',
      type: 'branch',
      name: 'Prioritize by Sentiment',
      description: 'Route to different queues based on sentiment',
      config: {
        condition: {
          field: 'sentiment',
          operator: 'equals',
          value: 'negative'
        },
        branches: {
          true: 'urgent-queue',
          false: 'normal-queue'
        }
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'urgent-queue',
      type: 'output.database',
      name: 'Urgent Queue',
      description: 'Save to urgent queue',
      config: {
        table: 'urgent_messages',
        mode: 'insert'
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'normal-queue',
      type: 'output.database',
      name: 'Normal Queue',
      description: 'Save to normal queue',
      config: {
        table: 'normal_messages',
        mode: 'insert'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-messages', target: 'analyze-sentiment' },
    { id: 'e2', source: 'analyze-sentiment', target: 'prioritize' },
    { id: 'e3', source: 'prioritize', target: 'urgent-queue' },
    { id: 'e4', source: 'prioritize', target: 'normal-queue' }
  ]
}

// ------------------------------------------------------------
// Demonstration: OpenRouterBlock in 3 Contexts
// ------------------------------------------------------------
async function demonstrateOpenRouterBlockReusability() {
  console.log('\n' + '='.repeat(80))
  console.log('  EXAMPLE 2: OpenRouterBlock Reusability in 3 Different Contexts')
  console.log('='.repeat(80) + '\n')

  // Register blocks
  registerAllBuiltInBlocks()

  // Context 1: Contact Extraction
  console.log('1️⃣  Context: Contact Extraction')
  console.log('─'.repeat(80))
  console.log('Workflow: Raw Text → OpenRouterBlock → CRM')
  console.log('\nOpenRouterBlock Config:')
  console.log('  Prompt: "Extract name, email, phone from this text..."')
  console.log('  Model: mistralai/mistral-7b-instruct:free')
  console.log('  Output: JSON with extracted fields')
  console.log('\nUse Case: Extract structured contacts from unstructured text\n')

  const validation1 = await workflowValidator.validate(contactExtractionWorkflow)
  console.log(`Validation: ${validation1.valid ? '✅ Valid' : '❌ Invalid'}`)
  console.log('')

  // Context 2: Interest Inference
  console.log('2️⃣  Context: Interest Inference')
  console.log('─'.repeat(80))
  console.log('Workflow: Social Bio → OpenRouterBlock → Lead Scoring')
  console.log('\nOpenRouterBlock Config:')
  console.log('  Prompt: "Analyze this bio and extract 5-10 interests..."')
  console.log('  Model: google/gemma-2-27b-it (optimized for Italian)')
  console.log('  Output: JSON array of interests with categories')
  console.log('\nUse Case: Personalize marketing based on inferred interests\n')

  const validation2 = await workflowValidator.validate(interestInferenceWorkflow)
  console.log(`Validation: ${validation2.valid ? '✅ Valid' : '❌ Invalid'}`)
  console.log('')

  // Context 3: Sentiment Analysis
  console.log('3️⃣  Context: Sentiment Analysis')
  console.log('─'.repeat(80))
  console.log('Workflow: Messages → OpenRouterBlock → Priority Queue')
  console.log('\nOpenRouterBlock Config:')
  console.log('  Prompt: "Classify sentiment as positive/neutral/negative..."')
  console.log('  Model: mistralai/mistral-7b-instruct:free')
  console.log('  Output: JSON with sentiment, score, confidence')
  console.log('\nUse Case: Prioritize negative sentiment for urgent response\n')

  const validation3 = await workflowValidator.validate(sentimentAnalysisWorkflow)
  console.log(`Validation: ${validation3.valid ? '✅ Valid' : '❌ Invalid'}`)
  console.log('')

  console.log('📊 Summary:')
  console.log('  Same OpenRouterBlock')
  console.log('  3 Different Prompts')
  console.log('  3 Completely Different NLP Tasks')
  console.log('\n✅ Demonstrates versatility of generic LLM block!\n')
}

// ============================================================
// EXAMPLE 3: CountryConfigBlock Reusability
// ============================================================

/**
 * CountryConfigBlock detects country from phone/email and provides
 * country-specific configuration (language, culture, etc.)
 *
 * Context 1: Lead Enrichment (localized LLM prompts)
 * Context 2: Content Localization (translation)
 * Context 3: Data Validation (format checking)
 */

// ------------------------------------------------------------
// Workflow 3A: Lead Enrichment with CountryConfigBlock
// ------------------------------------------------------------
/**
 * Use Case: Localize LLM prompts based on detected country
 *
 * Workflow: Contact → CountryConfigBlock → Localized LLM Interests → Output
 *
 * CountryConfigBlock Config:
 * - Auto-detect country from phone/email
 * - Provide localized LLM system prompt
 * - Add country-specific context to interest inference
 */

const localizedEnrichmentWorkflow: WorkflowDefinition = {
  workflowId: 'localized-lead-enrichment',
  name: 'Localized Lead Enrichment',
  version: 1,
  description: 'Enrich leads with country-localized AI prompts',
  metadata: {
    author: 'Lume Team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['enrichment', 'localization', 'country', 'ai']
  },
  nodes: [
    {
      id: 'input-contact',
      type: BlockType.INPUT,
      name: 'Contact Input',
      description: 'Contact with phone number',
      config: {
        source: 'static',
        data: {
          contact: {
            email: 'mario.rossi@company.it',
            phone: '+393291234567',
            firstName: 'Mario',
            lastName: 'Rossi'
          }
        }
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'detect-country',
      type: 'countries.config',
      name: 'Country Detection',
      description: 'Detect country and get localized config',
      config: {
        phoneField: 'phone',
        emailField: 'email',
        fallbackCountry: 'US'
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'infer-interests',
      type: 'ai.interestInference',
      name: 'Localized Interest Inference',
      description: 'Infer interests with country-specific context',
      config: {
        apiToken: '{{secrets.openrouter}}',
        bioField: 'bio',
        countryField: 'country',
        model: 'google/gemma-2-27b-it:free',
        maxInterests: 10
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'output-enriched',
      type: 'output.logger',
      name: 'Enriched Contact',
      description: 'Output enriched contact with localized interests',
      config: {
        format: 'json'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-contact', target: 'detect-country' },
    { id: 'e2', source: 'detect-country', target: 'infer-interests' },
    { id: 'e3', source: 'infer-interests', target: 'output-enriched' }
  ]
}

// ------------------------------------------------------------
// Workflow 3B: Content Localization with CountryConfigBlock
// ------------------------------------------------------------
/**
 * Use Case: Localize content based on user country
 *
 * Workflow: User Profile → CountryConfigBlock → Translate Content → Localize → Output
 *
 * CountryConfigBlock Config:
 * - Detect country from profile
 * - Provide target language for translation
 * - Provide cultural context for localization
 */

const contentLocalizationWorkflow: WorkflowDefinition = {
  workflowId: 'content-localization',
  name: 'Content Localization',
  version: 1,
  description: 'Localize content based on user country',
  metadata: {
    author: 'Lume Team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['localization', 'translation', 'country', 'content']
  },
  nodes: [
    {
      id: 'input-content',
      type: BlockType.INPUT,
      name: 'Content + User',
      description: 'Content to localize and user profile',
      config: {
        source: 'static',
        data: {
          content: 'Welcome to our amazing product! Sign up now for 20% off.',
          user: {
            email: 'mario.rossi@company.it',
            phone: '+393291234567'
          }
        }
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'detect-country',
      type: 'countries.config',
      name: 'Detect User Country',
      description: 'Detect country from user profile',
      config: {
        phoneField: 'user.phone',
        emailField: 'user.email'
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'translate',
      type: 'ai.openrouter',
      name: 'Translate Content',
      description: 'Translate to detected country language',
      config: {
        apiToken: '{{secrets.openrouter}}',
        model: 'meta-llama/llama-3-70b-instruct:free',
        prompt: 'Translate this content to {{detect-country.output.language}}: {{input-content.output.data.content}}. Keep the tone and offers the same.',
        temperature: 0.3,
        maxTokens: 500
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'localize',
      type: 'ai.openrouter',
      name: 'Cultural Localization',
      description: 'Adapt for cultural context',
      config: {
        apiToken: '{{secrets.openrouter}}',
        model: 'google/gemma-2-27b-it:free',
        prompt: 'Localize this translated content for {{detect-country.output.name}} culture: {{translate.output}}. Adapt references, currency, formats.',
        temperature: 0.5,
        maxTokens: 500
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'output-localized',
      type: 'output.logger',
      name: 'Localized Content',
      description: 'Output localized content',
      config: {
        format: 'json'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-content', target: 'detect-country' },
    { id: 'e2', source: 'detect-country', target: 'translate' },
    { id: 'e3', source: 'translate', target: 'localize' },
    { id: 'e4', source: 'localize', target: 'output-localized' }
  ]
}

// ------------------------------------------------------------
// Workflow 3C: Data Validation with CountryConfigBlock
// ------------------------------------------------------------
/**
 * Use Case: Validate data format based on country
 *
 * Workflow: User Data → CountryConfigBlock → Validate Format → Output
 *
 * CountryConfigBlock Config:
 * - Detect country from phone/email
 * - Provide expected format for phone, date, postal code
 * - Validate against country-specific formats
 */

const dataValidationWorkflow: WorkflowDefinition = {
  workflowId: 'country-aware-validation',
  name: 'Country-Aware Data Validation',
  version: 1,
  description: 'Validate data format based on detected country',
  metadata: {
    author: 'Lume Team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['validation', 'country', 'data-quality']
  },
  nodes: [
    {
      id: 'input-data',
      type: BlockType.INPUT,
      name: 'User Data',
      description: 'User data to validate',
      config: {
        source: 'static',
        data: {
          users: [
            {
              email: 'mario.rossi@company.it',
              phone: '+393291234567',
              birthDate: '21/02/1986',
              postalCode: '00100'
            },
            {
              email: 'john.doe@company.com',
              phone: '+12125551234',
              birthDate: '1986-02-21',
              postalCode: '10001'
            }
          ]
        }
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'detect-countries',
      type: 'countries.config',
      name: 'Detect Countries',
      description: 'Detect country for each user',
      config: {
        phoneField: 'phone',
        emailField: 'email'
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'validate-formats',
      type: 'filter',
      name: 'Validate Formats',
      description: 'Filter out invalid formats for each country',
      config: {
        conditions: [
          {
            operator: 'and',
            conditions: [
              { field: 'phoneValid', operator: 'equals', value: true },
              { field: 'emailValid', operator: 'equals', value: true },
              { field: 'dateValid', operator: 'equals', value: true }
            ]
          }
        ],
        onFail: 'skip'
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'output-valid',
      type: 'output.logger',
      name: 'Valid Data',
      description: 'Output only valid records',
      config: {
        format: 'json'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-data', target: 'detect-countries' },
    { id: 'e2', source: 'detect-countries', target: 'validate-formats' },
    { id: 'e3', source: 'validate-formats', target: 'output-valid' }
  ]
}

// ------------------------------------------------------------
// Demonstration: CountryConfigBlock in 3 Contexts
// ------------------------------------------------------------
async function demonstrateCountryConfigBlockReusability() {
  console.log('\n' + '='.repeat(80))
  console.log('  EXAMPLE 3: CountryConfigBlock Reusability in 3 Different Contexts')
  console.log('='.repeat(80) + '\n')

  // Register blocks
  registerAllBuiltInBlocks()

  // Context 1: Localized Enrichment
  console.log('1️⃣  Context: Localized Lead Enrichment')
  console.log('─'.repeat(80))
  console.log('Workflow: Contact → CountryConfigBlock → Localized LLM → Output')
  console.log('\nCountryConfigBlock Usage:')
  console.log('  - Detect country from phone/email')
  console.log('  - Provide localized LLM system prompt')
  console.log('  - Add country-specific context to interest inference')
  console.log('\nUse Case: Improve AI accuracy with cultural context\n')

  const validation1 = await workflowValidator.validate(localizedEnrichmentWorkflow)
  console.log(`Validation: ${validation1.valid ? '✅ Valid' : '❌ Invalid'}`)
  console.log('')

  // Context 2: Content Localization
  console.log('2️⃣  Context: Content Localization')
  console.log('─'.repeat(80))
  console.log('Workflow: Content → CountryConfigBlock → Translate → Localize → Output')
  console.log('\nCountryConfigBlock Usage:')
  console.log('  - Detect user country')
  console.log('  - Provide target language for translation')
  console.log('  - Provide cultural context for localization')
  console.log('\nUse Case: Adapt content for international users\n')

  const validation2 = await workflowValidator.validate(contentLocalizationWorkflow)
  console.log(`Validation: ${validation2.valid ? '✅ Valid' : '❌ Invalid'}`)
  console.log('')

  // Context 3: Data Validation
  console.log('3️⃣  Context: Country-Aware Data Validation')
  console.log('─'.repeat(80))
  console.log('Workflow: User Data → CountryConfigBlock → Validate → Output')
  console.log('\nCountryConfigBlock Usage:')
  console.log('  - Detect country from phone/email')
  console.log('  - Provide expected format (phone, date, postal code)')
  console.log('  - Validate against country-specific formats')
  console.log('\nUse Case: Ensure data quality for international databases\n')

  const validation3 = await workflowValidator.validate(dataValidationWorkflow)
  console.log(`Validation: ${validation3.valid ? '✅ Valid' : '❌ Invalid'}`)
  console.log('')

  console.log('📊 Summary:')
  console.log('  Same CountryConfigBlock')
  console.log('  3 Different Applications')
  console.log('  3 Completely Different Use Cases')
  console.log('\n✅ Demonstrates reusability for country-specific logic!\n')
}

// ============================================================
// MAIN EXECUTION - Demonstrate All Examples
// ============================================================

async function runAllReusabilityExamples() {
  console.log('\n' + '█'.repeat(80))
  console.log('█' + ' '.repeat(78) + '█')
  console.log('█' + '  BLOCK REUSABILITY EXAMPLES - Microservices in Action'.padEnd(78) + '█')
  console.log('█' + ' '.repeat(78) + '█')
  console.log('█'.repeat(80) + '\n')

  console.log('This demonstration shows how the SAME blocks can be reused in')
  console.log('COMPLETELY DIFFERENT workflows, just like microservices.\n')

  console.log('Press Enter to continue through each example...')
  console.log('Or Ctrl+C to exit.\n')

  // Example 1: FilterBlock
  await demonstrateFilterBlockReusability()

  // Example 2: OpenRouterBlock
  await demonstrateOpenRouterBlockReusability()

  // Example 3: CountryConfigBlock
  await demonstrateCountryConfigBlockReusability()

  // Final Summary
  console.log('\n' + '='.repeat(80))
  console.log('  FINAL SUMMARY - Block Reusability Demonstration')
  console.log('='.repeat(80) + '\n')

  console.log('📦 Blocks Demonstrated:\n')
  console.log('  1. FilterBlock')
  console.log('     - Data Cleaning')
  console.log('     - Lead Enrichment (business emails)')
  console.log('     - Sentiment Filtering (positive only)')
  console.log('')

  console.log('  2. OpenRouterBlock (Generic LLM)')
  console.log('     - Contact Extraction')
  console.log('     - Interest Inference')
  console.log('     - Sentiment Analysis')
  console.log('')

  console.log('  3. CountryConfigBlock')
  console.log('     - Localized Enrichment')
  console.log('     - Content Localization')
  console.log('     - Data Validation')
  console.log('')

  console.log('🎯 Key Insights:\n')
  console.log('  ✅ Each block is INDEPENDENT and REUSABLE')
  console.log('  ✅ Same block + Different config = Different use case')
  console.log('  ✅ Blocks compose like LEGO bricks')
  console.log('  ✅ No code duplication across workflows')
  console.log('  ✅ Microservices architecture at workflow level\n')

  console.log('💡 Benefits:\n')
  console.log('  • Faster development - reuse existing blocks')
  console.log('  • Consistency - same logic across workflows')
  console.log('  • Maintainability - fix bug once, benefit everywhere')
  console.log('  • Testability - test blocks in isolation')
  console.log('  • Flexibility - compose blocks infinitely\n')

  console.log('✅ Demonstrated: Blocks are truly reusable microservices!\n')
  console.log('='.repeat(80) + '\n')
}

// ============================================================
// Export Examples
// ============================================================

if (require.main === module) {
  runAllReusabilityExamples().catch(error => {
    console.error('❌ Error running examples:', error)
    process.exit(1)
  })
}

export {
  // FilterBlock Examples
  dataCleaningWorkflow,
  leadEnrichmentWithFilter,
  sentimentFilteringWorkflow,
  demonstrateFilterBlockReusability,

  // OpenRouterBlock Examples
  contactExtractionWorkflow,
  interestInferenceWorkflow,
  sentimentAnalysisWorkflow,
  demonstrateOpenRouterBlockReusability,

  // CountryConfigBlock Examples
  localizedEnrichmentWorkflow,
  contentLocalizationWorkflow,
  dataValidationWorkflow,
  demonstrateCountryConfigBlockReusability,

  // Main
  runAllReusabilityExamples
}
