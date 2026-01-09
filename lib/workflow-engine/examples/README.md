# Workflow Engine Examples

This directory contains practical examples demonstrating how to use the Lume Workflow Engine.

## 📚 Table of Contents

- [Getting Started Examples](#getting-started-examples) - Learn the basics
- [Block Reusability Examples](#block-reusability-examples) - See blocks in action
- [Workflow Templates](#workflow-templates) - Ready-to-use workflows
- [Real-World Examples](#real-world-examples) - Production-ready examples
- [Integration Examples](#integration-examples) - Database, API, Job integration

---

## 🚀 Getting Started Examples

### [complete-example.ts](./complete-example.ts)
**Level:** Beginner

Demonstrates:
- Creating a custom block
- Defining a workflow with nodes and edges
- Validating workflows
- Variable interpolation
- Manual execution

**Run it:**
```bash
npx tsx lib/workflow-engine/examples/complete-example.ts
```

---

### [csv-workflow-enrichment-example.ts](./csv-workflow-enrichment-example.ts)
**Level:** Intermediate | **NEW!**

**Demonstrates the power of workflow-based approach vs monolithic blocks!**

This example shows how to compose multiple blocks to create a CSV enrichment pipeline:
- **Input:** CSV with columns (nome, celular, email, nascimento)
- **Workflow:** 7+ composed blocks (Country, Filter, Apollo, Instagram, AI, etc.)
- **Output:** CSV with added "interessi" column (comma-separated)
- **Filtering:** Only rows where at least one interest was found

**Architecture:**
```
Input CSV → Country Detection → Filter Business → Apollo LinkedIn
                                              ↓
                                         Instagram Search
                                              ↓
                                       AI Interest Extraction
                                              ↓
                                       Filter Empty Interests
                                              ↓
                                            Output CSV
```

**Key Insight:** Compare this workflow approach with the monolithic `csv-interest-enrichment-example.ts` to see the power of composable blocks!

**Run it:**
```bash
npx tsx lib/workflow-engine/examples/csv-workflow-enrichment-example.ts
```

---

## 🧩 Block Reusability Examples

### [block-reusability-examples.ts](./block-reusability-examples.ts)
**Level:** Intermediate | **NEW!**

Demonstrates how the SAME blocks can be reused in DIFFERENT workflows:

**Example 1: FilterBlock in 3 Contexts**
- Data Cleaning (remove invalid emails)
- Lead Enrichment (keep business emails only)
- Sentiment Analysis (keep positive only)

**Example 2: OpenRouterBlock in 3 Contexts**
- Contact Extraction (extract from text)
- Interest Inference (infer from bio)
- Sentiment Analysis (analyze sentiment)

**Example 3: CountryConfigBlock in 3 Contexts**
- Localized Enrichment (country-aware AI prompts)
- Content Localization (translation & cultural adaptation)
- Data Validation (national format validation)

**Run it:**
```bash
npx tsx lib/workflow-engine/examples/block-reusability-examples.ts
```

**Key Insight:** Same block, different config, completely different use cases!

---

## 📋 Workflow Templates

### [workflow-templates.ts](./workflow-templates.ts)
**Level:** All Levels | **NEW!**

Five ready-to-use workflow templates you can copy and customize:

1. **Simple Data Pipeline** (Beginner)
   - Input → Transform → Output
   - Use case: Basic ETL, field mapping, data standardization
   - Cost: $0

2. **Lead Enrichment Pipeline** (Intermediate)
   - Input → Country → Filter → Apollo → AI → Output
   - Use case: Lead scoring, CRM enrichment
   - Cost: ~$0.02-0.03 per lead

3. **AI Content Processing** (Advanced)
   - Input → Contact Extraction → Interest Inference → Sentiment → Branch → Output
   - Use case: Social media analysis, comment processing
   - Cost: ~$0.0001 per comment (free models)

4. **Batch Data Processing** (Advanced)
   - Input → Filter → Transform → [Parallel Enrichments] → Merge → Output
   - Use case: Large dataset enrichment, performance optimization
   - Cost: Varies based on enrichment blocks

5. **Multi-Source Data Fusion** (Intermediate)
   - [Input1, Input2, Input3] → Merge → Validate → Transform → Output
   - Use case: CRM integration, data consolidation
   - Cost: $0 (unless adding enrichment)

**Usage:**
```typescript
import { getTemplate } from './lib/workflow-engine/examples/workflow-templates'

// 1. Get template
const template = getTemplate('leadEnrichmentPipeline')

// 2. Customize config
template.nodes[0].config.source = 'my-csv-file.csv'

// 3. Execute
const result = await workflowOrchestrator.execute(template, context, input)
```

---

## 🎯 Real-World Examples

### [ai-workflow-example.ts](./ai-workflow-example.ts)
**Level:** Advanced

Demonstrates a complete AI-powered lead enrichment workflow with:
- Contact extraction from comments
- Interest inference from social data
- Sentiment analysis
- Conditional branching

**Run it:**
```bash
npx tsx lib/workflow-engine/examples/ai-workflow-example.ts
```

---

### [end-to-end-example.ts](./end-to-end-example.ts)
**Level:** Intermediate

End-to-end workflow execution with:
- Complete workflow definition
- Validation
- Context creation with secrets
- Progress tracking
- Result handling

**Run it:**
```bash
npx tsx lib/workflow-engine/examples/end-to-end-example.ts
```

---

### [real-world-workflow.ts](./real-world-workflow.ts)
**Level:** Advanced

Production-ready workflow demonstrating:
- Multi-stage processing
- Error handling
- Retry logic
- Performance optimization

**Run it:**
```bash
npx tsx lib/workflow-engine/examples/real-world-workflow.ts
```

---

## 💾 Integration Examples

### [database-integration-example.ts](./database-integration-example.ts)
**Level:** Intermediate

Shows how to integrate workflows with Supabase database:
- Read from database
- Process with workflow
- Write back to database

**Run it:**
```bash
npx tsx lib/workflow-engine/examples/database-integration-example.ts
```

---

### [workflow-job-integration-example.ts](./workflow-job-integration-example.ts)
**Level:** Advanced

Demonstrates background job processing:
- Create workflow execution job
- Track progress
- Handle async completion
- Poll for results

**Run it:**
```bash
npx tsx lib/workflow-engine/examples/workflow-job-integration-example.ts
```

---

## 📊 CSV Processing Examples

### [csv-interest-enrichment-example.ts](./csv-interest-enrichment-example.ts)
**Level:** Intermediate

**Purpose:** Enrich CSV file with interests field

**Input CSV:**
```csv
nome;celular;email;nascimento
Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986
```

**Output CSV:**
```csv
nome;celular;email;nascimento;interessi
Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986;chitarra elettrica, escursionismo montagna
```

**Strategies:**
1. Country Detection (from phone) - FREE
2. LinkedIn via Apify (business emails only) - $0.003
3. Instagram Search - $0.05
4. Contextualized LLM Analysis - $0.0001

**Features:**
- Output CSV contains ONLY records with interests found
- Configurable LLM model
- Cost tracking per contact

**Run it:**
```bash
npx tsx lib/workflow-engine/examples/csv-interest-enrichment-example.ts
```

---

### [lead-enrichment-workflow-example.ts](./lead-enrichment-workflow-example.ts)
**Level:** Intermediate

Demonstrates complete lead enrichment workflow:
- Country detection from phone
- Email classification (business vs personal)
- LinkedIn enrichment for business emails
- LLM interest inference with cultural context

**Run it:**
```bash
npx tsx lib/workflow-engine/examples/lead-enrichment-workflow-example.ts
```

---

### [csv-enrichment-example.ts](./csv-enrichment-example.ts)
**Level:** Beginner

Simple CSV enrichment example showing:
- CSV parsing
- Field transformation
- Data enrichment
- CSV output generation

**Run it:**
```bash
npx tsx lib/workflow-engine/examples/csv-enrichment-example.ts
```

---

## 🌍 Localization Examples

### [csv-interest-inference-latam-example.ts](./csv-interest-inference-latam-example.ts)
**Level:** Intermediate

Demonstrates country-aware interest inference for LATAM countries:
- Brazil (pt-BR)
- Mexico (es-MX)
- Argentina (es-AR)
- Colombia (es-CO)
- Chile (es-CL)

**Key Features:**
- Auto-detect country from phone
- Localized LLM prompts per country
- Cultural context awareness

**Run it:**
```bash
npx tsx lib/workflow-engine/examples/csv-interest-inference-latam-example.ts
```

---

## 📖 Documentation

### Main Guides

- [Workflow Building Guide](../WORKFLOW-BUILDING-GUIDE.md) - Step-by-step workflow creation
- [Block Reusability Guide](../BLOCK-REUSABILITY-GUIDE.md) - Architecture and best practices
- [Block Quick Reference](../BLOCKS-QUICK-REFERENCE.md) - All blocks in one place

### How-To Guides

- [CSV Interest Quick Start](../CSV-INTEREST-QUICK-START.md) - Quick start for CSV enrichment
- [CSV Enrichment How-To](../CSV-ENRICHMENT-HOWTO.md) - Detailed CSV enrichment guide
- [Lead Enrichment Guide](../LEAD-ENRICHMENT-GUIDE.md) - Complete lead enrichment workflow
- [Country Config Usage](./COUNTRY-CONFIG-USAGE.md) - How to use country detection

### Completion Reports

- [Sprint Completions](../SPRINT-*-COMPLETION.md) - Development sprint reports
- [Email to Social Reality](../EMAIL-TO-SOCIAL-REALITY.md) - Real-world use case

---

## 🎓 Learning Path

### Beginner Path

1. Start with [complete-example.ts](./complete-example.ts)
2. Read [Workflow Building Guide](../WORKFLOW-BUILDING-GUIDE.md)
3. Try [simple-data-pipeline](./workflow-templates.ts) template
4. Experiment with [csv-enrichment-example.ts](./csv-enrichment-example.ts)

### Intermediate Path

1. Study [block-reusability-examples.ts](./block-reusability-examples.ts)
2. Read [Block Reusability Guide](../BLOCK-REUSABILITY-GUIDE.md)
3. Use [lead-enrichment-pipeline](./workflow-templates.ts) template
4. Build your own workflow with multiple blocks

### Advanced Path

1. Analyze [ai-workflow-example.ts](./ai-workflow-example.ts)
2. Study [batch-data-processing](./workflow-templates.ts) template
3. Implement [workflow-job-integration](./workflow-job-integration-example.ts)
4. Create custom blocks for your use case

---

## 🚦 Quick Start by Use Case

### "I want to enrich a CSV with interests"

→ Read [CSV Interest Quick Start](../CSV-INTEREST-QUICK-START.md)
→ Run [csv-interest-enrichment-example.ts](./csv-interest-enrichment-example.ts)

### "I want to enrich leads with LinkedIn + AI"

→ Use [lead-enrichment-pipeline](./workflow-templates.ts) template
→ Read [Lead Enrichment Guide](../LEAD-ENRICHMENT-GUIDE.md)

### "I want to analyze social media content"

→ Run [ai-workflow-example.ts](./ai-workflow-example.ts)
→ Study [ai-content-processing](./workflow-templates.ts) template

### "I want to process large datasets efficiently"

→ Use [batch-data-processing](./workflow-templates.ts) template
→ Read [Block Reusability Guide](../BLOCK-REUSABILITY-GUIDE.md)

### "I want to combine data from multiple sources"

→ Use [multi-source-data-fusion](./workflow-templates.ts) template
→ Study [real-world-workflow.ts](./real-world-workflow.ts)

### "I want to understand how blocks are reusable"

→ Run [block-reusability-examples.ts](./block-reusability-examples.ts)
→ Read [Block Reusability Guide](../BLOCK-REUSABILITY-GUIDE.md)

---

## 🛠️ Running Examples

### Prerequisites

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Run Examples

```bash
# Run specific example
npx tsx lib/workflow-engine/examples/EXAMPLE_NAME.ts

# Run with environment variables
APIFY_TOKEN=xxx OPENROUTER_API_KEY=xxx npx tsx lib/workflow-engine/examples/EXAMPLE_NAME.ts
```

### Required API Keys

Some examples require API keys:

- **Apify** (for social scraping): https://apify.com/
- **Apollo** (for LinkedIn enrichment): https://www.apollo.io/
- **OpenRouter** (for AI models): https://openrouter.ai/
- **Hunter** (for email tools): https://hunter.io/

**Note:** Many examples work in demo mode without API keys (using mock data).

---

## 💡 Tips for Learning

1. **Start Simple** - Begin with complete-example.ts
2. **Read Logs** - All examples show detailed execution logs
3. **Experiment** - Modify config and see what changes
4. **Use Templates** - Don't start from scratch, use templates
5. **Check Costs** - Review Block Quick Reference for costs

---

## 🤝 Contributing

Have a useful example to share? Follow these guidelines:

1. **Add to this directory** - Create YOUR-example.ts
2. **Document it** - Add description, level, run instructions
3. **Test it** - Verify it runs successfully
4. **Update README** - Add link to your example

---

## 📞 Need Help?

- **Documentation**: See main guides above
- **Block Reference**: Check [BLOCKS-QUICK-REFERENCE.md](../BLOCKS-QUICK-REFERENCE.md)
- **Issues**: Report bugs or request features on GitHub

---

**Happy workflow building! 🚀**
