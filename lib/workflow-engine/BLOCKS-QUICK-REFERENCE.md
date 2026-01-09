# Blocks Quick Reference Card

## 🎯 Quick Reference

This card provides a quick overview of all available blocks in the Lume Workflow Engine. Use it to find the right block for your needs.

---

## 📋 Block Catalog

### INPUT Blocks - Data Sources

| Block ID | Name | Input | Output | Use Cases | Cost | Complexity |
|----------|------|-------|--------|-----------|------|------------|
| `input.static` | Static Input | Config.data | Any data | Testing, demos, prototyping | $0 | ⭐ |
| `input.database` | Database Input | Table/query | DB records | Production data, persistent storage | $0 | ⭐⭐ |

**When to use:**
- `input.static` → Quick testing, hardcoded data
- `input.database` → Real data from Supabase/PostgreSQL

---

### API Blocks - External Service Integration

| Block ID | Name | Input | Output | Use Cases | Cost | Complexity |
|----------|------|-------|--------|-----------|------|------------|
| `api.apify` | Apify Scraper | Dataset ID | Scraped data | Instagram, Facebook scraping | $0.01-0.10 | ⭐⭐ |
| `api.apollo` | Apollo Enrichment | Email | LinkedIn data | B2B lead enrichment | $0.02/lead | ⭐⭐ |
| `api.hunter.finder` | Hunter Email Finder | Name/domain | Email | Find missing emails | $0.004 | ⭐⭐ |
| `api.hunter.verifier` | Hunter Email Verifier | Email | Deliverability | Verify email validity | $0.0016 | ⭐ |
| `api.mixedbread` | Mixedbread Embeddings | Text | Vector embeddings | Semantic search, clustering | $0.0001 | ⭐⭐⭐ |

**When to use:**
- `api.apify` → Social media scraping (Instagram comments, Facebook posts)
- `api.apollo` → LinkedIn enrichment for business emails only
- `api.hunter.finder` → Find email addresses from name/company
- `api.hunter.verifier` → Verify email deliverability before sending
- `api.mixedbread` → Create embeddings for semantic search

---

### AI Blocks - Artificial Intelligence

| Block ID | Name | Input | Output | Use Cases | Cost | Model |
|----------|------|-------|--------|-----------|------|-------|
| `ai.openrouter` | Generic LLM | Text prompt | LLM response | Any NLP task | $0.0001-0.01 | Any |
| `ai.contactExtraction` | Contact Extraction | Unstructured text | Structured contacts | Extract contacts from comments/bio | $0.0001 | Mistral 7B |
| `ai.interestInference` | Interest Inference | Bio/posts | Interest list | Infer interests from social data | $0.0001 | Gemma 2 27B |
| `ai.sentimentAnalysis` | Sentiment Analysis | Text | Sentiment + score | Analyze sentiment (positive/neutral/negative) | $0.0001 | Mistral 7B |

**When to use:**
- `ai.openrouter` → Generic LLM tasks (summary, translation, generation, etc.)
- `ai.contactExtraction` → Extract structured contacts from unstructured text
- `ai.interestInference` → Infer interests from social bio/posts with cultural context
- `ai.sentimentAnalysis` → Classify sentiment for prioritization/routing

**Recommended Models:**
- **Italian content**: `google/gemma-2-27b-it:free` (excellent for Italian)
- **General NLP**: `mistralai/mistral-7b-instruct:free` (fast, free)
- **Advanced tasks**: `meta-llama/llama-3-70b-instruct:free` (more capable)

---

### TRANSFORM Blocks - Data Transformation

| Block ID | Name | Input | Output | Use Cases | Cost | Complexity |
|----------|------|-------|--------|-----------|------|------------|
| `transform.fieldMapping` | Field Mapping | Object with fields | Mapped object | Rename, map fields between systems | $0 | ⭐ |
| `transform.calculate` | Calculate | Object | Calculated values | Derive fields (age, scores, etc.) | $0 | ⭐ |
| `transform.format` | Format | Raw values | Formatted values | Format dates, phones, strings | $0 | ⭐ |
| `transform.merge` | Merge | Multiple objects | Merged object | Combine data from multiple sources | $0 | ⭐⭐ |

**When to use:**
- `transform.fieldMapping` → Adapt data between different systems/schemas
- `transform.calculate` → Compute derived fields (age from DOB, totals, scores)
- `transform.format` → Format output (phone international format, date ISO, etc.)
- `transform.merge` → Combine data from multiple sources

**Common Operations:**
- `rename` → Rename field
- `map` → Map field to new name
- `calculate` → Calculate field value
- `format` → Format field value
- `extract` → Extract substring/part
- `flatten` → Flatten nested objects
- `deduplicate` → Remove duplicates

---

### FILTER Blocks - Data Filtering

| Block ID | Name | Input | Output | Use Cases | Cost | Complexity |
|----------|------|-------|--------|-----------|------|------------|
| `filter` | Filter | Array | Filtered array | Remove unwanted records, routing | $0 | ⭐ |

**When to use:**
- Remove invalid/incomplete records
- Keep only business emails (reduce costs)
- Keep only high-value leads
- Route based on conditions
- Validate data quality

**Common Operators:**
- `exists` → Field exists and not null
- `not_exists` → Field missing or null
- `equals` → Exact match
- `not_equals` → Not equal
- `contains` → Contains substring
- `not_contains` → Does not contain
- `greater_than` → Numeric greater than
- `less_than` → Numeric less than
- `in` → Value in array
- `not_in` → Value not in array
- `regex` → Matches regex pattern
- `and` → All conditions true
- `or` → At least one condition true

**Example Configs:**

Data Cleaning:
```typescript
{
  conditions: [
    { field: 'email', operator: 'exists' },
    { field: 'email', operator: 'contains', value: '@' }
  ]
}
```

Business Emails Only:
```typescript
{
  conditions: [
    { operator: 'and', conditions: [
      { field: 'email', operator: 'not_contains', value: '@gmail' },
      { field: 'email', operator: 'not_contains', value: '@yahoo' }
    ]}
  ]
}
```

Positive Sentiment:
```typescript
{
  conditions: [
    { field: 'sentiment', operator: 'in', value: ['positive', 'neutral'] }
  ]
}
```

---

### BRANCH Blocks - Conditional Routing

| Block ID | Name | Input | Output | Use Cases | Cost | Complexity |
|----------|------|-------|--------|-----------|------|------------|
| `branch` | Branch | Any data | Route to different paths | Lead scoring, A/B testing | $0 | ⭐⭐ |

**When to use:**
- Route high-value leads to premium enrichment
- Route negative sentiment to urgent queue
- A/B testing different paths
- Conditional processing based on data

**Example Config:**

Lead Scoring:
```typescript
{
  condition: {
    operator: 'and',
    conditions: [
      { field: 'email', operator: 'exists' },
      { field: 'interests', operator: 'greater_than', value: 5 }
    ]
  },
  branches: {
    true: 'premium-enrichment',
    false: 'standard-enrichment'
  }
}
```

---

### COUNTRIES Blocks - Country Configuration

| Block ID | Name | Input | Output | Use Cases | Cost | Complexity |
|----------|------|-------|--------|-----------|------|------------|
| `countries.config` | Country Config | Phone/email | Country + localized config | Localize LLM prompts, validation | $0 | ⭐⭐ |

**When to use:**
- Auto-detect country from phone/email
- Localize AI prompts for cultural context
- Validate national formats (phone, date, postal code)
- Country-aware business rules

**Output:**
```typescript
{
  code: 'IT',           // ISO country code
  name: 'Italy',        // Country name
  region: 'europe',     // Region
  language: 'it-IT',    // Language code
  confidence: 'high',   // Detection confidence
  currency: 'EUR',      // Currency
  dateFormat: 'DD/MM/YYYY',  // Date format
  phoneFormat: '+39 XXX XXXXXXX'  // Phone format
}
```

---

### ENRICHMENT Blocks - Pre-built Workflows

| Block ID | Name | Input | Output | Use Cases | Cost | Complexity |
|----------|------|-------|--------|-----------|------|------------|
| `enrichment.lead` | Lead Enrichment | Contact | Enriched contact | Complete 3-strategy enrichment | $0.02-0.03 | ⭐⭐ |
| `csv.interestEnrichment` | CSV Interest Enrichment | CSV | CSV with interests | Batch CSV enrichment with interests | $0.02-0.03/row | ⭐⭐ |

**When to use:**
- `enrichment.lead` → Single contact complete enrichment (country + LinkedIn + AI)
- `csv.interestEnrichment` → Batch process CSV file, add interests column

---

### OUTPUT Blocks - Data Destinations

| Block ID | Name | Input | Output | Use Cases | Cost | Complexity |
|----------|------|-------|--------|-----------|------|------------|
| `output.logger` | Logger Output | Any data | Console log | Debug, demos, testing | $0 | ⭐ |
| `output.database` | Database Output | Any data | Database table | Persist results to Supabase/PostgreSQL | $0 | ⭐⭐ |

**When to use:**
- `output.logger` → Development, debugging, quick demos
- `output.database` → Production persistence, CRM integration

---

## 🎯 Block Selection Decision Tree

```
What do you need to do?
│
├─ Read data?
│  ├─ Static/hardcoded → input.static
│  └─ From database → input.database
│
├─ Scrape social media?
│  └─ Apify scraper → api.apify
│
├─ Find/verify emails?
│  ├─ Find email → api.hunter.finder
│  └─ Verify email → api.hunter.verifier
│
├─ Enrich with LinkedIn?
│  └─ Apollo → api.apollo
│
├─ Process text with AI?
│  ├─ Extract contacts → ai.contactExtraction
│  ├─ Infer interests → ai.interestInference
│  ├─ Analyze sentiment → ai.sentimentAnalysis
│  └─ Generic LLM task → ai.openrouter
│
├─ Filter data?
│  └─ Remove unwanted records → filter
│
├─ Route data conditionally?
│  └─ Branch based on conditions → branch
│
├─ Transform data?
│  ├─ Rename/map fields → transform.fieldMapping
│  ├─ Calculate derived fields → transform.calculate
│  ├─ Format values → transform.format
│  └─ Combine sources → transform.merge
│
├─ Detect country?
│  └─ From phone/email → countries.config
│
├─ Complete enrichment pipeline?
│  ├─ Single contact → enrichment.lead
│  └─ CSV batch → csv.interestEnrichment
│
└─ Save results?
   ├─ Log to console → output.logger
   └─ Save to database → output.database
```

---

## 💰 Cost Estimation

### Per-Block Costs

| Block | Cost Per Execution | Cost for 1000 | Notes |
|-------|-------------------|---------------|-------|
| Input blocks | $0 | $0 | Local data only |
| Transform | $0 | $0 | CPU only |
| Filter | $0 | $0 | CPU only |
| Branch | $0 | $0 | CPU only |
| Country Config | $0 | $0 | Local detection |
| `api.apify` | $0.01-0.10 | $10-100 | Depends on actor |
| `api.apollo` | $0.02 | $20 | Per lead |
| `api.hunter.finder` | $0.004 | $4 | Per email |
| `api.hunter.verifier` | $0.0016 | $1.60 | Per email |
| `api.mixedbread` | $0.0001 | $0.10 | Per embedding |
| `ai.openrouter` (free) | $0 | $0 | Free models |
| `ai.openrouter` (paid) | $0.0001-0.01 | $0.10-10 | Depends on model |
| `ai.contactExtraction` | $0.0001 | $0.10 | Uses free model |
| `ai.interestInference` | $0.0001 | $0.10 | Uses free model |
| `ai.sentimentAnalysis` | $0.0001 | $0.10 | Uses free model |
| `enrichment.lead` | $0.02-0.03 | $20-30 | Complete pipeline |
| `csv.interestEnrichment` | $0.02-0.03 | $20-30 | Per CSV row |

### Example Workflow Costs

**Simple Data Pipeline:**
```
Input → Transform → Output
Cost: $0 (no external APIs)
```

**Lead Enrichment (100 leads):**
```
Input → Country → Filter (business) → Apollo → AI Interests → Output
Cost: 100 × $0.025 = $2.50
```

**AI Content Processing (1000 comments):**
```
Input → Contact Extract → Interest Infer → Sentiment → Branch → Output
Cost: 1000 × $0.0003 = $0.30 (using free models)
```

---

## 🔧 Quick Configuration Examples

### Apollo LinkedIn Enrichment

```typescript
{
  id: 'apollo',
  type: 'api.apollo',
  config: {
    apiKey: '{{secrets.apollo}}',
    emailField: 'email'  // Field with email to enrich
  }
}
```

### AI Interest Inference

```typescript
{
  id: 'ai-interests',
  type: 'ai.interestInference',
  config: {
    apiToken: '{{secrets.openrouter}}',
    bioField: 'bio',  // Field with bio/text
    countryField: 'country',  // Optional: for cultural context
    model: 'google/gemma-2-27b-it:free',  // Italian optimized
    maxInterests: 10
  }
}
```

### Filter Business Emails

```typescript
{
  id: 'filter-business',
  type: 'filter',
  config: {
    conditions: [
      { operator: 'and', conditions: [
        { field: 'email', operator: 'not_contains', value: '@gmail' },
        { field: 'email', operator: 'not_contains', value: '@yahoo' }
      ]}
    ],
    onFail: 'skip'  // Skip records that don't match
  }
}
```

### Country Detection

```typescript
{
  id: 'country',
  type: 'countries.config',
  config: {
    phoneField: 'phone',
    emailField: 'email',  // Optional: fallback
    fallbackCountry: 'IT'  // Default if can't detect
  }
}
```

### Branch High-Value Leads

```typescript
{
  id: 'branch-value',
  type: 'branch',
  config: {
    condition: {
      operator: 'and',
      conditions: [
        { field: 'email', operator: 'exists' },
        { field: 'interests', operator: 'greater_than', value: 5 }
      ]
    },
    branches: {
      true: 'premium-path',  // High value
      false: 'standard-path'  // Standard
    }
  }
}
```

---

## 📚 Additional Resources

- [Workflow Building Guide](./WORKFLOW-BUILDING-GUIDE.md) - Step-by-step workflow creation
- [Block Reusability Guide](./BLOCK-REUSABILITY-GUIDE.md) - Architecture and best practices
- [Block Reusability Examples](./examples/block-reusability-examples.ts) - Same blocks, different workflows
- [Workflow Templates](./examples/workflow-templates.ts) - 5 ready-to-use templates

---

**Happy block composing! 🧩**
