# Workflow CLI Guide

**Command-line interface for the Workflow Engine**

---

## Installation

The CLI is available as an npm script:

```bash
npm run workflow --help
```

Or directly with tsx:

```bash
npx tsx scripts/workflow-cli.ts --help
```

---

## Quick Start

### 1. List All Workflows

```bash
npm run workflow -- list
```

### 2. Execute Workflow in Mock Mode

```bash
npm run workflow -- exec --id my-workflow --mode demo
```

### 3. Test a Block

```bash
npm run workflow -- blocks test --type api.apify --mode test
```

---

## Commands Reference

### Workflow Commands

#### `workflow list`
List all workflows in the database.

```bash
npm run workflow -- list
npm run workflow -- list --filter "category=enrichment"
npm run workflow -- list --tags "api,ai" --json
```

**Options:**
- `-f, --filter <key=value>` - Filter workflows
- `-t, --tags <tags>` - Filter by tags (comma-separated)
- `-j, --json` - Output as JSON

---

#### `workflow get`
Get workflow details by ID.

```bash
npm run workflow -- get --id my-workflow
npm run workflow -- get --id my-workflow --json
```

**Options:**
- `-i, --id <workflowId>` - Workflow ID (required)
- `-j, --json` - Output as JSON

---

#### `workflow exec`
**Execute a workflow** - This is the main command for running workflows.

```bash
# Execute in demo/mock mode (default)
npm run workflow -- exec --id my-workflow

# Execute with production APIs
npm run workflow -- exec --id my-workflow --mode live

# Execute with input data (inline JSON)
npm run workflow -- exec --id my-workflow --input '{"url": "https://instagram.com/p/ABC123"}'

# Execute with test config file
npm run workflow -- exec --id my-workflow --file test-config.json

# Execute with input from stdin (NEW!)
echo '{"url": "https://instagram.com/p/ABC123"}' | npm run workflow -- exec --id my-workflow

# Execute with input from file via stdin
cat workflow-input.json | npm run workflow -- exec --id my-workflow

# Execute with progress bar
npm run workflow -- exec --id my-workflow --mode demo --watch

# Execute and output as JSON
npm run workflow -- exec --id my-workflow --mode demo --json
```

**Options:**
- `-i, --id <workflowId>` - Workflow ID (required)
- `-f, --file <path>` - Test configuration JSON file
- `--use-baseline` - Use baseline configuration
- `--input <json>` - Inline input JSON
- `-m, --mode <mode>` - Execution mode (default: `demo`)
  - `live` or `production` - Real API calls
  - `mock` or `demo` - Simulated data (no API keys needed)
  - `test` - Deterministic mock data
- `-w, --watch` - Show progress bar
- `-j, --json` - Output as JSON
- `--stdin` - Read input from stdin (implicit when piped)

**Execution Modes:**

| Mode | API Calls | API Keys Required | Use Case |
|------|-----------|------------------|----------|
| `demo` (default) | 🎭 Mock | ❌ No | Development, testing |
| `test` | 🎭 Mock | ❌ No | Unit testing |
| `live` | ✅ Real | ✅ Yes | Production |
| `production` | ✅ Real | ✅ Yes | Production |

---

#### `workflow validate`
Validate a workflow definition.

```bash
npm run workflow -- validate --file workflow-definition.json
```

**Options:**
- `-f, --file <path>` - Workflow definition JSON file (required)
- `-j, --json` - Output as JSON

---

### Block Commands

#### `workflow blocks list`
List all available blocks.

```bash
npm run workflow -- blocks list
npm run workflow -- blocks list --category api
npm run workflow -- blocks list --json
```

**Options:**
- `-c, --category <category>` - Filter by category
- `-j, --json` - Output as JSON

---

#### `workflow blocks get`
Get block details.

```bash
npm run workflow -- blocks get --type api.apify
```

**Options:**
- `-t, --type <blockType>` - Block type (required)
- `-j, --json` - Output as JSON

---

#### `workflow blocks test`
**Test a single block** - Execute a block in isolation.

```bash
# Test block in mock mode (default)
npm run workflow -- blocks test --type api.apify --use-baseline

# Test block in live mode
npm run workflow -- blocks test --type api.apify --config test-config.json --mode live

# Test block with custom config
npm run workflow -- blocks test --type ai.sentimentAnalysis --config sentiment-test.json --mode demo

# Test and output as JSON
npm run workflow -- blocks test --type api.apify --use-baseline --json
```

**Options:**
- `-t, --type <blockType>` - Block type (required)
- `-c, --config <path>` - Test configuration JSON file
- `--use-baseline` - Use baseline configuration
- `-m, --mode <mode>` - Execution mode (default: `test`)
  - `test` or `demo` or `mock` - Mock data (no API keys)
  - `live` or `production` - Real API calls
- `-j, --json` - Output as JSON

---

## Usage Examples

### Example 1: Execute Workflow in Mock Mode

**Scenario:** Test the Instagram sentiment workflow without API costs

```bash
npm run workflow -- exec \
  --id instagram-sentiment \
  --mode demo \
  --input '{"url": "https://instagram.com/p/ABC123"}' \
  --watch
```

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Execute Workflow: instagram-sentiment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode: DEMO 🎭 MOCK

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Execution Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Workflow ID: instagram-sentiment
Mode: demo
Watch Mode: Enabled

Input:
{"url": "https://instagram.com/p/ABC123"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Executing Workflow...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[████████████████████] 100% - WORKFLOW_COMPLETED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Execution Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: COMPLETED ✅

Execution Time: 850ms
Total Nodes: 2
Completed Nodes: 2
Failed Nodes: 0
Skipped Nodes: 0

Output:
{
  "comments": [
    {
      "text": "Amazing shot! 📸",
      "sentiment": "positive",
      "score": 0.82
    }
  ]
}
```

---

### Example 2: Test Single Block

**Scenario:** Test the Apify scraper block

```bash
npm run workflow -- blocks test \
  --type api.apify \
  --mode demo \
  --use-baseline
```

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Test Block: api.apify
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode: DEMO 🎭 MOCK
Name: Apify Scraper
Category: api
Description: Scrapes Instagram/Facebook comments

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Test Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Input:
{"url": "https://instagram.com/p/ABC123", "platform": "instagram"}

Block Config:
{"platform": "instagram", "url": "...", "limit": 50, "mode": "demo"}

Mock mode: No secrets required 🎭

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Executing Block...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[INFO] 🎭 MOCK MODE: Simulating Apify Scraper block
[INFO] 🎭 Mock: Generated 2 comments

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Test Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: COMPLETED ✅

Execution Time: 856ms
Retries: 0
Mode: MOCK 🎭

Output:
{
  "platform": "instagram",
  "url": "https://instagram.com/p/ABC123",
  "comments": [
    {
      "id": "mock_instagram_1",
      "text": "Amazing shot! 📸",
      "username": "@user_1",
      "likes": 45
    }
  ],
  "metadata": {
    "totalComments": 2,
    "mock": true
  }
}
```

---

### Example 3: Production Execution

**Scenario:** Execute workflow with real APIs

```bash
# Set environment variables
export APIFY_API_KEY=your_key
export OPENROUTER_API_KEY=your_key

# Execute in live mode
npm run workflow -- exec \
  --id instagram-sentiment \
  --mode live \
  --input '{"url": "https://instagram.com/p/ABC123"}' \
  --watch
```

---

### Example 4: Using Stdin (NEW!)

**Scenario:** Execute workflow with input from stdin

#### 4a. Pipe from echo

```bash
echo '{"url": "https://instagram.com/p/ABC123", "limit": 50}' | \
  npm run workflow -- exec --id instagram-sentiment --mode demo --watch
```

#### 4b. Pipe from file

```bash
cat workflow-input.json | npm run workflow -- exec --id instagram-sentiment
```

**workflow-input.json:**
```json
{
  "input": {
    "url": "https://instagram.com/p/ABC123",
    "platform": "instagram",
    "limit": 50
  }
}
```

#### 4c. Pipe from curl

```bash
# Fetch data from API and process with workflow
curl -s https://api.example.com/data | \
  npm run workflow -- exec --id my-workflow --mode demo
```

#### 4d. Pipe from command output

```bash
# Generate data with script and process
node generate-data.js | npm run workflow -- exec --id my-workflow
```

#### 4e. Test Block with Stdin

```bash
# Test Apify block with config from stdin
cat block-apify.json | npm run workflow -- blocks test --type api.apify --mode demo
```

**block-apify.json:**
```json
{
  "description": "Test Apify Instagram scraper",
  "input": {
    "url": "https://instagram.com/p/ABC123"
  },
  "config": {
    "platform": "instagram",
    "limit": 50
  }
}
```

---

### Example 5: Test AI Block

**Scenario:** Test sentiment analysis block

```bash
npm run workflow -- blocks test \
  --type ai.sentimentAnalysis \
  --mode test \
  --config test-configs/sentiment.json
```

**test-configs/sentiment.json:**
```json
{
  "description": "Test sentiment analysis",
  "input": ["Great product!", "Terrible experience", "It's okay"],
  "config": {
    "granularity": "document"
  }
}
```

---

## Test Configuration Format

For block testing, create a JSON config file:

```json
{
  "description": "Test description",
  "input": {
    "field1": "value1",
    "field2": "value2"
  },
  "config": {
    "blockOption1": "value1",
    "blockOption2": "value2"
  },
  "variables": {
    "var1": "value1"
  },
  "secrets": {
    "apiKey": "optional-override-key"
  }
}
```

---

## Environment Variables

For live/production mode, set these in `.env.local`:

```bash
# API Keys
APIFY_API_KEY=your_apify_key
APOLLO_API_KEY=your_apollo_key
HUNTER_API_KEY=your_hunter_key
OPENROUTER_API_KEY=your_openrouter_key
MIXEDBREAD_API_KEY=your_mixedbread_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

---

## Tips & Tricks

### 1. Quick Development Cycle

```bash
# 1. List workflows
npm run workflow -- list

# 2. Execute in mock mode (fast, no API costs)
npm run workflow -- exec --id my-workflow --mode demo --watch

# 3. Test specific blocks
npm run workflow -- blocks test --type api.apify --mode test --use-baseline

# 4. Execute in production (when ready)
npm run workflow -- exec --id my-workflow --mode live
```

### 2. Debug Failed Executions

```bash
# Execute with JSON output
npm run workflow -- exec --id my-workflow --mode demo --json > output.json

# Inspect the output
cat output.json | jq '.error'
```

### 3. Test Without Database

```bash
# Use inline input instead of database
npm run workflow -- exec \
  --id my-workflow \
  --input '{"url": "https://..."}' \
  --mode demo
```

### 4. CI/CD Integration

```bash
# In CI pipeline - use test mode for fast, deterministic tests
npm run workflow -- exec --id my-workflow --mode test --json
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Workflow tests passed"
else
  echo "❌ Workflow tests failed"
  exit 1
fi
```

---

## Troubleshooting

### "Workflow not found"

**Problem:** Workflow ID doesn't exist in database

**Solution:**
```bash
# List available workflows
npm run workflow -- list

# Use correct workflow ID
npm run workflow -- exec --id <correct-id>
```

### "Block not found"

**Problem:** Block type is incorrect

**Solution:**
```bash
# List all blocks
npm run workflow -- blocks list

# Get block details
npm run workflow -- blocks get --type <block-type>
```

### "Missing secrets"

**Problem:** API keys not configured

**Solution:**
```bash
# Use mock mode (no API keys needed)
npm run workflow -- exec --id my-workflow --mode demo

# Or set environment variables
export APIFY_API_KEY=your_key
npm run workflow -- exec --id my-workflow --mode live
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success (completed) |
| 1 | Error/Failed |
| 2 | Partial completion |

---

## More Help

```bash
# General help
npm run workflow -- --help

# Command-specific help
npm run workflow -- exec --help
npm run workflow -- blocks test --help
```

---

**Ready to use the CLI?** 🚀

Start with mock mode for development:

```bash
npm run workflow -- exec --id my-workflow --mode demo --watch
```
