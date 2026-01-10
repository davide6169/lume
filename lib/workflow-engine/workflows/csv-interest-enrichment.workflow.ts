/**
 * CSV Interest Enrichment Workflow Definition
 *
 * Workflow-based architecture for CSV enrichment with social media data + AI.
 *
 * Version: 2.0 (Workflow-based, replacing monolithic block)
 *
 * Architecture:
 * - Decomposed into multiple reusable blocks
 * - Parallel processing where possible
 * - Graceful error handling (continue on individual failures)
 * - Cost tracking and optimization
 *
 * Costs (per contact):
 * - Country Detection: $0.000 (free)
 * - Email Classification: $0.000 (free)
 * - LinkedIn (Apify): $0.003 (business emails only)
 * - Instagram (Apify): $0.050
 * - Interest Inference (LLM): $0.010
 * - TOTAL: ~$0.063 worst case
 */

import type { WorkflowDefinition } from '../types'

export const csvInterestEnrichmentWorkflow: WorkflowDefinition = {
  $schema: 'https://lume.ai/workflow-schema.json',
  workflowId: 'csv.interestEnrichment',
  name: 'CSV Interest Enrichment Pipeline',
  version: 2,
  description: 'Multi-stage workflow to enrich CSV contacts with interest data from social platforms. Uses Apify for LinkedIn/Instagram and OpenRouter LLM for interest extraction.',
  metadata: {
    author: 'Lume Workflow Engine',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['csv', 'enrichment', 'instagram', 'linkedin', 'ai', 'interests', 'apify', 'openrouter'],
    version: 2,
    costs: {
      perContact: {
        linkedin: 0.003,
        instagram: 0.050,
        llm: 0.010,
        total: 0.063
      }
    }
  },
  nodes: [
    // ========================================
    // LAYER 0: INPUT
    // ========================================
    {
      id: 'csv-parse',
      type: 'csv.parser',
      name: 'Parse CSV Input',
      description: 'Parse raw CSV string into structured data',
      config: {
        delimiter: ';',
        hasHeader: true,
        skipEmpty: true,
        trimWhitespace: true
      },
      inputSchema: {
        type: 'object',
        required: ['csv'],
        properties: {
          csv: { type: 'string', description: 'Raw CSV content' }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          headers: { type: 'array', items: { type: 'string' } },
          rows: { type: 'array', items: { type: 'object' } }
        }
      }
    },

    // ========================================
    // LAYER 1: PARALLEL PROCESSING
    // ========================================
    {
      id: 'country-detect',
      type: 'countries.config',
      name: 'Detect Country',
      description: 'Auto-detect country from phone number with fallback',
      config: {
        phoneField: 'celular',
        emailField: 'email',
        fallbackCountry: 'IT'
      },
      inputSchema: { type: 'array' },
      outputSchema: { type: 'array' }
    },

    {
      id: 'email-classify',
      type: 'transform.emailClassify',
      name: 'Classify Email Type',
      description: 'Classify email as business or personal',
      config: {
        personalDomains: [
          'gmail.com', 'gmail.com.br', 'gmail.com.mx', 'gmail.com.ar',
          'yahoo.com', 'yahoo.com.br', 'yahoo.com.mx', 'yahoo.com.ar',
          'hotmail.com', 'hotmail.com.br', 'hotmail.com.mx', 'outlook.com',
          'libero.it', 'tin.it', 'virgilio.it', 'alice.it'
        ]
      },
      inputSchema: { type: 'array' },
      outputSchema: { type: 'array' }
    },

    // ========================================
    // LAYER 2: BRANCHING
    // ========================================
    {
      id: 'branch-email-type',
      type: 'branch',
      name: 'Branch by Email Type',
      description: 'Route business emails to LinkedIn enrichment',
      config: {
        condition: {
          field: 'emailType',
          operator: 'equals',
          value: 'business'
        },
        branches: {
          true: 'linkedin-search',
          false: 'skip-linkedin'
        }
      },
      inputSchema: { type: 'array' },
      outputSchema: { type: 'array' }
    },

    // ========================================
    // LAYER 3: SOCIAL PLATFORM LOOKUP
    // ========================================
    {
      id: 'linkedin-search',
      type: 'api.linkedinSearch',
      name: 'LinkedIn Enrichment (Apify)',
      description: 'Search LinkedIn profile using Apify - business emails only',
      config: {
        apiToken: '{{secrets.apify}}',
        actor: 'supreme_coder/linkedin-profile-scraper',
        mode: 'live',
        maxResults: 1
      },
      inputSchema: { type: 'array' },
      outputSchema: { type: 'array' },
      metadata: {
        costs: { perContact: 0.003 },
        apifyActor: 'supreme_coder/linkedin-profile-scraper',
        notes: 'NO LinkedIn cookie required - $3/1000 profiles'
      }
    },

    {
      id: 'skip-linkedin',
      type: 'transform.passThrough',
      name: 'Skip LinkedIn (Personal Email)',
      description: 'Pass through for personal email addresses',
      config: {},
      inputSchema: { type: 'array' },
      outputSchema: { type: 'array' }
    },

    {
      id: 'instagram-search',
      type: 'api.instagramSearch',
      name: 'Instagram Profile Search (Apify)',
      description: 'Search Instagram profile and extract bio/posts',
      config: {
        apiToken: '{{secrets.apify}}',
        actor: 'apify/instagram-scraper',
        mode: 'live',
        maxResults: 10,
        includePosts: true,
        maxPosts: 12
      },
      inputSchema: { type: 'array' },
      outputSchema: { type: 'array' },
      metadata: {
        costs: { perContact: 0.050 },
        apifyActor: 'apify/instagram-scraper'
      }
    },

    // ========================================
    // LAYER 4: FILTER
    // ========================================
    {
      id: 'has-bio-data',
      type: 'filter.hasBioData',
      name: 'Has Bio Data?',
      description: 'Filter contacts with bio data from LinkedIn or Instagram',
      config: {
        requireBio: true,
        requirePosts: false,
        minPostCount: 1
      },
      inputSchema: { type: 'array' },
      outputSchema: { type: 'array' }
    },

    // ========================================
    // LAYER 5: AI PROCESSING
    // ========================================
    {
      id: 'interest-inference',
      type: 'ai.interestInference',
      name: 'Extract Interests (LLM)',
      description: 'Extract interests using country-contextualized LLM',
      config: {
        apiToken: '{{secrets.openrouter}}',
        model: 'google/gemma-2-27b-it',
        maxInterests: 10,
        temperature: 0.5,
        mode: 'live'
      },
      inputSchema: { type: 'array' },
      outputSchema: { type: 'array' },
      metadata: {
        costs: { perContact: 0.010 },
        model: 'google/gemma-2-27b-it',
        provider: 'OpenRouter'
      }
    },

    // ========================================
    // LAYER 6: OUTPUT
    // ========================================
    {
      id: 'csv-assemble',
      type: 'csv.assembler',
      name: 'Assemble CSV Output',
      description: 'Assemble final CSV with interests column',
      config: {
        addInterestsColumn: true,
        interestsColumnName: 'interessi',
        filterEmpty: true,
        delimiter: ';'
      },
      inputSchema: {
        type: 'object',
        required: ['rows'],
        properties: {
          rows: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                original: { type: 'object' },
                interests: { oneOf: [{ type: 'array' }, { type: 'string' }] }
              }
            }
          }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          csv: {
            type: 'object',
            properties: {
              headers: { type: 'array' },
              rows: { type: 'array' },
              csvString: { type: 'string' }
            }
          }
        }
      }
    }
  ],

  edges: [
    // Layer 0 → Layer 1
    { id: 'e1', source: 'csv-parse', target: 'country-detect' },
    { id: 'e2', source: 'csv-parse', target: 'email-classify' },

    // Layer 1 → Layer 2
    { id: 'e3', source: 'email-classify', target: 'branch-email-type' },

    // Layer 2 → Layer 3 (Branch)
    { id: 'e4', source: 'branch-email-type', target: 'linkedin-search', sourcePort: 'true' },
    { id: 'e5', source: 'branch-email-type', target: 'skip-linkedin', sourcePort: 'false' },

    // Layer 3 → Layer 4 (Merge both paths)
    { id: 'e6', source: 'linkedin-search', target: 'instagram-search' },
    { id: 'e7', source: 'skip-linkedin', target: 'instagram-search' },

    // Layer 4 → Layer 5
    { id: 'e8', source: 'instagram-search', target: 'has-bio-data' },

    // Layer 5 → Layer 6 (Filter)
    { id: 'e9', source: 'has-bio-data', target: 'interest-inference', sourcePort: 'true' },

    // Layer 6 → Layer 7 (Output)
    { id: 'e10', source: 'interest-inference', target: 'csv-assemble' },
    { id: 'e11', source: 'has-bio-data', target: 'csv-assemble', sourcePort: 'false' }
  ],

  globals: {
    timeout: 3600, // 1 hour max for entire workflow
    retryPolicy: {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 2
    },
    errorHandling: 'continue', // Continue on individual contact failures
    maxParallelNodes: 3, // Max 3 blocks can run in parallel
    costLimits: {
      maxCostPerContact: 0.10, // Stop at $0.10 per contact
      maxTotalCost: 100.00, // Stop at $100 total
      warnAt: 0.80 // Warn at 80% of budget
    }
  }
}
