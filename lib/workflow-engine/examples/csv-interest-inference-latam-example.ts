/**
 * CSV Interest Inference with Auto-Country Detection - Example
 *
 * This example demonstrates how to enrich a CSV file with inferred interests
 * using automatic country detection from email domain and phone number.
 *
 * Workflow:
 * 1. Parse CSV input
 * 2. Calculate age from birth date
 * 3. Auto-detect country from email/phone
 * 4. Infer interests using country-specific LLM prompt
 * 5. Output enriched CSV
 */

import {
  WorkflowDefinition,
  BlockType
} from '../types'
import {
  workflowValidator,
  WorkflowOrchestrator,
  ContextFactory,
  registerAllBuiltInBlocks
} from '../index'

// ============================================
// Example Workflow Definition
// ============================================

const csvInterestInferenceWorkflow: WorkflowDefinition = {
  workflowId: 'csv-interest-inference-latam',
  name: 'CSV Interest Inference LATAM',
  version: 1,
  description: 'Automatically detects country and infers interests from CSV contact data',
  metadata: {
    author: 'Workflow Engine',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['csv', 'enrichment', 'interests', 'latam', 'auto-detection']
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
    {
      id: 'input',
      type: BlockType.INPUT,
      name: 'CSV Input',
      config: {
        source: 'csv',
        data: {} // Will be provided at runtime
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'transform',
      type: BlockType.TRANSFORM,
      name: 'Calculate Age & Extract Info',
      config: {
        operations: [
          {
            type: 'calculate',
            field: 'eta',
            transformation: 'calculateAge("{{input.nascimento}}")',
            description: 'Calculate age from birth date'
          },
          {
            type: 'extract',
            field: 'first_name',
            transformation: '{{input.nome}}.split(" ")[0]',
            description: 'Extract first name from full name'
          },
          {
            type: 'extract',
            field: 'last_name',
            transformation: '{{input.nome}}.split(" ").slice(-1)[0]',
            description: 'Extract last name from full name'
          }
        ]
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'country-detection',
      type: BlockType.CUSTOM,
      name: 'Country Detection',
      config: {
        blockType: 'countries.config',
        email: '{{input.email}}',
        phone: '{{input.celular}}',
        defaultCountry: 'BR' // Fallback to Brazil if detection fails
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'llm-inference',
      type: BlockType.AI,
      name: 'Interest Inference (Country-Specific)',
      config: {
        blockType: 'ai.openrouter',
        apiToken: '{{secrets.openrouter}}',
        model: '{{variables.model}}', // Uses model from country detection
        maxTokens: 500,
        temperature: 0.7,
        messages: [
          {
            'role': 'system',
            'content': '{{variables.system_prompt}}' // Uses country-specific system prompt
          },
          {
            'role': 'user',
            'content': `Analizza questo profilo demografico:

Nome: {{input.nome}}
Età: {{nodes.transform.output.eta}} anni
Email: {{input.email}}
Paese rilevato: {{variables.country}}
Lingua: {{variables.language}}

Inferisci 5-10 interessi probabili con confidence score (0-1).
Considera:
1. Interessi comuni per persone di {{nodes.transform.output.eta}} anni in {{variables.country_name}}
2. Contesto culturale {{variables.region}}
3. Tendenze attuali in {{variables.country_name}}
4. Interessi comuni: {{variables.common_interests}}

Rispondi solo in formato JSON array:
[
  {"topic": "futebol", "confidence": 0.9, "category": "sport", "reason": "Molto popolare in {{variables.country}}"},
  {"topic": "música", "confidence": 0.8, "category": "entertainment"}
]`
          }
        ]
      },
      inputSchema: null,
      outputSchema: null
    },
    {
      id: 'output',
      type: BlockType.OUTPUT,
      name: 'CSV Enriched',
      config: {
        format: 'csv',
        fields: {
          'nome': '{{input.nome}}',
          'celular': '{{input.celular}}',
          'email': '{{input.email}}',
          'nascimento': '{{input.nascimento}}',
          'eta': '{{nodes.transform.output.eta}}',
          'country': '{{variables.country}}',
          'country_name': '{{variables.country_name}}',
          'detection_method': '{{nodes.country-detection.output.detectionMethod}}',
          'confidence': '{{nodes.country-detection.output.confidence}}',
          'interessi': '{{nodes.llm-inference.output.content}}'
        }
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input', target: 'transform' },
    { id: 'e2', source: 'transform', target: 'country-detection' },
    { id: 'e3', source: 'country-detection', target: 'llm-inference' },
    { id: 'e4', source: 'llm-inference', 'target': 'output' }
  ]
}

// ============================================
// Example CSV Data (Multi-Country LATAM)
// ============================================

const exampleCSVData = [
  {
    nome: 'Carlos Silva',
    celular: '+5511999999999',
    email: 'carlos.silva@gmail.com.br',
    nascimento: '15/03/1985'
  },
  {
    nome: 'María González',
    celular: '+525512345678',
    email: 'maria.gonzalez@yahoo.com.mx',
    nascimento: '22/07/1990'
  },
  {
    nome: 'Juan Pérez',
    celular: '+5491187654321',
    email: 'juan.perez@outlook.com.ar',
    nascimento: '10/11/1988'
  },
  {
    nome: 'Ana Rodríguez',
    celular: '+573001234567',
    email: 'ana.rodriguez@gmail.com',
    nascimento: '05/02/1992'
  },
  {
    nome: 'Luca Bianchi',
    celular: '+393331234567',
    email: 'luca.bianchi@azienda.it',
    nascimento: '21/02/1986'
  }
]

// ============================================
// Run the Example
// ============================================

async function runCSVInterestInferenceExample() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║   CSV Interest Inference with Auto-Country Detection      ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')

  // Step 1: Register blocks
  console.log('📦 Step 1: Registering blocks')
  console.log('─'.repeat(60))
  registerAllBuiltInBlocks()
  console.log('✅ Blocks registered')
  console.log('')

  // Step 2: Validate workflow
  console.log('✓ Step 2: Validating workflow')
  console.log('─'.repeat(60))

  const validationResult = await workflowValidator.validate(csvInterestInferenceWorkflow)

  if (!validationResult.valid) {
    console.error('❌ Validation failed!')
    console.error('Errors:', validationResult.errors)
    return
  }

  console.log('✅ Workflow is valid')
  console.log('')

  // Step 3: Process each contact
  console.log('🚀 Step 3: Processing contacts with auto-country detection')
  console.log('─'.repeat(60))

  const orchestrator = new WorkflowOrchestrator()
  const results = []

  for (let i = 0; i < exampleCSVData.length; i++) {
    const contact = exampleCSVData[i]
    console.log(`\n📋 Contact ${i + 1}/${exampleCSVData.length}: ${contact.nome}`)
    console.log(`   Email: ${contact.email}`)
    console.log(`   Phone: ${contact.celular}`)

    try {
      // Create execution context
      const context = ContextFactory.create({
        workflowId: csvInterestInferenceWorkflow.workflowId,
        executionId: `csv-inference-${Date.now()}-${i}`,
        mode: 'demo',
        variables: {},
        secrets: {
          openrouter: process.env.OPENROUTER_API_KEY || 'sk-or-demo-key'
        },
        progress: (progress, event) => {
          console.log(`   [${progress}%] ${event.event}`)
        }
      })

      // Execute workflow
      const startTime = Date.now()
      const result = await orchestrator.execute(
        csvInterestInferenceWorkflow,
        context,
        contact
      )
      const executionTime = Date.now() - startTime

      if (result.status === 'completed') {
        console.log('')
        console.log(`   ✅ Completed in ${executionTime}ms`)
        console.log(`   🌎 Country: ${result.output.country} (${result.output.country_name})`)
        console.log(`   📊 Detection: ${result.output.detection_method} (${result.output.confidence} confidence)`)

        try {
          const interests = JSON.parse(result.output.interessi)
          console.log(`   ❤️  Interests:`)
          interests.forEach((interest: any, idx: number) => {
            console.log(`      ${idx + 1}. ${interest.topic} (${interest.confidence * 100}% confidence)`)
            console.log(`         Category: ${interest.category}`)
            if (interest.reason) {
              console.log(`         Reason: ${interest.reason}`)
            }
          })
        } catch (e) {
          console.log(`   ❤️  Interests: ${result.output.interessi}`)
        }

        results.push({
          ...contact,
          ...result.output
        })
      } else {
        console.log(`   ❌ Failed: ${result.error?.message}`)
      }

    } catch (error) {
      console.error(`   ❌ Error processing contact:`, error)
    }
  }

  // Summary
  console.log('')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║                    Processing Summary                      ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')

  // Count by country
  const countryCounts: Record<string, number> = {}
  results.forEach(result => {
    const country = result.country_name || 'Unknown'
    countryCounts[country] = (countryCounts[country] || 0) + 1
  })

  console.log('Contacts by Country:')
  Object.entries(countryCounts).forEach(([country, count]) => {
    console.log(`  ${country}: ${count}`)
  })
  console.log('')

  console.log('Detection Methods:')
  const methodCounts: Record<string, number> = {}
  results.forEach(result => {
    const method = result.detection_method || 'unknown'
    methodCounts[method] = (methodCounts[method] || 0) + 1
  })
  Object.entries(methodCounts).forEach(([method, count]) => {
    console.log(`  ${method}: ${count}`)
  })
  console.log('')

  console.log('Sample Enriched Output (CSV format):')
  console.log('nome;celular;email;nascimento;eta;country;interessi')
  results.slice(0, 3).forEach(result => {
    const interestsClean = result.interessi.replace(/"/g, "'").replace(/;/g, ',')
    console.log(`${result.nome};${result.celular};${result.email};${result.nascimento};${result.eta};${result.country};"${interestsClean}"`)
  })
  console.log('')

  console.log('✅ Example completed successfully!')
  console.log('')
  console.log('Key Features Demonstrated:')
  console.log('  ✅ Automatic country detection from email/phone')
  console.log('  ✅ Country-specific LLM prompts')
  console.log('  ✅ Multi-language support (PT-BR, ES-MX, ES-AR, ES-CO, IT-IT)')
  console.log('  ✅ Interest inference with confidence scores')
  console.log('  ✅ CSV enrichment workflow')
  console.log('')
}

// ============================================
// Run the Example
// ============================================

if (require.main === module) {
  runCSVInterestInferenceExample().catch(error => {
    console.error('❌ Example failed:', error)
    process.exit(1)
  })
}

export { runCSVInterestInferenceExample, csvInterestInferenceWorkflow }
