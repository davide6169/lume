#!/usr/bin/env tsx

/**
 * Workflow CLI - Command Line Interface for Workflow Engine
 *
 * Provides CLI commands for:
 * - Workflow CRUD operations
 * - Block testing
 * - Workflow execution
 * - Baseline configuration generation
 */

import { Command } from 'commander'
import { registerListCommand } from './workflow-cli/commands/workflow.list'
import { registerGetCommand } from './workflow-cli/commands/workflow.get'
import { registerCreateCommand } from './workflow-cli/commands/workflow.create'
import { registerUpdateCommand } from './workflow-cli/commands/workflow.update'
import { registerDeleteCommand } from './workflow-cli/commands/workflow.delete'
import { registerValidateCommand } from './workflow-cli/commands/workflow.validate'
import { registerExecCommand } from './workflow-cli/commands/workflow.exec'
import { registerExecutionsCommand } from './workflow-cli/commands/workflow.executions'
import { registerBlocksListCommand } from './workflow-cli/commands/blocks.list'
import { registerBlocksGetCommand } from './workflow-cli/commands/blocks.get'
import { registerBlocksTestCommand } from './workflow-cli/commands/blocks.test'
import { registerBlocksBaselineCommand } from './workflow-cli/commands/blocks.baseline'

// Initialize CLI
const program = new Command()

program
  .name('workflow')
  .description('CLI for Workflow Engine - Manage and test workflows')
  .version('1.0.0')

// ============================================
// Workflow Commands
// ============================================

program
  .command('list')
  .description('List all workflows')
  .option('-f, --filter <key=value>', 'Filter workflows by key=value')
  .option('-t, --tags <tags>', 'Filter by comma-separated tags')
  .option('-j, --json', 'Output as JSON')
  .action(registerListCommand)

program
  .command('get')
  .description('Get workflow details')
  .option('-i, --id <workflowId>', 'Workflow ID')
  .option('-j, --json', 'Output as JSON')
  .action(registerGetCommand)

program
  .command('create')
  .description('Create a new workflow')
  .option('-f, --file <path>', 'Workflow definition JSON file')
  .option('-j, --json', 'Output as JSON')
  .action(registerCreateCommand)

program
  .command('update')
  .description('Update an existing workflow')
  .option('-i, --id <workflowId>', 'Workflow ID')
  .option('-f, --file <path>', 'Updated workflow definition JSON file')
  .option('-j, --json', 'Output as JSON')
  .action(registerUpdateCommand)

program
  .command('delete')
  .description('Delete a workflow')
  .option('-i, --id <workflowId>', 'Workflow ID')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(registerDeleteCommand)

program
  .command('validate')
  .description('Validate a workflow definition')
  .option('-f, --file <path>', 'Workflow definition JSON file')
  .option('-j, --json', 'Output as JSON')
  .action(registerValidateCommand)

// ============================================
// Workflow Execution Commands
// ============================================

program
  .command('exec')
  .description('Execute a workflow')
  .option('-i, --id <workflowId>', 'Workflow ID')
  .option('-f, --file <path>', 'Test configuration JSON file')
  .option('--use-baseline', 'Use baseline configuration')
  .option('--input <json>', 'Inline input JSON')
  .option('-m, --mode <mode>', 'Execution mode: live, mock, demo, test (default: demo)', 'demo')
  .option('-w, --watch', 'Watch execution in real-time')
  .option('-j, --json', 'Output as JSON')
  .action(registerExecCommand)

program
  .command('executions')
  .description('List workflow executions')
  .option('-i, --id <workflowId>', 'Filter by workflow ID')
  .option('-s, --status <status>', 'Filter by status (pending/running/completed/failed)')
  .option('-l, --limit <number>', 'Limit results', '50')
  .option('-j, --json', 'Output as JSON')
  .action(registerExecutionsCommand)

// ============================================
// Block Commands
// ============================================

const blocksCmd = program.command('blocks').description('Block management commands')

blocksCmd
  .command('list')
  .description('List all available blocks')
  .option('-c, --category <category>', 'Filter by category')
  .option('-j, --json', 'Output as JSON')
  .action(registerBlocksListCommand)

blocksCmd
  .command('get')
  .description('Get block details')
  .option('-t, --type <blockType>', 'Block type')
  .option('-j, --json', 'Output as JSON')
  .action(registerBlocksGetCommand)

blocksCmd
  .command('test')
  .description('Test a block')
  .option('-t, --type <blockType>', 'Block type')
  .option('-c, --config <path>', 'Test configuration JSON file')
  .option('--use-baseline', 'Use baseline configuration')
  .option('-m, --mode <mode>', 'Execution mode: live, mock, demo, test (default: test)', 'test')
  .option('-j, --json', 'Output as JSON')
  .action(registerBlocksTestCommand)

blocksCmd
  .command('baseline')
  .description('Generate baseline configuration for a block')
  .option('-t, --type <blockType>', 'Block type')
  .option('-o, --output <path>', 'Output directory', './test-configs/baseline')
  .action(registerBlocksBaselineCommand)

// Parse arguments
program.parse()

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
