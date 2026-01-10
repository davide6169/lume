/**
 * CSV Interest Enrichment Workflow V3
 *
 * Version 3.2 - FullContact + PDL + LLM Merge (Hybrid)
 *
 * Multi-source enrichment combining B2C (FullContact) and B2B (PDL) data with intelligent LLM merge.
 *
 * Architecture:
 * - FullContact as PRIMARY enrichment (Instagram, personal interests, demographics) - ALWAYS ON
 * - PDL as SECONDARY enrichment (LinkedIn, professional skills, experience) - OPTIONAL (flag)
 * - LLM Merge combines interests from both sources when both available
 * - Intelligent deduplication and prioritization of specific over generic interests
 *
 * Costs (per contact):
 * - FullContact: $0.01-0.05 (always)
 * - PDL: $0.01-0.03 (optional, if enabled)
 * - LLM Merge: $0.01 (only if both FullContact and PDL have data)
 * - TOTAL: $0.01-0.05 (FullContact only)
 * - TOTAL: $0.02-0.08 (FullContact + PDL + LLM Merge)
 *
 * Configuration:
 * - enablePDL: false (default) - Enable PDL secondary enrichment
 * - enableLLMMerge: auto (true if PDL enabled)
 * - Supports mock mode: YES (all blocks support mock)
 */

import type { WorkflowDefinition } from '../types'

export const csvInterestEnrichmentWorkflowV3: WorkflowDefinition = {
  $schema: 'https://lume.ai/workflow-schema.json',
  workflowId: 'csv.interestEnrichment.v3',
  name: 'CSV Interest Enrichment Pipeline V3.2 (FullContact + PDL + LLM Merge)',
  version: '3.2',
  description: 'Multi-source workflow to enrich CSV contacts with interest data from FullContact (primary B2C), PDL (secondary B2B), and intelligent LLM merge of both sources.',
  metadata: {
    author: 'Lume Workflow Engine',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['csv', 'enrichment', 'fullcontact', 'pdl', 'llm', 'interests', 'merge', 'b2c', 'b2b', 'hybrid'],
    version: '3.2',
    costs: {
      perContact: {
        fullcontact: { min: 0.01, max: 0.05 },
        pdl: { min: 0.01, max: 0.03 },
        llmMerge: 0.01,
        total: { min: 0.01, max: 0.08 }
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
      }
    },

    // ========================================
    // LAYER 1: PARALLEL PROCESSING
    // ========================================
    {
      id: 'country-detect',
      type: 'countries.config',
      name: 'Detect Country',
      description: 'Auto-detect country from phone/email',
      config: {
        phoneField: 'celular',
        emailField: 'email',
        fallbackCountry: 'IT'
      }
    },

    {
      id: 'email-classify',
      type: 'transform.emailClassify',
      name: 'Classify Email Type',
      description: 'Classify email as business or personal',
      config: {
        personalDomains: [
          'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
          'libero.it', 'tin.it', 'virgilio.it'
        ],
        emailField: 'email',
        outputField: 'emailType'
      }
    },

    {
      id: 'contact-normalize',
      type: 'transform.contactNormalize',
      name: 'Normalize Contact Data',
      description: 'Normalize names, phones, emails, dates',
      config: {
        nameField: 'nome',
        firstNameField: 'firstName',
        lastNameField: 'lastName',
        phoneField: 'celular',
        emailField: 'email',
        birthDateField: 'nascimento'
      }
    },

    // ========================================
    // LAYER 2: FULLCONTACT ENRICHMENT (PRIMARY)
    // ========================================
    {
      id: 'fullcontact-enrich',
      type: 'api.fullcontactSearch',
      name: 'FullContact Person Enrichment',
      description: 'Primary enrichment via FullContact API - B2C focused (Instagram, interests, demographics)',
      config: {
        apiToken: '{{secrets.fullcontact}}',
        mode: 'live',
        enabled: true
      },
      metadata: {
        costs: { perContact: 0.03 },
        supportsMock: true
      }
    },

    // ========================================
    // LAYER 3: PDL BRANCHING (OPTIONAL)
    // ========================================
    {
      id: 'branch-pdl-enabled',
      type: 'branch',
      name: 'Check if PDL Secondary Enrichment Enabled',
      description: 'Route to PDL if secondary enrichment is enabled via flag',
      config: {
        condition: {
          field: '_enablePDL',
          operator: 'equals',
          value: true
        },
        branches: {
          true: 'pdl-enrich',
          false: 'skip-pdl'
        }
      }
    },

    // ========================================
    // LAYER 4: PDL SECONDARY OR SKIP
    // ========================================
    {
      id: 'pdl-enrich',
      type: 'api.pdlSearch',
      name: 'PDL Person Enrichment (Secondary)',
      description: 'B2B secondary enrichment (LinkedIn, skills, experience) when enabled',
      config: {
        apiToken: '{{secrets.pdl}}',
        mode: 'live',
        enabled: true
      },
      metadata: {
        costs: { perContact: 0.02 },
        supportsMock: true
      }
    },

    {
      id: 'skip-pdl',
      type: 'transform.passThrough',
      name: 'Skip PDL (Not Enabled)',
      description: 'Pass through when PDL secondary enrichment is disabled',
      config: {}
    },

    // ========================================
    // LAYER 5: LLM MERGE (CONDITIONAL)
    // ========================================
    {
      id: 'llm-merge-interests',
      type: 'ai.llmMergeInterests',
      name: 'LLM Merge Interests',
      description: 'Intelligently merge interests from FullContact (B2C) and PDL (B2B) with deduplication',
      config: {
        apiToken: '{{secrets.openrouter}}',
        model: 'google/gemma-2-27b-it:free',
        mode: 'live',
        enabled: true,
        maxInterests: 15,
        temperature: 0.3
      },
      metadata: {
        costs: { perContact: 0.01 },
        supportsMock: true
      }
    },

    {
      id: 'skip-merge',
      type: 'transform.passThrough',
      name: 'Skip Merge (PDL Disabled)',
      description: 'Pass through when PDL is disabled (no merge needed)',
      config: {}
    },

    // ========================================
    // LAYER 6: OUTPUT
    // ========================================
    {
      id: 'csv-assemble',
      type: 'csv.assembler',
      name: 'Assemble CSV Output',
      description: 'Generate final CSV with interests column from FullContact',
      config: {
        addInterestsColumn: true,
        interestsColumnName: 'interessi',
        filterEmpty: true,
        delimiter: ';'
      }
    }
  ],

  edges: [
    // Layer 0 → Layer 1
    { id: 'e1', source: 'csv-parse', target: 'country-detect' },
    { id: 'e2', source: 'csv-parse', target: 'email-classify' },
    { id: 'e3', source: 'csv-parse', target: 'contact-normalize' },

    // Layer 1 → Layer 2 (FullContact)
    { id: 'e4', source: 'email-classify', target: 'fullcontact-enrich' },
    { id: 'e5', source: 'contact-normalize', target: 'fullcontact-enrich' },

    // Layer 2 → Layer 3 (PDL Branch)
    { id: 'e6', source: 'fullcontact-enrich', target: 'branch-pdl-enabled' },

    // Layer 3 → Layer 4 (PDL or Skip)
    { id: 'e7', source: 'branch-pdl-enabled', target: 'pdl-enrich', sourcePort: 'true' },
    { id: 'e8', source: 'branch-pdl-enabled', target: 'skip-pdl', sourcePort: 'false' },

    // Layer 4 → Layer 5 (LLM Merge or Skip)
    { id: 'e9', source: 'pdl-enrich', target: 'llm-merge-interests' },
    { id: 'e10', source: 'skip-pdl', target: 'skip-merge' },

    // Layer 5 → Layer 6 (Output)
    { id: 'e11', source: 'llm-merge-interests', target: 'csv-assemble' },
    { id: 'e12', source: 'skip-merge', target: 'csv-assemble' }
  ],

  globals: {
    timeout: 3600,
    retryPolicy: {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 2
    },
    errorHandling: 'continue',
    maxParallelNodes: 3,

    // PDL Secondary Enrichment Configuration
    enablePDL: false, // default: OFF - enable to add B2B data from PDL

    enrichment: {
      primary: 'fullcontact', // B2C interests (always ON)
      secondary: 'pdl', // B2B skills (optional)
      secondaryEnabled: false, // default: OFF
      mergeStrategy: 'llm-dedupe-prioritize' // LLM merge when both sources available
    },

    costLimits: {
      maxCostPerContact: 0.08,
      maxTotalCost: 100.00,
      warnAt: 0.80,
      breakdown: {
        fullcontact: '0.01-0.05 (always)',
        pdl: '0.01-0.03 (if enabled)',
        llmMerge: '0.01 (if both sources have data)'
      }
    },

    // Mock validation
    mockMode: {
      enabled: false,
      validateAllBlocksSupportMock: true
    }
  }
}
