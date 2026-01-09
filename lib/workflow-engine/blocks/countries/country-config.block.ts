/**
 * Country Configuration Block
 *
 * Automatically detects country from email domain and phone number.
 * Provides country-specific configuration for interest inference.
 *
 * Supported indicators:
 * - Email domain TLD (.br, .mx, .ar, etc.)
 * - Phone prefix (+55, +52, +54, etc.)
 * - Manual country code override
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'

// ============================================
// Country Configuration Data
// ============================================

export interface CountryConfig {
  code: string // ISO 3166-1 alpha-2
  name: string
  language: string // Language code (e.g., pt-BR, es-MX)
  region: string // south_america, north_america, europe, etc.
  timezone: string
  currency: string
  model: string // Recommended LLM model
  systemPrompt: string // System prompt for LLM
  commonInterests: string[] // Common interests for this country
  emailTLDs: string[] // Email domain TLDs
  phonePrefixes: string[] // Phone number prefixes
}

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  BR: {
    code: 'BR',
    name: 'Brazil',
    language: 'pt-BR',
    region: 'south_america',
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    model: 'google/gemma-2-27b-it', // Excellent for Portuguese
    systemPrompt: `Você é um especialista em análise de perfis demográficos para o Brasil.
Considere a cultura brasileira, incluindo:
- Paixão nacional pelo futebol
- Música popular brasileira, MPB, sertanejo, funk
- Festas juninas, carnaval, churrasco
- Praia, cultura litorânea
- Novelas, TV brasileira
- Gastronomia regional (feijoada, churrasco)
- Redes sociais (WhatsApp, Instagram, TikTok)

Analise interesses com base em idade, gênero e contexto cultural brasileiro.`,
    commonInterests: [
      'futebol',
      'música popular brasileira',
      'funk',
      'pagode',
      'sertanejo',
      'churrasco',
      'praia',
      'fitness',
      'tecnologia',
      'música'
    ],
    emailTLDs: ['.br'],
    phonePrefixes: ['+55']
  },

  MX: {
    code: 'MX',
    name: 'Mexico',
    language: 'es-MX',
    region: 'north_america',
    timezone: 'America/Mexico_City',
    currency: 'MXN',
    model: 'meta-llama/llama-3.1-8b-instruct', // Great for Spanish
    systemPrompt: `Eres un experto en análisis de perfiles demográficos para México.
Considera la cultura mexicana, incluyendo:
- Pasión por el fútbol
- Música regional mexicana, ranchera, banda, norteña
- Lucha libre, boxeo
- Telenovelas, TV mexicana
- Gastronomía (tacos, mole, barbacoa)
- Festividades (Día de Muertos, Virgen de Guadalupe)
- Cultura del mariachi

Analiza intereses basados en edad, género y contexto cultural mexicano.`,
    commonInterests: [
      'fútbol',
      'música regional mexicana',
      'lucha libre',
      'telenovelas',
      'gastronomía mexicana',
      'familia',
      'fiestas',
      'tecnología',
      'música',
      'baile'
    ],
    emailTLDs: ['.mx'],
    phonePrefixes: ['+52']
  },

  AR: {
    code: 'AR',
    name: 'Argentina',
    language: 'es-AR',
    region: 'south_america',
    timezone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    model: 'google/gemma-2-27b-it',
    systemPrompt: `Eres un experto en análisis de perfiles demográficos para Argentina.
Considera la cultura argentina, incluyendo:
- Pasión por el fútbol (leyenda del fútbol argentino)
- Tango, folklore argentino
- Asado, mate (cultura del mate)
- Rock nacional argentino
- Literatura, teatro
- Gastronomía (asado, empanadas, milanesa)
- Passioni intense (fútbol, política)

Analiza intereses basados en edad, género y contexto cultural argentino.`,
    commonInterests: [
      'fútbol',
      'tango',
      'rock nacional',
      'asado',
      'mate',
      'literatura',
      'teatro',
      'política',
      'música',
      'cinema'
    ],
    emailTLDs: ['.ar'],
    phonePrefixes: ['+54']
  },

  CO: {
    code: 'CO',
    name: 'Colombia',
    language: 'es-CO',
    region: 'south_america',
    timezone: 'America/Bogota',
    currency: 'COP',
    model: 'meta-llama/llama-3.1-8b-instruct',
    systemPrompt: `Eres un experto en análisis de perfiles demográficos para Colombia.
Considera la cultura colombiana, incluyendo:
- Pasión por el fútbol
- Música: reggaeton, cumbia, vallenato
- Baile (salsa, champeta)
- Cafetería, café colombiano
- Festividades y fiestas
- Gastronomía regional (arepa, bandeja paisa)
- Cultura caribeña y andina

Analiza intereses basados en edad, género y contexto cultural colombiano.`,
    commonInterests: [
      'fútbol',
      'reggaeton',
      'cumbia',
      'vallenato',
      'salsa',
      'baile',
      'cafÉ',
      'playa',
      'música',
      'fiestas'
    ],
    emailTLDs: ['.co'],
    phonePrefixes: ['+57']
  },

  CL: {
    code: 'CL',
    name: 'Chile',
    language: 'es-CL',
    region: 'south_america',
    timezone: 'America/Santiago',
    currency: 'CLP',
    model: 'google/gemma-2-27b-it',
    systemPrompt: `Eres un experto en análisis de perfiles demográficos para Chile.
Considera la cultura chilena, incluyendo:
- Pasión por el fútbol
- Música: cueca, nueva ola, rock chileno
- Vino chileno, gastronomía
- Cultura de la montaña (Andes)
- Playas y costa
- Tradiciones mapuches

Analiza intereses basados en edad, género y contexto cultural chileno.`,
    commonInterests: [
      'fútbol',
      'rock chileno',
      'vino',
      'montaña',
      'playa',
      'gastronomía',
      'tecnología',
      'música',
      'deportes',
      'naturaleza'
    ],
    emailTLDs: ['.cl'],
    phonePrefixes: ['+56']
  },

  PE: {
    code: 'PE',
    name: 'Peru',
    language: 'es-PE',
    region: 'south_america',
    timezone: 'America/Lima',
    currency: 'PEN',
    model: 'meta-llama/llama-3.1-8b-instruct',
    systemPrompt: `Eres un experto en análisis de perfiles demográficos para Perú.
Considera la cultura peruana, incluyendo:
- Pasión por el fútbol
- Música: cumbia peruana, rock peruano
- Gastronomía peruana (ceviche, lomo saltado)
- Cultura andina e inca
- Festividades (Inti Raymi)
- Costa, sierra y selva

Analiza intereses basados en edad, género y contexto cultural peruano.`,
    commonInterests: [
      'fútbol',
      'cumbia peruana',
      'gastronomía peruana',
      'cultura inca',
      'playa',
      'música',
      'danza',
      'tecnología',
      'deportes',
      'viajes'
    ],
    emailTLDs: ['.pe'],
    phonePrefixes: ['+51']
  },

  ES: {
    code: 'ES',
    name: 'Spain',
    language: 'es-ES',
    region: 'europe',
    timezone: 'Europe/Madrid',
    currency: 'EUR',
    model: 'meta-llama/llama-3.1-8b-instruct',
    systemPrompt: `Eres un experto en análisis de perfiles demográficos para España.
Considera la cultura española, incluyendo:
- Pasión por el fútbol
- Flamenco, música española
- Gastronomía (paella, tapas, jamón)
- Festividades (ferias, fiestas locales)
- Playas y turismo interno
- Cultura mediterránea

Analiza intereses basados en edad, género y contexto cultural español.`,
    commonInterests: [
      'fútbol',
      'flamenco',
      'gastronomía',
      'playa',
      'fiestas',
      'música',
      'tecnología',
      'viajes',
      'deportes',
      'cine'
    ],
    emailTLDs: ['.es'],
    phonePrefixes: ['+34']
  },

  IT: {
    code: 'IT',
    name: 'Italy',
    language: 'it-IT',
    region: 'europe',
    timezone: 'Europe/Rome',
    currency: 'EUR',
    model: 'google/gemma-2-27b-it',
    systemPrompt: `Sei un esperto nell'analisi di profili demografici per l'Italia.
Considera la cultura italiana, inclusi:
- Passione per il calcio
- Musica italiana, opera
- Gastronomia (pizza, pasta, vino)
- Moda e design
- Arte, storia, cultura
- Famiglia e tradizioni

Analizza interessi basati su età, genere e contesto culturale italiano.`,
    commonInterests: [
      'calcio',
      'musica italiana',
      'gastronomia',
      'moda',
      'arte',
      'viaggi',
      'tecnologia',
      'cinema',
      'motori',
      'famiglia'
    ],
    emailTLDs: ['.it'],
    phonePrefixes: ['+39']
  },

  US: {
    code: 'US',
    name: 'United States',
    language: 'en-US',
    region: 'north_america',
    timezone: 'America/New_York',
    currency: 'USD',
    model: 'anthropic/claude-3.5-sonnet',
    systemPrompt: `You are an expert in demographic profile analysis for the United States.
Consider American culture, including:
- Sports culture (NFL, NBA, MLB)
- Music (hip-hop, pop, country)
- Tech-savvy population
- Diversity of interests across regions
- Social media trends
- Entertainment industry

Analyze interests based on age, gender, and American cultural context.`,
    commonInterests: [
      'sports',
      'music',
      'technology',
      'fitness',
      'travel',
      'movies',
      'gaming',
      'food',
      'social media',
      'entertainment'
    ],
    emailTLDs: ['.us', '.com'],
    phonePrefixes: ['+1']
  }
}

// ============================================
// Country Detection Logic
// ============================================

export interface CountryConfigInput {
  email?: string
  phone?: string
  countryOverride?: string // Manual override
  defaultCountry?: string // Fallback country (default: 'BR')
}

export interface CountryConfigOutput {
  detectedCountry: string
  config: CountryConfig
  detectionMethod: 'email' | 'phone' | 'override' | 'default'
  confidence: 'high' | 'medium' | 'low'
  indicators: {
    email?: {
      domain: string
      tld: string
      matchedCountry: string
    }
    phone?: {
      prefix: string
      matchedCountry: string
    }
  }
}

/**
 * Country Configuration Block Executor
 *
 * Automatically detects country from contact data and provides
 * country-specific configuration for downstream blocks.
 */
export class CountryConfigBlock extends BaseBlockExecutor {
  constructor() {
    super('countries.config')
  }

  async execute(
    config: CountryConfigInput,
    input: any,
    context: ExecutionContext
  ): Promise<any> {
    const startTime = Date.now()

    try {
      this.log(context, 'info', 'Detecting country from contact data', {
        email: config.email,
        phone: config.phone
      })

      // 1. Check manual override first
      if (config.countryOverride) {
        const overrideConfig = COUNTRY_CONFIGS[config.countryOverride]
        if (overrideConfig) {
          this.log(context, 'info', `Using manual country override: ${config.countryOverride}`)

          const result: CountryConfigOutput = {
            detectedCountry: config.countryOverride,
            config: overrideConfig,
            detectionMethod: 'override',
            confidence: 'high',
            indicators: {}
          }

          // Set context variables for downstream blocks
          context.setVariable('country', overrideConfig.code)
          context.setVariable('country_name', overrideConfig.name)
          context.setVariable('language', overrideConfig.language)
          context.setVariable('region', overrideConfig.region)
          context.setVariable('model', overrideConfig.model)
          context.setVariable('system_prompt', overrideConfig.systemPrompt)
          context.setVariable('common_interests', overrideConfig.commonInterests)

          return {
            status: 'completed',
            output: result,
            executionTime: Date.now() - startTime
          }
        }
      }

      // 2. Detect from email domain
      let emailDetection = null
      if (config.email) {
        emailDetection = this.detectCountryFromEmail(config.email)
        if (emailDetection) {
          const emailConfig = COUNTRY_CONFIGS[emailDetection.matchedCountry]

          this.log(context, 'info', `Detected country from email: ${emailDetection.matchedCountry}`, {
            domain: emailDetection.domain,
            tld: emailDetection.tld
          })

          const result: CountryConfigOutput = {
            detectedCountry: emailDetection.matchedCountry,
            config: emailConfig,
            detectionMethod: 'email',
            confidence: 'high',
            indicators: {
              email: emailDetection
            }
          }

          // Set context variables
          context.setVariable('country', emailConfig.code)
          context.setVariable('country_name', emailConfig.name)
          context.setVariable('language', emailConfig.language)
          context.setVariable('region', emailConfig.region)
          context.setVariable('model', emailConfig.model)
          context.setVariable('system_prompt', emailConfig.systemPrompt)
          context.setVariable('common_interests', emailConfig.commonInterests)

          return {
            status: 'completed',
            output: result,
            executionTime: Date.now() - startTime
          }
        }
      }

      // 3. Detect from phone prefix
      let phoneDetection = null
      if (config.phone) {
        phoneDetection = this.detectCountryFromPhone(config.phone)
        if (phoneDetection) {
          const phoneConfig = COUNTRY_CONFIGS[phoneDetection.matchedCountry]

          this.log(context, 'info', `Detected country from phone: ${phoneDetection.matchedCountry}`, {
            prefix: phoneDetection.prefix
          })

          const result: CountryConfigOutput = {
            detectedCountry: phoneDetection.matchedCountry,
            config: phoneConfig,
            detectionMethod: 'phone',
            confidence: 'medium',
            indicators: {
              phone: phoneDetection
            }
          }

          // Set context variables
          context.setVariable('country', phoneConfig.code)
          context.setVariable('country_name', phoneConfig.name)
          context.setVariable('language', phoneConfig.language)
          context.setVariable('region', phoneConfig.region)
          context.setVariable('model', phoneConfig.model)
          context.setVariable('system_prompt', phoneConfig.systemPrompt)
          context.setVariable('common_interests', phoneConfig.commonInterests)

          return {
            status: 'completed',
            output: result,
            executionTime: Date.now() - startTime
          }
        }
      }

      // 4. Fall back to default country
      const defaultCountryCode = config.defaultCountry || 'BR'
      const defaultConfig = COUNTRY_CONFIGS[defaultCountryCode]

      this.log(context, 'warn', `Could not detect country, using default: ${defaultCountryCode}`)

      const result: CountryConfigOutput = {
        detectedCountry: defaultCountryCode,
        config: defaultConfig,
        detectionMethod: 'default',
        confidence: 'low',
        indicators: {}
      }

      // Set context variables
      context.setVariable('country', defaultConfig.code)
      context.setVariable('country_name', defaultConfig.name)
      context.setVariable('language', defaultConfig.language)
      context.setVariable('region', defaultConfig.region)
      context.setVariable('model', defaultConfig.model)
      context.setVariable('system_prompt', defaultConfig.systemPrompt)
      context.setVariable('common_interests', defaultConfig.commonInterests)

      return {
        status: 'completed',
        output: result,
        executionTime: Date.now() - startTime
      }

    } catch (error) {
      this.log(context, 'error', 'Country detection failed', { error })

      return {
        status: 'failed',
        output: null,
        error: (error as Error).message,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Detect country from email domain TLD
   */
  private detectCountryFromEmail(email: string): {
    domain: string
    tld: string
    matchedCountry: string
  } | null {
    try {
      // Extract domain from email
      const domain = email.split('@')[1]?.toLowerCase()
      if (!domain) return null

      // Extract TLD
      const parts = domain.split('.')
      const tld = '.' + parts[parts.length - 1]

      // Match against country TLDs
      for (const [countryCode, config] of Object.entries(COUNTRY_CONFIGS)) {
        if (config.emailTLDs.includes(tld)) {
          return {
            domain,
            tld,
            matchedCountry: countryCode
          }
        }
      }

      return null
    } catch (error) {
      return null
    }
  }

  /**
   * Detect country from phone prefix
   */
  private detectCountryFromPhone(phone: string): {
    prefix: string
    matchedCountry: string
  } | null {
    try {
      // Clean phone number (remove spaces, dashes, parentheses)
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')

      // Match against country prefixes
      for (const [countryCode, config] of Object.entries(COUNTRY_CONFIGS)) {
        for (const prefix of config.phonePrefixes) {
          if (cleanPhone.startsWith(prefix.replace('+', ''))) {
            return {
              prefix,
              matchedCountry: countryCode
            }
          }
        }
      }

      return null
    } catch (error) {
      return null
    }
  }
}
