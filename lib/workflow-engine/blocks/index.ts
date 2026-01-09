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
  SentimentAnalysisBlock,
  type SentimentAnalysisConfig
} from './ai/sentiment-analysis.block'

// Filter & Branch Blocks
export {
  FilterBlock,
  type FilterConfig
} from './filter/filter.block'

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

/**
 * Register all built-in blocks to the registry
 */
import { registerBlock } from '../registry'

// Import all blocks for registration
import { ApifyScraperBlock } from './api/apify-scraper.block'
import { ApolloEnrichmentBlock } from './api/apollo-enrichment.block'
import { HunterEmailFinderBlock, HunterEmailVerifierBlock } from './api/hunter-io.block'
import { MixedbreadEmbeddingsBlock } from './api/mixedbread-embeddings.block'
import { OpenRouterBlock } from './ai/openrouter.block'
import { ContactExtractionBlock } from './ai/contact-extraction.block'
import { InterestInferenceBlock } from './ai/interest-inference.block'
import { SentimentAnalysisBlock } from './ai/sentiment-analysis.block'
import { FilterBlock } from './filter/filter.block'
import { BranchBlock } from './branch/branch.block'

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

  console.log('[WorkflowEngine] All built-in blocks registered successfully')
}
