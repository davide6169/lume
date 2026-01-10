# Mock Mode for Workflow Engine API Blocks

## Overview

The Workflow Engine now supports **mock/stub mode** for all API blocks, allowing you to test workflows without calling real APIs or consuming API credits.

## How It Works

### Enabling Mock Mode

Mock mode can be enabled in two ways:

#### 1. Per-Block Configuration

Set `mode: 'mock'` in the block configuration:

```json
{
  "nodes": [
    {
      "id": "enrich",
      "type": "api.apollo",
      "config": {
        "mode": "mock",
        "contacts": [...]
      }
    },
    {
      "id": "llm",
      "type": "ai.openrouter",
      "config": {
        "mode": "mock",
        "model": "mistralai/mistral-7b-instruct:free",
        "messages": [...]
      }
    }
  ]
}
```

#### 2. Global Context Mode

Set the execution mode to `demo` or `test`:

```typescript
const context = ContextFactory.create({
  workflowId: 'my-workflow',
  mode: 'demo',  // or 'test'
  variables: {}
})
```

When in `demo` or `test` mode, all API blocks automatically use mock responses.

### Blocks Supporting Mock Mode

| Block Type | Mock Response |
|------------|---------------|
| `api.apollo` | Fake enrichment with realistic contact data |
| `ai.openrouter` | Contextual LLM responses (sentiment, interests, etc.) |
| `api.hunter.finder` | Generated emails from contact names |
| `api.hunter.verifier` | Email verification with realistic status scores |
| `api.mixedbread` | Random vector embeddings (768-dim) |
| `api.apify` | Mock scraper results |

## Mock Data Generator

The `MockDataGenerator` class provides realistic mock responses:

### Features

- **Realistic Data**: Company names, titles, locations, interests
- **Contextual Responses**: Based on input (e.g., sentiment analysis keywords)
- **Simulated Latency**: 100-1000ms to mimic real API calls
- **Deterministic**: Same inputs produce similar outputs
- **Cost Tracking**: All mock responses have `cost: 0`

### Example Usage

```typescript
import { MockDataGenerator } from '@/lib/workflow-engine/utils/mock-data-generator'

// Apollo enrichment mock
const apolloMock = MockDataGenerator.generateApolloEnrichment(contacts)

// OpenRouter LLM mock
const llmMock = MockDataGenerator.generateOpenRouterResponse(messages, model)

// Hunter verification mock
const hunterMock = MockDataGenerator.generateHunterVerification(email)
```

## Benefits

### Development
✅ Test workflows without API keys
✅ No API costs during development
✅ Fast iteration with instant feedback

### Testing
✅ Deterministic responses for unit tests
✅ No external dependencies
✅ CI/CD friendly

### Demos
✅ Show functionality without credentials
✅ Zero-cost demonstrations
✅ Works offline (after first run)

### Quality
✅ Consistent data structure
✅ Type-safe responses
✅ Realistic output format

## Examples

### Complete Mock Workflow

```json
{
  "workflowId": "demo-enrichment",
  "name": "Demo Enrichment (Mock)",
  "mode": "demo",
  "nodes": [
    {
      "id": "input",
      "type": "input.static",
      "config": {
        "data": {
          "contacts": [
            { "firstName": "Mario", "lastName": "Rossi", "company": "TechCorp" },
            { "firstName": "Giulia", "lastName": "Bianchi", "company": "InnovateLab" }
          ]
        }
      }
    },
    {
      "id": "enrich",
      "type": "api.apollo",
      "config": {
        "mode": "mock",
        "contacts": "{{input.contacts}}"
      }
    },
    {
      "id": "output",
      "type": "output.logger",
      "config": {}
    }
  ],
  "edges": [
    { "from": "input", "to": "enrich" },
    { "from": "enrich", "to": "output" }
  ]
}
```

### CLI Usage

```bash
# Test workflow with mock mode
npm run workflow exec -- --id demo-enrichment --mode demo

# Test specific block with mock mode
npm run workflow blocks test -- --type api.apollo --config ./mock-config.json
```

## Mock Response Format

All mock responses include:

```typescript
{
  data: {...},      // The mock response data
  metadata: {
    mock: true,     // Always set to true for mock responses
    cost: 0,        // Zero cost
    timestamp: "2026-01-10T..."
  }
}
```

## Migration Guide

### Before (Real API Only)

```json
{
  "type": "api.apollo",
  "config": {
    "apiToken": "real-api-key",
    "contacts": [...]
  }
}
```

### After (With Mock Support)

```json
{
  "type": "api.apollo",
  "config": {
    "mode": "mock",           // ← Add this for mock mode
    "apiToken": "ignored",    // Optional in mock mode
    "contacts": [...]
  }
}
```

## Implementation Status

✅ **Implemented:**
- `api.apollo` - Apollo Enrichment
- `ai.openrouter` - OpenRouter LLM
- `api.hunter.finder` - Hunter Email Finder
- `api.hunter.verifier` - Hunter Email Verifier

🚧 **To Be Implemented:**
- `api.mixedbread` - Mixedbread Embeddings
- `api.apify` - Apify Scrapers
- `csv.interestEnrichment` - CSV Interest Enrichment
- `ai.contactExtraction` - AI Contact Extraction
- `ai.interestInference` - AI Interest Inference
- `ai.sentimentAnalysis` - AI Sentiment Analysis

## Adding Mock Mode to New Blocks

To add mock mode to a block:

1. Import `MockDataGenerator`
2. Add `mode?: 'live' | 'mock'` to config interface
3. Check for mock mode at start of `execute()`
4. Return mock response instead of calling real API

```typescript
export class MyApiBlock extends BaseBlockExecutor {
  async execute(config: MyConfig, input: any, context: ExecutionContext) {
    // Check mock mode
    const shouldMock = config.mode === 'mock' || context.mode === 'demo' || context.mode === 'test'

    if (shouldMock) {
      this.log(context, 'info', '🧪 MOCK MODE')
      await MockDataGenerator.simulateLatency(200, 800)

      const mockData = MockDataGenerator.generateMyApiMock(input)

      return {
        status: 'completed',
        output: { ...mockData, mock: true },
        executionTime: Date.now() - startTime,
        ...
      }
    }

    // Real API mode...
  }
}
```

## Notes

- **Security**: Mock mode never makes real API calls
- **Performance**: Mock mode includes simulated latency for realism
- **Data Quality**: Mock data mimics real API response structure
- **Cost**: All mock responses have `cost: 0`
- **Detection**: Mock responses include `mock: true` flag

## See Also

- [MockDataGenerator API](../utils/mock-data-generator.ts)
- [Workflow Engine Documentation](../README.md)
- [Testing Guide](../../examples/README.md)
