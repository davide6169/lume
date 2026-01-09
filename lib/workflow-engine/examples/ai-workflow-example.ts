/**
 * AI-Powered Lead Enrichment Workflow Example
 *
 * This example demonstrates advanced AI-powered workflows using:
 * - Contact Extraction from comments
 * - Interest Inference from social data
 * - Sentiment Analysis of text
 * - Generic OpenRouter LLM tasks
 */

import {
  WorkflowDefinition,
  BlockType,
  ExecutionStatus
} from '../types'
import {
  workflowValidator,
  WorkflowOrchestrator,
  ContextFactory,
  registerAllBuiltInBlocks
} from '../index'

// ============================================================
// AI-Powered Workflow Definition
// ============================================================

const aiEnrichmentWorkflow: WorkflowDefinition = {
  workflowId: 'ai-powered-enrichment',
  name: 'AI-Powered Lead Enrichment',
  version: 1,
  description: 'Advanced lead enrichment with AI-powered contact extraction, interest inference, and sentiment analysis',
  metadata: {
    author: 'Lume AI Team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['ai', 'enrichment', 'sentiment', 'interests', 'production']
  },
  globals: {
    timeout: 3600,
    retryPolicy: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000
    },
    errorHandling: 'continue'
  },
  nodes: [
    // 1. Input: Raw comments from social media
    {
      id: 'input-comments',
      type: BlockType.INPUT,
      name: 'Social Media Comments',
      description: 'Raw comments from Instagram/Facebook posts',
      config: {
        source: 'apify',
        fields: ['comments', 'platform', 'url']
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
                ownerUsername: { type: 'string' },
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    },

    // 2. AI Contact Extraction
    {
      id: 'extract-contacts',
      type: 'ai.contactExtraction',
      name: 'AI Contact Extraction',
      description: 'Extract structured contacts from unstructured comments',
      config: {
        apiToken: '{{secrets.openrouter}}',
        text: '{{input-comments.output.comments}}',
        model: 'mistralai/mistral-7b-instruct:free',
        minFields: 2
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
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' }
              }
            }
          }
        }
      }
    },

    // 3. Filter: Contacts with email
    {
      id: 'filter-contacts',
      type: 'filter',
      name: 'Filter Contacts with Email',
      description: 'Keep only contacts that have email or phone',
      config: {
        conditions: [
          {
            operator: 'or',
            conditions: [
              { field: 'email', operator: 'exists' },
              { field: 'phone', operator: 'exists' }
            ]
          }
        ],
        onFail: 'skip'
      },
      inputSchema: null,
      outputSchema: null
    },

    // 4. AI Interest Inference
    {
      id: 'infer-interests',
      type: 'ai.interestInference',
      name: 'AI Interest Inference',
      description: 'Infer interests from social media data',
      config: {
        apiToken: '{{secrets.openrouter}}',
        data: '{{nodes.extract-contacts.output.contacts}}',
        model: 'mistralai/mistral-7b-instruct:free',
        maxInterests: 10
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
                interests: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      topic: { type: 'string' },
                      confidence: { type: 'number' },
                      category: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // 5. AI Sentiment Analysis
    {
      id: 'analyze-sentiment',
      type: 'ai.sentimentAnalysis',
      name: 'AI Sentiment Analysis',
      description: 'Analyze sentiment of comments and bios',
      config: {
        apiToken: '{{secrets.openrouter}}',
        texts: '{{input-comments.output.comments[].text}}',
        model: 'mistralai/mistral-7b-instruct:free',
        granularity: 'document'
      },
      inputSchema: null,
      outputSchema: {
        type: 'object',
        properties: {
          analyses: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
                score: { type: 'number' },
                confidence: { type: 'number' }
              }
            }
          }
        }
      }
    },

    // 6. Filter: Positive sentiment only
    {
      id: 'filter-positive',
      type: 'filter',
      name: 'Filter Positive Sentiment',
      description: 'Keep only contacts with positive/neutral sentiment',
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

    // 7. Branch: High value leads
    {
      id: 'branch-value',
      type: 'branch',
      name: 'Branch by Value',
      description: 'Route high-value leads to premium enrichment',
      config: {
        condition: {
          operator: 'and',
          conditions: [
            { field: 'email', operator: 'exists' },
            { field: 'interests.length', operator: 'greater_than', value: 5 }
          ]
        },
        branches: {
          true: 'premium-enrichment',
          false: 'standard-enrichment'
        }
      },
      inputSchema: null,
      outputSchema: null
    },

    // 8A. Premium Enrichment Path (Apollo + Hunter)
    {
      id: 'premium-enrichment',
      type: BlockType.TRANSFORM,
      name: 'Premium Enrichment',
      description: 'Full enrichment for high-value leads',
      config: {
        operations: [
          {
            type: 'map',
            field: 'tier',
            targetField: 'premium'
          }
        ]
      },
      inputSchema: null,
      outputSchema: null
    },

    // 8B. Standard Enrichment Path
    {
      id: 'standard-enrichment',
      type: BlockType.TRANSFORM,
      name: 'Standard Enrichment',
      description: 'Basic enrichment for standard leads',
      config: {
        operations: [
          {
            type: 'map',
            field: 'tier',
            targetField: 'standard'
          }
        ]
      },
      inputSchema: null,
      outputSchema: null
    },

    // 9. Output
    {
      id: 'output-results',
      type: BlockType.OUTPUT,
      name: 'Store Enriched Leads',
      description: 'Store AI-enriched leads to database',
      config: {
        destination: 'database',
        table: 'ai_enriched_leads',
        format: 'json'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-comments', target: 'extract-contacts' },
    { id: 'e2', source: 'extract-contacts', target: 'filter-contacts' },
    { id: 'e3', source: 'filter-contacts', target: 'infer-interests' },
    { id: 'e4', source: 'infer-interests', target: 'analyze-sentiment' },
    { id: 'e5', source: 'analyze-sentiment', target: 'filter-positive' },
    { id: 'e6', source: 'filter-positive', target: 'branch-value' },
    { id: 'e7', source: 'branch-value', target: 'premium-enrichment' },
    { id: 'e8', source: 'branch-value', target: 'standard-enrichment' },
    { id: 'e9a', source: 'premium-enrichment', target: 'output-results' },
    { id: 'e9b', source: 'standard-enrichment', target: 'output-results' }
  ]
}

// ============================================================
// Main Execution Function
// ============================================================

async function runAIWorkflowExample() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║   AI-Powered Lead Enrichment Workflow                    ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')

  // Step 1: Register all built-in blocks
  console.log('📦 Step 1: Registering all built-in blocks')
  console.log('─'.repeat(60))

  registerAllBuiltInBlocks()

  console.log('✅ All blocks registered (including 4 AI blocks)')
  console.log('')

  // Step 2: Validate workflow
  console.log('✓ Step 2: Validating workflow')
  console.log('─'.repeat(60))

  const validationResult = await workflowValidator.validate(aiEnrichmentWorkflow)

  if (!validationResult.valid) {
    console.error('❌ Validation failed!')
    validationResult.errors.forEach(error => {
      console.error(`   [${error.type}] ${error.message}`)
    })
    return
  }

  console.log(`✅ Workflow "${aiEnrichmentWorkflow.workflowId}" is valid`)
  console.log(`   Nodes: ${aiEnrichmentWorkflow.nodes.length}`)
  console.log(`   Edges: ${aiEnrichmentWorkflow.edges.length}`)

  if (validationResult.warnings.length > 0) {
    console.log(`   ⚠️  Warnings: ${validationResult.warnings.length}`)
  }
  console.log('')

  // Step 3: Create execution context
  console.log('⚙️  Step 3: Creating execution context')
  console.log('─'.repeat(60))

  const context = ContextFactory.create({
    workflowId: aiEnrichmentWorkflow.workflowId,
    mode: 'production',
    variables: {
      timestamp: new Date().toISOString()
    },
    secrets: {
      openrouter: process.env.OPENROUTER_API_KEY || 'demo-key'
    },
    progress: (progress, event) => {
      const icon = event.event === 'layer_completed' ? '✓' : '→'
      console.log(`   ${icon} [${progress}%] ${event.event}`)
    }
  })

  console.log(`✅ Context created: ${context.executionId}`)
  console.log('')

  // Step 4: Display workflow capabilities
  console.log('🧠 Step 4: AI Capabilities')
  console.log('─'.repeat(60))
  console.log('')
  console.log('This workflow demonstrates:')
  console.log('')
  console.log('1. 📝 Contact Extraction')
  console.log('   - Extracts structured contacts from unstructured comments')
  console.log('   - Uses AI to identify names, emails, phones')
  console.log('')
  console.log('2. 🎯 Interest Inference')
  console.log('   - Analyzes bio, posts, hashtags')
  console.log('   - Infers 5-10 interests per contact with confidence scores')
  console.log('   - Categorizes interests (professional, hobby, travel, etc.)')
  console.log('')
  console.log('3. 😊 Sentiment Analysis')
  console.log('   - Analyzes sentiment of comments')
  console.log('   - Returns sentiment category (positive/neutral/negative)')
  console.log('   - Provides confidence score and key phrases')
  console.log('')
  console.log('4. 🔀 Smart Routing')
  console.log('   - Branches high-value leads to premium path')
  console.log('   - Standard leads to basic enrichment')
  console.log('')

  // Step 5: Mock execution
  console.log('🚀 Step 5: Workflow Execution')
  console.log('─'.repeat(60))
  console.log('')
  console.log('Note: This is a demonstration. In production:')
  console.log('  - Connect real data sources (Apify, databases)')
  console.log('  - Use actual OpenRouter API key')
  console.log('  - Process thousands of comments')
  console.log('  - Store results to database')
  console.log('')

  // Show example outputs
  console.log('Example Output - Contact Extraction:')
  console.log(JSON.stringify([
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890'
    }
  ], null, 2))
  console.log('')

  console.log('Example Output - Interest Inference:')
  console.log(JSON.stringify([
    {
      topic: 'technology',
      confidence: 0.95,
      category: 'professional'
    },
    {
      topic: 'photography',
      confidence: 0.87,
      category: 'hobby'
    }
  ], null, 2))
  console.log('')

  console.log('Example Output - Sentiment Analysis:')
  console.log(JSON.stringify({
    sentiment: 'positive',
    score: 0.8,
    confidence: 0.92,
    keyPhrases: ['love this', 'amazing', 'great product'],
    emotions: ['joy', 'surprise']
  }, null, 2))
  console.log('')

  // Summary
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║                     AI Features Summary                    ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log('🤖 AI Blocks Available:')
  console.log('   1. ai.openrouter - Generic LLM tasks')
  console.log('   2. ai.contactExtraction - Extract contacts from text')
  console.log('   3. ai.interestInference - Infer interests')
  console.log('   4. ai.sentimentAnalysis - Analyze sentiment')
  console.log('')
  console.log('💡 Use Cases:')
  console.log('   • Lead scoring with AI')
  console.log('   • Personalized outreach based on interests')
  console.log('   • Sentiment-based prioritization')
  console.log('   • Automatic contact discovery')
  console.log('   • Content categorization')
  console.log('')

  console.log('✅ AI blocks ready for production use!')
  console.log('')
}

// ============================================================
// Run the Example
// ============================================================

if (require.main === module) {
  runAIWorkflowExample().catch(error => {
    console.error('❌ Example failed:', error)
    process.exit(1)
  })
}

export { runAIWorkflowExample, aiEnrichmentWorkflow }
