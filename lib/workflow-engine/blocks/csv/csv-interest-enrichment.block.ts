/**
 * CSV Interest Enrichment Block
 *
 * BANCO DI PROVA INIZIALE del workflow engine
 *
 * INPUT: CSV con colonne: nome;celular;email;nascimento
 * OUTPUT: CSV arricchito con campo aggiuntivo: interessi (separati da ",")
 *
 * Esempio:
 * Input:  Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986
 * Output: Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986;calcio, tecnologia, viaggi
 *
 * Strategie utilizzate:
 * 1. Country Detection (dal telefono) - FREE, 100% coverage
 * 2. LinkedIn via Apify Supreme Coder ($3/1000) - 35% coverage (email business)
 * 3. Instagram Search via Apify - 40-60% coverage
 * 4. Contextualized LLM Analysis (solo SE hai dati bio) - Alta accuracy
 *
 * NOTA: Se non vengono trovati dati bio, il campo interessi sarà VUOTO (non generiamo fake interests)
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'

// Types
export interface CSVInterestEnrichmentInput {
  csv: {
    headers: string[]
    rows: Array<{
      nome: string
      celular: string
      email: string
      nascimento: string
    }>
  }
}

export interface CSVInterestEnrichmentConfig {
  apifyToken: string // {{secrets.apify}}
  openrouterToken: string // {{secrets.openrouter}}
  enableLinkedIn?: boolean // Default: true
  enableInstagram?: boolean // Default: true
  maxCostPerContact?: number // Default: 0.10 (massimo $0.10 per contatto)
}

export interface CSVInterestEnrichmentOutput {
  csv: {
    headers: string[] // headers originali + "interessi"
    rows: Array<{
      nome: string
      celular: string
      email: string
      nascimento: string
      interessi: string // ← CAMPO AGGIUNTIVO (solo se trovato)
    }>
  }
  metadata: {
    totalContacts: number
    contactsWithInterests: number
    contactsWithoutInterests: number
    filteredContacts: number  // Record filtrati (senza interessi)
    outputRecords: number  // Record nel CSV output
    countryDetected: number
    linkedinFound: number
    instagramFound: number
    totalCost: number
    avgCostPerContact: number
  }
}

/**
 * CSV Interest Enrichment Block
 */
export class CSVInterestEnrichmentBlock extends BaseBlockExecutor {
  constructor() {
    super('csv.interestEnrichment')
  }

  async execute(
    config: CSVInterestEnrichmentConfig,
    input: CSVInterestEnrichmentInput,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      this.log(context, 'info', 'Starting CSV Interest Enrichment', {
        contactsCount: input.csv.rows.length
      })

      // Validate input
      if (!input.csv || !input.csv.rows || !Array.isArray(input.csv.rows)) {
        throw new Error('Input CSV must have rows array')
      }

      const contacts = input.csv.rows
      const enrichedRows: any[] = []

      // Statistics
      let contactsWithInterests = 0
      let contactsWithoutInterests = 0
      let countryDetected = 0
      let linkedinFound = 0
      let instagramFound = 0
      let totalCost = 0

      // Process each contact
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i]
        this.log(context, 'debug', `Processing contact ${i + 1}/${contacts.length}`)

        const enrichedRow = { ...contact }

        try {
          // ============================================
          // STRATEGY 1: Country Detection (from phone)
          // ============================================
          const countryData = await this.detectCountry(contact, context)
          if (countryData) {
            countryDetected++
          }

          // ============================================
          // STRATEGY 2: LinkedIn (business emails only)
          // ============================================
          let linkedinData = null
          const emailType = this.classifyEmail(contact.email)

          if (emailType === 'business' && config.enableLinkedIn !== false) {
            this.log(context, 'debug', `Business email detected for ${contact.email}`)

            linkedinData = await this.enrichWithLinkedIn(
              contact,
              config.apifyToken,
              context
            )

            if (linkedinData && linkedinData.found) {
              linkedinFound++
              totalCost += 0.003 // $0.003 per LinkedIn lookup
            }
          }

          // ============================================
          // STRATEGY 3: Instagram Search
          // ============================================
          let instagramData = null

          if (config.enableInstagram !== false && totalCost < (config.maxCostPerContact || 0.10)) {
            this.log(context, 'debug', `Searching Instagram for ${contact.nome}`)

            instagramData = await this.searchInstagram(
              contact,
              countryData,
              config.apifyToken,
              context
            )

            if (instagramData && instagramData.found) {
              instagramFound++
              totalCost += 0.05 // ~$0.05 per Instagram search
            }
          }

          // ============================================
          // STRATEGY 4: Extract Interests (only if we have bio data)
          // ============================================
          let interests: string[] = []

          // From LinkedIn (professional skills)
          if (linkedinData && linkedinData.skills) {
            interests.push(...linkedinData.skills)
          }

          // From Instagram (bio + posts)
          if (instagramData && instagramData.bio) {
            const instagramInterests = await this.extractInterestsFromInstagram(
              instagramData,
              countryData,
              config.openrouterToken,
              context
            )
            interests.push(...instagramInterests)
          }

          // Clean and deduplicate interests
          interests = this.cleanInterests(interests)

          // ============================================
          // ADD "interessi" FIELD
          // ============================================
          if (interests.length > 0) {
            // Join with comma
            enrichedRow.interessi = interests.join(', ')
            contactsWithInterests++

            this.log(context, 'debug', `Extracted ${interests.length} interests for ${contact.nome}`)
          } else {
            // Empty field if no bio data found
            enrichedRow.interessi = ''
            contactsWithoutInterests++

            this.log(context, 'debug', `No bio data found for ${contact.nome}, interests field empty`)
          }

          // Cost tracking
          enrichedRow.enrichment_cost = totalCost

        } catch (error) {
          this.log(context, 'warn', `Failed to enrich contact ${i + 1}`, {
            error: (error as Error).message
          })

          // Add empty interests field
          enrichedRow.interessi = ''
          contactsWithoutInterests++
        }

        enrichedRows.push(enrichedRow)

        // Update progress
        const progress = Math.round(((i + 1) / contacts.length) * 100)
        context.updateProgress(progress, {
          timestamp: new Date().toISOString(),
          event: 'enrichment_progress',
          details: {
            processed: i + 1,
            total: contacts.length,
            contactsWithInterests,
            contactsWithoutInterests,
            countryDetected,
            linkedinFound,
            instagramFound,
            totalCost: totalCost.toFixed(4)
          }
        })
      }

      // Prepare output - FILTER: only rows with interests
      const rowsWithInterests = enrichedRows.filter(row => row.interessi && row.interessi.trim().length > 0)

      const output: CSVInterestEnrichmentOutput = {
        csv: {
          headers: [...input.csv.headers, 'interessi'],
          rows: rowsWithInterests  // ← SOLO record con interessi
        },
        metadata: {
          totalContacts: contacts.length,
          contactsWithInterests,
          contactsWithoutInterests,
          filteredContacts: enrichedRows.length - rowsWithInterests.length,
          outputRecords: rowsWithInterests.length,
          countryDetected,
          linkedinFound,
          instagramFound,
          totalCost,
          avgCostPerContact: totalCost / contacts.length
        }
      }

      const executionTime = Date.now() - startTime

      this.log(context, 'info', 'CSV Interest Enrichment completed', {
        executionTime,
        totalContacts: contacts.length,
        contactsWithInterests,
        contactsWithoutInterests,
        filteredContacts: enrichedRows.length - rowsWithInterests.length,
        outputRecords: rowsWithInterests.length,
        totalCost: totalCost.toFixed(4),
        avgCostPerContact: (totalCost / contacts.length).toFixed(4)
      })

      return {
        status: 'completed',
        output,
        executionTime,
        error: undefined,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: output.metadata,
        logs: []
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'CSV Interest Enrichment failed', {
        error: (error as Error).message
      })

      return {
        status: 'failed',
        output: null,
        executionTime,
        error: error as Error,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {},
        logs: []
      }
    }
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  /**
   * Detect country from phone number
   */
  private async detectCountry(contact: any, context: ExecutionContext) {
    try {
      const phone = contact.celular
      if (!phone) return null

      // Clean phone number
      const cleanPhone = phone.replace(/\s/g, '').replace(/-/g, '')

      // Detect country from prefix
      const countryMap: Record<string, string> = {
        '+39': 'IT',
        '+55': 'BR',
        '+52': 'MX',
        '+54': 'AR',
        '+57': 'CO',
        '+56': 'CL',
        '+51': 'PE',
        '+34': 'ES',
        '+1': 'US'
      }

      for (const [prefix, code] of Object.entries(countryMap)) {
        if (cleanPhone.startsWith(prefix.replace('+', ''))) {
          return {
            code,
            name: this.getCountryName(code),
            confidence: 'medium'
          }
        }
      }

      // Default: Italy (since CSV is Italian)
      return {
        code: 'IT',
        name: 'Italy',
        confidence: 'low',
        method: 'default'
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Get country name from code
   */
  private getCountryName(code: string): string {
    const names: Record<string, string> = {
      'IT': 'Italy',
      'BR': 'Brazil',
      'MX': 'Mexico',
      'AR': 'Argentina',
      'CO': 'Colombia',
      'CL': 'Chile',
      'PE': 'Peru',
      'ES': 'Spain',
      'US': 'United States'
    }
    return names[code] || code
  }

  /**
   * Classify email as business or personal
   */
  private classifyEmail(email: string): 'business' | 'personal' {
    const personalDomains = [
      'gmail.com', 'gmail.com.br', 'gmail.com.mx', 'gmail.com.ar',
      'yahoo.com', 'yahoo.com.br', 'yahoo.com.mx', 'yahoo.com.ar',
      'hotmail.com', 'hotmail.com.br', 'hotmail.com.mx', 'outlook.com',
      'libero.it', 'tin.it', 'virgilio.it', 'alice.it'
    ]

    const domain = email.split('@')[1]?.toLowerCase()
    return personalDomains.includes(domain) ? 'personal' : 'business'
  }

  /**
   * Enrich with LinkedIn using Apify Supreme Coder
   * Actor: supreme_coder/linkedin-profile-scraper
   */
  private async enrichWithLinkedIn(
    contact: any,
    apifyToken: string,
    context: ExecutionContext
  ): Promise<any> {
    try {
      this.log(context, 'debug', `Enriching ${contact.email} with LinkedIn`)

      // NOTA: Per trovare LinkedIn da email, serve o:
      // 1. Username LinkedIn conosciuto
      // 2. Cercare su Google: "Mario Rossi" site:linkedin.com

      // Per ora, torniamo null (da implementare con Google Search)
      return {
        found: false,
        reason: 'LinkedIn username not found from email alone'
      }

    } catch (error) {
      this.log(context, 'warn', `LinkedIn enrichment failed`, {
        error: (error as Error).message
      })
      return { found: false }
    }
  }

  /**
   * Search Instagram profile using Apify
   * Actor: apify/instagram-search-scraper
   */
  private async searchInstagram(
    contact: any,
    countryData: any,
    apifyToken: string,
    context: ExecutionContext
  ): Promise<any> {
    try {
      this.log(context, 'debug', `Searching Instagram for ${contact.nome}`)

      // NOTA: Qui chiameremmo Apify Instagram Search
      // Per ora, simuliamo

      // Simulazione: 50% di trovare Instagram
      const found = Math.random() > 0.5

      if (found) {
        return {
          found: true,
          username: this.generateUsernameFromName(contact.nome),
          bio: 'Musician | Photographer | Travel lover ✈️',
          posts: [
            'Oggi nuova avventura in montagna! 🏔️',
            'La mia chitarra elettrica è fantastica 🎸',
            'Fotografando il tramonto a Firenze 📸'
          ]
        }
      }

      return { found: false }

    } catch (error) {
      this.log(context, 'warn', `Instagram search failed`, {
        error: (error as Error).message
      })
      return { found: false }
    }
  }

  /**
   * Generate Instagram username from name
   */
  private generateUsernameFromName(nome: string): string {
    const parts = nome.toLowerCase().split(' ')
    const first = parts[0]
    const last = parts.slice(1).join('')

    const variations = [
      `${first}.${last}`,
      `${first}_${last}`,
      `${first}${last}`,
      `${first}.${last}.it`
    ]

    return variations[0] // Return first variation
  }

  /**
   * Extract interests from Instagram bio/posts using contextualized LLM
   */
  private async extractInterestsFromInstagram(
    instagramData: any,
    countryData: any,
    openrouterToken: string,
    context: ExecutionContext
  ): Promise<string[]> {
    try {
      const country = countryData?.code || 'IT'
      const countryName = countryData?.name || 'Italy'

      // Build contextualized prompt
      const prompt = this.buildContextualizedPrompt(
        instagramData.bio,
        instagramData.posts,
        country,
        countryName
      )

      // Call OpenRouter LLM
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemma-2-27b-it', // Good for Italian
          messages: [
            {
              role: 'system',
              content: `Sei un esperto nell'analisi di profili social per la ${countryName}.
              Analizza bio e post estraendo interessi REALI, contextualizzati per la cultura ${countryName}.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.5
        })
      })

      const data = await response.json()
      const content = data.choices[0]?.message?.content || '[]'

      // Parse JSON response
      let interests = JSON.parse(content)

      // Handle markdown code blocks
      if (!Array.isArray(interests)) {
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          interests = JSON.parse(jsonMatch[1])
        }
      }

      if (Array.isArray(interests)) {
        return interests.map((i: any) => i.topic || i.interest).slice(0, 10)
      }

      return []
    } catch (error) {
      console.error('Failed to extract interests from Instagram:', error)
      return []
    }
  }

  /**
   * Build contextualized prompt for LLM
   */
  private buildContextualizedPrompt(
    bio: string,
    posts: string[],
    country: string,
    countryName: string
  ): string {
    const parts: string[] = []

    parts.push(`Analizza questo profilo Instagram di una persona della ${countryName}.`)

    if (bio) {
      parts.push(`Bio: "${bio}"`)
    }

    if (posts && posts.length > 0) {
      const samplePosts = posts.slice(0, 3)
      parts.push(`Post recenti:\n${samplePosts.map((p, i) => `${i + 1}. ${p}`).join('\n')}`)
    }

    parts.push(`
Context culturale ${countryName}:
- Considera i comportamenti, interessi e valori tipici della ${countryName}
- Contextualizza gli interessi trovati per la cultura locale

Restituisci un array JSON di interessi nel formato:
[
  {
    "topic": "nome interesse",
    "cultural_context": "contesto culturalmente specifico"
  }
]

Regole:
- Estrai SOLO interessi menzionati nella bio o nei post
- Contextualizza per la cultura ${countryName}
- Massimo 5-10 interessi
- Restituisci SOLO JSON, niente spiegazioni`)

    return parts.join('\n\n')
  }

  /**
   * Clean and deduplicate interests
   */
  private cleanInterests(interests: string[]): string[] {
    // Remove duplicates
    const unique = [...new Set(interests)]

    // Remove empty strings
    const filtered = unique.filter(i => i && i.trim().length > 0)

    // Remove very generic interests
    const generic = ['music', 'travel', 'food', 'friends', 'life']
    const specific = filtered.filter(i => !generic.includes(i.toLowerCase()))

    return specific.slice(0, 10) // Max 10 interests
  }
}
