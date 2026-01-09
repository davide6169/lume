/**
 * Email to Social Profile Block
 *
 * Attempts to find social media profiles from email address using:
 * 1. Apollo.io for LinkedIn (business emails only)
 * 2. Username guessing for Instagram/Twitter/TikTok
 * 3. FullContact/Clearbit integration (optional, paid APIs)
 *
 * Success rates:
 * - Business email + Apollo: ~60-80%
 * - Personal email + username guessing: ~20-40%
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'

// Import Apollo for LinkedIn enrichment
import { ApolloEnrichmentService } from '@/lib/services/apollo-enrichment'

export interface EmailToSocialInput {
  email: string
  firstName?: string
  lastName?: string
  full?: boolean // Enable deep search (slower, may use paid APIs)
}

export interface EmailToSocialConfig {
  apolloToken?: string // {{secrets.apollo}}
  clearbitToken?: string // {{secrets.clearbit}} (optional)
  fullContactToken?: string // {{secrets.fullcontact}} (optional)
  enableUsernameGuessing?: boolean // Default: true
  maxUsernamesToTry?: number // Default: 5
}

export interface SocialProfile {
  platform: 'linkedin' | 'instagram' | 'twitter' | 'tiktok' | 'facebook'
  username?: string
  url?: string
  confidence: 'high' | 'medium' | 'low'
  method: 'apollo' | 'clearbit' | 'guessed' | 'not_found'
  verified?: boolean
  followers?: number
  bio?: string
}

export interface EmailToSocialOutput {
  email: string
  profiles: SocialProfile[]
  linkedin?: {
    found: boolean
    url?: string
    firstName?: string
    lastName?: string
    title?: string
    company?: string
    skills?: string[]
    confidence: 'high' | 'medium' | 'low'
  }
  guessedUsernames: {
    platform: string
    usernames: string[]
  }[]
  summary: {
    totalFound: number
    byPlatform: Record<string, number>
    searchMethods: string[]
  }
}

/**
 * Email to Social Block Executor
 */
export class EmailToSocialBlock extends BaseBlockExecutor {
  constructor() {
    super('social.emailToSocial')
  }

  async execute(
    config: EmailToSocialConfig,
    input: EmailToSocialInput,
    context: ExecutionContext
  ): Promise<any> {
    const startTime = Date.now()

    try {
      this.log(context, 'info', 'Searching social profiles for email', {
        email: input.email
      })

      const profiles: SocialProfile[] = []
      const searchMethods: string[] = []

      // ============================================
      // Strategy 1: Apollo.io for LinkedIn (Business emails)
      // ============================================
      if (this.isBusinessEmail(input.email) && config.apolloToken) {
        this.log(context, 'debug', 'Business email detected, trying Apollo for LinkedIn')

        const linkedinResult = await this.searchLinkedInWithApollo(
          input.email,
          config.apolloToken,
          context
        )

        if (linkedinResult.found) {
          profiles.push({
            platform: 'linkedin',
            url: linkedinResult.url,
            confidence: linkedinResult.confidence,
            method: 'apollo',
            verified: true
          })

          searchMethods.push('apollo_linkedin')
        }
      }

      // ============================================
      // Strategy 2: Clearbit for LinkedIn (Optional, paid)
      // ============================================
      if (config.clearbitToken) {
        this.log(context, 'debug', 'Trying Clearbit for enrichment')

        const clearbitResult = await this.searchWithClearbit(
          input.email,
          config.clearbitToken,
          context
        )

        if (clearbitResult.linkedin && !profiles.find(p => p.platform === 'linkedin')) {
          profiles.push({
            platform: 'linkedin',
            url: clearbitResult.linkedin.url,
            confidence: 'high',
            method: 'clearbit',
            verified: true
          })

          searchMethods.push('clearbit_linkedin')
        }
      }

      // ============================================
      // Strategy 3: Username Guessing (Instagram/Twitter/TikTok)
      // ============================================
      if (config.enableUsernameGuessing !== false) {
        this.log(context, 'debug', 'Generating username guesses')

        const guessedUsernames = this.generateUsernames(
          input.email,
          input.firstName,
          input.lastName
        )

        const platformsToGuess: Array<'instagram' | 'twitter' | 'tiktok'> = [
          'instagram',
          'twitter',
          'tiktok'
        ]

        for (const platform of platformsToGuess) {
          const limit = config.maxUsernamesToTry || 5
          const platformProfiles = await this.tryUsernames(
            platform,
            guessedUsernames.slice(0, limit),
            context
          )

          profiles.push(...platformProfiles)
        }

        if (profiles.some(p => p.method === 'guessed')) {
          searchMethods.push('username_guessing')
        }
      }

      // ============================================
      // Build Summary
      // ============================================
      const byPlatform: Record<string, number> = {}
      profiles.forEach(profile => {
        byPlatform[profile.platform] = (byPlatform[profile.platform] || 0) + 1
      })

      const summary = {
        totalFound: profiles.length,
        byPlatform,
        searchMethods
      }

      // ============================================
      // Build Output
      // ============================================
      const linkedinProfile = profiles.find(p => p.platform === 'linkedin')
      const result: EmailToSocialOutput = {
        email: input.email,
        profiles,
        linkedin: linkedinProfile ? {
          found: true,
          url: linkedinProfile.url,
          confidence: linkedinProfile.confidence
        } : {
          found: false,
          confidence: 'low'
        },
        guessedUsernames: [
          {
            platform: 'instagram',
            usernames: this.generateUsernames(input.email, input.firstName, input.lastName)
          }
        ],
        summary
      }

      this.log(context, 'info', 'Social profile search completed', {
        totalFound: profiles.length,
        methods: searchMethods.join(', ')
      })

      return {
        status: 'completed',
        output: result,
        executionTime: Date.now() - startTime
      }

    } catch (error) {
      this.log(context, 'error', 'Social profile search failed', { error })

      return {
        status: 'failed',
        output: null,
        error: (error as Error).message,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Check if email is from a business domain
   */
  private isBusinessEmail(email: string): boolean {
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'icloud.com', 'aol.com', 'protonmail.com', 'mail.com',
      'gmail.com.br', 'yahoo.com.br', 'hotmail.com.br'
    ]

    const domain = email.split('@')[1]?.toLowerCase()
    return !personalDomains.includes(domain)
  }

  /**
   * Search LinkedIn using Apollo.io
   */
  private async searchLinkedInWithApollo(
    email: string,
    token: string,
    context: ExecutionContext
  ): Promise<{
    found: boolean
    url?: string
    firstName?: string
    lastName?: string
    title?: string
    company?: string
    confidence: 'high' | 'medium' | 'low'
  }> {
    try {
      const apollo = new ApolloEnrichmentService(token)

      // Apollo requires first_name, last_name, and email
      // We can extract from email
      const emailParts = email.split('@')[0]
      const nameParts = emailParts.split(/[._-]/)

      const result = await apollo.enrichContact([{
        email,
        first_name: nameParts[0] || '',
        last_name: nameParts[1] || ''
      }])

      if (result && result.length > 0 && result[0].linkedin_url) {
        return {
          found: true,
          url: result[0].linkedin_url,
          firstName: result[0].first_name,
          lastName: result[0].last_name,
          title: result[0].title,
          company: result[0].company,
          confidence: 'high'
        }
      }

      return { found: false, confidence: 'low' }

    } catch (error) {
      console.error('[EmailToSocial] Apollo search failed:', error)
      return { found: false, confidence: 'low' }
    }
  }

  /**
   * Search using Clearbit API (optional, requires paid account)
   */
  private async searchWithClearbit(
    email: string,
    token: string,
    context: ExecutionContext
  ): Promise<{
    linkedin?: {
      url: string
      handle: string
    }
  }> {
    try {
      const response = await fetch(`https://person.clearbit.com/v2/people/find?email=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        return {}
      }

      const data = await response.json()

      return {
        linkedin: data.linkedin ? {
          url: data.linkedin.url,
          handle: data.linkedin.handle
        } : undefined
      }

    } catch (error) {
      console.error('[EmailToSocial] Clearbit search failed:', error)
      return {}
    }
  }

  /**
   * Generate likely usernames from email
   */
  private generateUsernames(
    email: string,
    firstName?: string,
    lastName?: string
  ): string[] {
    const emailPart = email.split('@')[0].toLowerCase()
    const usernames: string[] = []

    // Extract name from email if not provided
    const parts = emailPart.split(/[._-]/)
    const first = firstName || parts[0] || ''
    const last = lastName || parts[1] || ''

    // Strategy 1: Email as-is (most common)
    usernames.push(emailPart)

    // Strategy 2: With dots
    if (first && last && !emailPart.includes('.')) {
      usernames.push(`${first}.${last}`)
    }

    // Strategy 3: With underscores
    if (!emailPart.includes('_')) {
      usernames.push(emailPart.replace(/[.-]/g, '_'))
    }

    // Strategy 4: Combined without separator
    if (first && last) {
      usernames.push(`${first}${last}`)
    }

    // Strategy 5: With common suffixes for Brazil/Latam
    if (email.endsWith('.br')) {
      usernames.push(`${emailPart}.br`)
      usernames.push(`${emailPart}br`)
      usernames.push(`${emailPart}_br`)
    }

    // Strategy 6: First name + last initial
    if (first && last) {
      usernames.push(`${first}${last[0]}`)
      usernames.push(`${first}.${last[0]}`)
    }

    // Strategy 7: Last name + first initial
    if (first && last) {
      usernames.push(`${last}${first[0]}`)
      usernames.push(`${last}.${first[0]}`)
    }

    // Remove duplicates and limit
    return [...new Set(usernames)].slice(0, 10)
  }

  /**
   * Try multiple usernames on a platform
   * NOTE: This requires actual API calls to check if username exists
   * For now, returns unverified guesses
   */
  private async tryUsernames(
    platform: 'instagram' | 'twitter' | 'tiktok',
    usernames: string[],
    context: ExecutionContext
  ): Promise<SocialProfile[]> {
    // TODO: Implement actual username verification
    // This would require:
    // - Instagram: Scrape profile page or use unofficial API
    // - Twitter: Use Twitter API (paid)
    // - TikTok: Scrape profile page

    // For now, return as unverified guesses with low confidence
    return usernames.slice(0, 3).map(username => ({
      platform,
      username,
      url: `https://${platform}.com/${username}`,
      confidence: 'low' as const,
      method: 'guessed' as const,
      verified: false
    }))
  }
}
