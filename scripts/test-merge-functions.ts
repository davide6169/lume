/**
 * Direct test of deepMerge and smartMerge functions
 */

// Copy of the merge functions from orchestrator
function deepMerge(target: any, source: any): any {
  if (source === null || source === undefined) {
    return target
  }
  if (typeof source !== 'object' || typeof target !== 'object') {
    return source
  }

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

function smartMerge(target: any, source: any): any {
  if (source === null || source === undefined) {
    return target
  }
  if (typeof source !== 'object' || typeof target !== 'object') {
    return source
  }

  // Special handling for 'contacts' or 'items' arrays
  // These often contain objects that should be merged by 'id' or 'email'
  for (const arrayKey of ['contacts', 'items', 'rows']) {
    if (source[arrayKey] && target[arrayKey] &&
        Array.isArray(source[arrayKey]) && Array.isArray(target[arrayKey])) {

      const targetArray = target[arrayKey] as any[]
      const sourceArray = source[arrayKey] as any[]

      // Check if items have 'id' field for smart merging
      const hasIds = targetArray.some(item => item.id !== undefined) ||
                     sourceArray.some(item => item.id !== undefined)

      if (hasIds) {
        // Merge by ID
        const mergedArray = [...targetArray]
        const idMap = new Map(targetArray.map(item => [item.id, item]))

        for (const sourceItem of sourceArray) {
          const id = sourceItem.id
          if (idMap.has(id)) {
            // Deep merge existing item
            const existingItem = idMap.get(id)
            const mergedItem = deepMerge(existingItem, sourceItem)
            // Replace in array
            const index = mergedArray.findIndex(item => item.id === id)
            if (index !== -1) {
              mergedArray[index] = mergedItem
            }
          } else {
            // Add new item
            mergedArray.push(sourceItem)
          }
        }

        // Create a new source without the array key to avoid overwriting
        const sourceWithoutArray = { ...source }
        delete sourceWithoutArray[arrayKey]

        // Deep merge everything except the array (which we already merged)
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

console.log('🧪 Testing deepMerge and smartMerge functions\n')

// Test 1: Simple objects
console.log('Test 1: Simple objects')
let result1 = smartMerge({}, { valueA: 'A', countA: 1 })
console.log('smartMerge({}, { valueA: "A", countA: 1 })')
console.log('Result:', result1)
console.log('Expected: { valueA: "A", countA: 1 }')
console.log(result1.valueA === 'A' && result1.countA === 1 ? '✅ PASSED\n' : '❌ FAILED\n')

// Test 2: Merge two simple objects
console.log('Test 2: Merge two simple objects')
let merged = {}
merged = smartMerge(merged, { valueA: 'A', countA: 1 })
console.log('After first merge:', merged)
merged = smartMerge(merged, { valueB: 'B', countB: 2 })
console.log('After second merge:', merged)
console.log('Expected: { valueA: "A", countA: 1, valueB: "B", countB: 2 }')
console.log(merged.valueA === 'A' && merged.countA === 1 && merged.valueB === 'B' && merged.countB === 2 ? '✅ PASSED\n' : '❌ FAILED\n')

// Test 3: Nested objects
console.log('Test 3: Nested objects')
let merged3 = {}
merged3 = smartMerge(merged3, {
  contacts: [{ id: 1, name: 'Alice', from: 'A' }],
  metadata: { source: 'A', count: 1 }
})
console.log('After first merge:', JSON.stringify(merged3, null, 2))
merged3 = smartMerge(merged3, {
  contacts: [{ id: 2, name: 'Bob', from: 'B' }],
  metadata: { processed: true }
})
console.log('After second merge:', JSON.stringify(merged3, null, 2))
console.log('Expected: contacts array with 2 items, metadata with both source and processed')
const has2Contacts = merged3.contacts?.length === 2
const hasMetadataSource = merged3.metadata?.source === 'A'
const hasMetadataProcessed = merged3.metadata?.processed === true
console.log(`Contacts length: ${merged3.contacts?.length} (expected: 2) - ${has2Contacts ? '✅' : '❌'}`)
console.log(`Metadata.source: ${merged3.metadata?.source} (expected: A) - ${hasMetadataSource ? '✅' : '❌'}`)
console.log(`Metadata.processed: ${merged3.metadata?.processed} (expected: true) - ${hasMetadataProcessed ? '✅' : '❌'}`)
console.log(has2Contacts && hasMetadataSource && hasMetadataProcessed ? '✅ PASSED\n' : '❌ FAILED\n')

// Test 4: Smart merge by ID
console.log('Test 4: Smart merge by ID')
let merged4 = {}
merged4 = smartMerge(merged4, {
  contacts: [
    { id: 1, name: 'Alice', emailType: 'business' },
    { id: 2, name: 'Bob', emailType: 'personal' }
  ]
})
console.log('After first merge:', JSON.stringify(merged4, null, 2))
merged4 = smartMerge(merged4, {
  contacts: [
    { id: 1, name: 'Alice', normalized: { firstName: 'Alice', lastName: 'Smith' } },
    { id: 3, name: 'Charlie', normalized: { firstName: 'Charlie', lastName: 'Brown' } }
  ]
})
console.log('After second merge:', JSON.stringify(merged4, null, 2))
const alice = merged4.contacts?.find((c: any) => c.id === 1)
const bob = merged4.contacts?.find((c: any) => c.id === 2)
const charlie = merged4.contacts?.find((c: any) => c.id === 3)
console.log(`Total contacts: ${merged4.contacts?.length} (expected: 3)`)
console.log(`Alice (id=1) has emailType: ${alice?.emailType} and normalized: ${alice?.normalized ? 'YES' : 'NO'}`)
console.log(`Bob (id=2) has emailType: ${bob?.emailType}`)
console.log(`Charlie (id=3) has normalized: ${charlie?.normalized ? 'YES' : 'NO'}`)
const test4Pass = merged4.contacts?.length === 3 &&
                 alice?.emailType && alice?.normalized &&
                 bob?.emailType &&
                 charlie?.normalized
console.log(test4Pass ? '✅ PASSED\n' : '❌ FAILED\n')

console.log('🎉 All function tests completed!')
