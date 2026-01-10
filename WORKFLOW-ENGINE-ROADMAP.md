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

## 🔮 PROSSIMA FASE: Integrazione UI del Workflow Engine

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
- **INTEGRAZIONE UI** - Il workflow engine è accessibile solo via API, non ci sono pagine/dashboard per gestire i workflow dall'interfaccia

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
               ❌ MANCA LINK UI
               │
               ▼
┌─────────────────────────────────────────┐
│  UI (app/(dashboard)/)                  │
│  ❌ NESSUNA pagina workflow             │
│  ✅ Solo /docs con documentazione       │
└─────────────────────────────────────────┘
```

### Deliverables: Integrazione UI

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
