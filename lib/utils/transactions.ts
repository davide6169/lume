/**
 * Transaction utilities for multi-step database operations
 * Implements compensating transaction pattern for Supabase
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface TransactionStep<T = any> {
  name: string
  execute: () => Promise<T>
  rollback?: (result: T) => Promise<void> | void
}

export interface TransactionResult<T> {
  success: boolean
  data: T | null
  error: string | null
  stepsCompleted: string[]
  stepsRolledBack: string[]
}

/**
 * Execute multiple steps in a transaction with rollback support
 * If any step fails, all previous steps are rolled back
 *
 * @param steps - Array of transaction steps with execute and rollback functions
 * @param supabase - Supabase client instance
 * @returns Transaction result with data, error, and execution details
 */
export async function executeTransaction<T = any>(
  steps: TransactionStep[],
  supabase: SupabaseClient
): Promise<TransactionResult<T>> {
  const results: any[] = []
  const stepsCompleted: string[] = []
  const stepsRolledBack: string[] = []

  try {
    // Execute all steps
    for (const step of steps) {
      console.log(`[Transaction] Executing step: ${step.name}`)
      const result = await step.execute()
      results.push(result)
      stepsCompleted.push(step.name)
      console.log(`[Transaction] Step completed: ${step.name}`)
    }

    // All steps completed successfully
    return {
      success: true,
      data: results as T,
      error: null,
      stepsCompleted,
      stepsRolledBack,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Transaction] Step failed: ${errorMessage}`)
    console.error(`[Transaction] Rolling back ${stepsCompleted.length} steps...`)

    // Rollback all completed steps in reverse order
    for (let i = stepsCompleted.length - 1; i >= 0; i--) {
      const stepName = stepsCompleted[i]
      const step = steps.find(s => s.name === stepName)

      if (step?.rollback) {
        try {
          console.log(`[Transaction] Rolling back step: ${stepName}`)
          await step.rollback(results[i])
          stepsRolledBack.push(stepName)
        } catch (rollbackError) {
          console.error(`[Transaction] Rollback failed for ${stepName}:`, rollbackError)
          // Continue rolling back other steps even if one fails
        }
      }
    }

    return {
      success: false,
      data: null,
      error: errorMessage,
      stepsCompleted,
      stepsRolledBack,
    }
  }
}

/**
 * Create a source audience with cost tracking in a transaction
 */
export async function createSourceAudienceWithCost(
  supabase: SupabaseClient,
  userId: string,
  audienceData: {
    name: string
    type: 'facebook' | 'instagram'
    urls: string[]
  }
) {
  return executeTransaction(
    [
      {
        name: 'create_source_audience',
        execute: async () => {
          const { data, error } = await supabase
            .from('source_audiences')
            .insert({
              user_id: userId,
              name: audienceData.name,
              type: audienceData.type,
              urls: audienceData.urls,
              status: 'pending',
            })
            .select()
            .single()

          if (error) throw error
          return data
        },
        rollback: async (result) => {
          await supabase
            .from('source_audiences')
            .delete()
            .eq('id', result.id)
        },
      },
    ],
    supabase
  )
}

/**
 * Update user settings with validation in a transaction
 */
export async function updateUserSettings(
  supabase: SupabaseClient,
  userId: string,
  settings: {
    demoMode?: boolean
    logsEnabled?: boolean
  }
) {
  return executeTransaction(
    [
      {
        name: 'update_settings',
        execute: async () => {
          const { data, error } = await supabase
            .from('settings')
            .upsert({
              user_id: userId,
              demo_mode: settings.demoMode,
              logs_enabled: settings.logsEnabled,
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (error) throw error
          return data
        },
        // No rollback needed for upsert (idempotent)
        rollback: async () => {},
      },
    ],
    supabase
  )
}

/**
 * Approve user and update their status in a transaction
 */
export async function approveUser(
  supabase: SupabaseClient,
  userId: string
) {
  return executeTransaction(
    [
      {
        name: 'update_user_status',
        execute: async () => {
          const { data, error } = await supabase
            .from('profiles')
            .update({ status: 'approved' })
            .eq('id', userId)
            .select()
            .single()

          if (error) throw error
          return data
        },
        rollback: async (originalData) => {
          // Revert to pending status
          await supabase
            .from('profiles')
            .update({ status: 'pending' })
            .eq('id', userId)
        },
      },
    ],
    supabase
  )
}

/**
 * Update user role with validation in a transaction
 */
export async function updateUserRole(
  supabase: SupabaseClient,
  userId: string,
  newRole: 'admin' | 'user'
) {
  // First, get the current role
  const { data: currentUser, error: fetchError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (fetchError) throw fetchError
  const previousRole = currentUser.role

  return executeTransaction(
    [
      {
        name: 'update_role',
        execute: async () => {
          const { data, error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId)
            .select()
            .single()

          if (error) throw error
          return { previousRole, newRole, data }
        },
        rollback: async (result) => {
          // Revert to previous role
          await supabase
            .from('profiles')
            .update({ role: result.previousRole })
            .eq('id', userId)
        },
      },
    ],
    supabase
  )
}
