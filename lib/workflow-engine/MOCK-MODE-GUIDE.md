# 🎭 Mock Mode Guide - Develop Without API Costs

**Develop and test workflows without consuming API credits or needing API keys**

---

## Overview

All API and AI blocks now support **Mock Mode** - a simulation mode that returns realistic fake data without making actual API calls. This is perfect for:

- ✅ **Development** - Build workflows without API costs
- ✅ **Testing** - Deterministic, fast tests
- ✅ **Offline Work** - Develop without internet
- ✅ **Demo** - Showcase workflows without credentials
- ✅ **Debugging** - Predictable data for debugging

---

## How It Works

### Two Ways to Enable Mock Mode

#### 1. Global Mode (Recommended for Development)

Set the execution context to `demo` or `test` mode:

```typescript
import { ContextFactory } from '@/lib/workflow-engine'

const context = ContextFactory.create({
  workflowId: 'my-workflow',
  mode: 'demo', // 🎭 All API blocks will use mock data
  // or mode: 'test'
  variables: {},
  secrets: {} // No API keys needed!
})
```

**When to use:**
- Development and testing
- Running workflows locally
- CI/CD pipelines

#### 2. Per-Block Mode

Override individual blocks:

```typescript
const workflow = {
  workflowId: 'my-workflow',
  nodes: [
    {
      id: 'apify-1',
      type: 'api.apify',
      name: 'Scrape Instagram',
      config: {
        mode: 'mock', // 🎭 Force mock for this block
        platform: 'instagram',
        url: 'https://instagram.com/p/ABC123'
        // No apiToken needed!
      }
    },
    {
      id: 'openrouter-1',
      type: 'ai.openrouter',
      name: 'Analyze Sentiment',
      config: {
        // No mode specified - uses context.mode
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [...]
      }
    }
  ]
}
```

**When to use:**
- Mix mock and real API calls
- Test specific blocks
- Demo mode with selective real data

---

## Decision Matrix

| Context Mode | Block Config | Result | Use Case |
|--------------|--------------|--------|----------|
| `production` | (none) | ✅ Live API | Production workflows |
| `demo` | (none) | 🎭 Mock | Development, testing |
| `test` | (none) | 🎭 Mock | Unit tests |
| `production` | `mode: 'mock'` | 🎭 Mock | Force mock in prod (rare) |
| `demo` | `mode: 'live'` | ✅ Live API | Test specific blocks in demo |

---

## Blocks with Mock Mode Support

### ✅ API Blocks (5 blocks)

| Block | Mock Data | Latency |
|-------|-----------|---------|
| **api.apify** | Realistic IG/FB comments | 500-1500ms |
| **api.apollo** | Enriched contacts with emails/phones | 200-800ms |
| **api.hunter.finder** | Email addresses | 150-500ms |
| **api.hunter.verifier** | Email verification results | 100-300ms |
| **api.mixedbread** | Vector embeddings | Not implemented yet |

### ✅ AI Blocks (4 blocks)

| Block | Mock Data | Latency |
|-------|-----------|---------|
| **ai.openrouter** | LLM responses | 300-1000ms |
| **ai.contactExtraction** | Structured contacts | 500-1000ms |
| **ai.interestInference** | Interest categories | 400-800ms |
| **ai.sentimentAnalysis** | Sentiment scores & emotions | 300-700ms |

---

## Usage Examples

### Example 1: Complete Mock Workflow

```typescript
import { workflowOrchestrator } from '@/lib/workflow-engine'
import { ContextFactory } from '@/lib/workflow-engine'

// 1. Create workflow with Instagram scraping + sentiment analysis
const workflow = {
  workflowId: 'instagram-sentiment',
  name: 'Instagram Sentiment Analysis',
  version: 1,
  nodes: [
    {
      id: 'scrape-1',
      type: 'api.apify',
      name: 'Scrape Comments',
      config: {
        platform: 'instagram',
        url: 'https://instagram.com/p/ABC123',
        limit: 50
        // 🎭 No mode needed - context.mode will handle it
      }
    },
    {
      id: 'sentiment-1',
      type: 'ai.sentimentAnalysis',
      name: 'Analyze Sentiment',
      config: {
        texts: '{{nodes.scrape-1.output.comments[].text}}'
      }
    }
  ],
  edges: [
    { id: 'e1', source: 'scrape-1', target: 'sentiment-1' }
  ]
}

// 2. Execute in DEMO mode - no API keys needed!
const context = ContextFactory.create({
  workflowId: 'instagram-sentiment',
  mode: 'demo', // 🎭 MOCK MODE
  variables: {},
  secrets: {} // Empty - no API keys!
})

const result = await workflowOrchestrator.execute(workflow, context, {})

console.log('🎭 Mock Results:', {
  commentsScraped: result.metadata.completedNodes,
  sentimentResults: result.output
})

// Output:
// 🎭 Mock Results: {
//   commentsScraped: 2,
//   sentimentResults: {
//     comments: [
//       { text: 'Amazing shot! 📸', sentiment: 'positive', score: 0.8 },
//       { text: 'Love this! ❤️', sentiment: 'positive', score: 0.9 }
//     ]
//   }
// }
```

### Example 2: Selective Mock (Test AI logic only)

```typescript
// Use real Apify data, but mock AI calls
const context = ContextFactory.create({
  workflowId: 'test-ai-only',
  mode: 'demo', // Mock mode
  variables: {},
  secrets: {
    apify: process.env.APIFY_API_KEY // Use real Apify key
  }
})

const workflow = {
  nodes: [
    {
      id: 'apify-1',
      type: 'api.apify',
      config: {
        mode: 'live', // ✅ Override: Use real API
        platform: 'instagram',
        url: realInstagramUrl,
        apiToken: '{{secrets.apify}}'
      }
    },
    {
      id: 'sentiment-1',
      type: 'ai.sentimentAnalysis',
      config: {
        // Uses context.mode = 'demo', so mock
        texts: '{{nodes.apify-1.output.comments[].text}}'
      }
    }
  ]
}
```

### Example 3: Unit Testing

```typescript
import { workflowOrchestrator } from '@/lib/workflow-engine'

describe('Instagram Sentiment Workflow', () => {
  it('should analyze sentiment from Instagram comments', async () => {
    const context = ContextFactory.create({
      workflowId: 'test',
      mode: 'test', // 🎭 Mock mode
      variables: {},
      secrets: {}
    })

    const result = await workflowOrchestrator.execute(workflow, context, {})

    // Assertions with deterministic mock data
    expect(result.status).toBe('completed')
    expect(result.output.comments).toBeDefined()
    expect(result.output.comments.length).toBeGreaterThan(0)

    // Mock data always has these fields
    expect(result.output.comments[0]).toHaveProperty('sentiment')
    expect(result.output.comments[0]).toHaveProperty('score')
  })
})
```

---

## Mock Data Characteristics

### Apify Scraper (Instagram/Facebook)

```json
{
  "platform": "instagram",
  "url": "https://instagram.com/p/ABC123",
  "comments": [
    {
      "id": "mock_instagram_1",
      "text": "Amazing shot! 📸",
      "username": "@user_1",
      "timestamp": "2026-01-09T10:30:00.000Z",
      "likes": 45,
      "replies": 3
    }
  ],
  "metadata": {
    "totalComments": 2,
    "mock": true,
    "mockLatency": 856
  }
}
```

### Sentiment Analysis

```json
{
  "results": [
    {
      "text": "Amazing shot! 📸",
      "textId": 0,
      "sentiment": "positive",
      "score": 0.82,
      "confidence": 0.89,
      "emotions": {
        "joy": 0.78,
        "anger": 0.01,
        "fear": 0.12,
        "surprise": 0.34
      },
      "keyPhrases": ["mock phrase 1", "mock phrase 2"]
    }
  ],
  "metadata": {
    "totalAnalyzed": 1,
    "positiveCount": 1,
    "avgScore": 0.82,
    "mock": true
  }
}
```

### OpenRouter LLM

```json
{
  "content": "This is a mock LLM response for testing purposes.",
  "model": "mistralai/mistral-7b-instruct:free",
  "usage": {
    "promptTokens": 150,
    "completionTokens": 50,
    "totalTokens": 200
  },
  "finishReason": "stop",
  "mock": true
}
```

### Apollo Enrichment

```json
{
  "contacts": [
    {
      "firstName": "Mario",
      "lastName": "Rossi",
      "email": "mario.rossi@example.com",
      "title": "Software Engineer",
      "company": "Tech Company Inc",
      "phone": "+39 333 1234567",
      "enriched": true,
      "enrichedAt": "2026-01-09T10:30:00.000Z"
    }
  ],
  "metadata": {
    "totalContacts": 1,
    "successfulEnrichments": 1,
    "cost": 0.02,
    "mock": true
  }
}
```

---

## Best Practices

### ✅ DO

1. **Use `mode: 'demo'` for development**
   ```typescript
   const context = ContextFactory.create({
     mode: 'demo', // Perfect for local dev
     ...
   })
   ```

2. **Use `mode: 'test'` for unit tests**
   ```typescript
   // Tests are fast and deterministic
   mode: 'test'
   ```

3. **Keep API keys in environment variables**
   ```bash
   # .env.local
   APIFY_API_KEY=xxx
   OPENROUTER_API_KEY=xxx
   ```

4. **Test with real APIs before production**
   ```typescript
   // Switch to production mode for final testing
   mode: 'production'
   ```

### ❌ DON'T

1. **Don't use `mode: 'mock'` in production**
   - Set `mode: 'production'` for production workflows

2. **Don't commit API keys**
   - Use environment variables
   - Mock mode doesn't need keys anyway!

3. **Don't assume mock data is real**
   - Mock data is for testing only
   - Always verify with real APIs before deploying

---

## Migration Guide

### Before (No Mock Mode)

```typescript
// ❌ Required API keys for development
const context = ContextFactory.create({
  workflowId: 'test',
  mode: 'production', // Had to use production even for dev
  secrets: {
    apify: process.env.APIFY_API_KEY, // Required!
    openrouter: process.env.OPENROUTER_API_KEY // Required!
  }
})
```

### After (With Mock Mode)

```typescript
// ✅ No API keys needed for development
const context = ContextFactory.create({
  workflowId: 'test',
  mode: 'demo', // 🎭 Mock mode
  secrets: {} // Empty!
})
```

---

## Troubleshooting

### Mock mode not working?

**Check:**
1. `context.mode` is set to `'demo'` or `'test'`
2. Block supports mock mode (all API/AI blocks do)
3. Not overriding with `mode: 'live'` in block config

### Need to test one block with real API?

**Solution:** Use selective mock mode
```typescript
{
  id: 'real-api-block',
  type: 'api.apify',
  config: {
    mode: 'live', // Override context mode
    apiToken: '{{secrets.apify}}'
  }
}
```

### Mock data looks unrealistic?

**Mock data characteristics:**
- Random but deterministic per execution
- Realistic data structure
- Latency simulation (300-1500ms)
- Metadata includes `mock: true` flag

---

## Performance

| Operation | Live Mode | Mock Mode | Speedup |
|-----------|-----------|-----------|---------|
| Instagram scraping (50 comments) | 5-10s | 0.5-1.5s | **5-10x** |
| Sentiment analysis (100 texts) | 8-15s | 0.3-0.7s | **20-50x** |
| Contact enrichment (10 contacts) | 3-5s | 0.2-0.8s | **5-15x** |

---

## Summary

**Mock Mode Benefits:**
- ✅ Zero API costs during development
- ✅ Fast, deterministic tests
- ✅ Offline development
- ✅ No API keys needed
- ✅ Same data structure as live mode

**When to use:**
- Development: `mode: 'demo'`
- Testing: `mode: 'test'`
- Production: `mode: 'production'`

---

**Ready to develop without API costs?** 🚀

Start using mock mode today:
```typescript
const context = ContextFactory.create({
  mode: 'demo', // 🎭 Enable mock mode
  ...
})
```
