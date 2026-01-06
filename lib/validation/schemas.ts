import { z } from 'zod'

/**
 * Validation schemas for API endpoints
 * Uses Zod for runtime type checking and validation
 */

// ============================================
// Common Schemas
// ============================================

export const uuidSchema = z.string().uuid('Invalid UUID format')

export const emailSchema = z.string().email('Invalid email format')

export const urlSchema = z.string().url('Invalid URL format')

export const nonEmptyStringSchema = z.string().min(1, 'This field is required')

// ============================================
// User Management Schemas
// ============================================

export const updateUserRoleSchema = z.object({
  userId: uuidSchema,
  role: z.enum(['admin', 'user']),
})

export const updateUserStatusSchema = z.object({
  userId: uuidSchema,
  status: z.enum(['pending', 'approved']),
})

export const updateUserSchema = z.discriminatedUnion('field', [
  z.object({
    userId: uuidSchema,
    role: z.enum(['admin', 'user']),
    status: z.undefined().optional(),
  }),
  z.object({
    userId: uuidSchema,
    status: z.enum(['pending', 'approved']),
    role: z.undefined().optional(),
  }),
])

// ============================================
// Settings Schemas
// ============================================

export const saveSettingsSchema = z.object({
  demoMode: z.boolean().optional(),
  logsEnabled: z.boolean().optional(),
  selectedLlmModel: z.string().min(1).optional(),
  selectedEmbeddingModel: z.string().min(1).optional(),
})

// ============================================
// Source Audiences Schemas
// ============================================

export const createSourceAudienceSchema = z.object({
  name: nonEmptyStringSchema.max(100, 'Name must be less than 100 characters'),
  type: z.enum(['facebook', 'instagram']),
  urls: z
    .array(z.string().url('Each URL must be valid'))
    .min(1, 'At least one URL is required')
    .max(50, 'Cannot add more than 50 URLs at once'),
})

export const updateSourceAudienceSchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().max(100).optional(),
  type: z.enum(['facebook', 'instagram']).optional(),
  urls: z.array(z.string().url()).max(50).optional(),
  selected: z.boolean().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
})

// ============================================
// Shared Audiences Schemas
// ============================================

export const createSharedAudienceSchema = z.object({
  name: nonEmptyStringSchema.max(100),
  contacts: z.array(z.any()).min(1, 'At least one contact is required'),
})

export const contactSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: emailSchema,
  phone: z.string().optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  interests: z.array(z.string()).optional(),
})

// ============================================
// Filter Schemas
// ============================================

export const filterRuleSchema = z.object({
  field: z.enum([
    'firstName',
    'lastName',
    'email',
    'phone',
    'city',
    'country',
    'interests',
  ]),
  operator: z.enum([
    'CONTAINS',
    'EQUALS',
    'NOT',
    'STARTS_WITH',
    'ENDS_WITH',
    'GT',
    'LT',
  ]),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
  logicalOperator: z.enum(['AND', 'OR']).default('AND'),
})

export const createFilterSchema = z.object({
  name: nonEmptyStringSchema.max(100),
  rules: z.array(filterRuleSchema).min(1, 'At least one rule is required'),
})

// ============================================
// Job Schemas
// ============================================

export const startSearchSchema = z.object({
  sourceAudienceIds: z.array(uuidSchema).min(1, 'At least one audience is required'),
  sharedAudienceName: nonEmptyStringSchema.max(100),
})

export const jobIdSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
})

// ============================================
// Supabase Config Schemas
// ============================================

export const supabaseConfigSchema = z.object({
  url: z
    .string()
    .min(1, 'Supabase URL is required')
    .url('Invalid URL format')
    .refine((url) => url.startsWith('https://'), {
      message: 'Supabase URL must use HTTPS',
    })
    .refine((url) => !url.includes('your-project'), {
      message: 'Please replace "your-project" with your actual project URL',
    }),
  anonKey: z
    .string()
    .min(1, 'Supabase Anon Key is required')
    .refine((key) => !key.includes('your-anon-key'), {
      message: 'Please replace "your-anon-key" with your actual anon key',
    }),
})

// ============================================
// Helper Functions
// ============================================

/**
 * Validate request body against a schema
 * @returns Object with { data, error } - either data is valid or error contains details
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): {
  data?: T
  error?: {
    message: string
    details: z.ZodError
  }
} {
  try {
    const data = schema.parse(body)
    return { data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: {
          message: 'Validation failed',
          details: error,
        },
      }
    }
    return {
      error: {
        message: 'Unknown validation error',
        details: error as z.ZodError,
      },
    }
  }
}

/**
 * Format Zod error for API response
 */
export function formatZodError(error: z.ZodError): {
  field: string
  message: string
}[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }))
}
