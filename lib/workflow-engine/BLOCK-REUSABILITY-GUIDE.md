# Block Reusability Guide - Architecture & Best Practices

## 🎯 Obiettivo

Questa guida spiega **l'architettura dei blocchi riutilizzabili** del Lume Workflow Engine e come comporli efficacemente, proprio come **microservizi**.

---

## 📐 Microservizi Architecture

### 1.1 Cos'è un Blocco Riutilizzabile?

Un **blocco** è un **microservizio** con queste caratteristiche:

```typescript
interface BlockExecutor {
  // Input: Dati da processare (cambia ogni esecuzione)
  input: any

  // Config: Configurazione statica (stessa per workflow)
  config: BlockConfig

  // Context: Runtime state (secrets, variables, logger)
  context: ExecutionContext

  // Execute: Logica di elaborazione
  execute(config, input, context): Promise<ExecutionResult>
}
```

### 1.2 Principi Chiave

#### **Single Responsibility**
Ogni blocco fa **UNA SOLA COSA** bene:

✅ **CORRETTO:**
```typescript
FilterBlock → Filtra array per condizioni
OpenRouterBlock → Chiama LLM generico
CountryConfigBlock → Rileva paese da telefono/email
```

❌ **SBAGLIATO:**
```typescript
LeadEnrichmentBlock → Filtra + Apollo + AI + Output (troppe responsabilità!)
```

#### **No Side Effects**
I blocchi non devono dipendere da stato esterno:

✅ **CORRETTO:**
```typescript
class FilterBlock {
  async execute(config, input, context) {
    // Input → Output pura funzione
    return filteredData
  }
}
```

❌ **SBAGLIATO:**
```typescript
class FilterBlock {
  async execute(config, input, context) {
    // DIPENDENZA ESTERNA - blocco non riutilizzabile!
    const globalState = globalThis.filterCache
    return filteredData
  }
}
```

#### **Input/Output Standardizzati**
Ogni blocco ha interfacce chiare:

```typescript
// Input definito
inputSchema: {
  type: 'object',
  properties: {
    email: { type: 'string' },
    phone: { type: 'string' }
  },
  required: ['email']
}

// Output definito
outputSchema: {
  type: 'object',
  properties: {
    enriched: { type: 'boolean' },
    linkedinUrl: { type: 'string' }
  }
}
```

### 1.3 Disaccoppiamento Totale

I blocchi sono **completamente disaccoppiati**:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ FilterBlock │ ---> │ ApolloBlock │ ---> │  AIBlock    │
└─────────────┘      └─────────────┘      └─────────────┘

Nessun blocco conosce l'implementazione degli altri.
Comunicano solo tramite input/output.
```

**Vantaggi:**
- Sviluppo parallelo di blocchi
- Test isolati di ogni blocco
- Sostituzione blocchi senza impatti
- Composizione infinita

---

## 🧩 Pattern di Composizione

### 2.1 Sequential Pattern

I blocchi vengono eseguiti in sequenza:

```
Input → Block1 → Block2 → Block3 → Output
```

**Esempio:**
```typescript
nodes: [
  { id: 'input', type: 'input.static', ... },
  { id: 'country', type: 'countries.config', ... },
  { id: 'enrich', type: 'api.apollo', ... },
  { id: 'ai', type: 'ai.interestInference', ... },
  { id: 'output', type: 'output.logger', ... }
],
edges: [
  { source: 'input', target: 'country' },
  { source: 'country', target: 'enrich' },
  { source: 'enrich', target: 'ai' },
  { source: 'ai', target: 'output' }
]
```

**Quando usarlo:**
- Pipeline di trasformazione dati
- Passaggi sequenziali obbligatori
- Ogni step dipende dal precedente

---

### 2.2 Parallel Pattern

Più blocchi eseguiti in parallelo sullo stesso input:

```
          ┌─→ Block2 ─┐
Input ───→│            ├──→ Merge ─→ Output
          └─→ Block3 ─┘
```

**Esempio:**
```typescript
nodes: [
  { id: 'input', type: 'input.static', ... },
  { id: 'enrich1', type: 'api.apollo', ... },
  { id: 'enrich2', type: 'ai.interestInference', ... },
  { id: 'enrich3', type: 'ai.sentimentAnalysis', ... },
  { id: 'merge', type: 'transform.merge', ... },
  { id: 'output', type: 'output.logger', ... }
],
edges: [
  { source: 'input', target: 'enrich1' },
  { source: 'input', target: 'enrich2' },
  { source: 'input', target: 'enrich3' },
  { source: 'enrich1', target: 'merge', sourcePort: 'out', targetPort: 'in1' },
  { source: 'enrich2', target: 'merge', sourcePort: 'out', targetPort: 'in2' },
  { source: 'enrich3', target: 'merge', sourcePort: 'out', targetPort: 'in3' },
  { source: 'merge', target: 'output' }
]
```

**Quando usarlo:**
- Arricchimento da fonti diverse
- Indipendenza tra operazioni
- Ottimizzazione performance

---

### 2.3 Branching Pattern

I dati vengono instradati su percorsi diversi in base a condizioni:

```
                ┌─→ TruePath ─┐
Input ──→ Branch                ├─→ Merge ─→ Output
                └─→ FalsePath ─┘
```

**Esempio:**
```typescript
nodes: [
  { id: 'input', type: 'input.static', ... },
  { id: 'branch', type: 'branch', ... },
  { id: 'premium-path', type: 'transform.enrichment', ... },
  { id: 'standard-path', type: 'transform.basic', ... },
  { id: 'merge', type: 'transform.merge', ... },
  { id: 'output', type: 'output.logger', ... }
],
edges: [
  { source: 'input', target: 'branch' },
  { source: 'branch', target: 'premium-path', condition: { value: true } },
  { source: 'branch', target: 'standard-path', condition: { value: false } },
  { source: 'premium-path', target: 'merge' },
  { source: 'standard-path', target: 'merge' },
  { source: 'merge', target: 'output' }
]
```

**Quando usarlo:**
- Lead scoring (high vs standard value)
- A/B testing
- Routing basato su regole business

---

### 2.4 Merge Pattern

Dati da più fonti vengono combinati:

```
Input1 ──┐
         ├──→ Merge ─→ Output
Input2 ──┘
```

**Esempio:**
```typescript
nodes: [
  { id: 'input1', type: 'input.database', ... },
  { id: 'input2', type: 'input.csv', ... },
  { id: 'merge', type: 'transform.merge', ... },
  { id: 'output', type: 'output.logger', ... }
],
edges: [
  { source: 'input1', target: 'merge', sourcePort: 'out', targetPort: 'in1' },
  { source: 'input2', target: 'merge', sourcePort: 'out', targetPort: 'in2' },
  { source: 'merge', target: 'output' }
]
```

**Quando usarlo:**
- Aggregazione dati da fonti diverse
- Join di dataset
- Consolidamento informazioni

---

### 2.5 Filter-Process Pattern

Filtra poi processa solo i dati validi:

```
Input → Filter → Process → Output
                ↓
              (filtered out)
```

**Esempio:**
```typescript
nodes: [
  { id: 'input', type: 'input.static', ... },
  { id: 'filter-business', type: 'filter', ... },
  { id: 'apollo-enrich', type: 'api.apollo', ... },
  { id: 'output', type: 'output.logger', ... }
],
edges: [
  { source: 'input', target: 'filter-business' },
  { source: 'filter-business', target: 'apollo-enrich' },
  { source: 'apollo-enrich', target: 'output' }
]
```

**Quando usarlo:**
- Ridurre costi API (filtrare prima di chiamare)
- Pulire dati prima del processamento
- Ottimizzare performance

---

### 2.6 Pattern Real-World Combinati

Esempio di workflow con pattern combinati:

```
Input CSV
   ↓
[Parallel: Country Detect + Email Classify]
   ↓
Branch: Business Email?
   ├─ Yes → [Apollo Enrichment + AI Interests] → Premium Output
   └─ No  → [Basic Info Only] → Standard Output
```

```typescript
const combinedPatternWorkflow: WorkflowDefinition = {
  workflowId: 'combined-patterns',
  name: 'Combined Pattern Workflow',
  version: 1,
  nodes: [
    // Input
    { id: 'input', type: 'input.static', ... },

    // Parallel Layer 1
    { id: 'country', type: 'countries.config', ... },
    { id: 'email-classify', type: 'transform.calculate', ... },

    // Merge from parallel
    { id: 'merge-parallel', type: 'transform.merge', ... },

    // Branch
    { id: 'branch-business', type: 'branch', ... },

    // Path 1: Premium (sequential)
    { id: 'apollo', type: 'api.apollo', ... },
    { id: 'ai-interests', type: 'ai.interestInference', ... },

    // Path 2: Standard (single)
    { id: 'basic', type: 'transform.fieldMapping', ... },

    // Final merge
    { id: 'merge-paths', type: 'transform.merge', ... },

    // Output
    { id: 'output', type: 'output.database', ... }
  ],
  edges: [
    // Input to parallel
    { source: 'input', target: 'country' },
    { source: 'input', target: 'email-classify' },

    // Merge parallel results
    { source: 'country', target: 'merge-parallel', sourcePort: 'out', targetPort: 'in1' },
    { source: 'email-classify', target: 'merge-parallel', sourcePort: 'out', targetPort: 'in2' },

    // Branch
    { source: 'merge-parallel', target: 'branch-business' },

    // Branch paths
    { source: 'branch-business', target: 'apollo', condition: { value: true } },
    { source: 'branch-business', target: 'basic', condition: { value: false } },

    // Sequential in premium path
    { source: 'apollo', target: 'ai-interests' },

    // Merge paths
    { source: 'ai-interests', target: 'merge-paths', sourcePort: 'out', targetPort: 'in1' },
    { source: 'basic', target: 'merge-paths', sourcePort: 'out', targetPort: 'in2' },

    // Output
    { source: 'merge-paths', target: 'output' }
  ]
}
```

---

## 🎯 Best Practices

### 3.1 Config vs Input

**Regola d'oro:**
- **Config**: Valori statici, configurazioni, API keys
- **Input**: Dati dinamici che cambiano ogni esecuzione

✅ **CORRETTO:**
```typescript
{
  id: 'apollo-enrich',
  type: 'api.apollo',
  config: {
    apiKey: '{{secrets.apollo}}',  // ← CONFIG: statico
    timeout: 10000                   // ← CONFIG: statico
  },
  input: {
    email: 'mario@example.com'       // ← INPUT: dinamico
  }
}
```

❌ **SBAGLIATO:**
```typescript
{
  id: 'apollo-enrich',
  type: 'api.apollo',
  config: {
    email: 'mario@example.com'      // ← SBAGLIATO: Dato dinamico in config!
  }
}
```

**Perché?**
- Config viene valutato UNA VOLTA a workflow definition time
- Input viene valutato OGNI esecuzione
- API keys non devono essere hardcoded nei blocchi

---

### 3.2 Variable Interpolation

Usa sempre variable interpolation per:

**API Keys e Secrets:**
```typescript
config: {
  apiKey: '{{secrets.apollo}}',
  apiToken: '{{secrets.openrouter}}'
}
```

**Output di altri nodi:**
```typescript
config: {
  email: '{{nodes.apollo.output.email}}',
  bio: '{{nodes.linkedin.output.bio}}'
}
```

**Variabili globali:**
```typescript
config: {
  environment: '{{variables.environment}}',
  version: '{{variables.version}}'
}
```

---

### 3.3 Error Handling Strategies

Scegli la strategia giusta per il tuo caso:

**1. Stop on Error (default)**
```typescript
globals: {
  errorHandling: 'stop'  // ← Ferma tutto al primo errore
}
```
*Quando usarlo:*
- Transactional workflows
- Data integrity critica
- Tutti i passaggi sono obbligatori

**2. Continue on Error**
```typescript
globals: {
  errorHandling: 'continue'  // ← Continua nonostante errori
}
```
*Quando usarlo:*
- Best effort processing
- Alcuni falliti sono accettabili
- Vuoi processare il più possibile

**3. Retry with Backoff**
```typescript
nodes: [
  {
    id: 'api-call',
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
      retryableErrors: ['timeout', 'rate limit']
    }
  }
]
```
*Quando usarlo:*
- API esterne (possono fallire temporaneamente)
- Network calls
- Servizi cloud non affidabili al 100%

---

### 3.4 Retry Policies per Block Type

Diversi blocchi richiedono diverse retry policies:

```typescript
// API Blocks (esterni, poco affidabili)
{
  type: 'api.apollo',
  retryConfig: {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelay: 1000
  }
}

// AI Blocks (più affidabili ma lenti)
{
  type: 'ai.interestInference',
  retryConfig: {
    maxRetries: 1,
    backoffMultiplier: 1.5,
    initialDelay: 500
  }
}

// Transform Blocks (locali, affidabili)
{
  type: 'transform.fieldMapping',
  retryConfig: {
    maxRetries: 0  // ← Nessun retry, blocco puro
  }
}
```

---

### 3.5 Timeout Configuration

Imposta timeout appropriati:

```typescript
// API Blocks (10-30 secondi)
{
  type: 'api.apollo',
  timeout: 10000  // ← 10 secondi per Apollo
}

// AI Blocks (30-60 secondi)
{
  type: 'ai.interestInference',
  timeout: 30000  // ← 30 secondi per LLM
}

// Transform Blocks (1-5 secondi)
{
  type: 'transform.fieldMapping',
  timeout: 5000   // ← 5 secondi per mapping
}
```

---

### 3.6 Input/Output Schema Validation

Usa sempre schema per production workflows:

```typescript
nodes: [
  {
    id: 'enrich',
    type: 'api.apollo',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' }
      },
      required: ['email']
    },
    outputSchema: {
      type: 'object',
      properties: {
        linkedinUrl: { type: 'string' },
        title: { type: 'string' },
        company: { type: 'string' }
      },
      required: ['linkedinUrl']
    }
  }
]
```

**Vantaggi:**
- Validazione automatica
- Documentazione inline
- Type safety
- Debugging facilitato

---

### 3.7 Port Naming Convention

Usa porte命名 convenzionali per chiarezza:

```typescript
// Default ports (quando single input/output)
{
  sourcePort: 'out',
  targetPort: 'in'
}

// Custom ports (quando multipli input/output)
{
  sourcePort: 'results',
  targetPort: 'input-data'
}

// Numbered ports (quando paralleli)
{
  sourcePort: 'out',
  targetPort: 'in1'  // o 'in2', 'in3', etc.
}
```

---

### 3.8 Progress Tracking

Aggiungi sempre progress callbacks per UX:

```typescript
const context = ContextFactory.create({
  workflowId: 'my-workflow',
  progress: (progress, event) => {
    // Log structured events
    console.log(`[${progress}%] ${event.event}`)

    // Send to monitoring
    monitoring.track(event)

    // Update UI
    ui.updateProgress(progress)
  }
})
```

---

## 🚫 Anti-Patterns da Evitare

### 4.1 Monolithic Blocks

❌ **ANTI-PATTERN:**
```typescript
class SuperEnrichmentBlock {
  async execute(config, input, context) {
    // Fa TUTTO:
    // - Country detection
    // - LinkedIn enrichment
    // - AI interests
    // - Sentiment analysis
    // - Email verification
  }
}
```

**Problemi:**
- Non riutilizzabile
- Difficile da testare
- Impossibile comporre
- Accoppiamento forte

✅ **SOLUZIONE:**
```typescript
// Componi blocchi piccoli:
Input → CountryConfig → Filter → Apollo → AIInterests → Output
```

---

### 4.2 Hardcoded Values

❌ **ANTI-PATTERN:**
```typescript
config: {
  apiKey: 'sk-ant-abc123...',  // ← Hardcoded!
  email: 'mario@example.com', // ← Hardcoded!
  country: 'IT'               // ← Hardcoded!
}
```

**Problemi:**
- Non riutilizzabile in altri ambienti
- Security risk (API keys in codice)
- Impossibile A/B test

✅ **SOLUZIONE:**
```typescript
config: {
  apiKey: '{{secrets.apollo}}',
  email: '{{input.email}}',
  country: '{{nodes.country-detector.output.code}}'
}
```

---

### 4.3 Implicit Dependencies

❌ **ANTI-PATTERN:**
```typescript
class BlockB {
  async execute(config, input, context) {
    // Dipende implicitamente da BlockA
    const resultA = context.getNodeResult('block-a')
    if (!resultA) {
      throw new Error('BlockA must run first!')
    }
  }
}
```

**Problemi:**
- Dipendenza implicata non documentata
- Difficile da testare isolatamente
- Ordine esecuzione non chiaro

✅ **SOLUZIONE:**
```typescript
// Definisci dipendenze esplicitamente con edges
edges: [
  { source: 'block-a', target: 'block-b' }
]

// BlockB non conosce BlockA
class BlockB {
  async execute(config, input, context) {
    // Input arriva da BlockA tramite orchestration
    // Non ha bisogno di sapere chi lo ha chiamato
  }
}
```

---

### 4.4 God Objects

❌ **ANTI-PATTERN:**
```typescript
class ConfigEverythingBlock {
  async execute(config, input, context) {
    // Configura TUTTO il workflow da qui
    // Blocco onnisciente
  }
}
```

**Problemi:**
- Violazione single responsibility
- Impossibile estendere
- Difficile da manutenere

✅ **SOLUZIONE:**
```typescript
// Ogni blocco fa una cosa:
ConfigBlock → Configure
TransformBlock → Transform
OutputBlock → Output
```

---

### 4.5 Tight Coupling

❌ **ANTI-PATTERN:**
```typescript
class ApolloBlock {
  async execute(config, input, context) {
    // Chiama DIRETTAMENTE un altro blocco
    const aiBlock = new InterestInferenceBlock()
    return aiBlock.execute(...)
  }
}
```

**Problemi:**
- Blocchi accoppiati
- Non riutilizzabili separatamente
- Impossibile testare

✅ **SOLUZIONE:**
```typescript
// Lascia l'orchestrator collegare i blocchi
edges: [
  { source: 'apollo', target: 'ai-interests' }
]

// ApolloBlock non conosce InterestInferenceBlock
class ApolloBlock {
  async execute(config, input, context) {
    // Fa solo Apollo enrichment
    return apolloData
  }
}
```

---

### 4.6 Missing Error Handling

❌ **ANTI-PATTERN:**
```typescript
class RiskyBlock {
  async execute(config, input, context) {
    // Nessun error handling
    const result = await riskyAPIcall()
    return result
  }
}
```

**Problemi:**
- Fallimento silenzioso
- Nessun retry
- Workflow si blocca

✅ **SOLUZIONE:**
```typescript
class RiskyBlock extends BaseBlockExecutor {
  async execute(config, input, context) {
    try {
      const result = await this.executeWithRetry(
        () => riskyAPIcall(),
        config.retryConfig
      )
      return {
        status: 'completed',
        output: result
      }
    } catch (error) {
      this.log(context, 'error', 'Block failed', { error })
      return {
        status: 'failed',
        error: error as Error
      }
    }
  }
}
```

---

## 📊 Esempi Concreti di Riutilizzabilità

### 5.1 FilterBlock: 9 Use Cases Diversi

Lo **stesso FilterBlock** usato in 9 contesti completamente diversi:

1. **Data Cleaning**: Rimuovi email invalide
2. **Lead Enrichment**: Filtra solo email business
3. **Sentiment Analysis**: Tieni solo sentiment positive
4. **Geographic Filtering**: Filtra per paese/regione
5. **Age Segmentation**: Filtra per fascia d'età
6. **Industry Filter**: Filtra per settore merceologico
7. **Score Threshold**: Filtra per punteggio minimo
8. **Date Range**: Filtra per periodo temporale
9. **Custom Logic**: Qualsiasi condizione complessa

**Stesso blocco, 9 config diverse, 9 use case!**

---

### 5.2 OpenRouterBlock: Task NLP Infiniti

Lo **stesso OpenRouterBlock** può fare QUALSIASI task NLP:

1. **Contact Extraction**: Estrai contatti da testo
2. **Interest Inference**: Inferisci interessi da bio
3. **Sentiment Analysis**: Analizza sentiment
4. **Translation**: Traduci in altra lingua
5. **Summarization**: Riassumi testi lunghi
6. **Classification**: Classifica documenti
7. **Generation**: Genera contenuti
8. **Question Answering**: Rispondi a domande
9. **Entity Extraction**: Estrai entità nominate
10. **Keyword Extraction**: Estrai parole chiave

**Stesso blocco, prompt diversi, task infiniti!**

---

### 5.3 CountryConfigBlock: Localizzazioni Multiple

Lo **stesso CountryConfigBlock** per diverse localizzazioni:

1. **Lead Enrichment**: Localizza LLM prompts per paese
2. **Content Translation**: Traduci contenuti nella lingua corretta
3. **Data Validation**: Valida formati nazionali (telefono, data, CAP)
4. **Currency Conversion**: Converti valuta in base al paese
5. **Cultural Adaptation**: Adatta contenuti per cultura
6. **Compliance**: Verifica compliance GDPR/local
7. **Timezone Handling**: Gestisci fusi orari
8. **Business Rules**: Applica regole business nazionali

**Stesso blocco, paesi diversi, logiche diverse!**

---

## 🎯 Principi Fini

### 6.1 Think Microservices

Ogni blocco è un **microservizio**:

```
┌─────────────────────────────────────────┐
│  Workflow Engine (Orchestrator)        │
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │ B1   │→│  B2  │→│  B3  │         │
│  └──────┘  └──────┘  └──────┘         │
│     ↓          ↓          ↓           │
│  Reusable  Reusable  Reusable         │
│  Microservizio                   │
└─────────────────────────────────────────┘
```

**Caratteristiche:**
- ✅ Independently deployable
- ✅ Independently scalable
- ✅ Independently testable
- ✅ Loosely coupled
- ✅ Technology agnostic

### 6.2 Compose, Don't Customize

Non **personalizzare** i blocchi, **componili**:

❌ **SBAGLIATO:**
```typescript
// Fork di FilterBlock per aggiungere logica custom
class MyCustomFilterBlock extends FilterBlock {
  // Logica custom...
}
```

✅ **CORRETTO:**
```typescript
// Componi FilterBlock con altri blocchi
FilterBlock → TransformBlock → Output
```

### 6.3 Small is Beautiful

Blocchi piccoli sono **più riutilizzabili**:

```
Più piccolo = Più riutilizzabile

1️⃣ Single purpose block (FILTER)
   → Riutilizzabile in 100+ workflow

2️⃣ Multi purpose block (ENRICHMENT)
   → Riutilizzabile in 10+ workflow

3️⃣ Monolithic block (SUPER_ENRICHMENT)
   → Riutilizzabile in 1 workflow
```

---

## 📚 Risorse Aggiuntive

- [Workflow Building Guide](./WORKFLOW-BUILDING-GUIDE.md) - Guida passo-passo
- [Block Reusability Examples](./examples/block-reusability-examples.ts) - Esempi concreti
- [Block Quick Reference](./BLOCKS-QUICK-REFERENCE.md) - Catalogo blocchi

---

**Buona composizione di blocchi! 🧩**
