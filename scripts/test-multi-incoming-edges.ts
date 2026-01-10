/**
 * Test per verificare il comportamento dell'orchestrator con multipli incoming edges
 */

import { WorkflowOrchestrator } from '../lib/workflow-engine/orchestrator'
import { ContextFactory } from '../lib/workflow-engine/context'
import { registerAllBuiltInBlocks } from '../lib/workflow-engine/blocks'

async function testMultipleIncomingEdges() {
  console.log('🔍 Testing orchestrator behavior with multiple incoming edges\n')

  registerAllBuiltInBlocks()

  // Create a simple test workflow with a node that has 2 incoming edges
  const testWorkflow = {
    workflowId: 'test.multi-incoming',
    name: 'Test Multiple Incoming Edges',
    version: '1.0',
    nodes: [
      {
        id: 'source-a',
        type: 'input.static',
        name: 'Source A',
        config: { data: { value: 'A', count: 1 } }
      },
      {
        id: 'source-b',
        type: 'input.static',
        name: 'Source B',
        config: { data: { value: 'B', count: 2 } }
      },
      {
        id: 'consumer',
        type: 'output.logger',
        name: 'Consumer (receives from both A and B)',
        config: { prefix: '[Consumer]' }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'source-a',
        target: 'consumer'
        // sourcePort default = 'out'
      },
      {
        id: 'e2',
        source: 'source-b',
        target: 'consumer'
        // sourcePort default = 'out' - STESLO SOURCE A!
      }
    ],
    globals: {}
  }

  const context = ContextFactory.create({
    workflowId: 'test.multi-incoming',
    executionId: 'test_multi_incoming',
    mode: 'demo',
    variables: {},
    secrets: {},
    logger: {
      debug: (msg: string) => console.log(`  [DEBUG] ${msg}`),
      info: (msg: string) => console.log(`  [INFO] ${msg}`),
      warn: (msg: string) => console.log(`  [WARN] ⚠️  ${msg}`),
      error: (msg: string) => console.log(`  [ERROR] ❌ ${msg}`)
    }
  })

  const orchestrator = new WorkflowOrchestrator()
  const result = await orchestrator.execute(testWorkflow, context, {})

  console.log('\n📊 Result:')
  console.log('Status:', result.status)

  if (result.output) {
    console.log('\nOutput received by consumer:')
    console.log(JSON.stringify(result.output, null, 2))
  }

  console.log('\n🔍 Analysis:')
  console.log('Expected behavior with 2 incoming edges:')
  console.log('  Option 1 (merge): { out: {...} } - ONE key, last value wins')
  console.log('  Option 2 (combine): { out: {...}, out: {...} } - IMPOSSIBLE, duplicate keys')
  console.log('  Option 3 (ports): { out: {...}, out2: {...} } - requires different sourcePorts')

  console.log('\n⚠️  ISSUE: When multiple edges use same sourcePort (default "out"),')
  console.log('   they OVERWRITE each other in the mergedInput object!')
  console.log('   Last edge wins - previous edge data is LOST!')
}

testMultipleIncomingEdges().catch(console.error)
