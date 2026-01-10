/**
 * CLI Logger - Formatted output for CLI
 */

import chalk from 'chalk'

export type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error'

class Logger {
  private verbose: boolean = false

  setVerbose(verbose: boolean) {
    this.verbose = verbose
  }

  debug(message: string, ...args: any[]) {
    if (this.verbose) {
      console.log(chalk.gray(`[DEBUG] ${message}`), ...args)
    }
  }

  info(message: string, ...args: any[]) {
    console.log(chalk.blue(`[INFO] ${message}`), ...args)
  }

  success(message: string, ...args: any[]) {
    console.log(chalk.green(`[✓] ${message}`), ...args)
  }

  warn(message: string, ...args: any[]) {
    console.log(chalk.yellow(`[WARN] ${message}`), ...args)
  }

  error(message: string, ...args: any[]) {
    console.error(chalk.red(`[ERROR] ${message}`), ...args)
  }

  // Formatted output
  table(data: any[], columns?: { key: string; label: string }[]) {
    if (!data || data.length === 0) {
      this.info('No data to display')
      return
    }

    console.table(data)
  }

  json(data: any) {
    console.log(JSON.stringify(data, null, 2))
  }

  // Section headers
  header(title: string) {
    console.log('')
    console.log(chalk.bold.cyan('═'.repeat(60)))
    console.log(chalk.bold.cyan(`  ${title}`))
    console.log(chalk.bold.cyan('═'.repeat(60)))
    console.log('')
  }

  subheader(title: string) {
    console.log('')
    console.log(chalk.bold.white(`▸ ${title}`))
    console.log('')
  }

  // Key-value display
  kv(key: string, value: any, indent: number = 0) {
    const prefix = '  '.repeat(indent)
    console.log(`${prefix}${chalk.gray(key)}: ${chalk.white(value)}`)
  }

  // Status indicators
  status(label: string, active: boolean) {
    const icon = active ? '🟢' : '⏸'
    console.log(`${icon} ${label}`)
  }

  // Progress
  spinner(message: string) {
    // Note: For real spinner, use 'ora' package
    // For now, just a simple message
    process.stdout.write(`\r⏳ ${message}...`)
  }

  spinnerStop(message: string, success: boolean = true) {
    const icon = success ? '✅' : '❌'
    console.log(`\r${icon} ${message}`)
  }

  // Box for important info
  box(lines: string[]) {
    const maxLength = Math.max(...lines.map(l => l.length))
    const border = '─'.repeat(maxLength + 2)

    console.log('')
    console.log(`┌${border}┐`)
    lines.forEach(line => {
      const padded = line.padEnd(maxLength)
      console.log(`│ ${padded} │`)
    })
    console.log(`└${border}┘`)
    console.log('')
  }

  // Duration formatting
  formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`
    } else {
      const minutes = Math.floor(ms / 60000)
      const seconds = ((ms % 60000) / 1000).toFixed(0)
      return `${minutes}m ${seconds}s`
    }
  }

  // Cost formatting
  formatCost(cost: number): string {
    return `$${cost.toFixed(4)}`
  }

  // Truncate long text
  truncate(text: string, maxLength: number = 50): string {
    if (text.length <= maxLength) {
      return text
    }
    return text.substring(0, maxLength - 3) + '...'
  }
}

export const logger = new Logger()
