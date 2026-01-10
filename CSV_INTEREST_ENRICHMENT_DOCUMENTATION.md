# CSV Interest Enrichment - Workflow Engine

**Documentazione Completa del Progetto**
Versione: 2.0 (Workflow-based)
Data: Gennaio 2025
Status: ✅ COMPLETATO (5/5 Fasi)

---

## 📋 Indice

1. [Panoramica del Progetto](#panoramica)
2. [Architettura del Workflow](#architettura)
3. [Blocchi del Workflow](#blocchi)
4. [Utility per Affidabilità](#utility)
5. [Configurazione e Setup](#configurazione)
6. [Costi e Performance](#costi)
7. [Utilizzo CLI](#cli)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## 📖 Panoramica <a name="panoramica"></a>

### Obiettivo

Sistema basato su **workflow modular** per arricchire contatti CSV con dati di interesse da social media (Instagram, LinkedIn) utilizzando LLM per inferenza.

### Architettura

```
INPUT: CSV con contatti
  ↓
CSV Parser → Normalizza Contatti → Classifica Email
  ↓
Ramo Email Business → LinkedIn Search (Apify)
Ramo Email Personal → Skip LinkedIn
  ↓
Instagram Search (Apify) per tutti
  ↓
Bio Data Filter → Ha Bio? → Sì: Interest Inference (LLM)
  ↓
CSV Assemble → OUTPUT: CSV con interessi
```

### Versionamento

| Versione | Descrizione | Data |
|----------|------------|------|
| 1.0 | Blocco monolitico | Precedente |
| **2.0** | **Workflow modulare** | **Gennaio 2025** |

---

## 🏗️ Architettura del Workflow <a name="architettura"></a>

### DAG (Directed Acyclic Graph)

```
Layer 0: Input
├─ csv-parse

Layer 1: Parallel Processing
├─ country-detect
├─ email-classify
└─ contact-normalize

Layer 2: Branching
└─ branch-email-type (business vs personal)

Layer 3: Social Platform Lookup
├─ linkedin-search (solo business)
└─ instagram-search (tutti)

Layer 4: Merge
└─ merge-profiles

Layer 5: Filter
└─ has-bio-data

Layer 6: AI Processing
└─ interest-inference (solo se ha bio)

Layer 7: Output
└─ csv-assemble
```

### File del Workflow

- **Definizione**: `lib/workflow-engine/workflows/csv-interest-enrichment.workflow.ts`
- **ID**: `csv.interestEnrichment`
- **Versione**: 2

---

## 🧩 Blocchi del Workflow <a name="blocchi"></a>

### Fase 1: Core CSV

#### 1. CSV Parser Block
**File**: `lib/workflow-engine/blocks/csv/csv-parser.block.ts`
**Tipo**: `csv.parser`
**Scopo**: Parsa CSV string in structured data

```typescript
Input: { csv: string }
Output: { headers: string[], rows: Array<Record<string, string>> }
```

**Configurazione**:
```typescript
{
  delimiter: ';',
  hasHeader: true,
  skipEmpty: true,
  trimWhitespace: true
}
```

#### 2. CSV Assembler Block
**File**: `lib/workflow-engine/blocks/csv/csv-assembler.block.ts`
**Tipo**: `csv.assembler`
**Scopo**: Assembla CSV finale con colonna interessi

```typescript
Input: { rows: Array<{original, interests, enrichmentMetadata}> }
Output: { csv: {headers, rows, csvString} }
```

**Configurazione**:
```typescript
{
  originalHeaders: string[],
  addInterestsColumn: true,
  interestsColumnName: 'interessi',
  filterEmpty: true,
  delimiter: ';'
}
```

---

### Fase 2: Apify Integrations

#### 3. Instagram Search Block
**File**: `lib/workflow-engine/blocks/api/instagram-search.block.ts`
**Tipo**: `api.instagramSearch`
**Scopo**: Cerca profili Instagram usando Apify

**Costo**: ~$0.050 per ricerca
**Actor**: `apify/instagram-scraper`

```typescript
Input: { contacts: Array<{original, email, nome}> }
Output: { contacts: Array<{original, instagram?, enrichmentMetadata}> }
```

**Configurazione**:
```typescript
{
  apiToken: '{{secrets.apify}}',
  actor: 'apify/instagram-scraper',
  mode: 'live',
  maxResults: 10,
  includePosts: true,
  maxPosts: 3 // Ridotto da 12 per evitare timeout
}
```

**⚠️ NOTE IMPORTANTI:**
- **Timeout**: 300 secondi (5 minuti) per profilo
- **Limite mensile Apify**: Se ricevi errore `Monthly usage hard limit exceeded`, il piano Apify ha raggiunto il limite mensile
- **Per velocizzare**: Usa `includePosts: false` o riduci `maxPosts` a 1-2

#### 4. LinkedIn Search Block
**File**: `lib/workflow-engine/blocks/api/linkedin-search.block.ts`
**Tipo**: `api.linkedinSearch`
**Scopo**: Cerca profili LinkedIn usando Apify

**Costo**: ~$0.003 per ricerca ($3/1000)
**Actor**: `supreme_coder/linkedin-profile-scraper`
**IMPORTANTE**: NO cookie LinkedIn richiesto

```typescript
Input: { contacts: Array<{original, email, nome}> }
Output: { contacts: Array<{original, linkedin?, enrichmentMetadata}> }
```

**Configurazione**:
```typescript
{
  apiToken: '{{secrets.apify}}',
  actor: 'supreme_coder/linkedin-profile-scraper',
  mode: 'live',
  maxResults: 1
}
```

**⚠️ NOTE IMPORTANTI:**
- **Input format**: Usa `urls: [profileUrl]` (non `url` o `startUrls`)
- **Profile URL**: `https://www.linkedin.com/in/firstname-lastname`
- **Limite mensile Apify**: Se ricevi errore `Monthly usage hard limit exceeded`, il piano Apify ha raggiunto il limite mensile

---

### Fase 3: Supporting Blocks

#### 5. Email Classifier Block
**File**: `lib/workflow-engine/blocks/transform/email-classifier.block.ts`
**Tipo**: `transform.emailClassify`
**Scopo**: Classifica email come business o personal

```typescript
Input: { contacts: Array<{email}> }
Output: { contacts: Array<{email, emailType, domain, confidence}> }
```

**Domini personali di default**:
```
gmail.com, yahoo.com, hotmail.com, outlook.com
libero.it, tin.it, virgilio.it, alice.it
```

#### 6. Contact Normalizer Block
**File**: `lib/workflow-engine/blocks/transform/contact-normalizer.block.ts`
**Tipo**: `transform.contactNormalize`
**Scopo**: Normalizza dati contatto

```typescript
Input: { contacts: Array<{nome, celular, email}> }
Output: { contacts: Array<{normalized: {firstName, lastName, phoneClean, ...}>} }
```

**Normalizzazioni**:
- Nome completo → firstName, lastName
- Telefono → Rimuove spazi e parentesi
- Email → Lowercase
- Data → Formato ISO

#### 7. Bio Data Filter Block
**File**: `lib/workflow-engine/blocks/filter/has-bio-data.block.ts`
**Tipo**: `filter.hasBioData`
**Scopo**: Filtra contatti con bio data

```typescript
Input: { contacts: Array<{linkedin?, instagram?}> }
Output: { hasBio: Array<>, noBio: Array<> }
```

**Configurazione**:
```typescript
{
  requireBio: true,
  minBioLength: 10,
  requirePosts: false,
  checkLinkedIn: true,
  checkInstagram: true
}
```

---

## 🛠️ Utility per Affidabilità <a name="utility"></a>

### Fase 4: Retry & Rate Limiting

#### 1. Rate Limiter
**File**: `lib/workflow-engine/utils/rate-limiter.ts`
**Scopo**: Token Bucket algorithm per API rate limiting

```typescript
import { RateLimiters } from './lib/workflow-engine/utils'

const apifyLimiter = RateLimiters.apify() // 100 req/min
await apifyLimiter.acquire()
// Fai chiamata API...
```

**Pre-configurati**:
- `RateLimiters.apify()`: 100 req/min
- `RateLimiters.openrouter()`: 60 req/min
- `RateLimiters.moderate()`: 10 req/sec
- `RateLimiters.strict()`: 1 req/sec

#### 2. Retry Executor
**File**: `lib/workflow-engine/utils/retry.ts`
**Scopo**: Exponential backoff con jitter

```typescript
import { RetryExecutors } from './lib/workflow-engine/utils'

const executor = RetryExecutors.standard() // 3 retry, 1s delay
const result = await executor.execute(async () => {
  return await apiCall()
})
```

**Features**:
- Exponential backoff (1s → 2s → 4s)
- Jitter (evita thundering herd)
- Circuit Breaker (ferma chiamate fallite)
- Retry conditions (network, server, rate limit)

---

### Fase 5: Caching

#### 3. Cache System
**File**: `lib/workflow-engine/utils/cache.ts`
**Scopo**: In-memory cache con TTL e LRU eviction

```typescript
import { Caches } from './lib/workflow-engine/utils'

const instagramCache = Caches.instagram() // 7 days TTL

// Con pattern fetch-or-cache
const data = await apiCache.fetch('key', () => apiCall())
```

**Pre-configurati**:
| Cache | TTL | Max Size | Use Case |
|-------|-----|----------|----------|
| `Caches.country()` | 24h | 500 | Country detection |
| `Caches.instagram()` | 7 days | 1000 | Instagram profiles |
| `Caches.linkedin()` | 30 days | 1000 | LinkedIn profiles |
| `Caches.llm()` | 7 days | 2000 | LLM results |
| `Caches.shortTerm()` | 5 min | 100 | Frequently changing data |

**Statistiche**:
```typescript
cache.getStats()
// { size, hits, misses, hitRate, evictions, totalSets }
```

---

## ⚙️ Configurazione e Setup <a name="configurazione"></a>

### Environment Variables

**File**: `.env.local`

```bash
# Apify (Instagram + LinkedIn)
APIFY_API_KEY=sk-or-...

# OpenRouter (LLM)
OPENROUTER_API_KEY=sk-or-...

# Supabase (opzionale)
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Registrazione Blocchi

I blocchi sono registrati automaticamente:

```typescript
import { registerAllBuiltInBlocks } from './lib/workflow-engine/blocks'

registerAllBuiltInBlocks()
```

### Esecuzione Workflow

```typescript
import { csvInterestEnrichmentWorkflow } from './lib/workflow-engine/workflows/csv-interest-enrichment.workflow'
import { WorkflowOrchestrator } from './lib/workflow-engine/orchestrator'
import { ContextFactory } from './lib/workflow-engine/context'

const orchestrator = new WorkflowOrchestrator()
const context = ContextFactory.create({
  workflowId: 'csv.interestEnrichment',
  executionId: 'exec_1',
  mode: 'production', // 'demo' | 'test'
  variables: {},
  secrets: {
    apify: process.env.APIFY_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY
  }
})

const input = { csv: '...raw csv...' }
const result = await orchestrator.execute(workflow, context, input)
```

---

## 💰 Costi e Performance <a name="costi"></a>

### Costi per Contatto

| Servizio | Costo | Note |
|----------|-------|------|
| Country Detection | $0.000 | Gratis |
| Email Classification | $0.000 | Gratis |
| **LinkedIn (Apify)** | **$0.003** | Business only |
| **Instagram (Apify)** | **$0.050** | Tutti |
| **Interest Inference (LLM)** | **$0.010** | Solo con bio |
| **TOTALE** | **~$0.063** | Worst case |

### Costi con Cache (50% duplicati)

- **Senza Cache**: $0.063 × 10 = $0.630
- **Con Cache**: $0.265 (10 contatti, 5 unici)
- **Risparmio**: 50%

### Performance

| Metrica | Valore |
|---------|--------|
| Throughput | ~100 contatti/ora (con cache) |
| Hit Rate Cache | 50% (con duplicati) |
| API Calls Saved | 50% |
| Velocità vs No Cache | 2x più veloce |

### Batch Processing

| Contatti | Tempo (stimato) | Costo |
|----------|----------------|-------|
| 10 | ~5 min | $0.63 |
| 100 | ~50 min | $6.30 |
| 1000 | ~8 ore | $63.00 |

---

## 💻 Utilizzo CLI <a name="cli"></a>

### Comandi Base

```bash
# Esegui workflow in demo mode
workflow exec --id csv.interestEnrichment --mode demo

# Esegui con file di configurazione
workflow exec --id csv.interestEnrichment --file config.json

# Esegui con input inline
workflow exec --id csv.interestEnrichment --input '{"csv":"..."}'

# Esegui disabilitando cache (dati freschi)
workflow exec --id csv.interestEnrichment --no-cache

# Esegui in production mode
workflow exec --id csv.interestEnrichment --mode live
```

### Opzioni CLI

| Opzione | Descrizione | Default |
|---------|-------------|---------|
| `--id <workflowId>` | Workflow ID | Richiesto |
| `--file <path>` | Config file | - |
| `--input <json>` | Input inline JSON | - |
| `--mode <mode>` | demo/test/live | demo |
| `--no-cache` | Disabilita cache | false |
| `--watch` | Progress bar | false |
| `--json` | Output JSON | false |

### Esempio Completo

```bash
# 1. Crea file di configurazione
cat > test-config.json << EOF
{
  "input": {
    "csv": "nome;celular;email;nascimento\nMarco Montemagno;;marco@montemagno.com;1974-01-01"
  },
  "variables": {},
  "secrets": {}
}
EOF

# 2. Esegui workflow
workflow exec \
  --id csv.interestEnrichment \
  --file test-config.json \
  --mode demo

# 3. Per dati freschi (senza cache)
workflow exec \
  --id csv.interestEnrichment \
  --file test-config.json \
  --mode live \
  --no-cache
```

---

## 🧪 Testing <a name="testing"></a>

### Test Files

| Fase | File | Scopo |
|------|------|-------|
| 1 | `test-csv-fase1.ts` | CSV Parser & Assembler |
| 2 | `test-csv-fase2.ts` | Instagram & LinkedIn Search |
| 3 | `test-csv-fase3.ts` | Supporting Blocks |
| 4 | `test-csv-fase4.ts` | Retry & Rate Limiting |
| 5 | `test-csv-fase5.ts` | Cache |

### Esegui Tutti i Test

```bash
# Fase 1: CSV
npx tsx test-csv-fase1.ts

# Fase 2: Apify
npx tsx test-csv-fase2.ts

# Fase 3: Supporting
npx tsx test-csv-fase3.ts

# Fase 4: Reliability
npx tsx test-csv-fase4.ts

# Fase 5: Cache
npx tsx test-csv-fase5.ts
```

---

## 🔧 Troubleshooting <a name="troubleshooting"></a>

### Errori Comuni

#### 1. Apify Token Missing
```
Error: Apify API token is required
```
**Soluzione**: Imposta `APIFY_API_KEY` in `.env.local`

#### 2. OpenRouter Token Invalid
```
Error: OpenRouter token validation failed
```
**Soluzione**: Verifica `OPENROUTER_API_KEY` in `.env.local`

#### 3. Cache Non Aggiornata
**Problema**: I dati sembrano vecchi
**Soluzione**: Usa `--no-cache` per dati freschi

#### 4. Rate Limit 429
**Problema**: Troppe richieste API
**Soluzione**: Automatico con RateLimiter, aumentare delay

#### 5. Apify Monthly Limit Exceeded
**Problema**: `Monthly usage hard limit exceeded`
**Soluzione**:
- Il piano Apify ha raggiunto il limite mensile di utilizzo
- Opzioni:
  - Attendere il reset mensile (inizio del prossimo mese)
  - Upgrade del piano Apify per aumentare il limite
  - Usare mock mode (`mode: 'demo'`) per testare senza API
- Verifica il limite: Apify Dashboard > Plans & Billing

### Logging

I blocchi loggano diverse informazioni:

```typescript
context.logger.debug('Messaggio debug', { data })
context.logger.info('Messaggio info', { data })
context.logger.warn('Messaggio warning', { data })
context.logger.error('Messaggio error', { data })
```

### Mock Mode

Per testing senza API:

```typescript
const context = ContextFactory.create({
  mode: 'demo', // 'demo' | 'test'
  // ...
})
```

---

## 📚 Riferimenti

### File Chiave

**Blocchi**:
- `lib/workflow-engine/blocks/csv/`
- `lib/workflow-engine/blocks/api/`
- `lib/workflow-engine/blocks/transform/`
- `lib/workflow-engine/blocks/filter/`

**Utility**:
- `lib/workflow-engine/utils/retry.ts`
- `lib/workflow-engine/utils/rate-limiter.ts`
- `lib/workflow-engine/utils/cache.ts`

**Workflow**:
- `lib/workflow-engine/workflows/csv-interest-enrichment.workflow.ts`

### Documentazione Tecnica

- **LinkedIn Analysis**: `lib/workflow-engine/LINKEDIN-SCRAPING-ANALYSIS.md`
- **Workflow Guide**: `lib/workflow-engine/WORKFLOW-BUILDING-GUIDE.md`
- **Block Guide**: `lib/workflow-engine/BLOCK-REUSABILITY-GUIDE.md`

---

## 🎯 Riepilogo Completo

### 5 Fasi Implementate

✅ **Fase 1**: CSV Parser & Assembler Blocks
✅ **Fase 2**: Instagram & LinkedIn Search Blocks (Apify)
✅ **Fase 3**: Email Classifier, Contact Normalizer, Bio Data Filter
✅ **Fase 4**: Retry Logic + Rate Limiting
✅ **Fase 5**: Caching con TTL e LRU
✅ **CLI Tool**: Opzione `--no-cache` per dati freschi

### Commit Finali

| Commit | Descrizione |
|--------|-------------|
| `fa13b12` | Fase 1: CSV Parser & Assembler |
| `4164c38` | Fase 2: Instagram & LinkedIn Search |
| `830c874` | Fase 3: Supporting Blocks |
| `6913e9c` | Fase 4: Retry & Rate Limiting |
| `a1b448f` | Fase 5: Caching System |
| `14438f4` | CLI: --no-cache option |

---

## 🚀 Prossimi Passi

### Miglioramenti Futuri

1. **Fase 6: Dashboard**
   - Interfaccia web per configurare workflow
   - Monitoraggio esecuzioni in tempo reale
   - Grafici costi e performance

2. **Fase 7: Advanced Features**
   - Batch processing parallelo
   - Webhook callbacks
   - Export in più formati (JSON, Excel, Google Sheets)

3. **Ottimizzazioni**
   - Compressione cache
   - Distributed cache (Redis)
   - Background job processing

---

**Documento creato**: 10 Gennaio 2026
**Versione**: 1.0
**Autore**: Claude Sonnet 4.5 + User
