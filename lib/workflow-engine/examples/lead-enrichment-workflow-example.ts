/**
 * Lead Enrichment Workflow Example
 *
 * This example demonstrates the complete workflow for enriching CSV contacts
 * using the 3 strategies that actually work:
 *
 * 1. Country Detection (CountryConfigBlock)
 * 2. LinkedIn via Apollo (business emails only)
 * 3. LLM Interest Inference (country-specific)
 *
 * Usage:
 *   npx tsx lib/workflow-engine/examples/lead-enrichment-workflow-example.ts
 */

import { workflowOrchestrator, ContextFactory, registerBlock, registerAllBuiltInBlocks } from '../index'
import type { WorkflowDefinition } from '../types'
import type { LeadEnrichmentInput, LeadEnrichmentConfig } from '../blocks/enrichment/lead-enrichment.block'

// ============================================================
// Register all built-in blocks
// ============================================================

registerAllBuiltInBlocks()

// ============================================================
// Define Workflow
// ============================================================

const leadEnrichmentWorkflow: WorkflowDefinition = {
  workflowId: 'lead-enrichment-complete',
  name: 'Complete Lead Enrichment',
  version: 1,
  description: 'Enrich contacts using 3 strategies: Country detection, LinkedIn (Apollo), and LLM interest inference',
  metadata: {
    author: 'Lume Workflow Engine',
    category: 'enrichment',
    tags: ['lead', 'enrichment', 'apollo', 'llm', 'country'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  nodes: [
    {
      id: 'input-1',
      type: 'input.static',
      name: 'CSV Input',
      config: {
        data: {
          // This will be overridden by actual input
          contacts: []
        }
      },
      inputSchema: {
        type: 'object',
        properties: {
          contacts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                fullName: { type: 'string' },
                phone: { type: 'string' },
                birthDate: { type: 'string', format: 'date' }
              }
            }
          }
        }
      },
      outputSchema: null
    },
    {
      id: 'enrichment-1',
      type: 'enrichment.lead',
      name: 'Lead Enrichment (3 Strategies)',
      config: {
        apolloToken: '{{secrets.apollo}}', // From secrets
        openrouterToken: '{{secrets.openrouter}}', // From secrets
        enableApollo: true,
        enableInterestInference: true,
        defaultCountry: 'BR' // Fallback to Brazil
      },
      inputSchema: null,
      outputSchema: {
        type: 'object',
        properties: {
          contacts: {
            type: 'array',
            description: 'Enriched contacts with country, linkedin, and interests'
          },
          metadata: {
            type: 'object',
            properties: {
              totalContacts: { type: 'number' },
              countryDetected: { type: 'number' },
              linkedinFound: { type: 'number' },
              businessEmails: { type: 'number' },
              personalEmails: { type: 'number' },
              totalInterests: { type: 'number' },
              totalCost: { type: 'number' }
            }
          }
        }
      }
    },
    {
      id: 'output-1',
      type: 'output.logger',
      name: 'Log Results',
      config: {
        prefix: '✅ [Lead Enrichment Result]',
        format: 'pretty'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-1', target: 'enrichment-1' },
    { id: 'e2', source: 'enrichment-1', target: 'output-1' }
  ]
}

// ============================================================
// Sample Input Data (CSV-like)
// ============================================================

const sampleContacts = {
  contacts: [
    {
      id: '1',
      email: 'carlos.silva@empresa.com.br',
      firstName: 'Carlos',
      lastName: 'Silva',
      phone: '+55 11 98765-4321',
      birthDate: '1990-05-15'
    },
    {
      id: '2',
      email: 'maria.gonzalez@yahoo.com.mx',
      firstName: 'Maria',
      lastName: 'Gonzalez',
      phone: '+52 55 1234-5678',
      birthDate: '1995-08-22'
    },
    {
      id: '3',
      email: 'joao.santos@startup.com.br',
      firstName: 'Joao',
      lastName: 'Santos',
      phone: '+55 21 99876-5432',
      birthDate: '1988-03-10'
    },
    {
      id: '4',
      email: 'ana.rodriguez@gmail.com.ar',
      firstName: 'Ana',
      lastName: 'Rodriguez',
      phone: '+54 11 4567-8901',
      birthDate: '1992-12-05'
    },
    {
      id: '5',
      email: 'pedro.martinez@empresa.co',
      firstName: 'Pedro',
      lastName: 'Martinez',
      phone: '+57 1 234-5678',
      birthDate: '1985-07-18'
    }
  ]
}

// ============================================================
// Execute Workflow
// ============================================================

async function executeLeadEnrichmentWorkflow() {
  console.log('\n' + '='.repeat(70))
  console.log('  LEAD ENRICHMENT WORKFLOW - 3 STRATEGIES THAT ACTUALLY WORK')
  console.log('='.repeat(70) + '\n')

  // Create execution context
  const context = ContextFactory.create({
    workflowId: 'lead-enrichment-complete',
    mode: 'demo',
    variables: {
      environment: 'demo'
    },
    secrets: {
      apollo: process.env.APOLLO_API_KEY || 'your-apollo-token',
      openrouter: process.env.OPENROUTER_API_KEY || 'your-openrouter-token'
    },
    progress: (progress, event) => {
      const lastEvent = event.details
      console.log(`  [${progress}%] ${event.event}`)
      if (lastEvent && typeof lastEvent === 'object') {
        if ('processed' in lastEvent) {
          console.log(`       Processed: ${lastEvent.processed}/${lastEvent.total} contacts`)
          console.log(`       Country detected: ${lastEvent.countryDetected}`)
          console.log(`       LinkedIn found: ${lastEvent.linkedinFound}`)
          console.log(`       Total interests: ${lastEvent.totalInterests}`)
        }
      }
    }
  })

  try {
    console.log('📥 Input Contacts:')
    console.log(`   Total: ${sampleContacts.contacts.length}`)
    sampleContacts.contacts.forEach((c: any, i: number) => {
      console.log(`   ${i + 1}. ${c.firstName} ${c.lastName} (${c.email})`)
    })
    console.log()

    // Execute workflow
    console.log('⚙️  Starting workflow execution...\n')

    const result = await workflowOrchestrator.execute(
      leadEnrichmentWorkflow,
      context,
      sampleContacts
    )

    // Check results
    if (result.status === 'completed') {
      console.log('\n' + '='.repeat(70))
      console.log('  ✅ WORKFLOW COMPLETED SUCCESSFULLY!')
      console.log('='.repeat(70) + '\n')

      const output = result.output as any
      const metadata = output.metadata

      console.log('📊 ENRICHMENT SUMMARY:')
      console.log(`   Total contacts:     ${metadata.totalContacts}`)
      console.log(`   Country detected:   ${metadata.countryDetected} (100%)`)
      console.log(`   Business emails:    ${metadata.businessEmails}`)
      console.log(`   Personal emails:    ${metadata.personalEmails}`)
      console.log(`   LinkedIn found:     ${metadata.linkedinFound} / ${metadata.businessEmails} business emails`)
      console.log(`   Total interests:    ${metadata.totalInterests}`)
      console.log(`   Avg per contact:    ${metadata.avgInterestsPerContact.toFixed(1)} interests`)
      console.log(`   Total cost:         $${metadata.totalCost.toFixed(4)} USD`)
      console.log(`   └─ Apollo (LinkedIn):     $${metadata.costBreakdown.apollo.toFixed(4)}`)
      console.log(`   └─ OpenRouter (LLM):     $${metadata.costBreakdown.openrouter.toFixed(4)}`)
      console.log()

      console.log('📋 ENRICHED CONTACTS:')
      console.log('   ' + '-'.repeat(70))

      output.contacts.forEach((contact: any, i: number) => {
        console.log(`   ${i + 1}. ${contact.firstName} ${contact.lastName} (${contact.email})`)

        // Country
        if (contact.country) {
          console.log(`      🌎 Country: ${contact.country.name} (${contact.country.code})`)
          console.log(`         Method: ${contact.country.detectionMethod} | Confidence: ${contact.country.confidence}`)
        }

        // LinkedIn
        if (contact.linkedin) {
          if (contact.linkedin.found) {
            console.log(`      💼 LinkedIn: ${contact.linkedin.url}`)
            console.log(`         Title: ${contact.linkedin.title || 'N/A'}`)
            console.log(`         Company: ${contact.linkedin.company || 'N/A'}`)
          } else {
            console.log(`      💼 LinkedIn: Not found (${contact.linkedin.emailType} email)`)
          }
        }

        // Interests
        if (contact.interests && contact.interests.length > 0) {
          console.log(`      ❤️  Interests (${contact.interests.length}):`)
          contact.interests.slice(0, 5).forEach((interest: any) => {
            console.log(`         • ${interest.topic} (${interest.category}) - ${(interest.confidence * 100).toFixed(0)}%`)
          })
        }

        console.log(`      💰 Cost: $${(contact.enrichmentCost || 0).toFixed(4)}`)
        console.log('   ' + '-'.repeat(70))
      })

      console.log('\n✨ Workflow completed successfully!')
      console.log(`\n   Execution time: ${result.executionTime}ms`)
      console.log(`   Total nodes: ${result.metadata.totalNodes}`)
      console.log(`   Completed: ${result.metadata.completedNodes}`)
      console.log()

    } else {
      console.log('\n❌ WORKFLOW FAILED')
      console.log(`Error: ${result.error}`)
    }

  } catch (error) {
    console.error('\n❌ Workflow execution failed:', error)
    process.exit(1)
  }
}

// ============================================================
// Run Example
// ============================================================

async function main() {
  try {
    await executeLeadEnrichmentWorkflow()
  } catch (error) {
    console.error('\n❌ Example failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { leadEnrichmentWorkflow, executeLeadEnrichmentWorkflow, sampleContacts }
