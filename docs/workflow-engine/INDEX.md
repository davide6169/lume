# Workflow Engine - Complete Index

**Central hub for all available blocks and workflows in the Lume Workflow Engine**

---

## 📑 Quick Navigation

- [🧩 Blocks Catalog](#-blocks-catalog) - All available blocks by category
- [🔄 Workflow Templates](#-workflow-templates) - Pre-built workflow templates
- [🚀 Quick Start](#-quick-start) - Get started in 5 minutes
- [📚 Documentation](#-documentation) - Detailed guides and references

---

## 🧩 Blocks Catalog

### Summary by Category

| Category | Blocks | Purpose |
|----------|---------|---------|
| **Input** | 2 blocks | Data sources for workflows |
| **API** | 5 blocks | External API integration |
| **AI** | 4 blocks | Artificial Intelligence & ML |
| **Enrichment** | 2 blocks | Lead/contact enrichment |
| **CSV** | 1 block | CSV processing |
| **Social** | 1 block | Social media integration |
| **Countries** | 1 block | Country detection & config |
| **Transform** | 1 block | Data transformation |
| **Filter** | 1 block | Data filtering |
| **Branch** | 1 block | Conditional routing |
| **Output** | 1 block | Result logging |

**Total: 20 blocks**

---

### 🔵 Input Blocks

#### `input.static` - Static Input Block
**Purpose:** Provide hardcoded/static data for testing and prototyping

**Summary:** Quick way to inject test data without database. Perfect for development, demos, and prototyping.

**Use Cases:**
- Quick testing without database
- Demo workflows
- Prototype development

**Input/Output:**
- Input: Configuration data
- Output: Configured data as-is

**Cost:** $0
**Complexity:** ⭐

**📖 See:** [Input Blocks Guide](./blocks/input/README.md)

---

#### `input.database` - Database Input Block
**Purpose:** Read data from Supabase/PostgreSQL database

**Summary:** Production-ready data source for persistent storage. Connects to your database tables and queries.

**Use Cases:**
- Production data pipelines
- Source audiences
- Persistent storage

**Input/Output:**
- Input: Table name or SQL query
- Output: Database records

**Cost:** $0
**Complexity:** ⭐⭐

**📖 See:** [Input Blocks Guide](./blocks/input/README.md)

---

### 🔌 API Blocks

#### `api.apify` - Apify Scraper Block
**Purpose:** Scrape social media data (Instagram, Facebook)

**Summary:** Integrates with Apify actors to scrape comments and posts from Instagram and Facebook. Provides structured social media data.

**Use Cases:**
- Instagram comment scraping
- Facebook post data extraction
- Social media listening

**Input/Output:**
- Input: URL, platform, limit
- Output: Comments/posts with metadata

**Cost:** $0.01-0.10 per run
**Complexity:** ⭐⭐
**Mock Mode:** ✅ Yes

**📖 See:** [Apify Scraper Block](./blocks/api/apify-scraper.block.ts) | [Mock Mode Guide](./MOCK-MODE-GUIDE.md#apify-scraper)

---

#### `api.apollo` - Apollo Enrichment Block
**Purpose:** Enrich contacts with LinkedIn data (business emails only)

**Summary:** Uses Apollo.io API to find LinkedIn profiles, job titles, and company information. Only works for business emails (@azienda.com), not personal emails.

**Use Cases:**
- B2B lead enrichment
- LinkedIn profile discovery
- Job title & company enrichment

**Input/Output:**
- Input: Email address
- Output: LinkedIn URL, title, company, location

**Cost:** $0.02 per contact
**Complexity:** ⭐⭐
**Mock Mode:** ✅ Yes
**Coverage:** ~35% of business emails

**📖 See:** [Apollo Enrichment Block](./blocks/api/apollo-enrichment.block.ts) | [Lead Enrichment Guide](./LEAD-ENRICHMENT-GUIDE.md)

---

#### `api.hunter.finder` - Hunter Email Finder Block
**Purpose:** Find email addresses from name and domain

**Summary:** Uses Hunter.io API to find email addresses when you only have name and company domain.

**Use Cases:**
- Find missing emails
- Complete contact profiles
- Email outreach preparation

**Input/Output:**
- Input: Name, domain
- Output: Email address with confidence score

**Cost:** $0.004 per lookup
**Complexity:** ⭐⭐
**Mock Mode:** ✅ Yes

**📖 See:** [Hunter IO Block](./blocks/api/hunter-io.block.ts)

---

#### `api.hunter.verifier` - Hunter Email Verifier Block
**Purpose:** Verify email deliverability

**Summary:** Checks if email addresses are valid and deliverable before sending outreach.

**Use Cases:**
- Email list cleaning
- Bounce prevention
- Deliverability verification

**Input/Output:**
- Input: Email address
- Output: Validity status, score, deliverability

**Cost:** $0.0016 per email
**Complexity:** ⭐
**Mock Mode:** ✅ Yes

**📖 See:** [Hunter IO Block](./blocks/api/hunter-io.block.ts)

---

#### `api.mixedbread` - Mixedbread Embeddings Block
**Purpose:** Generate vector embeddings for text

**Summary:** Creates vector embeddings using Mixedbread AI for semantic search, clustering, and similarity matching.

**Use Cases:**
- Semantic search
- Document clustering
- Similarity matching
- Recommendation systems

**Input/Output:**
- Input: Text string(s)
- Output: Vector embeddings (array of floats)

**Cost:** $0.0001 per text
**Complexity:** ⭐⭐⭐
**Mock Mode:** ✅ Yes

**📖 See:** [Mixedbread Block](./blocks/api/mixedbread-embeddings.block.ts)

---

### 🤖 AI Blocks

#### `ai.openrouter` - Generic LLM Block
**Purpose:** Generic Large Language Model for any NLP task

**Summary:** Universal LLM block using OpenRouter. Access to 100+ models (GPT-4, Claude, Llama, Mistral, etc.). Perfect for any text generation task.

**Use Cases:**
- Text summarization
- Translation
- Content generation
- Question answering
- Code generation

**Input/Output:**
- Input: Prompt, model selection
- Output: LLM response text

**Cost:** $0.0001-0.01 per 1K tokens
**Complexity:** ⭐⭐
**Mock Mode:** ✅ Yes
**Recommended Models:**
- Italian: `google/gemma-2-27b-it:free`
- General: `mistralai/mistral-7b-instruct:free`
- Advanced: `meta-llama/llama-3-70b-instruct:free`

**📖 See:** [OpenRouter Block](./blocks/ai/openrouter.block.ts) | [Mock Mode Guide](./MOCK-MODE-GUIDE.md#openrouter)

---

#### `ai.contactExtraction` - AI Contact Extraction Block
**Purpose:** Extract structured contacts from unstructured text

**Summary:** Uses Mistral 7B to extract contacts (email, phone, name) from unstructured text like social media bios and comments.

**Use Cases:**
- Extract contacts from comments
- Parse social bios
- Clean unstructured data

**Input/Output:**
- Input: Unstructured text (comments, bio, etc.)
- Output: Structured contacts with fields

**Cost:** $0.0001 per extraction
**Complexity:** ⭐⭐
**Mock Mode:** ✅ Yes
**Model:** Mistral 7B

**📖 See:** [Contact Extraction Block](./blocks/ai/contact-extraction.block.ts)

---

#### `ai.interestInference` - AI Interest Inference Block
**Purpose:** Infer interests from social media data with cultural context

**Summary:** Uses Gemma 2 27B to infer interests from bio/posts with country-specific cultural context (Brazil, Italy, Mexico, etc.). More accurate than generic models.

**Use Cases:**
- Interest profiling
- Lead scoring
- Personalization
- Audience segmentation

**Input/Output:**
- Input: Bio, posts, country, name, age
- Output: Interest list with confidence scores

**Cost:** $0.0001 per contact
**Complexity:** ⭐⭐
**Mock Mode:** ✅ Yes
**Model:** Gemma 2 27B

**📖 See:** [Interest Inference Block](./blocks/ai/interest-inference.block.ts) | [Mock Mode Guide](./MOCK-MODE-GUIDE.md#interest-inference)

---

#### `ai.sentimentAnalysis` - AI Sentiment Analysis Block
**Purpose:** Analyze sentiment of text (positive/neutral/negative)

**Summary:** Classifies text sentiment with confidence scores using Mistral 7B embeddings. Great for prioritization and routing.

**Use Cases:**
- Comment sentiment analysis
- Lead prioritization
- Customer feedback analysis
- Social listening

**Input/Output:**
- Input: Text string(s)
- Output: Sentiment (positive/neutral/negative) + score

**Cost:** $0.0001 per text
**Complexity:** ⭐⭐
**Mock Mode:** ✅ Yes
**Model:** Mistral 7B

**📖 See:** [Sentiment Analysis Block](./blocks/ai/sentiment-analysis.block.ts)

---

### 🎯 Enrichment Blocks

#### `enrichment.lead` - Lead Enrichment Block (Composite)
**Purpose:** Complete lead enrichment with 3 strategies

**Summary:** Composite block that combines country detection, LinkedIn enrichment (Apollo), and LLM interest inference into one powerful block.

**Strategies:**
1. **Country Detection** (FREE, 100% coverage)
2. **LinkedIn via Apollo** ($0.02, 35% coverage, business emails only)
3. **LLM Interest Inference** ($0.0001, 100% coverage, country-specific)

**Use Cases:**
- CSV lead enrichment
- Contact profiling
- Audience enrichment

**Input/Output:**
- Input: Contacts array (name, email, phone, birthDate)
- Output: Enriched contacts with country, linkedin, interests

**Cost:** $0.0001-0.02 per contact
**Complexity:** ⭐⭐⭐
**Mock Mode:** ✅ Yes

**📖 See:** [Lead Enrichment Guide](./LEAD-ENRICHMENT-GUIDE.md) | [Lead Enrichment Block](./blocks/enrichment/lead-enrichment.block.ts)

---

### 📊 CSV Blocks

#### `csv.interestEnrichment` - CSV Interest Enrichment Block
**Purpose:** Enrich CSV file with interests field

**Summary:** **Workflow campione** - Takes CSV with contacts and adds "interessi" column. Filters out records without interests. Perfect for email list enrichment.

**Workflow:**
1. Country detection from phone/email (FREE)
2. LinkedIn scraping (business emails only, $0.003)
3. Instagram search (50% coverage, $0.05)
4. LLM interest inference ($0.0001)

**Input/Output:**
- Input: CSV with nome, celular, email, nascimento
- Output: CSV with added "interessi" column

**Cost:** $0.0001-0.05 per contact
**Complexity:** ⭐⭐⭐
**Mock Mode:** ✅ Yes

**📖 See:** [CSV Interest Quick Start](./CSV-INTEREST-QUICK-START.md) | [CSV Block](./blocks/csv/csv-interest-enrichment.block.ts)

**🧪 Test:**
```bash
npm run workflow -- blocks test --type csv.interestEnrichment --mode demo
```

---

### 🌍 Countries Blocks

#### `countries.config` - Country Configuration Block
**Purpose:** Auto-detect country from phone/email and provide country-specific config

**Summary:** Detects country from email TLD (.br, .it, .mx) or phone prefix (+55, +39, +52) and returns country-specific LLM prompts, models, and settings.

**Use Cases:**
- Country detection
- Localized LLM prompts
- Cultural context

**Input/Output:**
- Input: Email, phone
- Output: Country code, name, language, region, model, system_prompt

**Cost:** $0
**Complexity:** ⭐

**📖 See:** [Country Config Block](./blocks/countries/country-config.block.ts)

---

### 🔄 Transform Blocks

#### `transform.fieldMapping` - Field Mapping Block
**Purpose:** Map and transform data fields

**Summary:** Rename, map, and transform fields between different schemas. Supports operations like rename, extract, calculate, format.

**Use Cases:**
- Schema adaptation
- Field renaming
- Data transformation
- System integration

**Input/Output:**
- Input: Object with fields
- Output: Object with mapped fields

**Cost:** $0
**Complexity:** ⭐⭐

**📖 See:** [Transform Block](./blocks/transform/field-mapping.block.ts)

---

### 🔀 Filter & Branch Blocks

#### `filter` - Filter Block
**Purpose:** Filter data based on conditions

**Summary:** Remove unwanted records based on conditions. Great for cost optimization (filter out personal emails before Apollo).

**Use Cases:**
- Remove invalid records
- Keep only business emails
- Clean data pipelines

**Input/Output:**
- Input: Array of records
- Output: Filtered array

**Cost:** $0
**Complexity:** ⭐

**📖 See:** [Filter Block](./blocks/filter/filter.block.ts)

---

#### `branch` - Branch Block
**Purpose:** Route data based on conditions

**Summary:** Conditional routing for workflows. Split data based on criteria (business vs personal email, country, etc.).

**Use Cases:**
- Conditional routing
- A/B testing workflows
- Multi-path processing

**Input/Output:**
- Input: Data record
- Output: Routed to different branches

**Cost:** $0
**Complexity:** ⭐⭐

**📖 See:** [Branch Block](./blocks/branch/branch.block.ts)

---

### 📤 Output Blocks

#### `output.logger` - Logger Output Block
**Purpose:** Log results to console

**Summary:** Output workflow results to console with pretty formatting. Great for debugging and development.

**Use Cases:**
- Development logging
- Debug output
- Test results

**Input/Output:**
- Input: Any data
- Output: Console logs

**Cost:** $0
**Complexity:** ⭐

**📖 See:** [Logger Block](./blocks/output/logger-output.block.ts)

---

## 🔄 Workflow Templates

### Summary

| Workflow ID | Name | Purpose | Complexity |
|-------------|------|---------|------------|
| `csv.interestEnrichment` | CSV Interest Enrichment | **Workflow campione** - Enrich CSV with interests | ⭐⭐ |
| `lead-enrichment-complete` | Complete Lead Enrichment | 3-strategy lead enrichment pipeline | ⭐⭐⭐ |
| `csv-interest-inference-latam` | LATAM Interest Inference | Multi-country interest inference | ⭐⭐⭐ |
| `standard-lead-enrichment` | Standard Lead Enrichment | Apify → Contact Extraction → Apollo → Output | ⭐⭐ |
| `ai-powered-enrichment` | AI-Powered Enrichment | AI-focused enrichment pipeline | ⭐⭐⭐ |

---

### 📊 CSV Interest Enrichment (Workflow Campione)

**Workflow ID:** `csv.interestEnrichment`

**Summary:** **Banca di prova iniziale** del workflow engine. Prende un CSV di contatti (nome, email, telefono, data di nascita) e aggiunge una colonna "interessi" con interessi inferiti tramite AI.

**Steps:**
1. **Country Detection** (dal telefono) - GRATIS
2. **LinkedIn Scraper** (email business) - $0.003/contatto
3. **Instagram Search** - $0.05/contatto
4. **LLM Interest Inference** (country-specific) - $0.0001/contatto

**Input:**
```csv
nome;celular;email;nascimento
Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986
```

**Output:**
```csv
nome;celular;email;nascimento;interessi
Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986;calcio, chitarra elettrica, pianoforte
```

**Features:**
- ✅ Filtra record senza interessi
- ✅ Mock mode per sviluppo
- ✅ CLI integration
- ✅ Italian interests (calcio, musica, arte, cibo)

**Test:**
```bash
npm run workflow -- blocks test --type csv.interestEnrichment --mode demo
```

**📖 See:** [CSV Interest Quick Start](./CSV-INTEREST-QUICK-START.md)

---

### 🎯 Complete Lead Enrichment

**Workflow ID:** `lead-enrichment-complete`

**Summary:** Advanced lead enrichment combining 3 proven strategies. Detects country, enriches business emails with LinkedIn, and infers interests using country-specific LLM prompts.

**Strategies:**
1. Country Detection (FREE, 100%)
2. LinkedIn via Apollo ($0.02, 35% of business emails)
3. LLM Interest Inference ($0.0001, 100%)

**Use Cases:**
- B2B lead enrichment
- Contact profiling
- Audience analysis

**Cost:** $0.0001-0.02 per contact
**Coverage:** 100%

**📖 See:** [Lead Enrichment Guide](./LEAD-ENRICHMENT-GUIDE.md)

---

### 🌎 LATAM Interest Inference

**Workflow ID:** `csv-interest-inference-latam`

**Summary:** Multi-country interest inference for LATAM markets (Brazil, Mexico, Argentina, Colombia, etc.). Uses country-specific LLM prompts for accurate cultural inference.

**Features:**
- Auto country detection
- Country-specific prompts
- Multi-language support (PT-BR, ES-MX, ES-AR, ES-CO)
- Age-based interests

**📖 See:** [LATAM Example](./examples/csv-interest-inference-latam-example.ts)

---

### 🏢 Standard Lead Enrichment

**Workflow ID:** `standard-lead-enrichment`

**Summary:** Simple 4-step pipeline: Input → Apify Scraper → AI Contact Extraction → Apollo Enrichment → Output.

**Steps:**
1. Scrape social media (Apify)
2. Extract contacts (AI)
3. Enrich with LinkedIn (Apollo)
4. Store results

**📖 See:** [Database Schema](./SPRINT-3.1-COMPLETION.md)

---

### 🧠 AI-Powered Enrichment

**Workflow ID:** `ai-powered-enrichment`

**Summary:** AI-focused enrichment pipeline with advanced NLP: Contact Extraction → Interest Inference → Sentiment Analysis → Apollo Enrichment.

**Steps:**
1. Extract contacts from social data
2. Infer interests with cultural context
3. Analyze sentiment
4. Enrich with LinkedIn
5. Store results

**📖 See:** [Database Schema](./SPRINT-3.1-COMPLETION.md)

---

## 🚀 Quick Start

### 1. Test a Block (Demo Mode)
```bash
# Auto-loads baseline config in demo mode
npm run workflow -- blocks test --type csv.interestEnrichment --mode demo
```

### 2. Execute a Workflow
```bash
# Demo mode (mock)
npm run workflow -- exec --id lead-enrichment-complete --mode demo

# Production mode (real APIs)
export APIFY_API_KEY=xxx
export OPENROUTER_API_KEY=xxx
npm run workflow -- exec --id lead-enrichment-complete --mode live
```

### 3. List Available Blocks
```bash
npm run workflow -- blocks list
```

### 4. List Available Workflows
```bash
npm run workflow -- list
```

---

## 📚 Documentation

### User Guides
- **[CLI Guide](./CLI-GUIDE.md)** - Complete CLI documentation
- **[Mock Mode Guide](./MOCK-MODE-GUIDE.md)** - Development without API keys
- **[Lead Enrichment Guide](./LEAD-ENRICHMENT-GUIDE.md)** - Complete lead enrichment
- **[CSV Interest Quick Start](./CSV-INTEREST-QUICK-START.md)** - Get started with CSV enrichment
- **[Workflow Building Guide](./WORKFLOW-BUILDING-GUIDE.md)** - Build custom workflows
- **[Block Reusability Guide](./BLOCK-REUSABILITY-GUIDE.md)** - Reuse blocks effectively

### Technical Docs
- **[README](./README.md)** - Project overview
- **[Sprint Completions](./SPRINT-3.3-COMPLETION.md)** - Implementation history
- **[Blocks Quick Reference](./BLOCKS-QUICK-REFERENCE.md)** - Block reference card

### Examples
- **[CSV Interest Enrichment Example](./examples/csv-interest-enrichment-example.ts)**
- **[Lead Enrichment Example](./examples/lead-enrichment-workflow-example.ts)**
- **[LATAM Interest Example](./examples/csv-interest-inference-latam-example.ts)**

---

## 🎯 Block Selection Guide

### "I want to..."

| Goal | Use Block |
|------|-----------|
| Scrape Instagram/Facebook | `api.apify` |
| Find LinkedIn profiles | `api.apollo` |
| Extract contacts from text | `ai.contactExtraction` |
| Infer interests | `ai.interestInference` |
| Analyze sentiment | `ai.sentimentAnalysis` |
| Enrich CSV with interests | `csv.interestEnrichment` |
| Detect country | `countries.config` |
| Generic LLM task | `ai.openrouter` |

---

## 💡 Best Practices

### 1. Start with Demo Mode
```bash
# Always test in demo mode first
npm run workflow -- blocks test --type <block-type> --mode demo
```

### 2. Use Mock Mode for Development
- No API costs
- Deterministic output
- Fast feedback

### 3. Filter Business Emails
```bash
# Use filter block to reduce Apollo costs
# Only business emails go to Apollo enrichment
```

### 4. Country-Specific Models
- **Italian:** `google/gemma-2-27b-it:free`
- **Spanish:** `meta-llama/llama-3.1-8b-instruct:free`
- **English:** `mistralai/mistral-7b-instruct:free`

---

## 📞 Support

- **CLI Help:** `npm run workflow -- --help`
- **Command Help:** `npm run workflow -- <command> --help`
- **GitHub Issues:** https://github.com/davide6169/lume/issues

---

**Last Updated:** 2026-01-10
**Version:** 1.0.0
**Status:** ✅ Production Ready
