# Workflow Engine - Project Plan
## Architettura a Blocchi Configurabile per Lead Enrichment Pipeline

**Status:** Proposed
**Version:** 1.0
**Date:** 2026-01-09
**Focus:** Setup motore di workflow configurabile con blocchi assemblabili

---

## Executive Summary

Questo documento definisce il piano di progetto per trasformare l'attuale workflow "cablato a codice" in un **motore di workflow configurabile basato su blocchi**. Il nuovo sistema permetterà di definire pipeline di lead enrichment attraverso configurazione JSON (Fase 1) e futura editor visuale (Fase 2).

### Obiettivo Principale
Creare un **deterministic workflow engine** che esegua grafi aciclici diretti (DAG) composti da nodi/blocchi, ognuno con input/output espliciti, configurazione runtime, e logging integrato.

### Current State Analysis
Attualmente il workflow è implementato in `/app/api/source-audiences/start/route.ts` (funzione `processSearchJob`):

```
STEP 1: Apify Scraping (linee 760-915)
  ↓
STEP 2: LLM Extraction (linee 917-1022)
  ↓
STEP 3: Apollo Enrichment (linee 1045-1138)
  ↓
STEP 4: Hunter.io Email Finder (linee 1140+)
  ↓
STEP 5: Vector Embeddings (linee 1328-1465)
  ↓
STEP 6: Database Storage (linee 1468-1554)
```

**Problemi dell'architettura attuale:**
- ❌ Pipeline hardcoded nel codice (nessuna flessibilità)
- ❌ Difficile aggiungere/rimuovere step senza modificare codice
- ❌ Impossibile testare singoli step in isolamento
- ❌ Nessuna visualizzazione del flusso dati
- ❌ Difficile riutilizzare componenti tra workflow diversi
- ❌ Configurazione sparsa (batch sizes, limiti, costi)
- ❌ Impossibile A/B testare diverse configurazioni

---

## Architettura Proposta

### Componenti Chiave

```
┌─────────────────────────────────────────────────────────────┐
│                    Workflow Engine Core                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Executor   │  │  Validator   │  │   Logger     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Block Registry                          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │Input│ │API  │ │ AI  │ │Trans│ │Filtr│ │Merge│ │Outpt│  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Workflow Storage                            │
│  - Workflow definitions (JSON schema)                       │
│  - Execution history                                        │
│  - Block configurations                                     │
└─────────────────────────────────────────────────────────────┘
```

### Schema JSON del Workflow

```json
{
  "$schema": "http://lume.ai/schemas/workflow-v1.json#",
  "workflowId": "lead-enrichment-v1",
  "name": "Lead Enrichment with Interest Inference",
  "version": 1,
  "description": "Complete lead enrichment pipeline from social URLs to enriched contacts",
  "metadata": {
    "author": "system",
    "createdAt": "2026-01-09T10:00:00Z",
    "updatedAt": "2026-01-09T10:00:00Z",
    "tags": ["enrichment", "social", "lead-gen"]
  },
  "globals": {
    "timeout": 3600,
    "retryPolicy": {
      "maxRetries": 3,
      "backoffMultiplier": 2,
      "initialDelay": 1000
    },
    "errorHandling": "continue"
  },
  "nodes": [
    {
      "id": "input-1",
      "type": "input",
      "name": "Source Audience Input",
      "description": "Receive source audience URLs from database",
      "config": {
        "source": "database",
        "query": "source_audiences",
        "fields": ["id", "name", "type", "urls"]
      },
      "inputSchema": null,
      "outputSchema": {
        "$id": "#/schemas/sourceAudience",
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "type": { "enum": ["facebook", "instagram"] },
          "urls": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["id", "type", "urls"]
      }
    },
    {
      "id": "scraper-1",
      "type": "api",
      "name": "Apify Comment Scraper",
      "description": "Fetch comments from social media URLs",
      "config": {
        "provider": "apify",
        "actor": {
          "facebook": "apify/facebook-comments-scraper",
          "instagram": "apify/instagram-comment-scraper"
        },
        "limits": {
          "facebook": 100,
          "instagram": 1000
        },
        "mapping": {
          "url": "{{input.urls}}",
          "platform": "{{input.type}}"
        }
      },
      "inputSchema": {
        "$ref": "#/schemas/sourceAudience"
      },
      "outputSchema": {
        "$id": "#/schemas/scrapedComments",
        "type": "object",
        "properties": {
          "comments": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": { "type": "string" },
                "text": { "type": "string" },
                "from": {
                  "type": "object",
                  "properties": {
                    "username": { "type": "string" },
                    "name": { "type": "string" }
                  }
                },
                "timestamp": { "type": "string", "format": "date-time" }
              }
            }
          },
          "metadata": {
            "type": "object",
            "properties": {
              "totalComments": { "type": "number" },
              "urlsProcessed": { "type": "number" },
              "platform": { "type": "string" }
            }
          }
        }
      },
      "retryConfig": {
        "maxRetries": 2,
        "retryableErrors": ["TIMEOUT", "RATE_LIMIT", "SERVER_ERROR"]
      }
    },
    {
      "id": "llm-1",
      "type": "ai",
      "name": "Contact Extraction LLM",
      "description": "Extract structured contacts from unstructured comments",
      "config": {
        "provider": "openrouter",
        "model": "mistralai/mistral-7b-instruct:free",
        "promptTemplate": "extract-contacts-from-comments",
        "batchSize": 50,
        "mapping": {
          "comments": "{{input.comments}}"
        }
      },
      "inputSchema": {
        "$ref": "#/schemas/scrapedComments"
      },
      "outputSchema": {
        "$id": "#/schemas/extractedContacts",
        "type": "object",
        "properties": {
          "contacts": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "firstName": { "type": "string" },
                "lastName": { "type": "string" },
                "email": { "type": "string", "format": "email" },
                "phone": { "type": "string" },
                "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
              }
            }
          },
          "metadata": {
            "type": "object",
            "properties": {
              "totalContacts": { "type": "number" },
              "modelUsed": { "type": "string" },
              "processingTime": { "type": "number" }
            }
          }
        }
      }
    },
    {
      "id": "enrichment-1",
      "type": "api",
      "name": "Apollo.io Enrichment",
      "description": "Enrich contacts with professional data",
      "config": {
        "provider": "apollo",
        "endpoint": "/api/v1/people/match",
        "batchMode": false,
        "mapping": {
          "email": "{{input.email}}",
          "firstName": "{{input.firstName}}",
          "lastName": "{{input.lastName}}"
        },
        "fieldMapping": {
          "title": "title",
          "company": "employment_history[0].organization_name",
          "linkedin": "linkedin_url",
          "phone": "contact.phone_numbers[0].raw_number"
        }
      },
      "inputSchema": {
        "$ref": "#/schemas/extractedContacts"
      },
      "outputSchema": {
        "$id": "#/schemas/enrichedContacts",
        "type": "object",
        "properties": {
          "contacts": {
            "type": "array",
            "items": {
              "allOf": [
                { "$ref": "#/schemas/extractedContacts/properties/contacts/items" },
                {
                  "type": "object",
                  "properties": {
                    "title": { "type": "string" },
                    "company": { "type": "string" },
                    "linkedinUrl": { "type": "string", "format": "uri" },
                    "phone": { "type": "string" },
                    "enriched": { "type": "boolean" },
                    "enrichedAt": { "type": "string", "format": "date-time" }
                  }
                }
              ]
            }
          },
          "enrichmentStats": {
            "type": "object",
            "properties": {
              "totalEnriched": { "type": "number" },
              "successfulEnrichments": { "type": "number" },
              "failedEnrichments": { "type": "number" },
              "cost": { "type": "number" }
            }
          }
        }
      }
    },
    {
      "id": "email-finder-1",
      "type": "api",
      "name": "Hunter.io Email Finder",
      "description": "Find missing emails for contacts without email",
      "config": {
        "provider": "hunter",
        "endpoint": "/v2/email-finder",
        "condition": {
          "field": "email",
          "operator": "empty"
        },
        "mapping": {
          "firstName": "{{input.firstName}}",
          "lastName": "{{input.lastName}}",
          "company": "{{input.company}}"
        }
      },
      "inputSchema": {
        "$ref": "#/schemas/enrichedContacts"
      },
      "outputSchema": {
        "$ref": "#/schemas/enrichedContacts"
      }
    },
    {
      "id": "filter-1",
      "type": "filter",
      "name": "Valid Contacts Filter",
      "description": "Filter out contacts with invalid or missing data",
      "config": {
        "conditions": [
          {
            "field": "email",
            "operator": "exists"
          },
          {
            "operator": "or",
            "conditions": [
              { "field": "firstName", "operator": "exists" },
              { "field": "lastName", "operator": "exists" }
            ]
          }
        ],
        "onFail": "skip"
      },
      "inputSchema": {
        "$ref": "#/schemas/enrichedContacts"
      },
      "outputSchema": {
        "$ref": "#/schemas/enrichedContacts"
      }
    },
    {
      "id": "embeddings-1",
      "type": "api",
      "name": "Vector Embeddings Generation",
      "description": "Generate embeddings for semantic search",
      "config": {
        "provider": "mixedbread",
        "model": "mxbai-embed-large-v1",
        "batchSize": 10,
        "fields": ["firstName", "lastName", "company", "title", "bio"],
        "outputField": "embedding"
      },
      "inputSchema": {
        "$ref": "#/schemas/enrichedContacts"
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "contacts": {
            "type": "array",
            "items": {
              "allOf": [
                { "$ref": "#/schemas/enrichedContacts/properties/contacts/items" },
                {
                  "type": "object",
                  "properties": {
                    "embedding": {
                      "type": "array",
                      "items": { "type": "number" },
                      "minItems": 1024,
                      "maxItems": 1024
                    }
                  }
                }
              ]
            }
          }
        }
      }
    },
    {
      "id": "output-1",
      "type": "output",
      "name": "Database Storage",
      "description": "Store enriched contacts as Shared Audience",
      "config": {
        "destination": "database",
        "table": "shared_audiences",
        "mapping": {
          "sourceAudienceId": "{{workflow.input.id}}",
          "contacts": "{{input.contacts}}",
          "metadata": "{{input.metadata}}"
        },
        "createRelation": true
      },
      "inputSchema": {
        "$ref": "#/schemas/enrichedContacts"
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "sharedAudienceId": { "type": "string" },
          "contactsCount": { "type": "number" },
          "storedAt": { "type": "string", "format": "date-time" }
        }
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "input-1", "target": "scraper-1", "sourcePort": "out", "targetPort": "in" },
    { "id": "e2", "source": "scraper-1", "target": "llm-1", "sourcePort": "out", "targetPort": "in" },
    { "id": "e3", "source": "llm-1", "target": "enrichment-1", "sourcePort": "out", "targetPort": "in" },
    { "id": "e4", "source": "enrichment-1", "target": "email-finder-1", "sourcePort": "out", "targetPort": "in" },
    { "id": "e5", "source": "email-finder-1", "target": "filter-1", "sourcePort": "out", "targetPort": "in" },
    { "id": "e6", "source": "filter-1", "target": "embeddings-1", "sourcePort": "out", "targetPort": "in" },
    { "id": "e7", "source": "embeddings-1", "target": "output-1", "sourcePort": "out", "targetPort": "in" }
  ],
  "schemas": {
    "sourceAudience": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "type": { "enum": ["facebook", "instagram"] },
        "urls": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["id", "type", "urls"]
    }
  }
}
```

---

## Tipi di Blocchi (Block Types)

### 1. Input Block
**Scopo:** Origine dei dati nel workflow

**Configurazione:**
```json
{
  "type": "input",
  "config": {
    "source": "database | upload | api | webhook",
    "query": "...",
    "fields": [...]
  }
}
```

**Implementazioni:**
- `DatabaseInput`: Legge da database Supabase
- `UploadInput`: Riceve file upload (CSV, JSON)
- `APIInput`: Trigger da API endpoint
- `WebhookInput`: Riceve webhook

### 2. API Block
**Scopo:** Chiama servizi esterni (Apify, Apollo, Hunter, etc.)

**Configurazione:**
```json
{
  "type": "api",
  "config": {
    "provider": "apify | apollo | hunter | custom",
    "endpoint": "...",
    "method": "GET | POST",
    "mapping": { "param": "{{input.field}}" },
    "batchMode": true | false,
    "batchSize": 50
  }
}
```

**Implementazioni:**
- `ApifyScraperBlock`: Wrapper per ApifyScraperService
- `ApolloEnrichmentBlock`: Wrapper per ApolloService
- `HunterEmailFinderBlock`: Wrapper per Hunter.io
- `HunterEmailVerifierBlock`: Wrapper per Hunter verification
- `MixedbreadEmbeddingsBlock`: Wrapper per Mixedbread service
- `GenericAPIBlock`: Per qualsiasi endpoint HTTP

### 3. AI Block
**Scopo:** Processamento con LLM/AI

**Configurazione:**
```json
{
  "type": "ai",
  "config": {
    "provider": "openrouter | openai | anthropic",
    "model": "...",
    "promptTemplate": "...",
    "temperature": 0.7,
    "maxTokens": 1000,
    "mapping": { "var": "{{input.field}}" }
  }
}
```

**Implementazioni:**
- `OpenRouterBlock`: Per OpenRouter service
- `ContactExtractionBlock`: Specializzato per estrazione contatti
- `InterestInferenceBlock`: Per inferenza interessi
- `SentimentAnalysisBlock`: Per analisi sentiment

### 4. Transform Block
**Scopo:** Trasforma, normalizza, mapping dati

**Configurazione:**
```json
{
  "type": "transform",
  "config": {
    "operations": [
      {
        "type": "map | rename | calculate | format",
        "field": "...",
        "transformation": "..."
      }
    ]
  }
}
```

**Implementazioni:**
- `FieldMappingBlock`: Rinomina/riorganizza campi
- `DataNormalizationBlock`: Normalizza formati (date, phone, etc.)
- `DeduplicationBlock`: Rimuove duplicati
- `CalculateFieldBlock`: Calcola campi derivati

### 5. Filter Block
**Scopo:** Filtra dati basato su condizioni

**Configurazione:**
```json
{
  "type": "filter",
  "config": {
    "conditions": [
      {
        "field": "email",
        "operator": "exists | equals | contains | regex",
        "value": "..."
      }
    ],
    "onFail": "skip | error"
  }
}
```

**Implementazioni:**
- `FieldFilterBlock`: Filtra per campo
- `ValidationFilterBlock`: Valida dati
- `CustomFilterBlock`: Condizioni custom JavaScript

### 6. Branch Block
**Scopo:** Routing condizionale (if/else)

**Configurazione:**
```json
{
  "type": "branch",
  "config": {
    "condition": {
      "field": "...",
      "operator": "...",
      "value": "..."
    },
    "branches": {
      "true": "node-id-1",
      "false": "node-id-2"
    }
  }
}
```

### 7. Merge Block
**Scopo:** Unisce output multipli

**Configurazione:**
```json
{
  "type": "merge",
  "config": {
    "strategy": "deepMerge | append | zip",
    "sources": ["input-1", "input-2"]
  }
}
```

### 8. Output Block
**Scopo:** Destinazione finale dati

**Configurazione:**
```json
{
  "type": "output",
  "config": {
    "destination": "database | csv | json | webhook | api",
    "format": "csv | json | parquet"
  }
}
```

**Implementazioni:**
- `DatabaseOutput`: Scrive su database
- `CSVOutput`: Genera CSV download
- `JSONOutput`: Genera JSON download
- `WebhookOutput': Invia a webhook
- `MetaAdsOutput`: Carica su Meta Ads

---

## Piano di Implementazione

### FASE 1: Core Workflow Engine (2-3 settimane)

#### Sprint 1.1: Foundation (3-4 giorni)
**Obiettivo:** Creare struttura base del motore

**Task:**
1. **Definizione TypeScript Types**
   - `WorkflowDefinition`: Tipo completo per workflow
   - `NodeDefinition`: Tipo per nodi
   - `EdgeDefinition`: Tipo per connessioni
   - `BlockType`: Enum per tipi blocco
   - `ExecutionResult`: Tipo per risultati esecuzione
   - `ExecutionContext`: Contesto esecuzione (variables, secrets, etc.)

2. **Workflow Validator**
   - Validazione schema JSON
   - Verifica aciclicità del grafo (DAG check)
   - Validazione input/output schemas
   - Validazione connessioni (type checking)

3. **Block Registry**
   - Registro centrale dei tipi blocco
   - Factory pattern per creare istanze blocchi
   - Sistema di plugin per blocchi custom

4. **Execution Context Manager**
   - Gestione variables ({{input.field}})
   - Gestione secrets (API keys)
   - Gestione stato globale del workflow
   - Gestione logging integrato

**Deliverables:**
- `/lib/workflow-engine/types/` - Tutti i tipi TypeScript
- `/lib/workflow-engine/validator.ts` - Workflow validator
- `/lib/workflow-engine/registry.ts` - Block registry
- `/lib/workflow-engine/context.ts` - Execution context manager

---

#### Sprint 1.2: Block Executor (4-5 giorni)
**Obiettivo:** Implementare executor che esegue nodi

**Task:**
1. **Block Executor Interface**
   ```typescript
   interface BlockExecutor {
     execute(
       config: BlockConfig,
       input: any,
       context: ExecutionContext
     ): Promise<ExecutionResult>
   }
   ```

2. **Core Executor Implementation**
   - Gestione sincrona/asincrona
   - Error handling con retry policy
   - Timeout handling
   - Memory management
   - Progress tracking

3. **Variable Interpolation**
   - Parser per template variables: `{{input.field}}`
   - Nested path resolution: `{{user.profile.name}}`
   - Function calls: `{{uppercase(input.name)}}`
   - Secret access: `{{secrets.apiKey}}`

4. **Schema Validation Runtime**
   - Validazione input contro inputSchema
   - Validazione output contro outputSchema
   - Type coercion e conversion
   - Error messages dettagliati

**Deliverables:**
- `/lib/workflow-engine/executor.ts` - Core executor
- `/lib/workflow-engine/interpolation.ts` - Variable parser
- `/lib/workflow-engine/schema-validator.ts` - Runtime schema validator

---

#### Sprint 1.3: Workflow Orchestrator (4-5 giorni)
**Obiettivo:** Implementare orchestrazione DAG

**Task:**
1. **DAG Executor**
   - Topological sort del grafo
   - Gestione dipendenze tra nodi
   - Esecuzione parallela di nodi indipendenti
   - Gestione errori e fallback

2. **State Management**
   - Tracking stato ogni nodo
   - Passaggio dati tra nodi
   - Gestione output multipli (merge)
   - Gestione branching

3. **Logging & Observability**
   - Structured logging per ogni blocco
   - Timeline events (come job processor)
   - Performance metrics (execution time, memory)
   - Error tracking

4. **Progress Tracking**
   - Calcolo progresso workflow
   - Aggiornamento real-time
   - Estensione sistema job esistente

**Deliverables:**
- `/lib/workflow-engine/orchestrator.ts` - DAG executor
- `/lib/workflow-engine/logger.ts` - Structured logger
- `/lib/workflow-engine/progress.ts` - Progress tracker

---

### FASE 2: Block Implementations (2-3 settimane)

#### Sprint 2.1: Core Blocks (5 giorni)
**Obiettivo:** Implementare blocchi fondamentali

**Task:**
1. **Input Blocks**
   - `DatabaseInputBlock`
   - `UploadInputBlock`
   - `StaticInputBlock`

2. **Output Blocks**
   - `DatabaseOutputBlock`
   - `CSVOutputBlock`
   - `JSONOutputBlock`

3. **Transform Blocks**
   - `FieldMappingBlock`
   - `DataNormalizationBlock`
   - `DeduplicationBlock`

4. **Filter Blocks**
   - `FieldFilterBlock`
   - `ValidationFilterBlock`

**Deliverables:**
- `/lib/workflow-engine/blocks/input/`
- `/lib/workflow-engine/blocks/output/`
- `/lib/workflow-engine/blocks/transform/`
- `/lib/workflow-engine/blocks/filter/`

---

#### Sprint 2.2: API Blocks (5 giorni)
**Obiettivo:** Implementare blocchi per servizi esterni

**Task:**
1. **Refactor existing services to blocks**
   - `ApifyScraperBlock` (da ApifyScraperService)
   - `ApolloEnrichmentBlock` (da ApolloService)
   - `HunterEmailFinderBlock` (da HunterService)
   - `HunterEmailVerifierBlock` (da HunterService)
   - `MixedbreadEmbeddingsBlock` (da MixedbreadService)

2. **Generic API Block**
   - `GenericAPIBlock` per qualsiasi endpoint HTTP
   - Supporto authentication (Bearer, API key, OAuth)
   - Request/response transformation
   - Error handling

3. **Batch Processing**
   - Sistema batch per API calls
   - Rate limiting integrato
   - Retry con backoff

**Deliverables:**
- `/lib/workflow-engine/blocks/api/apify-scraper.block.ts`
- `/lib/workflow-engine/blocks/api/apollo-enrichment.block.ts`
- `/lib/workflow-engine/blocks/api/hunter-email-finder.block.ts`
- `/lib/workflow-engine/blocks/api/hunter-email-verifier.block.ts`
- `/lib/workflow-engine/blocks/api/mixedbread-embeddings.block.ts`
- `/lib/workflow-engine/blocks/api/generic-api.block.ts`

---

#### Sprint 2.3: AI Blocks (5 giorni)
**Obiettivo:** Implementare blocchi AI/LLM

**Task:**
1. **OpenRouter Block**
   - `OpenRouterBlock` - Generico per OpenRouter
   - Configurazione model selection
   - Prompt template system
   - Response parsing

2. **Specialized AI Blocks**
   - `ContactExtractionBlock` - Estrazione contatti da testo
   - `InterestInferenceBlock` - Inferenza interessi
   - `SentimentAnalysisBlock` - Analisi sentiment

3. **Prompt Template System**
   - Template engine per prompts
   - Variable substitution
   - Few-shot examples management
   - Versioning prompts

**Deliverables:**
- `/lib/workflow-engine/blocks/ai/openrouter.block.ts`
- `/lib/workflow-engine/blocks/ai/contact-extraction.block.ts`
- `/lib/workflow-engine/blocks/ai/interest-inference.block.ts`
- `/lib/workflow-engine/prompts/` - Prompt templates

---

### FASE 3: Integration & Migration (2 settimane)

#### Sprint 3.1: Database Schema (3 giorni)
**Obiettivo:** Estendere database per workflows

**Task:**
1. **Nuove tabelle**
   ```sql
   -- Workflow definitions
   CREATE TABLE workflows (
     id UUID PRIMARY KEY,
     workflow_id TEXT UNIQUE NOT NULL,
     name TEXT NOT NULL,
     version INT NOT NULL,
     definition JSONB NOT NULL,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Workflow executions
   CREATE TABLE workflow_executions (
     id UUID PRIMARY KEY,
     workflow_id TEXT NOT NULL REFERENCES workflows(workflow_id),
     source_audience_id UUID REFERENCES source_audiences(id),
     status TEXT NOT NULL,
     input_data JSONB,
     output_data JSONB,
     error_message TEXT,
     started_at TIMESTAMPTZ DEFAULT NOW(),
     completed_at TIMESTAMPTZ,
     execution_time_ms INT
   );

   -- Block executions
   CREATE TABLE block_executions (
     id UUID PRIMARY KEY,
     workflow_execution_id UUID REFERENCES workflow_executions(id),
     node_id TEXT NOT NULL,
     block_type TEXT NOT NULL,
     status TEXT NOT NULL,
     input_data JSONB,
     output_data JSONB,
     error_message TEXT,
     started_at TIMESTAMPTZ DEFAULT NOW(),
     completed_at TIMESTAMPTZ,
     execution_time_ms INT,
     retry_count INT DEFAULT 0
   );

   -- Workflow templates
   CREATE TABLE workflow_templates (
     id UUID PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     category TEXT,
     definition JSONB NOT NULL,
     is_system_template BOOLEAN DEFAULT false,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Migration**
   - Creazione migration Supabase
   - Indici per performance
   - Row Level Security policies

**Deliverables:**
- `/supabase/migrations/002_workflows_schema.sql`

---

#### Sprint 3.2: Job Processor Integration (4 giorni)
**Obiettivo:** Integrare workflow engine con job processor

**Task:**
1. **Extend Job Types**
   - Aggiungere `WORKFLOW` job type
   - Aggiornare JobProcessor per gestire workflows

2. **Workflow Job Handler**
   ```typescript
   async function processWorkflowJob(job: Job, update: ProgressUpdateFn) {
     // 1. Load workflow definition
     // 2. Initialize execution context
     // 3. Execute workflow DAG
     // 4. Store results
     // 5. Update progress
   }
   ```

3. **Progress Tracking Extension**
   - Mappare block execution a progress
   - Eventi dettagliati per ogni blocco
   - Error recovery

4. **Backward Compatibility**
   - Mantenere vecchio `processSearchJob`
   - Migrazione graduale a workflows

**Deliverables:**
- Update `/lib/services/job-processor.ts`
- `/lib/workflow-engine/job-handler.ts`

---

#### Sprint 3.3: API Endpoints (3 giorni)
**Obiettivo:** Creare API per gestione workflows

**Task:**
1. **Workflow CRUD**
   - `POST /api/workflows` - Create workflow
   - `GET /api/workflows` - List workflows
   - `GET /api/workflows/:id` - Get workflow
   - `PUT /api/workflows/:id` - Update workflow
   - `DELETE /api/workflows/:id` - Delete workflow

2. **Workflow Execution**
   - `POST /api/workflows/:id/execute` - Execute workflow
   - `GET /api/workflows/executions/:id` - Get execution status
   - `GET /api/workflows/:id/executions` - List executions

3. **Block Testing**
   - `POST /api/workflows/blocks/:type/test` - Test single block
   - `POST /api/workflows/:id/validate` - Validate workflow

**Deliverables:**
- `/app/api/workflows/` - API endpoints

---

### FASE 4: Configuration & Templates (1 settimana)

#### Sprint 4.1: Default Workflows (3 giorni)
**Obiettivo:** Creare workflow templates predefiniti

**Task:**
1. **Standard Source Audience Workflow**
   - Ricreare workflow attuale con blocchi
   - Configurazione ottimale
   - Documentazione

2. **Alternative Workflows**
   - "Quick Enrichment" - Solo Apollo, niente scraping
   - "Deep Enrichment" - Tutti gli step
   - "Email Only" - Solo email finder/verifier
   - "Social Only" - Solo scraping + LLM

3. **Workflow Templates System**
   - Template con placeholders
   - Versioning templates
   - Import/export templates

**Deliverables:**
- `/lib/workflow-engine/templates/` - Workflow templates JSON
- `/lib/workflow-engine/templates/index.ts` - Template loader

---

#### Sprint 4.2: Configuration Management (2 giorni)
**Obiettivo:** Sistema di gestione configurazione

**Task:**
1. **Environment-based Configuration**
   - Dev/Staging/Prod configs
   - Feature flags per nuove features
   - Secret management

2. **Block Configurations**
   - Configurazioni predefinite per ogni blocco
   - Override settings per specific workflow
   - Cost estimates per blocco

3. **Validation Rules**
   - Regole di business
   - Limiti e soglie
   - Policy enforcement

**Deliverables:**
- `/lib/workflow-engine/config/` - Configuration files
- `/lib/workflow-engine/validation-rules.ts` - Business rules

---

### FASE 5: Testing & Quality (1 settimana)

#### Sprint 5.1: Unit Testing (3 giorni)
**Obiettivo:** Test completo engine

**Task:**
1. **Core Engine Tests**
   - Workflow validator tests
   - Block executor tests
   - Orchestrator tests
   - Variable interpolation tests

2. **Block Tests**
   - Test per ogni blocco
   - Mock per servizi esterni
   - Error scenarios

3. **Integration Tests**
   - End-to-end workflow tests
   - Database integration
   - Job processor integration

**Deliverables:**
- `/lib/workflow-engine/**/*.test.ts` - Unit tests
-覆盖率 > 80%

---

#### Sprint 5.2: Demo & Documentation (2 giorni)
**Obiettivo:** Demo e documentazione

**Task:**
1. **Demo Workflow**
   - Setup audience demo
   - Esecuzione workflow completo
   - Visualizzazione risultati

2. **Technical Documentation**
   - Architettura engine
   - Guida sviluppo blocchi
   - API reference
   - Esempi workflow

3. **User Documentation**
   - Guida creazione workflow
   - Template library
   - Troubleshooting

**Deliverables:**
- `/docs/workflow-engine/` - Documentation
- Demo setup
- README aggiornato

---

## Roadmap Completa

``│
│  FASE 1: Core Engine (3 settimane)
│  ├─ Sprint 1.1: Foundation (4 giorni)
│  ├─ Sprint 1.2: Block Executor (5 giorni)
│  └─ Sprint 1.3: Orchestrator (5 giorni)
│
├── FASE 2: Block Implementations (3 settimane)
│  ├─ Sprint 2.1: Core Blocks (5 giorni)
│  ├─ Sprint 2.2: API Blocks (5 giorni)
│  └─ Sprint 2.3: AI Blocks (5 giorni)
│
├── FASE 3: Integration (2 settimane)
│  ├─ Sprint 3.1: Database Schema (3 giorni)
│  ├─ Sprint 3.2: Job Processor Integration (4 giorni)
│  └─ Sprint 3.3: API Endpoints (3 giorni)
│
├── FASE 4: Configuration (1 settimana)
│  ├─ Sprint 4.1: Default Workflows (3 giorni)
│  └─ Sprint 4.2: Config Management (2 giorni)
│
└── FASE 5: Testing (1 settimana)
   ├─ Sprint 5.1: Testing (3 giorni)
   └─ Sprint 5.2: Demo & Docs (2 giorni)

Total: 10-12 settimane
```

---

## Vantaggi dell'Architettura Proposta

### 1. **Modularità**
- Ogni blocco è indipendente e riutilizzabile
- Facile aggiungere nuovi blocchi senza toccare l'engine
- Composizione di workflow complessi da blocchi semplici

### 2. **Configurability**
- Workflow definiti da JSON, non codice
- Configurazione runtime senza deploy
- A/B testing di diversi workflow
- Personalizzazione per cliente/caso d'uso

### 3. **Testability**
- Testing unitario di singoli blocchi
- Testing integrazione workflow
- Demo mode per blocchi (mock responses)
- Testing produzione con subset dati

### 4. **Observability**
- Logging granulare per blocco
- Performance metrics per blocco
- Cost tracking per blocco
- Debugging facilitato

### 5. **Scalability**
- Esecuzione parallela di nodi indipendenti
- Batch processing ottimizzato
- Gestione errori graceful
- Rate limiting integrato

### 6. **Extensibility**
- Plugin system per blocchi custom
- Supporto nuovi provider con minimo codice
- Template versioning
- Workflow marketplace (future)

### 7. **UI-Ready**
- Schema JSON compatibile con React Flow
- Visual editor possibile in Fase 2
- Drag & drop interface
- Real-time preview

### 8. **Type Safety**
- TypeScript strict mode
- JSON Schema validation
- Input/output type checking runtime
- Auto-completion in IDE

---

## Esempio: Migrazione Workflow Attuale

### Before (Hardcoded)
```typescript
// /app/api/source-audiences/start/route.ts:760-1554
async function processSearchJob(...) {
  // STEP 1: Apify Scraping (100+ lines)
  const comments = await apifyService.fetchInstagramComments(url)

  // STEP 2: LLM Extraction (100+ lines)
  const contacts = await openRouterService.extractComments(comments)

  // STEP 3: Apollo Enrichment (100+ lines)
  for (const contact of contacts) {
    await apolloService.enrichPerson(contact)
  }

  // STEP 4: Hunter Email Finder (50+ lines)
  // STEP 5: Embeddings (50+ lines)
  // STEP 6: Storage (50+ lines)
}
```

### After (Configurable)
```json
// workflows/source-audience-standard.json
{
  "workflowId": "source-audience-standard",
  "name": "Standard Source Audience Processing",
  "nodes": [
    { "id": "input", "type": "input", "config": {...} },
    { "id": "scraper", "type": "api", "config": {...} },
    { "id": "llm", "type": "ai", "config": {...} },
    { "id": "enrichment", "type": "api", "config": {...} },
    { "id": "output", "type": "output", "config": {...} }
  ],
  "edges": [
    { "source": "input", "target": "scraper" },
    { "source": "scraper", "target": "llm" },
    { "source": "llm", "target": "enrichment" },
    { "source": "enrichment", "target": "output" }
  ]
}
```

```typescript
// Esecuzione
const result = await workflowEngine.execute({
  workflowId: 'source-audience-standard',
  input: { sourceAudienceId: 'abc-123' }
})
```

---

## Testing Strategy

### Unit Testing (per blocco)
```typescript
describe('ApifyScraperBlock', () => {
  it('should fetch Instagram comments', async () => {
    const block = new ApifyScraperBlock()
    const result = await block.execute({
      url: 'https://instagram.com/p/ABC123'
    }, mockContext)

    expect(result.status).toBe('success')
    expect(result.output.comments).toBeDefined()
  })

  it('should handle rate limit errors', async () => {
    // Test retry logic
  })

  it('should validate input schema', async () => {
    // Test validation
  })
})
```

### Integration Testing (workflow completo)
```typescript
describe('Standard Source Audience Workflow', () => {
  it('should execute complete workflow', async () => {
    const workflow = loadWorkflow('source-audience-standard')
    const result = await engine.execute(workflow, {
      sourceAudienceId: testAudience.id
    })

    expect(result.status).toBe('completed')
    expect(result.output.contactsCount).toBeGreaterThan(0)
  })
})
```

### Demo Mode Testing
```typescript
// Mock responses per testing senza costi
const demoContext = new ExecutionContext({
  mode: 'demo',
  mocks: {
    apify: { comments: mockComments },
    apollo: { person: mockPerson }
  }
})

const result = await block.execute(config, input, demoContext)
```

---

## Cost Tracking

Per ogni blocco, tracciare:
```json
{
  "blockId": "enrichment-1",
  "executionCost": {
    "apiCalls": 150,
    "costPerCall": 0.02,
    "totalCost": 3.00,
    "currency": "USD"
  },
  "executionTime": {
    "startedAt": "2026-01-09T10:00:00Z",
    "completedAt": "2026-01-09T10:05:00Z",
    "durationMs": 300000
  }
}
```

Costo totale workflow = somma costi tutti i blocchi

---

## Next Steps (Immediati)

1. **Review & Approve Plan**
   - Discussione architettura proposta
   - Approvazione roadmap
   - Priorità feature

2. **Setup Development Environment**
   - Branch `feature/workflow-engine`
   - Setup structure directory
   - Setup linting, testing

3. **Start Sprint 1.1**
   - Definire TypeScript types
   - Setup repository skeleton
   - Prima versione validator

---

## Note Importanti

### Focus Fase 1
- **NON** refactoring implementazione Facebook/Instagram attuale
- Focus su **motore configurabile**
- Migrazione workflow esistente sarà test case per validare engine

### Backend-First
- Fase 1: Configurazione JSON da backend
- Workflow salvati in database
- CRUD via API
- Nessuna UI visuale in Fase 1

### Future Phase (non in scope)
- React Flow visual editor
- Drag & drop interface
- Real-time preview
- Workflow marketplace

---

## Rischi & Mitigazioni

| Rischio | Impatto | Mitigazione |
|---------|---------|-------------|
| Complessità engine | Alta | Sprint 1 focus su foundation, test continuo |
| Performance downgrade | Media | Benchmarking vs implementazione attuale |
| Migrazione dati | Media | Backward compatibility, migrazione graduale |
| Bug in produzione | Alta | Testing extensivo, canary deployment |
| Learning curve | Media | Documentazione, examples, training |

---

## Metriche di Successo

### Technical Metrics
- [ ] Performance: < 10% overhead vs hardcoded
- [ ] Test coverage: > 80%
- [ ] Uptime: > 99.9%
- [ ] Memory usage: < 500MB per workflow

### Business Metrics
- [ ] Tempo creazione nuovo workflow: < 1 ora
- [ ] Riduzione bug workflow: > 50%
- [ ] A/B testing capability: Enabled
- [ ] Cost tracking accuracy: 100%

### User Metrics
- [ ] Onboarding nuovo developer: < 4 ore
- [ ] Debugging time: < 30 min per issue
- [ ] Documentazione completeness: > 90%

---

## Conclusioni

Il workflow engine a blocchi configurabili rappresent a un'evoluzione naturale dell'architettura attuale, portando:
- **Flessibilità** senza sacrificare performance
- **Manutenibilità** attraverso modularità
- **Testability** a ogni livello
- **Estensibilità** per future features
- **Observability** per debugging e ottimizzazione

La roadmap proposta permette un rollout graduale in 10-12 settimane, con deliverables tangibili ogni sprint e risk management continuo.

---

**Document Version:** 1.0
**Last Updated:** 2026-01-09
**Owner:** Lume Team
**Status:** Ready for Review
