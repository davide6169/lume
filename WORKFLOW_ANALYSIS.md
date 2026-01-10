# CSV Interest Enrichment V3.2 - Analysis & Resolution

## 🔍 Original Issue: Multiple Incoming Edges Data Loss

**STATUS**: ✅ **RESOLVED** (Implemented Option A: Smart Merge in Orchestrator)

### The Problem

The workflow had **data loss** when nodes received input from multiple incoming edges with the same `sourcePort`.

#### Original Architecture

```
Layer 0:
└─ csv-parse

Layer 1 (Parallel):
├─ country-detect
├─ email-classify
└─ contact-normalize

Layer 2:
└─ fullcontact-enrich ← receives from email-classify AND contact-normalize
```

#### The Bug (BEFORE FIX)

From `orchestrator.ts` (old code):

```typescript
// Multiple dependencies (merge node)
const mergedInput: any = {}
for (const edge of incomingEdges) {
  const portName = edge.sourcePort || 'out'  // ← BOTH use 'out'
  mergedInput[portName] = output             // ← OVERWRITES!
}
return mergedInput
```

**What happened:**
1. First edge (email-classify): `mergedInput['out'] = { contacts: [...] }`
2. Second edge (contact-normalize): `mergedInput['out'] = { contacts: [...] }` → **OVERWRITES!**
3. Result: fullcontact-enrich received **ONLY** contact-normalize output, email-classify data was **LOST**

---

## ✅ The Solution (Implemented)

### Option A: Smart Merge in Orchestrator

Implemented **smart merge** that combines data from multiple sources intelligently:

#### 1. Deep Merge Function

Recursively merges nested objects, concatenates arrays:

```typescript
function deepMerge(target: any, source: any): any {
  if (source === null || source === undefined) return target
  if (typeof source !== 'object' || typeof target !== 'object') return source

  // Handle arrays: concatenate
  if (Array.isArray(source) && Array.isArray(target)) {
    return [...target, ...source]
  }

  // Handle objects: merge recursively
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (source[key] !== undefined && key in target) {
      result[key] = deepMerge(target[key], source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}
```

#### 2. Smart Merge Function

For arrays with IDs (contacts, items, rows), performs **ID-based merging**:

```typescript
function smartMerge(target: any, source: any): any {
  // Special handling for arrays with IDs
  for (const arrayKey of ['contacts', 'items', 'rows']) {
    if (source[arrayKey] && target[arrayKey]) {
      const hasIds = target[arrayKey].some(item => item.id !== undefined) ||
                     source[arrayKey].some(item => item.id !== undefined)

      if (hasIds) {
        // Merge by ID - deep merge items with same ID
        const mergedArray = [...targetArray]
        const idMap = new Map(targetArray.map(item => [item.id, item]))

        for (const sourceItem of sourceArray) {
          const id = sourceItem.id
          if (idMap.has(id)) {
            const existingItem = idMap.get(id)
            const mergedItem = deepMerge(existingItem, sourceItem)
            const index = mergedArray.findIndex(item => item.id === id)
            mergedArray[index] = mergedItem
          } else {
            mergedArray.push(sourceItem)
          }
        }

        // Deep merge everything except the array (which we already merged)
        const sourceWithoutArray = { ...source }
        delete sourceWithoutArray[arrayKey]
        return deepMerge(
          { ...target, [arrayKey]: mergedArray },
          sourceWithoutArray
        )
      }
    }
  }

  // Default: use regular deep merge
  return deepMerge(target, source)
}
```

#### 3. Updated Orchestrator

```typescript
// gatherNodeInput now uses smart merge
let mergedInput: any = {}
for (const edge of incomingEdges) {
  let output = sourceResult.output

  if (edge.adapter) {
    output = applyEdgeAdapter(output, edge.adapter, context)
  }

  // SMART MERGE into main input (merges arrays by ID when possible)
  mergedInput = smartMerge(mergedInput, output)
}
return mergedInput
```

---

## 📊 Test Results

All tests pass successfully:

### Test 1: Simple Objects ✅
```
Input A: { valueA: "A", countA: 1 }
Input B: { valueB: "B", countB: 2 }
Result: { valueA: "A", countA: 1, valueB: "B", countB: 2 }
```

### Test 2: Nested Objects (Deep Merge) ✅
```
Input A: {
  contacts: [{ id: 1, name: "Alice", from: "A" }],
  metadata: { source: "A", count: 1 }
}
Input B: {
  contacts: [{ id: 2, name: "Bob", from: "B" }],
  metadata: { processed: true }
}
Result: {
  contacts: [{ id: 1, ... }, { id: 2, ... }],  // 2 items
  metadata: { source: "A", count: 1, processed: true }  // MERGED!
}
```

### Test 3: Arrays with Same ID (Smart Merge) ✅
```
Input A: {
  contacts: [
    { id: 1, name: "Alice", emailType: "business" },
    { id: 2, name: "Bob", emailType: "personal" }
  ]
}
Input B: {
  contacts: [
    { id: 1, name: "Alice", normalized: { firstName: "Alice", lastName: "Smith" } },
    { id: 3, name: "Charlie", normalized: { firstName: "Charlie", lastName: "Brown" } }
  ]
}
Result: {
  contacts: [
    { id: 1, name: "Alice", emailType: "business", normalized: { ... } },  // MERGED!
    { id: 2, name: "Bob", emailType: "personal" },
    { id: 3, name: "Charlie", normalized: { ... } }
  ]
}
```

### CSV Workflow Test ✅
```
✅ All 11 nodes completed
✅ fullcontact-enrich receives merged data from email-classify AND contact-normalize
✅ csv-assemble receives merged data from llm-merge-interests AND skip-merge
✅ No data loss
✅ No regressions
```

---

## 📁 Files Modified

### Core Changes
1. **`lib/workflow-engine/orchestrator.ts`**
   - Added `deepMerge()` function (lines 28-51)
   - Added `smartMerge()` function (lines 59-113)
   - Updated `gatherNodeInput()` to use `smartMerge()` instead of overwrite (line 565)

### Test Files
2. **`scripts/test-merge-functions.ts`** - Unit tests for merge functions
3. **`scripts/test-multi-incoming-edges-v2.ts`** - Integration tests for orchestrator merge

### Block Registration
4. **`lib/workflow-engine/blocks/index.ts`**
   - Added registration for `input.static`, `input.database`, `output.logger`

---

## 🔬 Technical Details

### Merge Behavior

| Scenario | Behavior | Example |
|----------|----------|---------|
| Simple objects | All keys preserved | `{a:1} + {b:2}` → `{a:1, b:2}` |
| Nested objects | Deep merge | `{m:{x:1}} + {m:{y:2}}` → `{m:{x:1, y:2}}` |
| Arrays (no IDs) | Concatenated | `{a:[1]} + {a:[2]}` → `{a:[1,2]}` |
| Arrays (with IDs) | Smart merge by ID | `{a:[{id:1,x:1}]} + {a:[{id:1,y:2}]}` → `{a:[{id:1,x:1,y:2}]}` |
| Overlapping keys | Recursive merge | Preserves all data |

### Why Smart Merge?

For workflow data like contacts, we want to:
- **Merge** enrichment data for the same contact (same ID)
- **Add** new contacts that don't exist yet
- **Preserve** all metadata fields from different sources

Example:
```javascript
// email-classify output
{ contacts: [{ id: 1, email: "mario@test.com", emailType: "business" }] }

// contact-normalize output
{ contacts: [{ id: 1, email: "mario@test.com", normalized: { firstName: "Mario", lastName: "Rossi" } }] }

// Smart merge result
{
  contacts: [{
    id: 1,
    email: "mario@test.com",
    emailType: "business",        // ← from email-classify
    normalized: {                  // ← from contact-normalize
      firstName: "Mario",
      lastName: "Rossi"
    }
  }]
}
```

---

## 🎯 Impact

### Before Fix
- ❌ Data loss when multiple incoming edges
- ❌ Only last edge's data survived
- ❌ Workflow not working as designed

### After Fix
- ✅ All data from multiple sources preserved
- ✅ Intelligent merging for arrays with IDs
- ✅ Deep merge for nested objects
- ✅ Works for any workflow with multiple incoming edges

---

## 📝 Other Issues Found (Status)

### 2. country-detect is not used downstream
**Status**: ⚠️ **Still present** - Not critical
- Sets context variables but output not used by downstream blocks
- Could be removed or integrated if needed

### 3. Missing explicit merge block
**Status**: ✅ **Resolved** - No longer needed
- Smart merge in orchestrator eliminates need for explicit merge blocks
- Makes workflows cleaner and more intuitive

### 4. LLM Merge input format
**Status**: ⚠️ **Monitor** - Not causing issues currently
- Format mismatch exists but doesn't break the workflow
- Could be addressed with edge adapters if needed

---

## 🚀 Next Steps

1. ✅ Smart merge implementation - **COMPLETE**
2. ✅ Test coverage - **COMPLETE**
3. ✅ Documentation - **COMPLETE**
4. ✅ No regressions - **VERIFIED**

The workflow engine now properly handles data merging for nodes with multiple incoming edges, making the system more robust and intuitive.
