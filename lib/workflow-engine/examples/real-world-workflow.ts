/**
 * Real-World Lead Enrichment Workflow Example
 *
 * This example demonstrates a complete lead enrichment pipeline using:
 * - Apify Scraper (Instagram comments)
 * - AI Contact Extraction (OpenRouter)
 * - Apollo Enrichment
 * - Hunter Email Finder
 * - Filter (valid contacts)
 * - Mixedbread Embeddings
 * - Output (database storage)
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
// Real-World Workflow Definition
// ============================================================

const leadEnrichmentWorkflow: WorkflowDefinition = {
  workflowId: 'lead-enrichment-production',
  name: 'Lead Enrichment Pipeline (Production)',
  version: 1,
  description: 'Complete lead enrichment from Instagram to enriched contacts with embeddings',
  metadata: {
    author: 'Lume Production',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['production', 'enrichment', 'instagram', 'apollo', 'hunter', 'embeddings']
  },
  globals: {
    timeout: 3600, // 1 hour
    retryPolicy: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000
    },
    errorHandling: 'continue'
  },
  nodes: [
    // 1. Input: Source Audience
    {
      id: 'input-source',
      type: BlockType.INPUT,
      name: 'Source Audience Input',
      description: 'Receives source audience with Instagram URLs',
      config: {
        source: 'database',
        query: 'source_audiences',
        fields: ['id', 'name', 'type', 'urls']
      },
      inputSchema: null,
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['instagram'] },
          urls: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    },

    // 2. Apify Scraper
    {
      id: 'scrape-comments',
      type: 'api.apify',
      name: 'Scrape Instagram Comments',
      description: 'Fetches comments from Instagram posts using Apify',
      config: {
        apiToken: '{{secrets.apify}}',
        platform: 'instagram',
        url: '{{input.urls[0]}}', // First URL from source
        limit: 1000
      },
      inputSchema: {
        type: 'object',
        properties: {
          urls: { type: 'array' }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          platform: { type: 'string' },
          url: { type: 'string' },
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

    // 3. AI Contact Extraction
    {
      id: 'extract-contacts',
      type: 'ai',
      name: 'Extract Contacts from Comments',
      description: 'Uses OpenRouter/Mistral to extract structured contacts',
      config: {
        provider: 'openrouter',
        model: 'mistralai/mistral-7b-instruct:free',
        promptTemplate: 'extract-contacts-from-comments',
        batchSize: 50,
        mapping: {
          comments: '{{nodes.scrape-comments.output.comments}}'
        }
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

    // 4. Filter Valid Contacts
    {
      id: 'filter-valid',
      type: 'filter',
      name: 'Filter Valid Contacts',
      description: 'Filter contacts that have at least email or name',
      config: {
        conditions: [
          {
            operator: 'or',
            conditions: [
              { field: 'email', operator: 'exists' },
              {
                operator: 'and',
                conditions: [
                  { field: 'firstName', operator: 'exists' },
                  { field: 'lastName', operator: 'exists' }
                ]
              }
            ]
          }
        ],
        onFail: 'skip'
      },
      inputSchema: null,
      outputSchema: null
    },

    // 5. Apollo Enrichment
    {
      id: 'enrich-apollo',
      type: 'api.apollo',
      name: 'Enrich with Apollo',
      description: 'Enrich contacts with professional data from Apollo',
      config: {
        apiToken: '{{secrets.apollo}}',
        contacts: '{{nodes.extract-contacts.output.contacts}}',
        revealPersonalEmails: true,
        revealPhoneNumbers: true,
        batchSize: 10
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
                title: { type: 'string' },
                company: { type: 'string' },
                linkedinUrl: { type: 'string' },
                phone: { type: 'string' }
              }
            }
          }
        }
      }
    },

    // 6. Hunter Email Finder
    {
      id: 'find-emails',
      type: 'api.hunter.finder',
      name: 'Find Missing Emails',
      description: 'Find emails for contacts without email using Hunter.io',
      config: {
        apiToken: '{{secrets.hunter}}',
        contacts: '{{nodes.enrich-apollo.output.contacts}}'
      },
      inputSchema: null,
      outputSchema: null
    },

    // 7. Mixedbread Embeddings
    {
      id: 'generate-embeddings',
      type: 'api.mixedbread',
      name: 'Generate Vector Embeddings',
      description: 'Generate embeddings for semantic search',
      config: {
        apiToken: '{{secrets.mixedbread}}',
        items: '{{nodes.find-emails.output.contacts}}',
        model: 'mxbai-embed-large-v1',
        fields: ['firstName', 'lastName', 'company', 'title']
      },
      inputSchema: null,
      outputSchema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                embedding: {
                  type: 'array',
                  items: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },

    // 8. Output: Database Storage
    {
      id: 'output-storage',
      type: BlockType.OUTPUT,
      name: 'Store to Database',
      description: 'Store enriched contacts as Shared Audience in database',
      config: {
        destination: 'database',
        table: 'shared_audiences',
        mapping: {
          sourceAudienceId: '{{nodes.input-source.output.id}}',
          contacts: '{{nodes.generate-embeddings.output.items}}',
          metadata: {
            workflowId: 'lead-enrichment-production',
            processedAt: '{{variables.timestamp}}'
          }
        }
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-source', target: 'scrape-comments' },
    { id: 'e2', source: 'scrape-comments', target: 'extract-contacts' },
    { id: 'e3', source: 'extract-contacts', target: 'filter-valid' },
    { id: 'e4', source: 'filter-valid', target: 'enrich-apollo' },
    { id: 'e5', source: 'enrich-apollo', target: 'find-emails' },
    { id: 'e6', source: 'find-emails', target: 'generate-embeddings' },
    { id: 'e7', source: 'generate-embeddings', target: 'output-storage' }
  ]
}

// ============================================================
// Main Execution Function
// ============================================================

async function runRealWorldExample() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║   Real-World Lead Enrichment Workflow                     ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')

  // Step 1: Register all built-in blocks
  console.log('📦 Step 1: Registering all built-in blocks')
  console.log('─'.repeat(60))

  registerAllBuiltInBlocks()

  console.log('✅ All blocks registered')
  console.log('')

  // Step 2: Validate workflow
  console.log('✓ Step 2: Validating workflow')
  console.log('─'.repeat(60))

  const validationResult = await workflowValidator.validate(leadEnrichmentWorkflow)

  if (!validationResult.valid) {
    console.error('❌ Validation failed!')
    validationResult.errors.forEach(error => {
      console.error(`   [${error.type}] ${error.message}`)
      if (error.nodeId) {
        console.error(`      Node: ${error.nodeId}`)
      }
    })
    return
  }

  console.log(`✅ Workflow "${leadEnrichmentWorkflow.workflowId}" is valid`)
  console.log(`   Nodes: ${leadEnrichmentWorkflow.nodes.length}`)
  console.log(`   Edges: ${leadEnrichmentWorkflow.edges.length}`)

  if (validationResult.warnings.length > 0) {
    console.log(`   ⚠️  Warnings: ${validationResult.warnings.length}`)
    validationResult.warnings.forEach(warning => {
      console.log(`      - ${warning.message}`)
    })
  }
  console.log('')

  // Step 3: Create execution context
  console.log('⚙️  Step 3: Creating execution context')
  console.log('─'.repeat(60))

  const context = ContextFactory.create({
    workflowId: leadEnrichmentWorkflow.workflowId,
    mode: 'production',
    variables: {
      timestamp: new Date().toISOString(),
      environment: 'production'
    },
    secrets: {
      apify: process.env.APIFY_API_KEY || 'demo-key',
      apollo: process.env.APOLLO_API_KEY || 'demo-key',
      hunter: process.env.HUNTER_API_KEY || 'demo-key',
      mixedbread: process.env.MIXEDBREAD_API_KEY || 'demo-key',
      openrouter: process.env.OPENROUTER_API_KEY || 'demo-key'
    },
    progress: (progress, event) => {
      const icon = event.event === 'layer_completed' ? '✓' : '→'
      console.log(`   ${icon} [${progress}%] ${event.event}`)
      if (event.details?.nodeCount) {
        console.log(`      Nodes in layer: ${event.details.nodeCount}`)
      }
    }
  })

  console.log(`✅ Context created: ${context.executionId}`)
  console.log(`   Mode: ${context.mode}`)
  console.log('')

  // Step 4: Execute workflow
  console.log('🚀 Step 4: Executing workflow')
  console.log('─'.repeat(60))
  console.log('')

  const orchestrator = new WorkflowOrchestrator()
  const startTime = Date.now()

  // Mock input data
  const mockInput = {
    id: 'source-audience-123',
    name: 'Demo Instagram Audience',
    type: 'instagram',
    urls: ['https://instagram.com/p/ABC123/']
  }

  const result = await orchestrator.execute(
    leadEnrichmentWorkflow,
    context,
    mockInput
  )

  const totalTime = Date.now() - startTime
  console.log('')
  console.log('─'.repeat(60))
  console.log('')

  // Step 5: Display results
  console.log('📊 Step 5: Execution Results')
  console.log('─'.repeat(60))
  console.log('')

  console.log(`Status: ${result.status === 'completed' ? '✅ COMPLETED' : '❌ FAILED'}`)
  console.log(`Total Time: ${result.executionTime}ms`)
  console.log(`Nodes Completed: ${result.metadata.completedNodes}/${result.metadata.totalNodes}`)
  console.log(`Nodes Failed: ${result.metadata.failedNodes}`)
  console.log('')

  // Display per-node results
  console.log('Node Results:')
  console.log('─'.repeat(60))

  for (const [nodeId, nodeResult] of Object.entries(result.nodeResults)) {
    const node = leadEnrichmentWorkflow.nodes.find(n => n.id === nodeId)
    const nodeName = node?.name || nodeId
    const icon = nodeResult.status === ExecutionStatus.COMPLETED ? '✅' : '❌'

    console.log(`${icon} ${nodeName}`)
    console.log(`   Status: ${nodeResult.status}`)
    console.log(`   Time: ${nodeResult.executionTime}ms`)

    // Show metadata for specific nodes
    if (nodeResult.metadata) {
      const meta = nodeResult.metadata
      if (meta.successfulEnrichments !== undefined) {
        console.log(`   Enrichments: ${meta.successfulEnrichments} successful, ${meta.failedEnrichments} failed`)
      }
      if (meta.cost !== undefined) {
        console.log(`   Cost: $${meta.cost.toFixed(4)} USD`)
      }
      if (meta.inputCount !== undefined) {
        console.log(`   Filtered: ${meta.inputCount} → ${meta.outputCount}`)
      }
    }

    console.log('')
  }

  // Summary
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║                     Execution Summary                       ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`Workflow: ${leadEnrichmentWorkflow.workflowId}`)
  console.log(`Status: ${result.status.toUpperCase()}`)
  console.log(`Execution Time: ${totalTime}ms`)
  console.log(`Nodes: ${result.metadata.completedNodes}/${result.metadata.totalNodes} completed`)
  console.log(`Timeline Events: ${result.timeline.length}`)
  console.log('')

  if (result.status === ExecutionStatus.COMPLETED) {
    console.log('✅ Workflow executed successfully!')
    console.log('')
    console.log('This workflow would:')
    console.log('  1. Scrape Instagram comments')
    console.log('  2. Extract contacts using AI')
    console.log('  3. Filter valid contacts')
    console.log('  4. Enrich with Apollo data')
    console.log('  5. Find missing emails with Hunter.io')
    console.log('  6. Generate vector embeddings')
    console.log('  7. Store to database')
  } else {
    console.log('❌ Workflow execution failed')
    if (result.error) {
      console.log(`Error: ${result.error.message}`)
    }
  }

  console.log('')
}

// ============================================================
// Run the Example
// ============================================================

if (require.main === module) {
  runRealWorldExample().catch(error => {
    console.error('❌ Example failed:', error)
    process.exit(1)
  })
}

export { runRealWorldExample, leadEnrichmentWorkflow }
