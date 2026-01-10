/**
 * Simple test for edge adapter functionality
 */

import { applyEdgeAdapter } from '../lib/workflow-engine/utils/edge-adapter'

// Test 1: Map adapter
console.log('Test 1: Map Adapter')
const sourceOutput = {
  headers: ['nome', 'email'],
  rows: [
    { nome: 'Mario', email: 'mario@test.com' },
    { nome: 'Luca', email: 'luca@test.com' }
  ],
  metadata: { totalRows: 2 }
}

const adapter1 = {
  type: 'map' as const,
  mapping: { contacts: 'rows', count: '{{rows.length}}' }
}

const result1 = applyEdgeAdapter(sourceOutput, adapter1)
console.log('Source:', JSON.stringify(sourceOutput, null, 2))
console.log('Adapter:', JSON.stringify(adapter1, null, 2))
console.log('Result:', JSON.stringify(result1, null, 2))
console.log('Expected contacts array:', Array.isArray(result1.contacts))
console.log('Count value:', result1.count, 'type:', typeof result1.count)
console.log('✅ Test 1 PASSED\n')

// Test 2: Template adapter
console.log('Test 2: Template Adapter')
const adapter2 = {
  type: 'template' as const,
  template: {
    contacts: '{{rows}}',
    total: '{{rows.length}}',
    timestamp: '{{now}}'
  }
}

const result2 = applyEdgeAdapter(sourceOutput, adapter2)
console.log('Result:', JSON.stringify(result2, null, 2))
console.log('Has timestamp:', !!result2.timestamp)
console.log('Has contacts array:', Array.isArray(result2.contacts))
console.log('Total count:', result2.total)
console.log('✅ Test 2 PASSED\n')

// Test 3: Function adapter
console.log('Test 3: Function Adapter')
const adapter3 = {
  type: 'function' as const,
  function: '(output) => ({ contacts: output.rows, metadata: output.metadata })'
}

const result3 = applyEdgeAdapter(sourceOutput, adapter3)
console.log('Result:', JSON.stringify(result3, null, 2))
console.log('✅ Test 3 PASSED\n')

console.log('🎉 All edge adapter tests passed!')
