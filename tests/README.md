# Lume Tests

This directory contains all test files for the Lume project.

## Structure

```
tests/
├── workflow-engine/              # Workflow Engine Tests
│   ├── test-csv-workflow-direct.ts
│   ├── test-deep-merge.ts
│   ├── test-edge-adapter.ts
│   ├── test-merge-functions.ts
│   ├── test-multi-incoming-edges.ts
│   └── test-multi-incoming-edges-v2.ts
│
├── test-*.ts                      # Legacy/Debug Tests (25 files)
│   ├── test-apify-debug.ts
│   ├── test-csv-*.ts
│   ├── test-dev-fusion-*.ts
│   ├── test-instagram-*.ts
│   ├── test-linkedin-*.ts
│   └── ... (various integration tests)
│
└── README.md                      # This file
```

## Running Tests

### Workflow Engine Tests

```bash
# Run all workflow engine tests
cd tests/workflow-engine
for file in test-*.ts; do npx tsx "$file"; done

# Run specific test
npx tsx tests/workflow-engine/test-csv-workflow-direct.ts

# Run smart merge tests
npx tsx tests/workflow-engine/test-merge-functions.ts
npx tsx tests/workflow-engine/test-multi-incoming-edges-v2.ts

# Run edge adapter tests
npx tsx tests/workflow-engine/test-edge-adapter.ts

# Run CSV workflow test (demo mode)
npx tsx tests/workflow-engine/test-csv-workflow-direct.ts
```

### Legacy/Debug Tests

```bash
# Run specific test
npx tsx tests/test-csv-fase5.ts

# Run all legacy tests
cd tests
for file in test-*.ts; do npx tsx "$file"; done
```

## Test Categories

### Workflow Engine Tests (`tests/workflow-engine/`)

These tests validate the core workflow engine functionality:

| Test File | Purpose |
|-----------|---------|
| `test-csv-workflow-direct.ts` | Integration test for CSV Interest Enrichment workflow |
| `test-deep-merge.ts` | Unit tests for deep merge function |
| `test-edge-adapter.ts` | Tests for edge adapter functionality |
| `test-merge-functions.ts` | Unit tests for merge functions |
| `test-multi-incoming-edges-v2.ts` | Integration tests for multi-edge merge |
| `test-multi-incoming-edges.ts` | Original multi-edge test |

### Legacy/Debug Tests (`tests/test-*.ts`)

These are older tests used during development and debugging:

| Test File | Purpose |
|-----------|---------|
| `test-apify-debug.ts` | Debug Apify scraper |
| `test-csv-*.ts` | CSV workflow phase tests |
| `test-dev-fusion-*.ts` | Dev fusion format tests |
| `test-instagram-*.ts` | Instagram scraping tests |
| `test-linkedin-*.ts` | LinkedIn scraping tests |
| `test-fullcontact-block.ts` | FullContact block test |
| `test-fabio-rovazzi.ts` | Instagram profile test |
| `test-find-linkedin-actors.ts` | LinkedIn actors discovery |

## Test Modes

Most workflow engine tests support different execution modes:

```typescript
const context = ContextFactory.create({
  mode: 'demo',  // 'live' | 'mock' | 'demo' | 'test' | 'production'
  // ...
})
```

- **demo**: Mock mode with predefined data, zero cost
- **live**: Real API calls, actual costs
- **mock**: Mock responses for testing
- **test**: Test mode with validation
- **production**: Production mode with full logging

## Best Practices

1. **Clean up test data**: Remove test-generated files after running tests
2. **Use demo mode**: Prefer demo mode for development to avoid API costs
3. **Check git status**: Ensure no unintended files are created
4. **Document test purpose**: Add comments explaining what each test validates

## Adding New Tests

When adding new tests:

1. **Workflow Engine Tests**: Place in `tests/workflow-engine/`
   - Name: `test-{feature}.ts`
   - Include comprehensive documentation
   - Test both success and failure scenarios

2. **Integration Tests**: Place in `tests/`
   - Name: `test-{service}-{feature}.ts`
   - Document prerequisites (API keys, etc.)
   - Include setup instructions

## Troubleshooting

### Test Fails with "Block not registered"
**Solution**: Ensure `registerAllBuiltInBlocks()` is called before test

### Test Fails with "Cannot connect to database"
**Solution**: Check Supabase credentials or use test mode without DB

### Test Timeout
**Solution**: Increase timeout in test configuration or use demo mode

---

**Last Updated:** 11 Gennaio 2026
**Maintained By:** Lume Team
