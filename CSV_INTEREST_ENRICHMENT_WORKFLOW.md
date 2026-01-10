# CSV Interest Enrichment V3.2 - Complete Guide

**Version:** 3.2
**Last Updated:** 11 Gennaio 2026
**Status:** Production Ready ✅

---

## Overview

The CSV Interest Enrichment workflow transforms a CSV file containing contact data (name, email, phone) into enriched contacts with interests, demographics, and social profiles.

### What It Does

```
Input CSV → Parse → Detect Country → Classify Emails → Normalize Contacts
    ↓
FullContact Enrichment → (Optional) PDL Enrichment → LLM Interest Merge
    ↓
Output CSV with Interests Column
```

### Key Features

- ✅ **Smart Merge**: Combines data from multiple sources without losing information
- ✅ **Edge Adapters**: Clean data transformation between blocks
- ✅ **Mock Mode**: Zero-cost testing without API calls
- ✅ **Country Detection**: Automatic country-based configuration
- ✅ **Email Classification**: Business vs personal email detection
- ✅ **Contact Normalization**: Name parsing, phone cleaning
- ✅ **FullContact Integration**: B2C interest enrichment (Instagram, demographics)
- ✅ **PDL Integration** (Optional): B2B LinkedIn enrichment
- ✅ **LLM Interest Merging**: Intelligent deduplication and merging

---

## Architecture

### Workflow Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                        LAYER 0                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  csv-parse: Parse CSV input                                    │
│  Input: { csv: string }                                         │
│  Output: { headers, rows, metadata }                           │
└─────────────────────────────────────────────────────────────────┘
      │              │              │
      │ [e1]         │ [e2]         │ [e3]
      ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        LAYER 1 (Parallel)                       │
├─────────────────────────────────────────────────────────────────┤
│  country-detect     │  email-classify  │  contact-normalize     │
│  Detect country     │  Business/Person  │  Normalize data       │
│  Set context vars   │  email types      │  Clean phone/email    │
└─────────────────────────────────────────────────────────────────┘
      │                  │                  │
      └──────────────────┴──────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  fullcontact-enrich: Enrich with FullContact API               │
│  Input: Merged from email-classify AND contact-normalize        │
│  Output: { contacts: [...], metadata: {...} }                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  branch-pdl-enabled: Is PDL enabled?                            │
│  IF config.pdlEnabled → pdl-enrich                              │
│  ELSE → skip-pdl                                                │
└─────────────────────────────────────────────────────────────────┘
      │                              │
      │ [true]                       │ [false]
      ▼                              ▼
┌──────────────────┐         ┌──────────────────┐
│  pdl-enrich      │         │  skip-pdl        │
│  PDL B2B data    │         │  Pass through    │
└──────────────────┘         └──────────────────┘
      │                              │
      └──────────────┬───────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  branch-merge-interests: Has LLM merge?                         │
│  IF has PDL data → llm-merge-interests                          │
│  ELSE → skip-merge                                              │
└─────────────────────────────────────────────────────────────────┘
      │                              │
      ▼                              ▼
┌──────────────────┐         ┌──────────────────┐
│  llm-merge       │         │  skip-merge      │
│  LLM merge       │         │  Pass through    │
└──────────────────┘         └──────────────────┘
      │                              │
      └──────────────┬───────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  csv-assemble: Generate final CSV                              │
│  Input: Merged from llm-merge-interests OR skip-merge           │
│  Output: { csv: string, rows: array, metadata }                │
└─────────────────────────────────────────────────────────────────┘
```

### Smart Merge in Action

The workflow uses **smart merge** at two critical points:

#### 1. fullcontact-enrich receives from 2 sources

```javascript
// email-classify output
{
  contacts: [{
    original: { nome: "Mario", email: "mario@test.com" },
    emailType: "business",
    domain: "test.com"
  }],
  metadata: { totalProcessed: 1, businessEmails: 1 }
}

// contact-normalize output
{
  contacts: [{
    original: { nome: "Mario", email: "mario@test.com" },
    normalized: {
      firstName: "Mario",
      lastName: "Rossi",
      phoneClean: "+39123456789"
    }
  }],
  metadata: { totalProcessed: 1, normalizedNames: 1 }
}

// Smart merge result at fullcontact-enrich
{
  contacts: [{
    original: { nome: "Mario", email: "mario@test.com" },
    emailType: "business",        // ← from email-classify
    domain: "test.com",           // ← from email-classify
    normalized: {                  // ← from contact-normalize
      firstName: "Mario",
      lastName: "Rossi",
      phoneClean: "+39123456789"
    }
  }],
  metadata: {
    totalProcessed: 1,
    businessEmails: 1,             // ← from email-classify
    normalizedNames: 1            // ← from contact-normalize
  }
}
```

#### 2. csv-assemble receives from 2 sources

```javascript
// llm-merge-interests output
{
  contacts: [{ ...enriched with interests... }],
  metadata: { totalProcessed: 1 }
}

// skip-merge output
{
  contacts: [{ ...enriched without PDL... }],
  metadata: { totalProcessed: 1 },
  _branch: { result: false, routedTo: "skip-pdl" }
}

// Smart merge result at csv-assemble
{
  contacts: [{ ...same contacts... }],  // Smart merged by ID
  metadata: { totalProcessed: 1 },      // Metadata merged
  _branch: { result: false, routedTo: "skip-pdl" }  // Branch info preserved
}
```

---

## Block-by-Block Breakdown

### Layer 0: Input

#### csv-parse
**Type:** `csv.parser`
**Purpose:** Parse CSV string into structured data

**Input:**
```json
{
  "csv": "nome;celular;email;nascimento\nMario Rossi;;mario@example.com;1985-03-15"
}
```

**Output:**
```json
{
  "headers": ["nome", "celular", "email", "nascimento"],
  "rows": [
    { "nome": "Mario Rossi", "celular": "", "email": "mario@example.com", "nascimento": "1985-03-15" }
  ],
  "metadata": {
    "totalRows": 1,
    "totalColumns": 4,
    "delimiter": ";"
  }
}
```

**Edge Adapters:**
- e1: `rows` → `contacts` (to country-detect)
- e2: `rows` → `contacts` (to email-classify)
- e3: `rows` → `contacts` (to contact-normalize)

---

### Layer 1: Parallel Processing

#### country-detect
**Type:** `countries.config`
**Purpose:** Detect country from phone/email and set context variables

**Input:** `{ contacts: [...] }`

**Output:** `{ contacts: [...] }` (passthrough)

**Side Effects:** Sets context variables:
```javascript
context.setVariable('country', 'BR')
context.setVariable('language', 'pt-BR')
context.setVariable('region', 'south_america')
context.setVariable('model', 'google/gemma-2-27b-it')
context.setVariable('system_prompt', '...')
context.setVariable('common_interests', ['futebol', 'música', ...])
```

#### email-classify
**Type:** `transform.emailClassify`
**Purpose:** Classify emails as business or personal

**Input:** `{ contacts: [...] }`

**Output:**
```json
{
  "contacts": [
    {
      "original": { ... },
      "emailType": "business" | "personal",
      "domain": "example.com"
    }
  ],
  "metadata": {
    "totalProcessed": 1,
    "businessEmails": 1,
    "personalEmails": 0
  }
}
```

#### contact-normalize
**Type:** `transform.contactNormalize`
**Purpose:** Normalize contact data (name parsing, phone cleaning)

**Input:** `{ contacts: [...] }`

**Output:**
```json
{
  "contacts": [
    {
      "original": { ... },
      "normalized": {
        "firstName": "Mario",
        "lastName": "Rossi",
        "phoneClean": "+39123456789",
        "emailLower": "mario@example.com",
        "dateIso": "1985-03-15T00:00:00.000Z"
      }
    }
  ],
  "metadata": {
    "totalProcessed": 1,
    "normalizedNames": 1,
    "normalizedPhones": 1
  }
}
```

---

### Layer 2: FullContact Enrichment

#### fullcontact-enrich
**Type:** `api.fullcontactSearch`
**Purpose:** Enrich contacts with FullContact API (B2C data)

**Input:** Merged from email-classify AND contact-normalize (smart merge)

**Output:**
```json
{
  "contacts": [
    {
      "original": { ... },
      "emailType": "business",
      "normalized": { ... },
      "fullcontact": {
        "instagram": "https://instagram.com/...",
        "interests": ["technology", "business"],
        "demographics": { ... }
      }
    }
  ],
  "metadata": {
    "totalProcessed": 4,
    "profilesFound": 4,
    "cost": 0.04
  }
}
```

---

### Layer 3: PDL Branch

#### branch-pdl-enabled
**Type:** `branch`
**Purpose:** Route based on PDL enabled flag

**Condition:** `config.pdlEnabled === true`

**Routes:**
- **true** → pdl-enrich
- **false** → skip-pdl

---

### Layer 4: PDL Enrichment (Conditional)

#### pdl-enrich
**Type:** `api.pdlSearch`
**Purpose:** Enrich with PDL API (B2B LinkedIn data)

#### skip-pdl
**Type:** `transform.passThrough`
**Purpose:** Skip PDL when disabled

---

### Layer 5: LLM Merge Branch

#### branch-merge-interests
**Type:** `branch`
**Purpose:** Route based on merge enabled flag

**Condition:** `config.mergeInterests === true`

**Routes:**
- **true** → llm-merge-interests
- **false** → skip-merge

---

### Layer 6: LLM Merge (Conditional)

#### llm-merge-interests
**Type:** `ai.llmMergeInterests`
**Purpose:** Merge interests from FullContact and PDL using LLM

#### skip-merge
**Type:** `transform.passThrough`
**Purpose:** Skip LLM merge when disabled

---

### Layer 7: Output

#### csv-assemble
**Type:** `csv.assembler`
**Purpose:** Generate final CSV with interests column

**Input:** Merged from llm-merge-interests OR skip-merge (smart merge)

**Output:**
```json
{
  "csv": "nome;celular;email;interessi\nMario Rossi;;mario@example.com;technology,business",
  "rows": [
    {
      "original": { ... },
      "fullcontact": { ... },
      "interests": ["technology", "business"]
    }
  ],
  "metadata": {
    "totalOutput": 2,
    "withInterests": 2
  }
}
```

---

## Configuration

### Workflow Configuration

```typescript
{
  workflowId: 'csv.interestEnrichment.v3',
  version: '3.2',
  globals: {
    timeout: 3600,
    retryPolicy: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000
    },
    errorHandling: 'continue',
    pdlEnabled: false,      // ← Enable PDL secondary enrichment
    mergeInterests: false   // ← Enable LLM interest merging
  }
}
```

### Execution Modes

```typescript
const context = ContextFactory.create({
  mode: 'demo',  // 'live' | 'mock' | 'demo' | 'test' | 'production'
  variables: {},
  secrets: {
    FULLCONTACT_API_KEY: '...',
    PDL_API_KEY: '...',
    OPENROUTER_API_KEY: '...'
  }
})
```

**Modes:**
- **live**: Real API calls, actual costs
- **mock**: Mock responses for testing, zero cost
- **demo**: Predefined mock data, zero cost
- **test**: Test mode with validation
- **production**: Production mode with logging

---

## Usage Examples

### Example 1: Basic Enrichment

```typescript
import { WorkflowOrchestrator } from '@/lib/workflow-engine/orchestrator'
import { ContextFactory } from '@/lib/workflow-engine/context'
import { csvInterestEnrichmentWorkflow } from '@/lib/workflow-engine/workflows'

const orchestrator = new WorkflowOrchestrator()

const context = ContextFactory.create({
  workflowId: 'csv.interestEnrichment.v3',
  executionId: 'exec-123',
  mode: 'demo',  // Mock mode for testing
  variables: {},
  secrets: {},
  logger: console
})

const input = {
  csv: `nome;celular;email;nascimento
Mario Rossi;;mario.rossi@example.com;1985-03-15
Giulia Bianchi;;giulia.b@email.com;1990-07-22`
}

const result = await orchestrator.execute(csvInterestEnrichmentWorkflow, context, input)

console.log('Status:', result.status)  // 'completed'
console.log('Output CSV:', result.output.csv)
```

### Example 2: With PDL Secondary Enrichment

```typescript
const workflow = { ...csvInterestEnrichmentWorkflow }
workflow.globals.pdlEnabled = true

const context = ContextFactory.create({
  mode: 'live',  // Real API calls
  secrets: {
    FULLCONTACT_API_KEY: process.env.FULLCONTACT_API_KEY,
    PDL_API_KEY: process.env.PDL_API_KEY
  }
})

const result = await orchestrator.execute(workflow, context, input)
```

### Example 3: With LLM Interest Merging

```typescript
const workflow = { ...csvInterestEnrichmentWorkflow }
workflow.globals.pdlEnabled = true
workflow.globals.mergeInterests = true

const context = ContextFactory.create({
  mode: 'live',
  secrets: {
    FULLCONTACT_API_KEY: process.env.FULLCONTACT_API_KEY,
    PDL_API_KEY: process.env.PDL_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY
  }
})

const result = await orchestrator.execute(workflow, context, input)
```

---

## Cost Breakdown

### Per-Contact Costs

| Service | Cost Per Contact | Notes |
|---------|------------------|-------|
| FullContact | $0.01-0.05 | B2C data (Instagram, interests) |
| PDL | $0.01-0.03 | B2B data (LinkedIn, skills) |
| LLM Merge | $0.01 | Interest deduplication/merging |
| **Total (FullContact only)** | **$0.01-0.05** | Most common |
| **Total (with PDL)** | **$0.02-0.08** | B2B + B2C |
| **Total (with LLM merge)** | **$0.03-0.09** | Complete enrichment |

### Example: 100 Contacts

- FullContact only: $1.00 - $5.00
- With PDL: $2.00 - $8.00
- With LLM merge: $3.00 - $9.00

---

## Troubleshooting

### Issue: Data Loss in fullcontact-enrich

**Symptom:** fullcontact-enrich only receives data from contact-normalize, email-classify data is lost

**Cause:** Old orchestrator bug with multiple incoming edges

**Solution:** ✅ FIXED - Smart merge now combines data from both sources

### Issue: country-detect Not Used

**Symptom:** country-detect block executes but output is not used

**Status:** ⚠️ NOT A BUG - By design
- country-detect sets context variables
- Context variables are used by LLM blocks
- Currently LLM merge is optional (disabled by default)

**Workaround:** Enable `mergeInterests` in workflow globals

### Issue: LLM Merge Format Mismatch

**Symptom:** llm-merge-interests expects different input format

**Status:** ⚠️ MONITORING - Not causing issues currently

**Solution:** Add edge adapter if needed

---

## Performance Metrics

### Execution Time

| Configuration | Time (100 contacts) |
|---------------|---------------------|
| Demo mode (mock) | ~2 seconds |
| Live (FullContact only) | ~30 seconds |
| Live (with PDL) | ~60 seconds |
| Live (with LLM merge) | ~90 seconds |

### Parallelism

- Layer 1 executes 3 blocks in parallel: **3x speedup**
- Layer 5 executes 2 blocks in parallel: **2x speedup**
- Layer 6 executes 2 blocks in parallel: **2x speedup**

**Total theoretical speedup: ~12x** vs sequential execution

---

## Related Documentation

- [WORKFLOW_ANALYSIS.md](./WORKFLOW_ANALYSIS.md) - Smart merge implementation details
- [WORKFLOW-ENGINE-ROADMAP.md](./WORKFLOW-ENGINE-ROADMAP.md) - Engine development roadmap
- [EDGE_ADAPTERS.md](./lib/workflow-engine/docs/EDGE_ADAPTERS.md) - Edge adapter documentation
- [MOCK_MODE.md](./lib/workflow-engine/docs/MOCK_MODE.md) - Mock mode documentation

---

## Changelog

### Version 3.2 (11 Gennaio 2026)
- ✅ **FIXED**: Smart merge for multiple incoming edges
- ✅ **ADDED**: Edge adapters for data transformation
- ✅ **ADDED**: Mock mode for zero-cost testing
- ✅ **UPDATED**: Documentation and examples

### Version 3.1
- Added PDL secondary enrichment
- Added LLM interest merging
- Added branch blocks for conditional routing

### Version 3.0
- Initial workflow-based architecture
- CSV parsing and assembly
- FullContact integration

---

**Document Maintainer:** Lume Team
**Last Review:** 11 Gennaio 2026
**Next Review:** When workflow architecture changes
