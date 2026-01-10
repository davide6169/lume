/**
 * Workflow Engine - Blocks Index
 *
 * Central exports for all workflow blocks
 */

// API Blocks
export {
  ApifyScraperBlock,
  type ApifyScraperConfig
} from './api/apify-scraper.block'

export {
  ApolloEnrichmentBlock,
  type ApolloEnrichmentConfig
} from './api/apollo-enrichment.block'

export {
  HunterEmailFinderBlock,
  HunterEmailVerifierBlock,
  type HunterEmailFinderConfig,
  type HunterEmailVerifierConfig
} from './api/hunter-io.block'

export {
  MixedbreadEmbeddingsBlock,
  type MixedbreadEmbeddingsConfig
} from './api/mixedbread-embeddings.block'

export {
  InstagramSearchBlock,
  type InstagramSearchConfig,
  type InstagramSearchInput,
  type InstagramSearchOutput
} from './api/instagram-search.block'

export {
  LinkedInSearchBlock,
  type LinkedInSearchConfig,
  type LinkedInSearchInput,
  type LinkedInSearchOutput
} from './api/linkedin-search.block'

export {
  FullContactSearchBlock,
  type FullContactSearchConfig,
  type FullContactSearchInput,
  type FullContactSearchOutput
} from './api/fullcontact-search.block'

export {
  PDLSearchBlock,
  type PDLSearchConfig,
  type PDLSearchInput,
  type PDLSearchOutput
} from './api/pdl-search.block'

// AI Blocks
export {
  OpenRouterBlock,
  type OpenRouterConfig
} from './ai/openrouter.block'

export {
  ContactExtractionBlock,
  type ContactExtractionConfig
} from './ai/contact-extraction.block'

export {
  InterestInferenceBlock,
  type InterestInferenceConfig
} from './ai/interest-inference.block'

export {
  LLMMergeInterestsBlock,
  type LLMMergeInterestsConfig,
  type LLMMergeInterestsInput,
  type LLMMergeInterestsOutput
} from './ai/llm-merge-interests.block'

export {
  SentimentAnalysisBlock,
  type SentimentAnalysisConfig
} from './ai/sentiment-analysis.block'

// Filter & Branch Blocks
export {
  FilterBlock,
  type FilterConfig
} from './filter/filter.block'

export {
  HasBioDataFilterBlock,
  type HasBioDataFilterConfig,
  type HasBioDataFilterInput,
  type HasBioDataFilterOutput
} from './filter/has-bio-data.block'

export {
  BranchBlock,
  type BranchConfig
} from './branch/branch.block'

// Input/Output Blocks (already existing)
export {
  StaticInputBlock,
  DatabaseInputBlock
} from './input/static-input.block'

export {
  LoggerOutputBlock
} from './output/logger-output.block'

// Transform Blocks (already existing)
export {
  FieldMappingBlock
} from './transform/field-mapping.block'

export {
  EmailClassifierBlock,
  type EmailClassifierConfig,
  type EmailClassifierInput,
  type EmailClassifierOutput
} from './transform/email-classifier.block'

export {
  ContactNormalizerBlock,
  type ContactNormalizerConfig,
  type ContactNormalizerInput,
  type ContactNormalizerOutput
} from './transform/contact-normalizer.block'

export {
  MergeEnrichmentBlock,
  type MergeEnrichmentConfig,
  type MergeEnrichmentInput
} from './transform/merge-enrichment.block'

// Country Blocks
export {
  CountryConfigBlock,
  COUNTRY_CONFIGS,
  type CountryConfig,
  type CountryConfigInput,
  type CountryConfigOutput
} from './countries/country-config.block'

// Enrichment Blocks
export {
  LeadEnrichmentBlock,
  type LeadEnrichmentInput,
  type LeadEnrichmentConfig,
  type LeadEnrichmentOutput,
  type EnrichedContact
} from './enrichment/lead-enrichment.block'

// CSV Blocks
export {
  CSVInterestEnrichmentBlock,
  type CSVInterestEnrichmentInput,
  type CSVInterestEnrichmentConfig,
  type CSVInterestEnrichmentOutput
} from './csv/csv-interest-enrichment.block'

export {
  CSVParserBlock,
  type CSVParserConfig,
  type CSVParserInput,
  type CSVParserOutput
} from './csv/csv-parser.block'

export {
  CSVAssemblerBlock,
  type CSVAssemblerConfig,
  type CSVAssemblerInput,
  type CSVAssemblerOutput
} from './csv/csv-assembler.block'

/**
 * Register all built-in blocks to the registry
 */
import { registerBlock } from '../registry'

// Import all blocks for registration
import { ApifyScraperBlock } from './api/apify-scraper.block'
import { ApolloEnrichmentBlock } from './api/apollo-enrichment.block'
import { HunterEmailFinderBlock, HunterEmailVerifierBlock } from './api/hunter-io.block'
import { MixedbreadEmbeddingsBlock } from './api/mixedbread-embeddings.block'
import { InstagramSearchBlock } from './api/instagram-search.block'
import { LinkedInSearchBlock } from './api/linkedin-search.block'
import { FullContactSearchBlock } from './api/fullcontact-search.block'
import { PDLSearchBlock } from './api/pdl-search.block'
import { OpenRouterBlock } from './ai/openrouter.block'
import { ContactExtractionBlock } from './ai/contact-extraction.block'
import { InterestInferenceBlock } from './ai/interest-inference.block'
import { LLMMergeInterestsBlock } from './ai/llm-merge-interests.block'
import { SentimentAnalysisBlock } from './ai/sentiment-analysis.block'
import { FilterBlock } from './filter/filter.block'
import { HasBioDataFilterBlock } from './filter/has-bio-data.block'
import { BranchBlock } from './branch/branch.block'
import { EmailClassifierBlock } from './transform/email-classifier.block'
import { ContactNormalizerBlock } from './transform/contact-normalizer.block'
import { MergeEnrichmentBlock } from './transform/merge-enrichment.block'
import { CountryConfigBlock } from './countries/country-config.block'
import { LeadEnrichmentBlock } from './enrichment/lead-enrichment.block'
import { CSVInterestEnrichmentBlock } from './csv/csv-interest-enrichment.block'
import { CSVParserBlock } from './csv/csv-parser.block'
import { CSVAssemblerBlock } from './csv/csv-assembler.block'

export function registerAllBuiltInBlocks(): void {
  // API Blocks
  registerBlock('api.apify', ApifyScraperBlock as any, {
    name: 'Apify Scraper',
    description: 'Scrapes comments from Facebook and Instagram',
    category: 'api',
    version: '1.0.0'
  })

  registerBlock('api.apollo', ApolloEnrichmentBlock as any, {
    name: 'Apollo Enrichment',
    description: 'Enriches contact data using Apollo.io',
    category: 'api',
    version: '1.0.0'
  })

  registerBlock('api.hunter.finder', HunterEmailFinderBlock as any, {
    name: 'Hunter Email Finder',
    description: 'Finds email addresses using Hunter.io',
    category: 'api',
    version: '1.0.0'
  })

  registerBlock('api.hunter.verifier', HunterEmailVerifierBlock as any, {
    name: 'Hunter Email Verifier',
    description: 'Verifies email deliverability using Hunter.io',
    category: 'api',
    version: '1.0.0'
  })

  registerBlock('api.mixedbread', MixedbreadEmbeddingsBlock as any, {
    name: 'Mixedbread Embeddings',
    description: 'Generates vector embeddings using Mixedbread',
    category: 'api',
    version: '1.0.0'
  })

  registerBlock('api.instagramSearch', InstagramSearchBlock as any, {
    name: 'Instagram Search',
    description: 'Search Instagram profiles using Apify. Extracts bio, posts, and profile data. Cost: ~$0.050 per search.',
    category: 'api',
    version: '1.0.0'
  })

  registerBlock('api.linkedinSearch', LinkedInSearchBlock as any, {
    name: 'LinkedIn Search',
    description: 'Search LinkedIn profiles using Apify (supreme_coder actor). Extracts bio, headline, skills. Cost: ~$0.003 per search. NO LinkedIn cookie required.',
    category: 'api',
    version: '1.0.0'
  })

  registerBlock('api.fullcontactSearch', FullContactSearchBlock as any, {
    name: 'FullContact Person Search',
    description: 'Enrich contacts using FullContact API. Finds Instagram, interests, demographics for B2C data. Cost: ~$0.01-0.05 per lookup.',
    category: 'api',
    version: '1.0.0',
    supportsMock: true
  })

  registerBlock('api.pdlSearch', PDLSearchBlock as any, {
    name: 'People Data Labs Person Search',
    description: 'Enrich contacts using PDL API. Finds LinkedIn, skills, experience for B2B data. Use as fallback when FullContact fails. Cost: ~$0.01-0.03 per lookup.',
    category: 'api',
    version: '1.0.0',
    supportsMock: true
  })

  // AI Blocks
  registerBlock('ai.openrouter', OpenRouterBlock as any, {
    name: 'OpenRouter LLM',
    description: 'Generic LLM block using OpenRouter',
    category: 'ai',
    version: '1.0.0'
  })

  registerBlock('ai.contactExtraction', ContactExtractionBlock as any, {
    name: 'AI Contact Extraction',
    description: 'Extracts contacts from unstructured text',
    category: 'ai',
    version: '1.0.0'
  })

  registerBlock('ai.interestInference', InterestInferenceBlock as any, {
    name: 'AI Interest Inference',
    description: 'Infers interests from social media data',
    category: 'ai',
    version: '1.0.0'
  })

  registerBlock('ai.llmMergeInterests', LLMMergeInterestsBlock as any, {
    name: 'AI LLM Merge Interests',
    description: 'Merges interests from FullContact (B2C) and PDL (B2B) using LLM. Performs intelligent deduplication and combines similar items. Cost: ~$0.01 per merge.',
    category: 'ai',
    version: '1.0.0',
    supportsMock: true
  })

  registerBlock('ai.sentimentAnalysis', SentimentAnalysisBlock as any, {
    name: 'AI Sentiment Analysis',
    description: 'Analyzes sentiment of text content',
    category: 'ai',
    version: '1.0.0'
  })

  // Filter & Branch Blocks
  registerBlock('filter', FilterBlock as any, {
    name: 'Filter',
    description: 'Filters data based on conditions',
    category: 'filter',
    version: '1.0.0'
  })

  registerBlock('branch', BranchBlock as any, {
    name: 'Branch',
    description: 'Routes data based on conditions',
    category: 'branch',
    version: '1.0.0'
  })

  registerBlock('filter.hasBioData', HasBioDataFilterBlock as any, {
    name: 'Has Bio Data Filter',
    description: 'Filters contacts that have bio data from LinkedIn or Instagram. Routes contacts with bio to interest inference, others to assembler.',
    category: 'filter',
    version: '1.0.0'
  })

  // Transform Blocks
  registerBlock('transform.emailClassify', EmailClassifierBlock as any, {
    name: 'Email Classifier',
    description: 'Classifies email addresses as business or personal based on domain. Uses configurable personal domains list.',
    category: 'transform',
    version: '1.0.0'
  })

  registerBlock('transform.contactNormalize', ContactNormalizerBlock as any, {
    name: 'Contact Normalizer',
    description: 'Normalizes contact data by extracting name parts, cleaning phone numbers, and standardizing email and date formats.',
    category: 'transform',
    version: '1.0.0'
  })

  registerBlock('transform.mergeEnrichment', MergeEnrichmentBlock as any, {
    name: 'Merge Enrichment Data',
    description: 'Combines enrichment data from FullContact and PDL into unified bio data structure. Prioritizes FullContact (B2C) over PDL (B2B).',
    category: 'transform',
    version: '1.0.0',
    supportsMock: true
  })

  // Country Blocks
  registerBlock('countries.config', CountryConfigBlock as any, {
    name: 'Country Configuration',
    description: 'Automatically detects country and provides country-specific configuration',
    category: 'countries',
    version: '1.0.0'
  })

  // Enrichment Blocks
  registerBlock('enrichment.lead', LeadEnrichmentBlock as any, {
    name: 'Lead Enrichment',
    description: 'Complete lead enrichment workflow combining 3 strategies: Country detection, LinkedIn via Apollo (business emails only), and LLM interest inference',
    category: 'enrichment',
    version: '1.0.0'
  })

  // CSV Blocks
  registerBlock('csv.interestEnrichment', CSVInterestEnrichmentBlock as any, {
    name: 'CSV Interest Enrichment',
    description: 'Enrich CSV with interests field. Adds "interessi" column with comma-separated interests extracted from LinkedIn/Instagram. Empty if no bio data found.',
    category: 'csv',
    version: '1.0.0'
  })

  registerBlock('csv.parser', CSVParserBlock as any, {
    name: 'CSV Parser',
    description: 'Parse CSV string into structured data with headers and rows. Supports configurable delimiter and encoding.',
    category: 'csv',
    version: '1.0.0'
  })

  registerBlock('csv.assembler', CSVAssemblerBlock as any, {
    name: 'CSV Assembler',
    description: 'Assemble final CSV with interests column. Filters out rows without interests. Generates CSV string output.',
    category: 'csv',
    version: '1.0.0'
  })

  console.log('[WorkflowEngine] All built-in blocks registered successfully')
}
