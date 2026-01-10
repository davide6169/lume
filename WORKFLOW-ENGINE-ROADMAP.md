# Piano: Documentazione Workflow + Esempi di Riutilizzabilità Blocchi

## Obiettivo

Migliorare la documentazione del workflow engine con guide passo-passo e creare esempi che dimostrino come i blocchi sono riutilizzabili come "microservizi" in workflow diversi.

## Stato Attuale

✅ **Già Implementato:**
- WorkflowOrchestrator con esecuzione DAG parallela
- 14+ blocchi built-in (API, AI, Filter, Branch, Transform, ecc.)
- REST API completa (`/api/workflows/*`)
- 9+ esempi base (complete-example, ai-workflow-example, ecc.)
- Variable interpolation, retry, timeout, validation

❌ **Cosa Manca:**
- Documentazione passo-passo per costruire workflow custom
- Esempi che mostrino riutilizzabilità dei blocchi in contesti diversi
- Best practices per composizione workflow
- Guida architetturale su pattern di riutilizzo

---

## Deliverables

### 1. Documentazione Principale

**File:** `lib/workflow-engine/WORKFLOW-BUILDING-GUIDE.md`

Contenuto:
- **Step 1: Capire i blocchi riutilizzabili**
  - Catalogo blocchi con use cases
  - Input/output di ogni blocco
  - Quando usare ogni blocco

- **Step 2: Progettare il workflow**
  - Disegnare il grafo (nodi e edges)
  - Identificare dipendenze
  - Scegliere blocchi appropriati

- **Step 3: Definire il workflow JSON**
  - Struttura WorkflowDefinition
  - Configurare nodi con config appropriato
  - Definire edges per collegare i blocchi

- **Step 4: Validare il workflow**
  - Usare workflowValidator.validate()
  - Interpretare errori e warning
  - Best practices per validazione

- **Step 5: Eseguire il workflow**
  - Creare ExecutionContext con secrets
  - Eseguire con WorkflowOrchestrator
  - Gestire risultati ed errori

- **Step 6: Debug e monitoraggio**
  - Usare progress callbacks
  - Interpretare ExecutionResult
  - Troubleshooting comune

### 2. Esempi di Riutilizzabilità Blocchi

**File:** `lib/workflow-engine/examples/block-reusability-examples.ts`

Mostrerà **3 workflow diversi** che usano gli **stessi blocchi** in contesti diversi:

#### Esempio 1: FilterBlock in 3 Contesti

**Workflow A - Data Cleaning:**
```
Input CSV → FilterBlock (remove invalid emails) → Output
```

**Workflow B - Lead Enrichment:**
```
Leads → FilterBlock (keep only business emails) → Apollo Enrichment → Output
```

**Workflow C - Sentiment Analysis:**
```
Social Comments → Sentiment Analysis → FilterBlock (keep positive only) → Output
```

#### Esempio 2: OpenRouterBlock in 3 Contesti

**Workflow A - Contact Extraction:**
```
Raw Text → OpenRouterBlock (extract contacts) → CRM Output
```

**Workflow B - Interest Inference:**
```
Social Bio → OpenRouterBlock (infer interests) → Lead Scoring
```

**Workflow C - Sentiment Analysis:**
```
Comments → OpenRouterBlock (analyze sentiment) → Priority Queue
```

#### Esempio 3: CountryConfigBlock in 3 Contesti

**Workflow A - Lead Enrichment:**
```
Contact → CountryConfigBlock → Localized LLM → Output
```

**Workflow B - Content Generation:**
```
Template → CountryConfigBlock → Translate → Localize → Output
```

**Workflow C - Data Validation:**
```
User Data → CountryConfigBlock → Validate Format → Output
```

### 3. Architettura e Best Practices

**File:** `lib/workflow-engine/BLOCK-REUSABILITY-GUIDE.md`

Contenuto:
- **Microservizi Architecture**
  - Come i blocchi sono disaccoppiati
  - Input/output standardizzati
  - Nessuna dipendenza esterna

- **Pattern di Composizione**
  - Sequential pattern (A → B → C)
  - Parallel pattern (A → [B, C] → D)
  - Branching pattern (A → {B|C} → D)
  - Merge pattern ([A, B] → C)

- **Best Practices**
  - Config vs Input
  - Variable interpolation
  - Error handling strategies
  - Retry policies per block type

- **Anti-Patterns da Evitare**
  - Blocchi troppo grandi (monolitici)
  - Dipendenze implicite tra blocchi
  - Hardcoding values nei blocchi

### 4. Quick Reference Card

**File:** `lib/workflow-engine/BLOCKS-QUICK-REFERENCE.md`

Tabella rapida di tutti i blocchi:
- Block type
- Input required
- Output format
- Use cases
- Cost estimate
- Example config

---

## Struttura File

```
lib/workflow-engine/
├── WORKFLOW-BUILDING-GUIDE.md          [NUOVO] Guida passo-passo
├── BLOCK-REUSABILITY-GUIDE.md          [NUOVO] Architettura e best practices
├── BLOCKS-QUICK-REFERENCE.md          [NUOVO] Reference card blocchi
├── examples/
│   ├── block-reusability-examples.ts   [NUOVO] 3 workflow x 3 blocchi
│   ├── workflow-templates.ts           [NUOVO] 5 workflow templates pronti
│   └── README.md                       [AGGIORNATO] Indice esempi
```

---

## Dettaglio Implementazione

### Fase 1: Documentazione Principale (WORKFLOW-BUILDING-GUIDE.md)

**Sezioni:**

1. **Introduction**
   - Cos'è il workflow engine
   - Perché usare workflow invece di script
   - Blocchi come microservizi riutilizzabili

2. **Step-by-Step Guide**

   **Step 1: Understand Available Blocks**
   - Catalogo completo blocchi built-in
   - Quando usare ogni blocco
   - Tabella decisionale

   **Step 2: Design Your Workflow**
   - Disegnare il grafo su carta
   - Identificare input/output
   - Esempio visuale

   **Step 3: Create Workflow Definition**
   - Struttura JSON minimale
   - Esempio completo commentato
   - Common pitfalls

   **Step 4: Configure Nodes**
   - Config statico vs variable interpolation
   - Input/output schemas
   - Retry e timeout

   **Step 5: Define Edges**
   - Collegare i blocchi
   - Port naming (in/out)
   - Conditional routing

   **Step 6: Validate**
   - Validazione sintattica
   - Validazione semantica (DAG)
   - Fix errori comuni

   **Step 7: Execute**
   - Creare context
   - Passare secrets
   - Progress tracking

   **Step 8: Monitor & Debug**
   - Leggere ExecutionResult
   - Timeline events
   - Troubleshooting

3. **Real-World Example**
   - Workflow completo passo-passo
   - Da requisito a implementazione
   - Code snippet completi

### Fase 2: Block Reusability Examples (block-reusability-examples.ts)

**Structure:**
```typescript
// ============================================================
// EXAMPLE 1: FilterBlock Reusability
// ============================================================

// Workflow A: Data Cleaning
const dataCleaningWorkflow: WorkflowDefinition = {
  workflowId: 'data-cleaning',
  nodes: [
    { id: 'input', type: 'input.static', ... },
    { id: 'filter', type: 'filter', config: { conditions: [...] } },
    { id: 'output', type: 'output.logger', ... }
  ],
  edges: [...]
}

// Workflow B: Lead Enrichment
const leadEnrichmentWorkflow: WorkflowDefinition = {
  workflowId: 'lead-enrichment',
  nodes: [
    { id: 'input', type: 'input.static', ... },
    { id: 'filter', type: 'filter', config: { conditions: [...] } }, // SAME BLOCK, DIFFERENT CONFIG
    { id: 'apollo', type: 'api.apollo', ... },
    { id: 'output', type: 'output.logger', ... }
  ],
  edges: [...]
}

// Workflow C: Sentiment Analysis
const sentimentWorkflow: WorkflowDefinition = {
  workflowId: 'sentiment-analysis',
  nodes: [
    { id: 'input', type: 'input.static', ... },
    { id: 'sentiment', type: 'ai.sentimentAnalysis', ... },
    { id: 'filter', type: 'filter', config: { conditions: [...] } }, // SAME BLOCK, DIFFERENT CONTEXT
    { id: 'output', type: 'output.logger', ... }
  ],
  edges: [...]
}

// Execute all three to demonstrate reusability
async function demonstrateFilterBlockReusability() {
  console.log('=== FilterBlock in 3 Different Contexts ===\n')

  console.log('1️⃣ Data Cleaning Context')
  await executeWorkflow(dataCleaningWorkflow, input1)

  console.log('\n2️⃣ Lead Enrichment Context')
  await executeWorkflow(leadEnrichmentWorkflow, input2)

  console.log('\n3️⃣ Sentiment Analysis Context')
  await executeWorkflow(sentimentWorkflow, input3)

  console.log('\n✅ Same FilterBlock, 3 completely different use cases!')
}
```

Stessa struttura per:
- OpenRouterBlock (3 contesti)
- CountryConfigBlock (3 contesti)

### Fase 3: Workflow Templates (workflow-templates.ts)

**5 Templates Pronti all'Uso:**

1. **Simple Data Pipeline**
   ```
   Input → Transform → Output
   ```
   Use case: Simple ETL

2. **Lead Enrichment Pipeline**
   ```
   Input → Country Detection → Filter (business) → Apollo → LLM Interests → Output
   ```
   Use case: Lead scoring

3. **AI Content Processing**
   ```
   Input → Contact Extraction → Interest Inference → Sentiment Analysis → Branch → Output
   ```
   Use case: Social media analysis

4. **Batch Data Processing**
   ```
   Input → Filter → Transform → [Parallel: Enrich1, Enrich2, Enrich3] → Merge → Output
   ```
   Use case: Large dataset enrichment

5. **Multi-Source Data Fusion**
   ```
   [Input1, Input2, Input3] → Merge → Validate → Transform → Output
   ```
   Use case: CRM integration

### Fase 4: Quick Reference (BLOCKS-QUICK-REFERENCE.md)

**Formato tabella:**

| Block | Type | Input | Output | Use Cases | Cost | Example |
|-------|------|-------|--------|-----------|------|---------|
| Filter | filter | Array | Filtered array | Data cleaning, routing | $0 | `{ conditions: [...] }` |
| OpenRouter | ai.openrouter | Text prompt | LLM response | Any AI task | $0.0001-$0.01 | `{ model: '...', prompt: '...' }` |
| Apollo | api.apollo | Email | LinkedIn data | Lead enrichment | $0.02 | `{ email: '{{input.email}}' }` |
| ... | ... | ... | ... | ... | ... | ... |

---

## Implementation Order

1. ✅ **WORKFLOW-BUILDING-GUIDE.md** - Priorità 1
   - Guide passo-passo complete
   - Esempi pratici in ogni step

2. ✅ **block-reusability-examples.ts** - Priorità 1
   - 3 blocchi x 3 workflow = 9 esempi
   - Mostra stessa config diversa use case

3. ✅ **BLOCK-REUSABILITY-GUIDE.md** - Priorità 2
   - Architettura microservizi
   - Pattern di composizione
   - Best practices

4. ✅ **workflow-templates.ts** - Priorità 2
   - 5 templates pronti
   - Documentazione inline

5. ✅ **BLOCKS-QUICK-REFERENCE.md** - Priorità 3
   - Reference card rapida
   - Tabella formato Markdown

---

## File da Modificare

**Nuovi File:**
1. `lib/workflow-engine/WORKFLOW-BUILDING-GUIDE.md`
2. `lib/workflow-engine/BLOCK-REUSABILITY-GUIDE.md`
3. `lib/workflow-engine/BLOCKS-QUICK-REFERENCE.md`
4. `lib/workflow-engine/examples/block-reusability-examples.ts`
5. `lib/workflow-engine/examples/workflow-templates.ts`

**File da Aggiornare:**
1. `lib/workflow-engine/examples/README.md` - Aggiungere link ai nuovi esempi
2. `lib/workflow-engine/README.md` - Aggiungere sezione "Getting Started"

---

## Testing

Per ogni nuovo file:
- Verificare che TypeScript compili
- Eseguire esempi e verificare output
- Verificare che tutti i link funzionino
- Verificare che i codici siano eseguibili

---

## Success Criteria

✅ Sviluppatore nuovo può:
1. Leggere WORKFLOW-BUILDING-GUIDE.md
2. Capire come costruire un workflow custom
3. Copiare un template e adattarlo
4. Capire come riutilizzare blocchi in workflow diversi
5. Trovare rapidamente info su ogni blocco nella quick reference

✅ Blocchi sono dimostrati riutilizzabili in:
- 3+ contesti diversi per FilterBlock
- 3+ contesti diversi per OpenRouterBlock
- 3+ contesti diversi per CountryConfigBlock
- 5+ workflow templates pronti all'uso

---

## 🔮 PROSSIMA FASE: CLI Tool & Integrazione Applicazione (Priorità 1)

### Stato Attuale (10 Gennaio 2026)

**✅ COMPLETATO:**
- WorkflowOrchestrator con esecuzione DAG parallela
- 14+ blocchi built-in (API, AI, Filter, Branch, Transform, ecc.)
- REST API completa (`/api/workflows/*`)
- Database integration (WorkflowService)
- Job processor per esecuzioni asincrone
- Documentazione completa (GUIDE, README, EXAMPLES)
- Esempi di riutilizzabilità blocchi
- Templates pronti all'uso

**❌ MANCANTE:**
- **CLI TOOL** - Non esiste un tool CLI per interagire con il workflow engine da terminale
- **INTEGRAZIONE SOURCE AUDIENCE** - Le "Source Audience" (Facebook, Instagram) sono hardcodate, non sono workflow
- **INTEGRAZIONE UI** (STANDBY - Priorità 2) - Il workflow engine è accessibile solo via API

### Architettura Attuale

```
┌─────────────────────────────────────────┐
│  Workflow Engine (lib/workflow-engine/)  │
│  ✅ Orchestrator + Executor + Validator  │
│  ✅ 14+ blocchi built-in                 │
│  ✅ Job processor                        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  API Routes (app/api/workflows/)        │
│  ✅ GET/POST /api/workflows             │
│  ✅ GET/PUT/DELETE /api/workflows/:id   │
│  ✅ POST /api/workflows/:id/execute     │
│  ✅ GET /api/workflows/executions/:id   │
│  ✅ GET /api/workflows/blocks            │
│  ✅ POST /api/workflows/blocks/:type/test│
│  ✅ POST /api/workflows/validate         │
└──────────────┬──────────────────────────┘
               │
               ❌ MANCA: CLI Tool
               ❌ MANCA: Source Audience Integration
               ❌ MANCA: UI (STANDBY - Priorità 2)
               │
               ▼
┌─────────────────────────────────────────┐
│  UI (app/(dashboard)/)                  │
│  ❌ NESSUNA pagina workflow             │
│  ✅ Solo /docs con documentazione       │
└─────────────────────────────────────────┘
```

---

## Deliverables: CLI Tool per Workflow Engine (Priorità 1)

### Obiettivo

Creare un tool basato su TypeScript/Node.js che permetta di interagire con il workflow engine da riga di comando, utile per:
- Testing rapido di workflow e blocchi
- Automazione/CI/CD
- Debugging
- Amministrazione/manutenzione

### File

**CLI Entry Point:** `scripts/workflow-cli.ts`

**Support Files:**
- `scripts/workflow-cli/commands/` - Comandi CLI
- `scripts/workflow-cli/utils/` - Utility functions
- `scripts/workflow-cli/config/` - Configurazioni di test

### Funzionalità Richieste

#### 1.1 Operazioni CRUD sui Workflow

**Comandi:**
```bash
# List workflows
npm run workflow list
npm run workflow list -- --filter category=lead-enrichment
npm run workflow list -- --tags csv,ai

# Get workflow details
npm run workflow get -- --id csv-interest-enrichment

# Create workflow from file
npm run workflow create -- --file ./my-workflow.json

# Update workflow
npm run workflow update -- --id csv-interest-enrichment --file ./updated-workflow.json

# Delete workflow
npm run workflow delete -- --id csv-interest-enrichment

# Validate workflow (without saving)
npm run workflow validate -- --file ./my-workflow.json
```

**Implementazione:**
- Ogni comando è una funzione TypeScript in `scripts/workflow-cli/commands/`
- Usa le API interne del workflow engine (non HTTP)
- Output formattato (table, JSON, pretty-print)

#### 1.2 Test dei Singoli Blocchi

**Comandi:**
```bash
# List available blocks
npm run workflow blocks list

# Get block details
npm run workflow blocks get -- --type api.apollo

# Test block with config from JSON
npm run workflow blocks test -- --type api.apollo --config ./test-configs/apollo-test.json

# Test block with inline config
npm run workflow blocks test -- --type filter --config '{"conditions": [...]}'

# Test block with baseline config
npm run workflow blocks test -- --type csv.interestEnrichment --use-baseline
```

**Configurazione di Test (JSON):**
```json
// test-configs/baseline/csv-interest-enrichment.baseline.json
{
  "blockType": "csv.interestEnrichment",
  "description": "Baseline test config for CSV Interest Enrichment block",
  "input": {
    "contacts": [
      {
        "email": "test@example.com",
        "name": "Mario Rossi",
        "company": "Example Inc"
      }
    ]
  },
  "config": {
    "maxContacts": 10,
    "country": "IT"
  },
  "secrets": {
    "OPENROUTER_API_KEY": "${OPENROUTER_API_KEY}",
    "APOLLO_API_KEY": "${APOLLO_API_KEY}"
  },
  "expectedOutput": {
    "enrichedContacts": [
      {
        "email": "test@example.com",
        "interests": ["technology", "business"],
        "confidence": 0.8
      }
    ]
  }
}
```

**Baseline Generation:**
```bash
# Generate baseline from current block behavior
npm run workflow blocks baseline -- --type csv.interestEnrichment --output ./test-configs/baseline/

# This creates: csv-interest-enrichment.baseline.json
# Contains:
# - Input sample data
# - Block configuration
# - Expected output schema
# - Secrets template (with placeholders)
```

#### 1.3 Test dell'Intero Workflow

**Comandi:**
```bash
# Execute workflow with test config
npm run workflow exec -- --id csv-interest-enrichment --config ./test-configs/workflow-test.json

# Execute workflow with baseline config
npm run workflow exec -- --id csv-interest-enrichment --use-baseline

# Execute workflow with inline input
npm run workflow exec -- --id csv-interest-enrichment --input '{"contacts": [...]}'

# Execute workflow and watch progress in real-time
npm run workflow exec -- --id csv-interest-enrichment --watch

# Re-run last execution
npm run workflow rerun -- --execution-id <execution-id>

# Get execution result
npm run workflow result -- --execution-id <execution-id>

# List executions for a workflow
npm run workflow executions -- --id csv-interest-enrichment
```

**Configurazione di Test (Workflow):**
```json
// test-configs/workflows/csv-interest-enrichment.test.json
{
  "workflowId": "csv-interest-enrichment",
  "description": "Test config for CSV Interest Enrichment workflow",
  "input": {
    "csvFile": "./test-data/sample-contacts.csv",
    "parameters": {
      "maxContacts": 100,
      "country": "IT"
    }
  },
  "secrets": {
    "OPENROUTER_API_KEY": "${OPENROUTER_API_KEY}",
    "APOLLO_API_KEY": "${APOLLO_API_KEY}"
  },
  "validation": {
    "expectedMinContacts": 90,
    "expectedMaxCost": 5.0,
    "maxDuration": 60000
  }
}
```

### Struttura File CLI

```
scripts/
├── workflow-cli.ts                           # Entry point
├── workflow-cli/
│   ├── commands/
│   │   ├── workflow.list.ts                 # Lista workflow
│   │   ├── workflow.get.ts                  # Dettagli workflow
│   │   ├── workflow.create.ts               # Crea workflow
│   │   ├── workflow.update.ts               # Aggiorna workflow
│   │   ├── workflow.delete.ts               # Elimina workflow
│   │   ├── workflow.validate.ts             # Valida workflow
│   │   ├── workflow.exec.ts                 # Esegui workflow
│   │   ├── workflow.executions.ts           # Lista esecuzioni
│   │   ├── blocks.list.ts                   # Lista blocchi
│   │   ├── blocks.get.ts                    # Dettagli blocco
│   │   ├── blocks.test.ts                   # Test blocco
│   │   └── blocks.baseline.ts               # Genera baseline
│   ├── utils/
│   │   ├── logger.ts                        # Output formattato
│   │   ├── config-loader.ts                 # Carica JSON configs
│   │   ├── secrets-manager.ts               # Gestisce secrets
│   │   └── workflow-parser.ts               # Parsa workflow definitions
│   └── config/
│       ├── test-configs.schema.json         # Schema JSON configs
│       └── baseline-template.json           # Template baseline
└── test-configs/                            # Configurazioni di test
    ├── baseline/                            # Baseline configs
    │   ├── csv-interest-enrichment.baseline.json
    │   ├── apollo-contact.baseline.json
    │   └── filter.baseline.json
    └── workflows/                           # Workflow test configs
        ├── csv-interest-enrichment.test.json
        └── lead-enrichment.test.json
```

### Implementazione Comandi

#### Command: `workflow list`
```typescript
// scripts/workflow-cli/commands/workflow.list.ts
export async function commandWorkflowList(options: { filter?: string, tags?: string }) {
  const workflows = await WorkflowService.listAll();

  // Apply filters
  let filtered = workflows;
  if (options.filter) {
    const [key, value] = options.filter.split('=');
    filtered = filtered.filter(w => w[key] === value);
  }
  if (options.tags) {
    const tags = options.tags.split(',');
    filtered = filtered.filter(w =>
      tags.some(tag => w.tags?.includes(tag))
    );
  }

  // Output table
  console.table(filtered.map(w => ({
    ID: w.workflowId,
    Name: w.name,
    Category: w.category,
    Status: w.active ? '✅ Active' : '⏸ Inactive',
    Tags: w.tags?.join(', ') || '-'
  })));

  return filtered;
}
```

#### Command: `blocks test`
```typescript
// scripts/workflow-cli/commands/blocks.test.ts
export async function commandBlocksTest(options: {
  type: string,
  config?: string,
  useBaseline?: boolean
}) {
  // Load config
  let testConfig: TestConfig;
  if (options.useBaseline) {
    testConfig = await loadBaselineConfig(options.type);
  } else if (options.config) {
    testConfig = await loadJsonConfig(options.config);
  } else {
    throw new Error('Must provide --config or --use-baseline');
  }

  // Get block
  const block = BlockRegistry.get(options.type);

  // Replace secret placeholders
  const secrets = resolveSecrets(testConfig.secrets);

  // Execute block
  console.log(`🧪 Testing block: ${options.type}`);
  console.log(`📥 Input:`, JSON.stringify(testConfig.input, null, 2));

  const startTime = Date.now();
  const result = await block.execute(testConfig.input, testConfig.config || {}, secrets);
  const duration = Date.now() - startTime;

  console.log(`📤 Output:`, JSON.stringify(result, null, 2));
  console.log(`⏱ Duration: ${duration}ms`);

  // Validate against expected output (if provided)
  if (testConfig.expectedOutput) {
    const isValid = validateOutput(result, testConfig.expectedOutput);
    console.log(`✅ Validation: ${isValid ? 'PASSED' : 'FAILED'}`);
  }

  return result;
}
```

#### Command: `blocks baseline`
```typescript
// scripts/workflow-cli/commands/blocks.baseline.ts
export async function commandBlocksBaseline(options: {
  type: string,
  output: string
}) {
  const block = BlockRegistry.get(options.type);
  const schema = block.getSchema?.();

  const baseline: BaselineConfig = {
    blockType: options.type,
    description: `Baseline test config for ${options.type} block`,
    version: '1.0.0',
    generatedAt: new Date().toISOString(),

    // Generate sample input from schema
    input: generateSampleFromSchema(schema?.input),

    // Use default config
    config: schema?.config?.default || {},

    // Secrets template
    secrets: generateSecretsTemplate(schema?.secrets),

    // Expected output schema (for validation)
    expectedOutputSchema: schema?.output
  };

  const outputPath = path.join(options.output, `${options.type}.baseline.json`);
  await fs.writeFile(outputPath, JSON.stringify(baseline, null, 2));

  console.log(`✅ Baseline config generated: ${outputPath}`);
  return baseline;
}
```

### Configurazione npm scripts

**package.json:**
```json
{
  "scripts": {
    "workflow": "tsx scripts/workflow-cli.ts",
    "workflow:list": "tsx scripts/workflow-cli.ts list",
    "workflow:get": "tsx scripts/workflow-cli.ts get",
    "workflow:create": "tsx scripts/workflow-cli.ts create",
    "workflow:update": "tsx scripts/workflow-cli.ts update",
    "workflow:delete": "tsx scripts/workflow-cli.ts delete",
    "workflow:validate": "tsx scripts/workflow-cli.ts validate",
    "workflow:exec": "tsx scripts/workflow-cli.ts exec",
    "workflow:rerun": "tsx scripts/workflow-cli.ts rerun",
    "workflow:result": "tsx scripts/workflow-cli.ts result",
    "workflow:executions": "tsx scripts/workflow-cli.ts executions",
    "workflow:blocks": "tsx scripts/workflow-cli.ts blocks",
    "workflow:blocks:test": "tsx scripts/workflow-cli.ts blocks test",
    "workflow:blocks:baseline": "tsx scripts/workflow-cli.ts blocks baseline"
  }
}
```

### Implementation Order

1. **Setup** - Creare struttura file e package.json scripts
2. **Logger & Utils** - Output formattato, config loader, secrets manager
3. **Workflow CRUD** - Comandi base per gestione workflow
4. **Blocks Test** - Test singoli blocchi con config JSON
5. **Baseline Generation** - Genera automaticamente config di test
6. **Workflow Exec** - Test interi workflow
7. **Validation** - Valida output contro expected results

### Success Criteria

✅ Sviluppatore può:
1. Listare tutti i workflow con filtri
2. Creare/aggiornare/eliminare workflow da CLI
3. Testare qualsiasi blocco singolarmente con config JSON
4. Generare config baseline per qualsiasi blocco
5. Eseguire workflow interi con test config
6. Monitorare esecuzioni in real-time
7. Validare output contro expected results
8. Integrare CLI in CI/CD pipeline

---

## Deliverables: Integrazione Source Audience come Workflow (Priorità 1)

### Obiettivo

Integrare il workflow engine nell'applicazione principale facendo in modo che ogni "Source Audience" (Facebook, Instagram, CSV, ecc.) sia in realtà un workflow tra quelli disponibili.

### Stato Attuale

**Implementazione Pre-Workflow Engine:**
- Source Audience types hardcoded nel sistema
- Logica di fetching/enrichment monolitica
- Difficile aggiungere nuove fonti

**Target Post-Workflow Engine:**
- Ogni Source Audience = un workflow
- Logica modulare basata su blocchi
- Facile aggiungere nuove fonti = creare nuovi workflow

### Architettura Target

```
┌─────────────────────────────────────────────────────────────┐
│  UI: Source Audience Selection                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Facebook │  │ Instagram│  │   CSV    │  → Dynamic list  │
│  └──────────┘  └──────────┘  └──────────┘    from engine   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Application Layer (app/api/audiences/)                     │
│  - GET /api/audiences → List available source audiences     │
│  - POST /api/audiences/:type/fetch → Fetch from source      │
│  - POST /api/audiences/:type/enrich → Enrich data          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Workflow Engine Integration Layer                          │
│  - SourceAudienceService                                    │
│    • Maps "facebook" → workflow ID                          │
│    • Maps "instagram" → workflow ID                        │
│    • Maps "csv" → workflow ID                               │
│  - Executes workflows via WorkflowService                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Workflow Engine (lib/workflow-engine/)                     │
│  Workflow Definitions:                                       │
│  - source-facebook-workflow         [NUOVO]                 │
│  - source-instagram-workflow        [NUOVO]                 │
│  - source-csv-workflow              [ESISTE - rinominato]   │
│  - source-csv-interest-enrichment   [ESISTE]                │
└─────────────────────────────────────────────────────────────┘
```

### File da Modificare/Creare

#### 1. Service Layer

**File:** `lib/services/source-audience.service.ts` [NUOVO]

```typescript
// Service che mappa Source Audience types → Workflow IDs
export class SourceAudienceService {
  // Mapping: source type → workflow ID
  private readonly SOURCE_TYPE_WORKFLOW_MAP: Record<string, string> = {
    'facebook': 'source-facebook-workflow',
    'instagram': 'source-instagram-workflow',
    'csv': 'source-csv-workflow',
    'csv-interest-enrichment': 'csv-interest-enrichment'
  };

  // Get available source audience types
  async getAvailableSources(): Promise<SourceAudienceType[]> {
    const workflowIds = Object.values(this.SOURCE_TYPE_WORKFLOW_MAP);
    const workflows = await WorkflowService.listByIds(workflowIds);

    return workflows.map(w => ({
      id: this.extractSourceType(w.workflowId),
      name: w.name,
      description: w.description,
      category: w.category,
      icon: w.metadata?.icon,
      requiresConfig: w.metadata?.requiresConfig || [],
      outputSchema: w.metadata?.outputSchema
    }));
  }

  // Fetch audience from source (executes workflow)
  async fetchFromSource(
    sourceType: string,
    config: Record<string, any>,
    secrets?: Record<string, any>
  ): Promise<WorkflowExecutionResult> {
    const workflowId = this.SOURCE_TYPE_WORKFLOW_MAP[sourceType];
    if (!workflowId) {
      throw new Error(`Unknown source type: ${sourceType}`);
    }

    return await WorkflowService.execute(workflowId, config, secrets);
  }

  // Enrich existing audience data
  async enrichAudience(
    sourceType: string,
    data: any[],
    enrichmentType?: string
  ): Promise<WorkflowExecutionResult> {
    const workflowId = enrichmentType
      ? `${sourceType}-${enrichmentType}`
      : `${sourceType}-enrichment`;

    return await WorkflowService.execute(workflowId, { input: data });
  }

  // Get workflow definition for source type
  async getSourceWorkflow(sourceType: string): Promise<WorkflowDefinition> {
    const workflowId = this.SOURCE_TYPE_WORKFLOW_MAP[sourceType];
    return await WorkflowService.get(workflowId);
  }

  private extractSourceType(workflowId: string): string {
    return workflowId.replace('source-', '').replace('-workflow', '');
  }
}

export const sourceAudienceService = new SourceAudienceService();
```

#### 2. API Routes

**File:** `app/api/audiences/route.ts` [NUOVO]

```typescript
// GET /api/audiences - List available source audience types
export async function GET() {
  const sources = await sourceAudienceService.getAvailableSources();
  return NextResponse.json(sources);
}
```

**File:** `app/api/audiences/[type]/fetch/route.ts` [NUOVO]

```typescript
// POST /api/audiences/:type/fetch - Fetch audience from source
export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const { config, secrets } = await request.json();

  const result = await sourceAudienceService.fetchFromSource(
    params.type,
    config,
    secrets
  );

  return NextResponse.json(result);
}
```

**File:** `app/api/audiences/[type]/enrich/route.ts` [NUOVO]

```typescript
// POST /api/audiences/:type/enrich - Enrich audience data
export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const { data, enrichmentType } = await request.json();

  const result = await sourceAudienceService.enrichAudience(
    params.type,
    data,
    enrichmentType
  );

  return NextResponse.json(result);
}
```

#### 3. Workflow Definitions

**File:** `lib/workflow-engine/workflows/source-facebook-workflow.ts` [NUOVO]

```typescript
export const facebookWorkflowDefinition: WorkflowDefinition = {
  workflowId: 'source-facebook-workflow',
  name: 'Facebook Audience',
  description: 'Fetch audience data from Facebook Ads API',
  category: 'source',
  tags: ['facebook', 'social', 'audience'],
  version: '1.0.0',
  active: true,

  metadata: {
    icon: 'facebook',
    requiresConfig: ['adAccountId', 'accessToken'],
    outputSchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          demographics: { type: 'object' },
          interests: { type: 'array' }
        }
      }
    }
  },

  nodes: [
    {
      id: 'facebook-fetch',
      type: 'api.facebook',
      config: {
        endpoint: '{{config.apiEndpoint}}',
        accessToken: '{{secrets.FACEBOOK_ACCESS_TOKEN}}'
      }
    },
    {
      id: 'transform',
      type: 'transform.map',
      config: {
        mapping: {
          id: 'id',
          name: 'name',
          email: 'contact_info.email',
          demographics: 'demographics',
          interests: 'interests'
        }
      }
    },
    {
      id: 'output',
      type: 'output.static',
      config: {}
    }
  ],

  edges: [
    { from: 'facebook-fetch', to: 'transform' },
    { from: 'transform', to: 'output' }
  ]
};
```

**File:** `lib/workflow-engine/workflows/source-instagram-workflow.ts` [NUOVO]

```typescript
export const instagramWorkflowDefinition: WorkflowDefinition = {
  workflowId: 'source-instagram-workflow',
  name: 'Instagram Audience',
  description: 'Fetch audience data from Instagram Business API',
  category: 'source',
  tags: ['instagram', 'social', 'audience'],
  version: '1.0.0',
  active: true,

  metadata: {
    icon: 'instagram',
    requiresConfig: ['businessAccountId', 'accessToken'],
    outputSchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          followers: { type: 'number' },
          engagement: { type: 'number' },
          demographics: { type: 'object' }
        }
      }
    }
  },

  nodes: [
    {
      id: 'instagram-fetch',
      type: 'api.instagram',
      config: {
        endpoint: '{{config.apiEndpoint}}',
        accessToken: '{{secrets.INSTAGRAM_ACCESS_TOKEN}}'
      }
    },
    {
      id: 'transform',
      type: 'transform.map',
      config: {
        mapping: {
          username: 'username',
          followers: 'followers_count',
          engagement: 'engagement_rate',
          demographics: 'insights_data'
        }
      }
    },
    {
      id: 'output',
      type: 'output.static',
      config: {}
    }
  ],

  edges: [
    { from: 'instagram-fetch', to: 'transform' },
    { from: 'transform', to: 'output' }
  ]
};
```

**File:** `lib/workflow-engine/workflows/source-csv-workflow.ts` [NUOVO]

```typescript
export const csvWorkflowDefinition: WorkflowDefinition = {
  workflowId: 'source-csv-workflow',
  name: 'CSV Upload',
  description: 'Import audience data from CSV file',
  category: 'source',
  tags: ['csv', 'upload', 'file'],
  version: '1.0.0',
  active: true,

  metadata: {
    icon: 'file-spreadsheet',
    requiresConfig: ['csvFile'],
    outputSchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          name: { type: 'string' },
          company: { type: 'string' }
        }
      }
    }
  },

  nodes: [
    {
      id: 'csv-parse',
      type: 'csv.parse',
      config: {
        filePath: '{{config.csvFilePath}}',
        delimiter: ',',
        hasHeader: true
      }
    },
    {
      id: 'validate',
      type: 'validate.schema',
      config: {
        schema: {
          required: ['email', 'name'],
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string', minLength: 1 }
          }
        }
      }
    },
    {
      id: 'output',
      type: 'output.static',
      config: {}
    }
  ],

  edges: [
    { from: 'csv-parse', to: 'validate' },
    { from: 'validate', to: 'output' }
  ]
};
```

#### 4. UI Integration

**File:** `app/(dashboard)/audiences/page.tsx` [MODIFICATO]

```typescript
// Instead of hardcoded source types, fetch from API
export default async function AudiencesPage() {
  const sources = await fetch('/api/audiences').then(r => r.json());

  return (
    <div>
      <h1>Select Source Audience</h1>
      <div className="grid">
        {sources.map(source => (
          <SourceAudienceCard
            key={source.id}
            source={source}
            onClick={() => handleSourceSelect(source)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### 5. Blocks Nuovi (se necessario)

**File:** `lib/workflow-engine/blocks/api/facebook.block.ts` [NUOVO]

```typescript
export const FacebookBlock: Block = {
  type: 'api.facebook',
  name: 'Facebook API',
  description: 'Fetch data from Facebook Marketing API',
  category: 'api',

  async execute(input, config, secrets) {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.endpoint}`,
      {
        headers: {
          'Authorization': `Bearer ${secrets.FACEBOOK_ACCESS_TOKEN}`
        }
      }
    );

    return await response.json();
  }
};
```

**File:** `lib/workflow-engine/blocks/api/instagram.block.ts` [NUOVO]

```typescript
export const InstagramBlock: Block = {
  type: 'api.instagram',
  name: 'Instagram API',
  description: 'Fetch data from Instagram Graph API',
  category: 'api',

  async execute(input, config, secrets) {
    const response = await fetch(
      `https://graph.instagram.com/${config.endpoint}`,
      {
        headers: {
          'Authorization': `Bearer ${secrets.INSTAGRAM_ACCESS_TOKEN}`
        }
      }
    );

    return await response.json();
  }
};
```

### Implementation Order

**Phase 1: Foundation**
1. Create SourceAudienceService
2. Create API routes (`/api/audiences/*`)
3. Register workflows in database

**Phase 2: Initial Workflow**
4. Create CSV workflow (rename existing if needed)
5. Integrate with existing UI
6. Test end-to-end CSV flow

**Phase 3: Social Sources**
7. Create Facebook/Instagram blocks
8. Create Facebook/Instagram workflows
9. Test social source flows

**Phase 4: UI Integration**
10. Update UI to fetch sources dynamically
11. Update config forms based on metadata
12. Handle errors gracefully

**Phase 5: Enhancement**
13. Add enrichment workflows
14. Add validation workflows
15. Add caching layers

### Success Criteria

✅ Utente può:
1. Vedere lista source audiences dinamicamente
2. Selezionare qualsiasi source (CSV, Facebook, Instagram)
3. Configurare source based on workflow metadata
4. Eseguire fetch/enrich via workflow engine
5. Vedere risultati e costi
6. Aggiungere nuovi source = creare nuovo workflow

✅ Sistema:
1. Nessun hardcoded source type
2. Facile aggiungere nuove fonti
3. Logica riutilizzabile tra source
4. Monitoraggio e debugging unified

---

## STANDBY: Integrazione UI del Workflow Engine (Priorità 2)

### Stato Attuale (10 Gennaio 2026)

**✅ COMPLETATO:**
- WorkflowOrchestrator con esecuzione DAG parallela
- 14+ blocchi built-in (API, AI, Filter, Branch, Transform, ecc.)
- REST API completa (`/api/workflows/*`)
- Database integration (WorkflowService)
- Job processor per esecuzioni asincrone
- Documentazione completa (GUIDE, README, EXAMPLES)
- Esempi di riutilizzabilità blocchi
- Templates pronti all'uso

**❌ MANCANTE (STANDBY):**
- **INTEGRAZIONE UI** - Il workflow engine è accessibile solo via API, non ci sono pagine/dashboard per gestire i workflow dall'interfaccia

**Nota:** L'integrazione UI è messa in standby in quanto la priorità è data al CLI tool e all'integrazione Source Audience. L'UI verrà sviluppata in un secondo momento.

### Architettura Attuale (vedi sopra per dettagli completi)

[Le sezioni seguenti rimangono invariate ma marcate come STANDBY]

### Deliverables: Integrazione UI [STANDBY]

#### 1. Pagina Workflow Management
**File:** `app/(dashboard)/workflows/page.tsx`

**Funzionalità:**
- Lista workflow con filtri (attivi, category, tags)
- Card/Tabella con nome, descrizione, stato, version
- Create new workflow button
- Edit/Delete actions
- Badge stato (active/inactive)
- Badge category
- Tags list
- Last execution info

**API endpoints utilizzati:**
- `GET /api/workflows` - Lista workflow
- `POST /api/workflows` - Crea workflow
- `PUT /api/workflows/:id` - Aggiorna workflow
- `DELETE /api/workflows/:id` - Elimina workflow

#### 2. Pagina Workflow Builder
**File:** `app/(dashboard)/workflows/new/page.tsx` (creazione)
**File:** `app/(dashboard)/workflows/[id]/edit/page.tsx` (modifica)

**Funzionalità:**
- Visual node editor con drag & drop
- Sidebar con blocchi disponibili (categorized)
- Canvas per posizionare nodi
- Edge connections tra nodi
- Property panel per configurare nodi
- Zoom/Pan canvas
- Save/Validate buttons
- Preview mode

**Componenti React richiesti:**
- `WorkflowBuilder.tsx` - Main container
- `WorkflowCanvas.tsx` - Canvas con nodi
- `WorkflowNode.tsx` - Singolo nodo render
- `WorkflowEdge.tsx` - Connessione tra nodi
- `BlockLibrary.tsx` - Sidebar blocchi
- `PropertyPanel.tsx` - Configurazione nodo
- `WorkflowToolbar.tsx` - Azioni (save, validate, run)

**Librerie suggerite:**
- `reactflow` - Flow chart library per visual workflow editor
  - Drag & drop nodes
  - Custom node rendering
  - Edge connections
  - Zoom/Pan
  - Mini-map

#### 3. Pagina Workflow Execution
**File:** `app/(dashboard)/workflows/[id]/execute/page.tsx`

**Funzionalità:**
- Input form per workflow parameters
- Execute button
- Real-time progress monitoring
- Timeline events display
- Node execution status (pending/running/completed/failed)
- Results display
- Cost tracking
- Retry failed nodes
- Download/export results

**API endpoints utilizzati:**
- `POST /api/workflows/:id/execute` - Esecuzione
- `GET /api/workflows/executions/:id` - Stato esecuzione
- Server-Sent Events (SSE) o WebSocket per real-time updates

**Componenti React richiesti:**
- `WorkflowExecution.tsx` - Main container
- `ExecutionInputForm.tsx` - Form input parametri
- `ExecutionTimeline.tsx` - Timeline events
- `NodeExecutionStatus.tsx` - Stato nodi
- `ExecutionResults.tsx` - Risultati finali
- `CostTracker.tsx` - Costi esecuzione

#### 4. Pagina Workflow Executions History
**File:** `app/(dashboard)/workflows/[id]/executions/page.tsx`

**Funzionalità:**
- Lista storico esecuzioni workflow
- Filtri per stato, data range
- Card con info esecuzione
- View details button
- Re-run button
- Delete execution
- Download results

**API endpoints utilizzati:**
- `GET /api/workflows/:id/executions` - Lista esecuzioni
- `GET /api/workflows/executions/:id` - Dettagli esecuzione
- `POST /api/workflows/:id/execute` - Re-run

#### 5. Pagina Block Catalog
**File:** `app/(dashboard)/blocks/page.tsx`

**Funzionalità:**
- Catalogo blocchi disponibili
- Search filtri per category/type
- Card dettagli blocco:
  - Name, description, icon
  - Input/output schema
  - Config options
  - Cost estimate
  - Example usage
- Test block button
- Documentation link

**API endpoints utilizzati:**
- `GET /api/workflows/blocks` - Lista blocchi
- `GET /api/workflows/blocks/:type` - Dettagli blocco
- `POST /api/workflows/blocks/:type/test` - Test blocco

**Componenti React richiesti:**
- `BlockCatalog.tsx` - Catalogo blocchi
- `BlockCard.tsx` - Card singolo blocco
- `BlockDocumentation.tsx` - Doc blocco
- `BlockTester.tsx` - Form test blocco

### Componenti React Architecture

```
app/
├── (dashboard)/
│   ├── workflows/
│   │   ├── page.tsx                          [NUOVO] Lista workflow
│   │   ├── new/
│   │   │   └── page.tsx                      [NUOVO] Crea workflow
│   │   ├── [id]/
│   │   │   ├── edit/
│   │   │   │   └── page.tsx                  [NUOVO] Modifica workflow
│   │   │   ├── execute/
│   │   │   │   └── page.tsx                  [NUOVO] Esegui workflow
│   │   │   ├── executions/
│   │   │   │   └── page.tsx                  [NUOVO] Storico esecuzioni
│   │   │   └── page.tsx                      [NUOVO] Dettagli workflow
│   │   └── components/
│   │       ├── WorkflowBuilder.tsx           [NUOVO] Visual builder
│   │       ├── WorkflowCanvas.tsx           [NUOVO] Canvas nodi
│   │       ├── WorkflowNode.tsx              [NUOVO] Render nodo
│   │       ├── WorkflowEdge.tsx              [NUOVO] Render edge
│   │       ├── BlockLibrary.tsx              [NUOVO] Sidebar blocchi
│   │       ├── PropertyPanel.tsx             [NUOVO] Config nodo
│   │       ├── WorkflowToolbar.tsx           [NUOVO] Toolbar azioni
│   │       ├── ExecutionMonitor.tsx          [NUOVO] Monitor esecuzione
│   │       ├── ExecutionTimeline.tsx         [NUOVO] Timeline events
│   │       ├── NodeExecutionStatus.tsx       [NUOVO] Stato nodi
│   │       ├── ExecutionResults.tsx          [NUOVO] Risultati
│   │       └── CostTracker.tsx               [NUOVO] Costi
│   └── blocks/
│       └── page.tsx                          [NUOVO] Catalogo blocchi
└── components/
    └── workflow/
        ├── BlockCard.tsx                      [NUOVO] Card blocco
        ├── BlockDocumentation.tsx             [NUOVO] Doc blocco
        ├── BlockTester.tsx                    [NUOVO] Test blocco
        └── WorkflowList.tsx                   [NUOVO] Lista workflow
```

### Dipendenze Nuove

```json
{
  "dependencies": {
    "reactflow": "^11.10.0",           // Visual workflow builder
    "@xyflow/react": "^11.10.0",       // Reactflow nuovo nome
    "zustand": "^4.4.0",                // State management leggero
    "react-hook-form": "^7.49.0",       // Form management
    "zod": "^3.22.0",                   // Schema validation
    "@monaco-editor/react": "^4.6.0",  // JSON editor (opzionale)
    "date-fns": "^2.30.0"               // Date formatting
  }
}
```

### Implementation Order

**Fase 1: Foundation**
1. Installare dipendenze (reactflow, zustand)
2. Creare layout base pagine workflow
3. Setup routing Next.js
4. Creare component base (WorkflowList, BlockCard)

**Fase 2: Workflow Management**
5. Implementare `/workflows/page.tsx` - Lista workflow
6. Implementare `/workflows/[id]/page.tsx` - Dettagli workflow
7. CRUD operations (create, edit, delete)
8. Validation e error handling

**Fase 3: Visual Builder**
9. Implementare `/workflows/new/page.tsx` - Builder creazione
10. Implementare `/workflows/[id]/edit/page.tsx` - Builder modifica
11. Integrare reactflow
12. Implementare drag & drop nodi
13. Property panel configurazione
14. Edge connections
15. Save/Validate workflow

**Fase 4: Execution**
16. Implementare `/workflows/[id]/execute/page.tsx` - Esecuzione
17. Real-time progress monitoring
18. Timeline events display
19. Results display
20. Error handling e retry

**Fase 5: Blocks & History**
21. Implementare `/blocks/page.tsx` - Catalogo blocchi
22. Implementare `/workflows/[id]/executions/page.tsx` - Storico
23. Block testing interface
24. Cost tracking dashboard

### Success Criteria

✅ Utente può:
1. Navigare in `/workflows` e vedere lista workflow
2. Creare nuovo workflow con visual builder
3. Trascinare nodi dal catalogo al canvas
4. Configurare nodi con property panel
5. Connettere nodi con edges
6. Validare e salvare workflow
7. Eseguire workflow con input parameters
8. Monitorare esecuzione in real-time
9. Vedere risultati finali e costi
10. Consultare storico esecuzioni
11. Navigare catalogo blocchi
12. Testare blocchi singolarmente

---

## 🔬 NOVITÀ RECENTI (11 Gennaio 2026)

### Smart Merge per Multipli Incoming Edges ✅

Implementato lo **smart merge** nell'orchestrator per gestire nodi con più incoming edges senza perdita di dati.

#### Il Problema Risolto

Quando un nodo riceve input da più source con lo stesso `sourcePort`, i dati venivano sovrascritti invece che mergiati:

```typescript
// VECCHIO COMPORTAMENTO (BUG):
for (const edge of incomingEdges) {
  const portName = edge.sourcePort || 'out'  // = 'out' per tutti
  mergedInput[portName] = output  // → SOVRASCRIVE!
}
```

#### La Soluzione: Smart Merge

**1. Deep Merge** - Merge ricorsivo di oggetti
```typescript
function deepMerge(target: any, source: any): any {
  // Merge nested objects recursively
  // Concatenate arrays
  // Preserve all keys
}
```

**2. Smart Merge** - Merge intelligente per array con ID
```typescript
function smartMerge(target: any, source: any): any {
  // Per array con ID (contacts, items, rows):
  // - Merge items con lo stesso ID
  // - Aggiunge nuovi items
  // - Preserva tutti i campi
}
```

#### Test Results

✅ **Test 1**: Simple objects - Tutti i chiavi preservate
✅ **Test 2**: Nested objects - Deep merge funziona
✅ **Test 3**: Arrays with IDs - Smart merge by ID
✅ **CSV Workflow**: Nessuna regressione, tutti i nodi completati

#### Esempio Pratico

```javascript
// Input da email-classify
{ contacts: [{ id: 1, emailType: "business" }] }

// Input da contact-normalize
{ contacts: [{ id: 1, normalized: { firstName: "Mario" } }] }

// Smart merge result
{ contacts: [{
  id: 1,
  emailType: "business",      // ← da email-classify
  normalized: {                // ← da contact-normalize
    firstName: "Mario"
  }
}]}
```

### Edge Adapters ✅

Implementato **edge adapters** per trasformazioni dati tra blocchi.

#### Architecture

Prima (coupled):
```
csv-parser → outputs: { headers, rows, metadata }
              ↓ workaround: add "contacts: rows" alias
email-classify → expects: { contacts }
```

Dopo (decoupled):
```
csv-parser → outputs: { headers, rows, metadata }
              ↓ [EDGE ADAPTER] rows → contacts
email-classify → expects: { contacts }
```

#### Tipi di Adapter

**1. Map Adapter** - Mapping campi
```json
{
  "adapter": {
    "type": "map",
    "mapping": { "contacts": "rows" }
  }
}
```

**2. Template Adapter** - Template con sintassi `{{field}}`
```json
{
  "adapter": {
    "type": "template",
    "template": {
      "contacts": "{{rows}}",
      "total": "{{rows.length}}",
      "timestamp": "{{now}}"
    }
  }
}
```

**3. Function Adapter** - JavaScript custom
```json
{
  "adapter": {
    "type": "function",
    "function": "return { contacts: output.rows, count: output.rows.length };"
  }
}
```

### Mock Mode ✅

Implementato **mock mode** per tutti i blocchi API e utility.

#### Utilizzo

```typescript
// Blocco dichiara supporto mock
class MyBlock extends BaseBlockExecutor {
  static supportsMock = true
}

// Context con mode demo
const context = ContextFactory.create({
  mode: 'demo',  // 'live' | 'mock' | 'demo' | 'test' | 'production'
  // ...
})

// Orchestrator valida mock mode prima dell'esecuzione
```

#### Blocchi con Mock Mode

✅ **API Blocks**: Apify, Apollo, Hunter, FullContact, PDL, OpenRouter
✅ **Utility Blocks**: CSV parser/assembler, transforms, filters, branch, pass-through

Total: **20+ blocchi** con mock mode

### CLI Tool ✅

Implementato **CLI tool** per interagire con workflow engine da terminale.

#### Funzionalità

```bash
# Gestione workflow
npm run workflow list
npm run workflow get -- --id csv-interest-enrichment
npm run workflow create -- --file ./workflow.json
npm run workflow validate -- --file ./workflow.json

# Test blocchi
npm run workflow blocks list
npm run workflow blocks test -- --type api.apollo --config ./test.json

# Esecuzione workflow
npm run workflow exec -- --id csv-interest-enrichment --input '{"csv": "..."}'
npm run workflow executions -- --id csv-interest-enrichment
```

---

## Note Aggiuntive

### Considerazioni Importanti

1. **Reactflow Integration**
   - Reactflow richiede dati nodes/edges in formato specifico
   - Bisogna mappare WorkflowDefinition → Reactflow nodes
   - Custom node rendering per mostrare blocchi con icone
   - Edge types per visualizzare connessioni

2. **State Management**
   - Zustand per stato globale workflow
   - React Hook Form per configuration forms
   - Server Actions per API calls (Next.js 14+)

3. **Real-time Updates**
   - Server-Sent Events (SSE) per execution progress
   - O WebSocket per bidirectional communication
   - Polling fallback (meno efficiente)

4. **Validation**
   - Client-side: Zod schemas per forms
   - Server-side: workflowValidator.validate()
   - Real-time validation durante editing

5. **Performance**
   - Lazy loading componenti pesanti
   - Virtualization per lista workflow lunga
   - Debounce search inputs
   - Memoization node rendering

### Design Considerations

**Layout:**
- Sidebar fissa con blocchi catalog (left)
- Canvas centrale scrollabile/zoomabile
- Property panel floating o fissa (right)
- Toolbar fissa top
- Mini-map bottom-right

**Styling:**
- Usare shadcn/ui components esistenti
- Color coding per blocchi (api=blue, ai=purple, etc.)
- Icone lucide-react per ogni tipo blocco
- Dark mode support

**UX:**
- Drag & drop intuitivo
- Snap-to-grid per alignment nodi
- Auto-layout per organizzare grafo
- Keyboard shortcuts (Ctrl+S save, Ctrl+Z undo)
- Context menu sui nodi (delete, duplicate, config)
- Quick validation feedback
- Loading states per operazioni async
