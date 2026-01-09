# Workflow Building Guide - Step-by-Step

## 🎯 Obiettivo di Questa Guida

Questa guida ti mostrerà **passo dopo passo** come costruire un workflow custom utilizzando i blocchi riutilizzabili del Lume Workflow Engine.

Al termine di questa guida sarai in grado di:
- ✅ Capire quali blocchi usare per ogni scenario
- ✅ Progettare un workflow efficiente
- ✅ Definire un workflow JSON corretto
- ✅ Validare ed eseguire il workflow
- ✅ Debug e monitorare l'esecuzione

---

## 📚 Prerequisiti

Prima di iniziare, assicurati di:
1. Avere familiarità con TypeScript/JavaScript
2. Capire i concetti base di JSON
3. Avere Node.js installato
4. Avere letto il [README principale](./README.md)

---

## Step 1: Capire i Blocchi Riutilizzabili

### 1.1 Cos'è un Blocco?

Un **blocco** è un'unità di elaborazione riutilizzabile, come un **microservizio**:

```typescript
// Un blocco ha SEMPRE:
- Input: dati da processare
- Config: configurazione statica (api keys, parametri)
- Output: dati processati
- Execute: logica di elaborazione
```

### 1.2 Catalogo dei Blocchi Built-in

I blocchi sono organizzati per categoria:

#### **INPUT** - Blocchi di Ingresso Dati

| Blocco | ID | Use Case | Input | Output |
|--------|----|----------|-------|--------|
| Static Input | `input.static` | Dati statici hardcoded | Config.data | Dati statici |
| Database Input | `input.database` | Query database | Config.table, query | Records DB |

**Quando usarli:**
- `input.static` → Demo, test, prototipi
- `input.database` → Dati persistenti da Supabase/PostgreSQL

---

#### **API** - Integrazione Servizi Esterni

| Blocco | ID | Use Case | Costo |
|--------|----|----------|-------|
| Apify Scraper | `api.apify` | Scraping social media | $0.01-0.10 |
| Apollo Enrichment | `api.apollo` | LinkedIn da email business | $0.02 |
| Hunter Email Finder | `api.hunter.finder` | Trova email da nome/domains | $0.004 |
| Hunter Email Verifier | `api.hunter.verifier` | Verifica deliverability email | $0.0016 |
| Mixedbread Embeddings | `api.mixedbread` | Vector embeddings | $0.0001 |

**Quando usarli:**
- `api.apify` → Social media scraping (Instagram, Facebook)
- `api.apollo` → Enrichment B2B con LinkedIn
- `api.hunter.finder` → Trovare email mancanti
- `api.hunter.verifier` → Pulire liste email
- `api.mixedbread` → Semantic search, clustering

---

#### **AI** - Intelligenza Artificiale

| Blocco | ID | Use Case | Modello | Costo |
|--------|----|----------|---------|-------|
| OpenRouter | `ai.openrouter` | LLM generico | Qualsiasi modello | $0.0001-0.01 |
| Contact Extraction | `ai.contactExtraction` | Estrae contatti da testo | Mistral 7B | $0.0001 |
| Interest Inference | `ai.interestInference` | Inferisce interessi da bio | Mistral 7B | $0.0001 |
| Sentiment Analysis | `ai.sentimentAnalysis` | Analizza sentiment testo | Mistral 7B | $0.0001 |

**Quando usarli:**
- `ai.openrouter` → Task LLM generici (summary, translation, etc.)
- `ai.contactExtraction` → Estrarre contatti da commenti, bio, testi
- `ai.interestInference` → Capire interessi da social bio
- `ai.sentimentAnalysis` → Classificare sentiment (positive/neutral/negative)

---

#### **TRANSFORM** - Trasformazione Dati

| Blocco | ID | Use Case |
|--------|----|----------|
| Field Mapping | `transform.fieldMapping` | Rinomina, mappa campi |
| Calculate | `transform.calculate` | Calcola campi derivati |
| Format | `transform.format` | Formatta date, numeri, stringhe |

**Quando usarli:**
- `transform.fieldMapping` → Adattare dati tra sistemi diversi
- `transform.calculate` → Età da data di nascita, totali, etc.
- `transform.format` -> Formattazione output per CSV, API, etc.

---

#### **FILTER** - Filtraggio Dati

| Blocco | ID | Use Case |
|--------|----|----------|
| Filter | `filter` | Filtra array per condizioni |

**Quando usarli:**
- `filter` → Pulire dati, routing condizionale, validazione

---

#### **BRANCH** - Routing Condizionale

| Blocco | ID | Use Case |
|--------|----|----------|
| Branch | `branch` | Spara dati su percorsi diversi |

**Quando usarli:**
- `branch` → Lead scoring (high vs standard value), A/B testing

---

#### **COUNTRIES** - Configurazione Nazionale

| Blocco | ID | Use Case |
|--------|----|----------|
| Country Config | `countries.config` | Auto-detect paese da telefono/email |

**Quando usarli:**
- `countries.config` → Localizzazione LLM prompts, validazione formati nazionali

---

#### **ENRICHMENT** - Workflow Composti

| Blocco | ID | Use Case |
|--------|----|----------|
| Lead Enrichment | `enrichment.lead` | Enrichment completo 3-strategie |
| CSV Interest Enrichment | `csv.interestEnrichment` | CSV → CSV con interessi |

**Quando usarli:**
- `enrichment.lead` → Pipeline completa per singolo lead
- `csv.interestEnrichment` → Batch processing CSV

---

#### **OUTPUT** - Blocchi di Uscita Dati

| Blocco | ID | Use Case |
|--------|----|----------|
| Logger Output | `output.logger` | Log output in console |
| Database Output | `output.database` | Salva in database |

**Quando usarli:**
- `output.logger` → Debug, demo, test
- `output.database` → Persistenza risultati

---

### 1.3 Tabella Decisionale: Quale Blocco Usare?

```
Ho bisogno di...                          → Usa questo blocco
=========================================================================
Leggere dati statici                      → input.static
Leggere dati da database                  → input.database
Scraping social media                     → api.apify
Trovare LinkedIn da email                 → api.apollo
Estrarre contatti da testo non strutturato → ai.contactExtraction
Inferire interessi da bio                 → ai.interestInference
Analizzare sentiment testo                → ai.sentimentAnalysis
Chiamare LLM generico                     → ai.openrouter
Filtrare dati                             → filter
Suddividere dati in base a condizioni     → branch
Rinominare/mappare campi                  → transform.fieldMapping
Calcolare campi derivati                  → transform.calculate
Localizzare per paese                     → countries.config
Pipeline lead enrichment completa        → enrichment.lead
Elaborare CSV in batch                    → csv.interestEnrichment
Loggare/visualizzare risultati            → output.logger
Salvare in database                       → output.database
```

---

## Step 2: Progettare il Workflow

### 2.1 Disegna il Grafo su Carta

Prima di scrivere codice, **disegna sempre il workflow**:

```
Esempio: Lead Enrichment Pipeline

[Input: Leads]
      ↓
[Country Config] ← Rileva paese da telefono
      ↓
[Filter: Business Emails Only] ← Tieni solo @company
      ↓
[Apollo: LinkedIn Data] ← Enrich con LinkedIn
      ↓
[AI: Interest Inference] ← Inferisci interessi
      ↓
[Output: Enriched Leads]
```

### 2.2 Identifica Input e Output

Per ogni blocco, chiediti:
- **Input**: Di quali dati ha bisogno?
- **Output**: Cosa produce?

Esempio:
```
Block: Country Config
Input: { phone: "+393291234567" }
Output: { country: { code: "IT", name: "Italy", ... } }

Block: Filter (business emails)
Input: [{ email: "mario@gmail.com" }, { email: "luca@company.com" }]
Output: [{ email: "luca@company.com" }]  ← Solo email business
```

### 2.3 Identifica le Dipendenze

Quali blocchi dipendono da altri?

```
Layer 1 (parallel):
- Input: Leads (nessuna dipendenza)

Layer 2:
- Country Config (dipende da Input)

Layer 3:
- Filter (dipende da Country Config per avere dati completi)

Layer 4:
- Apollo (dipende da Filter)

Layer 5:
- AI Interest Inference (dipende da Apollo)

Layer 6:
- Output (dipende da AI Interest Inference)
```

---

## Step 3: Definire il Workflow JSON

### 3.1 Struttura Minimale

```typescript
const workflow: WorkflowDefinition = {
  workflowId: 'my-first-workflow',
  name: 'My First Workflow',
  version: 1,
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  nodes: [
    // nodi qui...
  ],
  edges: [
    // connessioni qui...
  ]
}
```

### 3.2 Definire i Nodi

Ogni nodo ha questa struttura:

```typescript
{
  id: 'unique-id',              // ← Deve essere unico nel workflow
  type: 'block-type',           // ← Tipo di blocco (es. 'filter', 'ai.openrouter')
  name: 'Human Readable Name',  // ← Nome descrittivo
  description: 'What this does',
  config: {                     // ← Configurazione statica del blocco
    // blocco-specifico config qui
  },
  inputSchema: null,            // ← (opzionale) JSON Schema per validazione input
  outputSchema: null,           // ← (opzionale) JSON Schema per validazione output
  retryConfig: {                // ← (opzionale) Retry policy
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelay: 1000
  },
  timeout: 30000                // ← (opzionale) Timeout in ms
}
```

### 3.3 Esempio Completo: Lead Enrichment Workflow

```typescript
const leadEnrichmentWorkflow: WorkflowDefinition = {
  $schema: 'http://lume.ai/schemas/workflow-v1.json#',
  workflowId: 'lead-enrichment-pipeline',
  name: 'Lead Enrichment Pipeline',
  version: 1,
  description: 'Enriches leads with country, LinkedIn, and AI interests',
  metadata: {
    author: 'Your Name',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['enrichment', 'lead', 'ai']
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
    // Node 1: Input
    {
      id: 'input-leads',
      type: 'input.static',
      name: 'Leads Input',
      description: 'Input leads data',
      config: {
        source: 'static',
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

    // Node 2: Country Detection
    {
      id: 'detect-country',
      type: 'countries.config',
      name: 'Country Detection',
      description: 'Detect country from phone',
      config: {
        phoneField: 'phone'
      },
      inputSchema: null,
      outputSchema: null
    },

    // Node 3: Filter Business Emails
    {
      id: 'filter-business',
      type: 'filter',
      name: 'Filter Business Emails',
      description: 'Keep only business emails',
      config: {
        conditions: [
          {
            field: 'email',
            operator: 'not_contains',
            value: '@gmail'
          },
          {
            field: 'email',
            operator: 'not_contains',
            value: '@yahoo'
          }
        ],
        onFail: 'skip'
      },
      inputSchema: null,
      outputSchema: null
    },

    // Node 4: Apollo Enrichment
    {
      id: 'apollo-enrich',
      type: 'api.apollo',
      name: 'Apollo LinkedIn Enrichment',
      description: 'Enrich with LinkedIn data',
      config: {
        apiKey: '{{secrets.apollo}}',
        email: '{{input-leads.output.leads[].email}}'
      },
      inputSchema: null,
      outputSchema: null,
      timeout: 10000
    },

    // Node 5: AI Interest Inference
    {
      id: 'infer-interests',
      type: 'ai.interestInference',
      name: 'AI Interest Inference',
      description: 'Infer interests from bio',
      config: {
        apiToken: '{{secrets.openrouter}}',
        data: '{{apollo-enrich.output}}',
        model: 'mistralai/mistral-7b-instruct:free',
        maxInterests: 10
      },
      inputSchema: null,
      outputSchema: null
    },

    // Node 6: Output
    {
      id: 'output-results',
      type: 'output.logger',
      name: 'Output Results',
      description: 'Log enriched leads',
      config: {
        prefix: '[Enriched Leads]',
        format: 'pretty'
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-leads', target: 'detect-country' },
    { id: 'e2', source: 'detect-country', target: 'filter-business' },
    { id: 'e3', source: 'filter-business', target: 'apollo-enrich' },
    { id: 'e4', source: 'apollo-enrich', target: 'infer-interests' },
    { id: 'e5', source: 'infer-interests', target: 'output-results' }
  ]
}
```

### 3.4 Variable Interpolation

Nota come nel config usiamo **variable interpolation**:

```typescript
config: {
  apiKey: '{{secrets.apollo}}',           // ← Segreto
  email: '{{input-leads.output.leads[].email}}'  // ← Output nodo precedente
}
```

**Tipi di variabili:**
- `{{input.field}}` → Dati dal workflow input
- `{{secrets.key}}` → API keys, tokens
- {{variables.name}}` → Variabili globali
- `{{nodes.node-id.output}}` → Output di un altro nodo
- `{{workflow.workflowId}}` → Metadati workflow

---

## Step 4: Configurare i Nodi

### 4.1 Config Statico vs Variable Interpolation

**❌ SBAGLIATO - Hardcoding:**
```typescript
config: {
  apiKey: 'sk-ant-abc123...'  // ← Hardcoded!
}
```

**✅ CORRETTO - Variable Interpolation:**
```typescript
config: {
  apiKey: '{{secrets.openrouter}}'  // ← Interpolato a runtime!
}
```

### 4.2 Input/Output Schemas (opzionale ma consigliato)

```typescript
inputSchema: {
  type: 'object',
  properties: {
    email: { type: 'string' },
    phone: { type: 'string' }
  },
  required: ['email']
}
```

Vantaggi:
- Validazione automatica
- Documentazione inline
- Type safety

### 4.3 Retry Policies per Block Type

Diversi blocchi richiedono diverse retry policies:

```typescript
// API esterne (possono fallire temporaneamente)
retryConfig: {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelay: 1000
}

// AI blocks (più affidabili)
retryConfig: {
  maxRetries: 1,
  backoffMultiplier: 1.5,
  initialDelay: 500
}

// Blocchi locali (raramente falliscono)
retryConfig: {
  maxRetries: 0
}
```

---

## Step 5: Definire gli Edges

### 5.1 Collegare i Blocchi

```typescript
edges: [
  {
    id: 'e1',                    // ← ID unico edge
    source: 'node-a',            // ← Nodo sorgente
    target: 'node-b',            // ← Nodo destinazione
    sourcePort: 'out',           // ← (opzionale) Porta sorgente
    targetPort: 'in',            // ← (opzionale) Porta destinazione
    condition: {                 // ← (opzionale) Routing condizionale
      field: 'score',
      operator: 'greater_than',
      value: 80
    }
  }
]
```

### 5.2 Port Naming

Di default i blocchi hanno porta `in` e `out`:

```
[node-a:out] → [node-b:in]
```

Puoi specificare porte custom:

```typescript
{
  source: 'node-a',
  sourcePort: 'results',      // ← Porta custom
  target: 'node-b',
  targetPort: 'input-data'    // ← Porta custom
}
```

### 5.3 Conditional Routing

Usa `condition` per routing dinamico:

```typescript
{
  source: 'sentiment-analysis',
  target: 'positive-leads',
  condition: {
    field: 'sentiment',
    operator: 'equals',
    value: 'positive'
  }
}
```

---

## Step 6: Validare il Workflow

### 6.1 Validazione Sintattica

```typescript
import { workflowValidator } from './workflow-engine'

const validationResult = await workflowValidator.validate(workflow)

if (!validationResult.valid) {
  console.error('❌ Validation failed!')
  validationResult.errors.forEach(error => {
    console.error(`[${error.type}] ${error.message}`)
  })
  return
}

console.log('✅ Workflow is valid!')
```

### 6.2 Tipi di Errori Comuni

#### **Error: "Duplicate node ID"**
```typescript
// ❌ SBAGLIATO
nodes: [
  { id: 'node-1', ... },
  { id: 'node-1', ... }  // ← Duplicato!
]

// ✅ CORRETTO
nodes: [
  { id: 'input-1', ... },
  { id: 'enrich-1', ... }
]
```

#### **Error: "Source node not found"**
```typescript
// ❌ SBAGLIATO
edges: [
  { source: 'missing-node', target: 'node-2' }  // ← Non esiste!
]

// ✅ CORRETTO
edges: [
  { source: 'input-1', target: 'node-2' }  // ← Esiste!
]
```

#### **Error: "Cycle detected"**
```typescript
// ❌ SBAGLIATO - Ciclo!
edges: [
  { source: 'node-1', target: 'node-2' },
  { source: 'node-2', target: 'node-1' }  // ← Ciclo!
]

// ✅ CORRETTO - DAG (Directed Acyclic Graph)
edges: [
  { source: 'node-1', target: 'node-2' },
  { source: 'node-2', target: 'node-3' }
]
```

### 6.3 Warning da Non Ignorare

```typescript
if (validationResult.warnings.length > 0) {
  console.log('⚠️  Warnings:')
  validationResult.warnings.forEach(warning => {
    console.log(`  - ${warning.message}`)
    if (warning.suggestion) {
      console.log(`    💡 ${warning.suggestion}`)
    }
  })
}
```

Warning comuni:
- "No input blocks found" → Aggiungi un nodo `input.*`
- "No output blocks found" → Aggiungi un nodo `output.*`
- "AI blocks detected. This may incur costs." → Considera costi

---

## Step 7: Eseguire il Workflow

### 7.1 Creare Execution Context

```typescript
import { ContextFactory } from './workflow-engine'

const context = ContextFactory.create({
  workflowId: workflow.workflowId,
  mode: 'production',  // 'production' | 'demo' | 'test'
  variables: {
    environment: 'production',
    version: '1.0.0'
  },
  secrets: {
    apollo: process.env.APOLLO_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY
  },
  progress: (progress, event) => {
    console.log(`[${progress}%] ${event.event}`)
    if (event.details) {
      console.log(`   Details:`, event.details)
    }
  }
})
```

### 7.2 Eseguire con WorkflowOrchestrator

```typescript
import { workflowOrchestrator } from './workflow-engine'

async function executeWorkflow(workflow, context, input) {
  try {
    const result = await workflowOrchestrator.execute(
      workflow,
      context,
      input
    )

    if (result.status === 'completed') {
      console.log('✅ Workflow completed!')
      console.log('Output:', result.output)
      console.log('Metadata:', result.metadata)
    } else {
      console.log('❌ Workflow failed:', result.error)
    }

    return result
  } catch (error) {
    console.error('❌ Execution error:', error)
    throw error
  }
}
```

### 7.3 Esempio Completo di Esecuzione

```typescript
async function runLeadEnrichment() {
  // 1. Register blocks
  registerAllBuiltInBlocks()

  // 2. Validate
  const validation = await workflowValidator.validate(leadEnrichmentWorkflow)
  if (!validation.valid) {
    console.error('Validation failed:', validation.errors)
    return
  }

  // 3. Create context
  const context = ContextFactory.create({
    workflowId: leadEnrichmentWorkflow.workflowId,
    mode: 'production',
    secrets: {
      apollo: process.env.APOLLO_API_KEY!,
      openrouter: process.env.OPENROUTER_API_KEY!
    },
    progress: (progress, event) => {
      console.log(`[${progress}%] ${event.event}`)
    }
  })

  // 4. Prepare input
  const input = {
    leads: [
      {
        email: 'mario.rossi@company.it',
        phone: '+393291234567',
        firstName: 'Mario',
        lastName: 'Rossi'
      }
    ]
  }

  // 5. Execute
  const result = await workflowOrchestrator.execute(
    leadEnrichmentWorkflow,
    context,
    input
  )

  // 6. Handle result
  if (result.status === 'completed') {
    console.log('\n✅ Enrichment completed!')
    console.log('Enriched leads:', result.output)
    console.log('\n📊 Statistics:')
    console.log(`  Total nodes: ${result.metadata.totalNodes}`)
    console.log(`  Completed: ${result.metadata.completedNodes}`)
    console.log(`  Failed: ${result.metadata.failedNodes}`)
    console.log(`  Execution time: ${result.executionTime}ms`)
  }
}

// Run
runLeadEnrichment().catch(console.error)
```

---

## Step 8: Debug e Monitoraggio

### 8.1 Progress Tracking

```typescript
context: ContextFactory.create({
  // ...
  progress: (progress, event) => {
    const timestamp = new Date(event.timestamp).toLocaleTimeString()

    console.log(`[${timestamp}] [${progress}%] ${event.event}`)

    if (event.nodeId) {
      console.log(`  Node: ${event.nodeId}`)
    }

    if (event.blockType) {
      console.log(`  Block: ${event.blockType}`)
    }

    if (event.details) {
      console.log(`  Details:`, event.details)
    }

    if (event.error) {
      console.error(`  Error: ${event.error}`)
    }
  }
})
```

### 8.2 Leggere ExecutionResult

```typescript
const result = await workflowOrchestrator.execute(workflow, context, input)

// Status
console.log('Status:', result.status)  // 'completed' | 'failed' | 'cancelled'

// Output
console.log('Output:', result.output)  // Dati finali

// Execution time
console.log('Time:', result.executionTime, 'ms')

// Per-node results
Object.entries(result.nodeResults).forEach(([nodeId, nodeResult]) => {
  console.log(`\nNode: ${nodeId}`)
  console.log(`  Status: ${nodeResult.status}`)
  console.log(`  Time: ${nodeResult.executionTime}ms`)
  console.log(`  Retries: ${nodeResult.retryCount}`)

  if (nodeResult.error) {
    console.error(`  Error: ${nodeResult.error.message}`)
  }

  // Node logs
  nodeResult.logs.forEach(log => {
    console.log(`  [${log.timestamp}] ${log.event}`)
  })
})
```

### 8.3 Timeline Events

```typescript
result.timeline.forEach(event => {
  console.log(`[${event.timestamp}] ${event.event}`)

  if (event.nodeId) {
    console.log(`  Node: ${event.nodeId}`)
  }

  if (event.details) {
    console.log(`  Details:`, event.details)
  }
})
```

### 8.4 Troubleshooting Comune

#### **Problema: Node timeout**

```typescript
// Solution: Aumenta timeout per quel nodo
{
  id: 'slow-node',
  timeout: 60000  // ← 60 secondi invece di 30
}
```

#### **Problema: API rate limiting**

```typescript
// Solution: Aggiungi retry con backoff
{
  id: 'api-node',
  retryConfig: {
    maxRetries: 5,
    backoffMultiplier: 2,
    initialDelay: 2000,
    retryableErrors: ['rate limit', 'too many requests']
  }
}
```

#### **Problema: Costi AI troppo alti**

```typescript
// Solution: Usa modello gratuito + batch
{
  id: 'ai-node',
  config: {
    model: 'mistralai/mistral-7b-instruct:free',  // ← Free model
    batchSize: 10  // ← Processa in batch
  }
}
```

#### **Problema: Workflow fallisce silenziosamente**

```typescript
// Solution: Imposta errorHandling: 'continue'
globals: {
  errorHandling: 'continue'  // ← Continua anche se un nodo fallisce
}
```

---

## 🎓 Real-World Example Completo

### Requisito

Creare un workflow che:
1. Legge un CSV di contatti
2. Filtra solo email business
3. Arricchisce con LinkedIn
4. Inferisce interessi con AI
5. Filtra solo sentiment positive
6. Salva in database

### Soluzione

```typescript
import {
  WorkflowDefinition,
  BlockType
} from './types'
import { workflowOrchestrator, ContextFactory, registerAllBuiltInBlocks } from './index'

// ============================================================
// WORKFLOW DEFINITION
// ============================================================

const contactEnrichmentWorkflow: WorkflowDefinition = {
  $schema: 'http://lume.ai/schemas/workflow-v1.json#',
  workflowId: 'contact-enrichment-complete',
  name: 'Contact Enrichment Pipeline',
  version: 1,
  description: 'Complete contact enrichment with LinkedIn, AI interests, and sentiment filtering',
  metadata: {
    author: 'Lume Team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['enrichment', 'ai', 'production']
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
    // 1. Input: CSV
    {
      id: 'input-csv',
      type: BlockType.INPUT,
      name: 'CSV Input',
      description: 'Read contacts from CSV',
      config: {
        source: 'csv',
        file: 'contacts.csv',
        format: 'semicolon'  // Italian CSV format
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
                email: { type: 'string' },
                phone: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' }
              }
            }
          }
        }
      }
    },

    // 2. Country Detection
    {
      id: 'country-detect',
      type: 'countries.config',
      name: 'Country Detection',
      description: 'Detect country from phone number',
      config: {
        phoneField: 'phone',
        fallbackCountry: 'IT'
      },
      inputSchema: null,
      outputSchema: null
    },

    // 3. Filter: Business Emails Only
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
              { field: 'email', operator: 'not_contains', value: '@libero' },
              { field: 'email', operator: 'not_contains', value: '@virgilio' }
            ]
          }
        ],
        onFail: 'skip'
      },
      inputSchema: null,
      outputSchema: null
    },

    // 4. Apollo: LinkedIn Enrichment
    {
      id: 'apollo-enrich',
      type: 'api.apollo',
      name: 'Apollo LinkedIn',
      description: 'Enrich with LinkedIn data',
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

    // 5. AI: Interest Inference
    {
      id: 'ai-interests',
      type: 'ai.interestInference',
      name: 'AI Interest Inference',
      description: 'Infer interests from LinkedIn bio',
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

    // 6. AI: Sentiment Analysis
    {
      id: 'ai-sentiment',
      type: 'ai.sentimentAnalysis',
      name: 'Sentiment Analysis',
      description: 'Analyze sentiment of bio/posts',
      config: {
        apiToken: '{{secrets.openrouter}}',
        textField: 'bio',
        model: 'mistralai/mistral-7b-instruct:free',
        granularity: 'document'
      },
      inputSchema: null,
      outputSchema: null
    },

    // 7. Filter: Positive Sentiment Only
    {
      id: 'filter-positive',
      type: 'filter',
      name: 'Filter Positive',
      description: 'Keep only positive/neutral sentiment',
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

    // 8. Output: Database
    {
      id: 'output-db',
      type: 'output.database',
      name: 'Save to Database',
      description: 'Save enriched contacts to database',
      config: {
        table: 'enriched_contacts',
        mode: 'upsert',
        keyFields: ['email']
      },
      inputSchema: null,
      outputSchema: null
    }
  ],
  edges: [
    { id: 'e1', source: 'input-csv', target: 'country-detect' },
    { id: 'e2', source: 'country-detect', target: 'filter-business' },
    { id: 'e3', source: 'filter-business', target: 'apollo-enrich' },
    { id: 'e4', source: 'apollo-enrich', target: 'ai-interests' },
    { id: 'e5', source: 'ai-interests', target: 'ai-sentiment' },
    { id: 'e6', source: 'ai-sentiment', target: 'filter-positive' },
    { id: 'e7', source: 'filter-positive', target: 'output-db' }
  ]
}

// ============================================================
// EXECUTION
// ============================================================

async function runContactEnrichment() {
  console.log('🚀 Starting Contact Enrichment Pipeline\n')

  // 1. Register blocks
  registerAllBuiltInBlocks()
  console.log('✅ Blocks registered\n')

  // 2. Validate
  console.log('📋 Validating workflow...')
  const validation = await workflowValidator.validate(contactEnrichmentWorkflow)
  if (!validation.valid) {
    console.error('❌ Validation failed!')
    validation.errors.forEach(err => console.error(`  - ${err.message}`))
    return
  }
  console.log('✅ Workflow valid\n')

  // 3. Create context
  const context = ContextFactory.create({
    workflowId: contactEnrichmentWorkflow.workflowId,
    mode: 'production',
    secrets: {
      apollo: process.env.APOLLO_API_KEY!,
      openrouter: process.env.OPENROUTER_API_KEY!,
      supabaseUrl: process.env.SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_KEY!
    },
    progress: (progress, event) => {
      const icons = {
        'layer_completed': '✓',
        'node_completed': '✓',
        'node_failed': '❌',
        'default': '→'
      }
      const icon = icons[event.event as keyof typeof icons] || icons.default
      console.log(`  ${icon} [${progress}%] ${event.event}`)
    }
  })

  // 4. Execute
  console.log('⚡ Executing workflow...\n')
  const result = await workflowOrchestrator.execute(
    contactEnrichmentWorkflow,
    context,
    null  // Input da config, non necessario
  )

  // 5. Report
  console.log('\n' + '='.repeat(60))
  console.log('EXECUTION REPORT')
  console.log('='.repeat(60))

  console.log(`\nStatus: ${result.status}`)
  console.log(`Time: ${result.executionTime}ms`)
  console.log(`\nNodes: ${result.metadata.totalNodes}`)
  console.log(`  Completed: ${result.metadata.completedNodes}`)
  console.log(`  Failed: ${result.metadata.failedNodes}`)
  console.log(`  Skipped: ${result.metadata.skippedNodes}`)

  if (result.status === 'completed') {
    console.log('\n✅ Pipeline completed successfully!')
  } else {
    console.error('\n❌ Pipeline failed:', result.error?.message)
  }

  return result
}

// Run
if (require.main === module) {
  runContactEnrichment().catch(console.error)
}

export { runContactEnrichment, contactEnrichmentWorkflow }
```

---

## 📚 Risorse Aggiuntive

- [Block Quick Reference](./BLOCKS-QUICK-REFERENCE.md) - Reference card rapida blocchi
- [Block Reusability Guide](./BLOCK-REUSABILITY-GUIDE.md) - Architettura e best practices
- [Block Reusability Examples](./examples/block-reusability-examples.ts) - Esempi concreti
- [Workflow Templates](./examples/workflow-templates.ts) - 5 templates pronti

---

**Buon workflow building! 🚀**
