/**
 * Secrets Manager - Manage API keys and sensitive configuration
 */

import { logger } from './logger'
import { configLoader } from './config-loader'

class SecretsManager {
  private secrets: Record<string, string> = {}

  /**
   * Load secrets from environment variables
   */
  loadFromEnv(prefix: string = ''): void {
    const envPrefix = prefix.toUpperCase()

    // Common API keys
    const commonKeys = [
      'OPENROUTER_API_KEY',
      'APOLLO_API_KEY',
      'HUNTER_IO_API_KEY',
      'FACEBOOK_ACCESS_TOKEN',
      'INSTAGRAM_ACCESS_TOKEN',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY'
    ]

    commonKeys.forEach(key => {
      const envKey = envPrefix ? `${envPrefix}_${key}` : key
      const value = process.env[envKey]
      if (value) {
        this.secrets[key] = value
        logger.debug(`Loaded secret: ${key}`)
      }
    })
  }

  /**
   * Load secrets from object
   */
  loadFromObject(secretsObj: Record<string, string>): void {
    for (const [key, value] of Object.entries(secretsObj)) {
      this.secrets[key] = value
      logger.debug(`Loaded secret: ${key}`)
    }
  }

  /**
   * Set a secret
   */
  set(key: string, value: string): void {
    this.secrets[key] = value
  }

  /**
   * Get a secret
   */
  get(key: string): string | undefined {
    return this.secrets[key]
  }

  /**
   * Get all secrets
   */
  getAll(): Record<string, string> {
    return { ...this.secrets }
  }

  /**
   * Check if a secret exists
   */
  has(key: string): boolean {
    return key in this.secrets
  }

  /**
   * Clear all secrets
   */
  clear(): void {
    this.secrets = {}
  }

  /**
   * Validate required secrets
   */
  validateRequired(requiredKeys: string[]): { valid: boolean; missing: string[] } {
    const missing: string[] = []

    requiredKeys.forEach(key => {
      if (!this.has(key)) {
        missing.push(key)
      }
    })

    return {
      valid: missing.length === 0,
      missing
    }
  }

  /**
   * Resolve secrets with environment variable substitution
   */
  resolveSecrets(secrets: Record<string, string>): Record<string, string> {
    return configLoader.resolveSecrets(secrets)
  }

  /**
   * Get default secrets for workflow execution
   */
  async getDefaultSecrets(): Promise<Record<string, string>> {
    // Load from environment
    this.loadFromEnv()

    // Try to load .env file
    await configLoader.loadEnvFile()

    return this.getAll()
  }

  /**
   * Display secrets (masked for security)
   */
  displaySecrets(): void {
    const masked: Record<string, string> = {}

    for (const [key, value] of Object.entries(this.secrets)) {
      if (value.length > 8) {
        masked[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      } else {
        masked[key] = '****'
      }
    }

    logger.debug('Loaded secrets:', masked)
  }
}

export const secretsManager = new SecretsManager()
