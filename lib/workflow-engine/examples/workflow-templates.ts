/**
 * Workflow Templates - Ready-to-Use Workflows
 *
 * This file contains 5 production-ready workflow templates that you can
 * copy, customize, and use immediately. Each template is fully documented
 * and demonstrates a common use case.
 *
 * Templates:
 * 1. Simple Data Pipeline - Basic ETL
 * 2. Lead Enrichment Pipeline - Complete lead scoring
 * 3. AI Content Processing - Social media analysis
 * 4. Batch Data Processing - Large dataset enrichment
 * 5. Multi-Source Data Fusion - CRM integration
 *
 * Usage:
 * 1. Copy the template you need
 * 2. Customize config for your data
 * 3. Add your API keys to secrets
 * 4. Execute!
 */

import {
  WorkflowDefinition,
  BlockType
} from '../types'

// ============================================================
// TEMPLATE 1: Simple Data Pipeline
// ============================================================

/**
 * Template: Simple Data Pipeline
 *
 * Use Case: Basic ETL (Extract, Transform, Load)
 *
 * Workflow:
 *   Input → Transform (field mapping) → Output
 *
 * Common uses:
 * - CSV field renaming
 * - Data format conversion
 * - Simple field calculations
 * - Data standardization
 *
 * Cost: $0 (no external APIs)
 * Complexity: Beginner
 *
 * How to customize:
 * 1. Change input source in input.data.source config
 * 2. Add/modify field mappings in transform.operations
 * 3. Change output destination in output.config
 */

export const simpleDataPipelineTemplate: WorkflowDefinition = {
  $schema: 'http://lume.ai/schemas/workflow-v1.json#',
  workflowId: 'simple-data-pipeline',
  name: 'Simple Data Pipeline',
  version: 1,
  description: 'Basic ETL pipeline for field mapping and transformation',
  metadata: {
    author: 'Lume Templates',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['etl', 'transform', 'beginner']
  },
  globals: {
    timeout: 60,
    errorHandling: 'stop'
  },
  nodes: [
    // STEP 1: Input
    {
      id: 'input-data',
      type: BlockType.INPUT,
      name: 'Input Data',
      description: 'Read input data (CSV, JSON, database)',
      config: {
        // CUSTOMIZE: Change source type and location
        source: 'csv',  // Options: 'csv', 'json', 'database', 'static'
        file: 'input.csv',
        delimiter: ';'
      },
      inputSchema: null,
      outputSchema: {
        type: 'object',
        properties: {
          records: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nome: { type: 'string' },
                email: { type: 'string' },
                telefono: { type: 'string' }
              }
            }
          }
        }
      }
    },

    // STEP 2: Transform
    {
      id: 'transform-fields',
      type: BlockType.TRANSFORM,
      name: 'Field Mapping',
      description: 'Map, rename, and calculate fields',
      config: {
        // CUSTOMIZE: Add/modify operations as needed
        operations: [
          // Example 1: Rename fields
          {
            type: 'rename',
            field: 'nome',
            targetField: 'fullName'
          },
          {
            type: 'rename',
            field: 'email',
            targetField: 'emailAddress'
          },
          {
            type: 'rename',
            field: 'telefono',
            targetField: 'phone'
          },
          // Example 2: Add calculated field
          {
            type: 'calculate',
            field: 'processingDate',
            expression: 'new Date().toISOString()'
          },
          // Example 3: Format field
          {
            type: 'format',
            field: 'phone',
            format: 'international'  // Adds + prefix
          }
        ]
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 3: Output
    {
      id: 'output-data',
      type: BlockType.OUTPUT,
      name: 'Output Data',
      description: 'Save transformed data',
      config: {
        // CUSTOMIZE: Change output destination
        destination: 'csv',  // Options: 'csv', 'json', 'database', 'logger'
        file: 'output.csv',
        format: 'semicolon'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-data', target: 'transform-fields' },
    { id: 'e2', source: 'transform-fields', target: 'output-data' }
  ]
}

// ============================================================
// TEMPLATE 2: Lead Enrichment Pipeline
// ============================================================

/**
 * Template: Lead Enrichment Pipeline
 *
 * Use Case: Complete lead enrichment with country detection, filtering, and AI
 *
 * Workflow:
 *   Input → Country Detect → Filter (business) → Apollo → AI Interests → Output
 *
 * Common uses:
 * - Lead scoring
 * - CRM enrichment
 * - Sales qualification
 * - Marketing personalization
 *
 * Cost: ~$0.02-0.03 per lead
 * Complexity: Intermediate
 *
 * How to customize:
 * 1. Adjust filter conditions to match your business email criteria
 * 2. Change AI model for interest inference (default: Gemma 2 27B for Italian)
 * 3. Modify output fields to match your CRM schema
 */

export const leadEnrichmentPipelineTemplate: WorkflowDefinition = {
  $schema: 'http://lume.ai/schemas/workflow-v1.json#',
  workflowId: 'lead-enrichment-pipeline',
  name: 'Lead Enrichment Pipeline',
  version: 1,
  description: 'Complete lead enrichment with country detection, LinkedIn, and AI',
  metadata: {
    author: 'Lume Templates',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['enrichment', 'lead', 'ai', 'production']
  },
  globals: {
    timeout: 300,
    retryPolicy: {
      maxRetries: 2,
      backoffMultiplier: 2,
      initialDelay: 1000
    },
    errorHandling: 'continue'
  },
  nodes: [
    // STEP 1: Input Leads
    {
      id: 'input-leads',
      type: BlockType.INPUT,
      name: 'Leads Input',
      description: 'Input leads from CRM, CSV, or database',
      config: {
        source: 'static',  // CUSTOMIZE: Change to 'csv', 'database', etc.
        data: {
          leads: [
            {
              email: 'mario.rossi@company.it',
              phone: '+393291234567',
              firstName: 'Mario',
              lastName: 'Rossi'
            }
          ]
        }
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 2: Country Detection
    {
      id: 'detect-country',
      type: 'countries.config',
      name: 'Country Detection',
      description: 'Detect country from phone number',
      config: {
        phoneField: 'phone',
        emailField: 'email',
        fallbackCountry: 'IT'  // CUSTOMIZE: Change default country
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 3: Filter Business Emails
    {
      id: 'filter-business',
      type: 'filter',
      name: 'Filter Business Emails',
      description: 'Keep only business emails to save costs',
      config: {
        // CUSTOMIZE: Modify filter conditions as needed
        conditions: [
          {
            operator: 'and',
            conditions: [
              { field: 'email', operator: 'not_contains', value: '@gmail' },
              { field: 'email', operator: 'not_contains', value: '@yahoo' },
              { field: 'email', operator: 'not_contains', value: '@hotmail' },
              { field: 'email', operator: 'not_contains', value: '@outlook' }
              // Add more personal domains to filter out
            ]
          }
        ],
        onFail: 'skip'
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 4: Apollo LinkedIn Enrichment
    {
      id: 'apollo-enrich',
      type: 'api.apollo',
      name: 'Apollo LinkedIn',
      description: 'Enrich with LinkedIn data from Apollo',
      config: {
        apiKey: '{{secrets.apollo}}',
        emailField: 'email'
      },
      inputSchema: null,
      outputSchema: null,
      timeout: 15000,
      retryConfig: {
        maxRetries: 2,
        backoffMultiplier: 2,
        initialDelay: 1000
      }
    },

    // STEP 5: AI Interest Inference
    {
      id: 'ai-interests',
      type: 'ai.interestInference',
      name: 'AI Interest Inference',
      description: 'Infer interests from LinkedIn bio using AI',
      config: {
        apiToken: '{{secrets.openrouter}}',
        bioField: 'bio',
        countryField: 'country',
        // CUSTOMIZE: Change model based on language/needs
        model: 'google/gemma-2-27b-it:free',  // Great for Italian
        maxInterests: 10
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 6: Output Enriched Leads
    {
      id: 'output-enriched',
      type: BlockType.OUTPUT,
      name: 'Save Enriched Leads',
      description: 'Save enriched leads to CRM or database',
      config: {
        destination: 'database',  // CUSTOMIZE: Change to 'csv', 'logger', etc.
        table: 'enriched_leads',
        mode: 'upsert',
        keyFields: ['email']
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-leads', target: 'detect-country' },
    { id: 'e2', source: 'detect-country', target: 'filter-business' },
    { id: 'e3', source: 'filter-business', target: 'apollo-enrich' },
    { id: 'e4', source: 'apollo-enrich', target: 'ai-interests' },
    { id: 'e5', source: 'ai-interests', target: 'output-enriched' }
  ]
}

// ============================================================
// TEMPLATE 3: AI Content Processing
// ============================================================

/**
 * Template: AI Content Processing
 *
 * Use Case: Analyze social media content with AI
 *
 * Workflow:
 *   Input → Contact Extraction → Interest Inference → Sentiment Analysis → Branch → Output
 *
 * Common uses:
 * - Social media monitoring
 * - Comment analysis
 * - Customer feedback processing
 * - Brand sentiment tracking
 *
 * Cost: ~$0.0001-0.001 per comment (using free models)
 * Complexity: Advanced
 *
 * How to customize:
 * 1. Change input source (Apify datasets, CSV, etc.)
 * 2. Adjust AI models based on content language
 * 3. Modify branch conditions for your use case
 * 4. Customize output format for your needs
 */

export const aiContentProcessingTemplate: WorkflowDefinition = {
  $schema: 'http://lume.ai/schemas/workflow-v1.json#',
  workflowId: 'ai-content-processing',
  name: 'AI Content Processing',
  version: 1,
  description: 'AI-powered analysis of social media content',
  metadata: {
    author: 'Lume Templates',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['ai', 'social', 'sentiment', 'advanced']
  },
  globals: {
    timeout: 600,
    retryPolicy: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000
    },
    errorHandling: 'continue'
  },
  nodes: [
    // STEP 1: Input Social Content
    {
      id: 'input-content',
      type: BlockType.INPUT,
      name: 'Social Media Content',
      description: 'Comments, posts, or bios from social media',
      config: {
        source: 'apify',  // CUSTOMIZE: Change to 'csv', 'database', etc.
        datasetId: 'instagram-comments'
      },
      inputSchema: null,
      outputSchema: {
        type: 'object',
        properties: {
          comments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                username: { type: 'string' },
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    },

    // STEP 2: Contact Extraction
    {
      id: 'extract-contacts',
      type: 'ai.contactExtraction',
      name: 'AI Contact Extraction',
      description: 'Extract contacts from unstructured text',
      config: {
        apiToken: '{{secrets.openrouter}}',
        textField: 'text',
        model: 'mistralai/mistral-7b-instruct:free',
        minFields: 2
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 3: Interest Inference
    {
      id: 'infer-interests',
      type: 'ai.interestInference',
      name: 'AI Interest Inference',
      description: 'Infer interests from bio/posts',
      config: {
        apiToken: '{{secrets.openrouter}}',
        bioField: 'text',
        model: 'google/gemma-2-27b-it:free',
        maxInterests: 10
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 4: Sentiment Analysis
    {
      id: 'analyze-sentiment',
      type: 'ai.sentimentAnalysis',
      name: 'Sentiment Analysis',
      description: 'Analyze sentiment of content',
      config: {
        apiToken: '{{secrets.openrouter}}',
        textField: 'text',
        model: 'mistralai/mistral-7b-instruct:free',
        granularity: 'document'
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 5: Branch by Sentiment
    {
      id: 'branch-sentiment',
      type: 'branch',
      name: 'Branch by Sentiment',
      description: 'Route to different processing based on sentiment',
      config: {
        condition: {
          field: 'sentiment',
          operator: 'equals',
          value: 'positive'
        },
        branches: {
          true: 'process-positive',
          false: 'process-negative'
        }
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 6A: Process Positive
    {
      id: 'process-positive',
      type: 'transform.calculate',
      name: 'Process Positive',
      description: 'Add priority score for positive content',
      config: {
        operations: [
          {
            type: 'calculate',
            field: 'priority',
            expression: 'high'
          },
          {
            type: 'calculate',
            field: 'followUp',
            expression: 'true'
          }
        ]
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 6B: Process Negative
    {
      id: 'process-negative',
      type: 'transform.calculate',
      name: 'Process Negative',
      description: 'Add urgency flag for negative content',
      config: {
        operations: [
          {
            type: 'calculate',
            field: 'priority',
            expression: 'urgent'
          },
          {
            type: 'calculate',
            field: 'escalate',
            expression: 'true'
          }
        ]
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 7: Output Results
    {
      id: 'output-results',
      type: BlockType.OUTPUT,
      name: 'Save Analysis Results',
      description: 'Save processed content to database',
      config: {
        destination: 'database',
        table: 'analyzed_content',
        mode: 'upsert',
        keyFields: ['id']
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-content', target: 'extract-contacts' },
    { id: 'e2', source: 'extract-contacts', target: 'infer-interests' },
    { id: 'e3', source: 'infer-interests', target: 'analyze-sentiment' },
    { id: 'e4', source: 'analyze-sentiment', target: 'branch-sentiment' },
    { id: 'e5a', source: 'branch-sentiment', target: 'process-positive' },
    { id: 'e5b', source: 'branch-sentiment', target: 'process-negative' },
    { id: 'e6a', source: 'process-positive', target: 'output-results' },
    { id: 'e6b', source: 'process-negative', target: 'output-results' }
  ]
}

// ============================================================
// TEMPLATE 4: Batch Data Processing
// ============================================================

/**
 * Template: Batch Data Processing
 *
 * Use Case: Process large datasets with parallel enrichment
 *
 * Workflow:
 *   Input → Filter → Transform → [Parallel: Enrich1, Enrich2, Enrich3] → Merge → Output
 *
 * Common uses:
 * - Bulk lead enrichment
 * - Large dataset processing
 * - Multi-source enrichment
 * - Performance optimization
 *
 * Cost: Varies based on enrichment blocks used
 * Complexity: Advanced
 *
 * How to customize:
 * 1. Adjust batchSize for your data size
 * 2. Add/remove parallel enrichment blocks as needed
 * 3. Modify merge strategy (deepMerge, append, zip)
 * 4. Tune maxParallelNodes for performance
 */

export const batchDataProcessingTemplate: WorkflowDefinition = {
  $schema: 'http://lume.ai/schemas/workflow-v1.json#',
  workflowId: 'batch-data-processing',
  name: 'Batch Data Processing',
  version: 1,
  description: 'Process large datasets with parallel enrichment',
  metadata: {
    author: 'Lume Templates',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['batch', 'parallel', 'performance', 'advanced']
  },
  globals: {
    timeout: 3600,
    retryPolicy: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000
    },
    errorHandling: 'continue',
    maxParallelNodes: 3  // CUSTOMIZE: Adjust for your needs
  },
  nodes: [
    // STEP 1: Input Batch Data
    {
      id: 'input-batch',
      type: BlockType.INPUT,
      name: 'Batch Input',
      description: 'Read large dataset (CSV, database, etc.)',
      config: {
        source: 'database',  // CUSTOMIZE: Change to 'csv', etc.
        table: 'raw_leads',
        batchSize: 100  // CUSTOMIZE: Adjust batch size
      },
      inputSchema: null,
      outputSchema: {
        type: 'object',
        properties: {
          batch: {
            type: 'array',
            items: {
              type: 'object'
            }
          }
        }
      }
    },

    // STEP 2: Pre-filter
    {
      id: 'filter-valid',
      type: 'filter',
      name: 'Filter Valid Records',
      description: 'Remove invalid records before enrichment',
      config: {
        conditions: [
          { field: 'email', operator: 'exists' },
          { field: 'email', operator: 'contains', value: '@' }
        ],
        onFail: 'skip'
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 3: Transform for Enrichment
    {
      id: 'transform-enrichment',
      type: BlockType.TRANSFORM,
      name: 'Prepare for Enrichment',
      description: 'Format data for enrichment APIs',
      config: {
        operations: [
          {
            type: 'format',
            field: 'phone',
            format: 'international'
          },
          {
            type: 'calculate',
            field: 'enrichmentReady',
            expression: 'true'
          }
        ]
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 4A: Parallel Enrichment 1 - Apollo
    {
      id: 'enrich-apollo',
      type: 'api.apollo',
      name: 'Apollo LinkedIn',
      description: 'Enrich with LinkedIn data',
      config: {
        apiKey: '{{secrets.apollo}}',
        emailField: 'email',
        batchSize: 10  // CUSTOMIZE: Adjust for API limits
      },
      inputSchema: null,
      outputSchema: null,
      timeout: 30000
    },

    // STEP 4B: Parallel Enrichment 2 - Hunter Verification
    {
      id: 'enrich-hunter',
      type: 'api.hunter.verifier',
      name: 'Hunter Email Verification',
      description: 'Verify email deliverability',
      config: {
        apiKey: '{{secrets.hunter}}',
        emailField: 'email'
      },
      inputSchema: null,
      outputSchema: null,
      timeout: 15000
    },

    // STEP 4C: Parallel Enrichment 3 - AI Interests
    {
      id: 'enrich-interests',
      type: 'ai.interestInference',
      name: 'AI Interest Inference',
      description: 'Infer interests from available data',
      config: {
        apiToken: '{{secrets.openrouter}}',
        bioField: 'bio',
        model: 'google/gemma-2-27b-it:free',
        maxInterests: 10
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 5: Merge All Enrichments
    {
      id: 'merge-enrichments',
      type: 'transform.merge',
      name: 'Merge Enrichments',
      description: 'Merge results from all parallel enrichments',
      config: {
        // CUSTOMIZE: Choose merge strategy
        // 'deepMerge' - recursively merge objects
        // 'append' - append arrays
        // 'zip' - combine by index
        strategy: 'deepMerge',
        sources: ['enrich-apollo', 'enrich-hunter', 'enrich-interests']
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 6: Final Transform
    {
      id: 'transform-final',
      type: BlockType.TRANSFORM,
      name: 'Final Transform',
      description: 'Format final output',
      config: {
        operations: [
          {
            type: 'calculate',
            field: 'enrichmentCompleted',
            expression: 'new Date().toISOString()'
          },
          {
            type: 'map',
            field: 'enrichmentScore',
            targetField: 'qualityScore'
          }
        ]
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 7: Output Batch Results
    {
      id: 'output-batch',
      type: BlockType.OUTPUT,
      name: 'Save Batch Results',
      description: 'Save enriched batch to database',
      config: {
        destination: 'database',
        table: 'enriched_leads',
        mode: 'upsert',
        keyFields: ['email'],
        batchSize: 100  // CUSTOMIZE: Adjust for performance
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-batch', target: 'filter-valid' },
    { id: 'e2', source: 'filter-valid', target: 'transform-enrichment' },
    { id: 'e3a', source: 'transform-enrichment', target: 'enrich-apollo' },
    { id: 'e3b', source: 'transform-enrichment', target: 'enrich-hunter' },
    { id: 'e3c', source: 'transform-enrichment', target: 'enrich-interests' },
    { id: 'e4a', source: 'enrich-apollo', target: 'merge-enrichments', sourcePort: 'out', targetPort: 'in1' },
    { id: 'e4b', source: 'enrich-hunter', target: 'merge-enrichments', sourcePort: 'out', targetPort: 'in2' },
    { id: 'e4c', source: 'enrich-interests', target: 'merge-enrichments', sourcePort: 'out', targetPort: 'in3' },
    { id: 'e5', source: 'merge-enrichments', target: 'transform-final' },
    { id: 'e6', source: 'transform-final', target: 'output-batch' }
  ]
}

// ============================================================
// TEMPLATE 5: Multi-Source Data Fusion
// ============================================================

/**
 * Template: Multi-Source Data Fusion
 *
 * Use Case: Combine data from multiple sources into unified view
 *
 * Workflow:
 *   [Input1, Input2, Input3] → Merge → Validate → Transform → Output
 *
 * Common uses:
 * - CRM integration
 * - Data consolidation
 * - Master data management
 * - 360° customer view
 *
 * Cost: $0 (unless adding enrichment)
 * Complexity: Intermediate
 *
 * How to customize:
 * 1. Add/remove input sources as needed
 * 2. Adjust merge strategy for your data
 * 3. Add validation rules specific to your use case
 * 4. Customize output schema for your target system
 */

export const multiSourceDataFusionTemplate: WorkflowDefinition = {
  $schema: 'http://lume.ai/schemas/workflow-v1.json#',
  workflowId: 'multi-source-data-fusion',
  name: 'Multi-Source Data Fusion',
  version: 1,
  description: 'Combine data from multiple sources into unified view',
  metadata: {
    author: 'Lume Templates',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['integration', 'crm', 'fusion', 'intermediate']
  },
  globals: {
    timeout: 300,
    errorHandling: 'continue'
  },
  nodes: [
    // INPUT SOURCE 1: CRM
    {
      id: 'input-crm',
      type: BlockType.INPUT,
      name: 'CRM Data',
      description: 'Data from CRM system',
      config: {
        source: 'database',  // CUSTOMIZE: Change to your CRM
        table: 'crm_contacts',
        query: 'SELECT * FROM contacts WHERE active = true'
      },
      inputSchema: null,
      outputSchema: {
        type: 'object',
        properties: {
          contacts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                company: { type: 'string' }
              }
            }
          }
        }
      }
    },

    // INPUT SOURCE 2: Marketing
    {
      id: 'input-marketing',
      type: BlockType.INPUT,
      name: 'Marketing Data',
      description: 'Data from marketing automation',
      config: {
        source: 'csv',  // CUSTOMIZE: Change to your source
        file: 'marketing-export.csv'
      },
      inputSchema: null,
      outputSchema: {
        type: 'object',
        properties: {
          leads: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                source: { type: 'string' },
                campaign: { type: 'string' },
                score: { type: 'number' }
              }
            }
          }
        }
      }
    },

    // INPUT SOURCE 3: Website
    {
      id: 'input-website',
      type: BlockType.INPUT,
      name: 'Website Data',
      description: 'Data from website forms',
      config: {
        source: 'api',  // CUSTOMIZE: Change to your source
        endpoint: 'https://api.example.com/form-submissions'
      },
      inputSchema: null,
      outputSchema: {
        type: 'object',
        properties: {
          submissions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                formType: { type: 'string' },
                submittedAt: { type: 'string' }
              }
            }
          }
        }
      }
    },

    // STEP 2: Merge All Sources
    {
      id: 'merge-sources',
      type: 'transform.merge',
      name: 'Merge Data Sources',
      description: 'Combine data from all sources',
      config: {
        // CUSTOMIZE: Choose merge strategy
        // 'deepMerge' - merge by key field (recommended)
        // 'append' - concatenate all records
        strategy: 'deepMerge',
        keyField: 'email',  // Merge records with same email
        sources: ['input-crm', 'input-marketing', 'input-website']
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 3: Validate Merged Data
    {
      id: 'validate-data',
      type: 'filter',
      name: 'Validate Merged Data',
      description: 'Ensure data quality and completeness',
      config: {
        conditions: [
          { field: 'email', operator: 'exists' },
          { field: 'email', operator: 'contains', value: '@' },
          { field: 'name', operator: 'exists' }
          // CUSTOMIZE: Add more validation rules
        ],
        onFail: 'skip'
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 4: Transform to Target Schema
    {
      id: 'transform-schema',
      type: BlockType.TRANSFORM,
      name: 'Transform to Unified Schema',
      description: 'Map to target system schema',
      config: {
        operations: [
          // CUSTOMIZE: Map fields to your target schema
          { type: 'rename', field: 'name', targetField: 'fullName' },
          { type: 'rename', field: 'company', targetField: 'organization' },
          {
            type: 'calculate',
            field: 'dataSources',
            expression: '[]'  // Will track which sources contributed
          },
          {
            type: 'calculate',
            field: 'lastUpdated',
            expression: 'new Date().toISOString()'
          }
        ]
      },
      inputSchema: null,
      outputSchema: null
    },

    // STEP 5: Output Unified Data
    {
      id: 'output-unified',
      type: BlockType.OUTPUT,
      name: 'Save Unified View',
      description: 'Save to master data table or CRM',
      config: {
        destination: 'database',  // CUSTOMIZE: Change to your target
        table: 'unified_contacts',
        mode: 'upsert',
        keyFields: ['email']
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    // All inputs to merge
    { id: 'e1a', source: 'input-crm', target: 'merge-sources', sourcePort: 'out', targetPort: 'in1' },
    { id: 'e1b', source: 'input-marketing', target: 'merge-sources', sourcePort: 'out', targetPort: 'in2' },
    { id: 'e1c', source: 'input-website', target: 'merge-sources', sourcePort: 'out', targetPort: 'in3' },

    // Pipeline
    { id: 'e2', source: 'merge-sources', target: 'validate-data' },
    { id: 'e3', source: 'validate-data', target: 'transform-schema' },
    { id: 'e4', source: 'transform-schema', target: 'output-unified' }
  ]
}

// ============================================================
// EXPORT ALL TEMPLATES
// ============================================================

export const workflowTemplates = {
  simpleDataPipeline: simpleDataPipelineTemplate,
  leadEnrichmentPipeline: leadEnrichmentPipelineTemplate,
  aiContentProcessing: aiContentProcessingTemplate,
  batchDataProcessing: batchDataProcessingTemplate,
  multiSourceDataFusion: multiSourceDataFusionTemplate
}

/**
 * Helper function to get template by name
 */
export function getTemplate(name: keyof typeof workflowTemplates): WorkflowDefinition {
  return workflowTemplates[name]
}

/**
 * Helper function to list all templates
 */
export function listTemplates(): Array<{
  name: string
  workflowId: string
  description: string
  complexity: string
  tags: string[]
}> {
  return Object.entries(workflowTemplates).map(([key, template]) => ({
    name: key,
    workflowId: template.workflowId,
    description: template.description,
    complexity: template.metadata.tags.includes('beginner') ? 'Beginner' :
                 template.metadata.tags.includes('advanced') ? 'Advanced' : 'Intermediate',
    tags: template.metadata.tags || []
  }))
}

// ============================================================
// USAGE EXAMPLE
// ============================================================

/**
 * Example: How to use a template
 */
export async function useTemplateExample() {
  // 1. Import and register blocks
  const { registerAllBuiltInBlocks, workflowOrchestrator, ContextFactory, workflowValidator } = await import('../index')

  registerAllBuiltInBlocks()

  // 2. Choose template
  const template = getTemplate('leadEnrichmentPipeline')

  // 3. Validate
  const validation = await workflowValidator.validate(template)
  if (!validation.valid) {
    console.error('Template validation failed:', validation.errors)
    return
  }

  // 4. Create context
  const context = ContextFactory.create({
    workflowId: template.workflowId,
    mode: 'production',
    secrets: {
      apollo: process.env.APOLLO_API_KEY!,
      openrouter: process.env.OPENROUTER_API_KEY!
    }
  })

  // 5. Execute
  const result = await workflowOrchestrator.execute(template, context, null)

  console.log('Template execution result:', result.status)
  return result
}

// ============================================================
// DOCUMENTATION
// ============================================================

/**
 * Quick Template Selection Guide
 *
 * Use Simple Data Pipeline when:
 *   - You need basic ETL (field mapping, renaming, formatting)
 *   - No external APIs required
 *   - Beginner-friendly
 *
 * Use Lead Enrichment Pipeline when:
 *   - You have leads with emails
 *   - Want to enrich with LinkedIn and AI
 *   - Need country-aware processing
 *
 * Use AI Content Processing when:
 *   - Analyzing social media content
 *   - Need contact extraction + interests + sentiment
 *   - Want to branch based on analysis results
 *
 * Use Batch Data Processing when:
 *   - Processing large datasets
 *   - Need parallel enrichment for performance
 *   - Combining multiple enrichment sources
 *
 * Use Multi-Source Data Fusion when:
 *   - Combining data from CRM, marketing, website, etc.
 *   - Creating unified customer view
 *   - Data consolidation/integration
 */
