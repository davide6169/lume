import { createSupabaseServerClient, createSupabaseServiceClient } from './server'
import type {
  Profile,
  SourceAudience,
  SharedAudience,
  Contact,
  Filter,
  UserSettings,
  ServiceCost,
  LogEntry,
} from '@/types'

// ============================================
// Profile Queries
// ============================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

export async function ensureProfileExists(
  userId: string,
  email?: string
): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient()

  // First, try to get existing profile
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (existingProfile) {
    return existingProfile
  }

  // Profile doesn't exist, create it using service role client (bypasses RLS)
  console.log('Profile not found, creating new profile for user:', userId)

  const serviceSupabase = await createSupabaseServiceClient()

  // Check if this will be the first user
  const { count: existingCount } = await serviceSupabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const isFirstUser = existingCount === 0

  const { data, error } = await serviceSupabase
    .from('profiles')
    .insert({
      id: userId,
      email: email || '',
      full_name: '',
      role: isFirstUser ? 'admin' : 'user',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating profile:', error)
    return null
  }

  if (isFirstUser) {
    console.log('First user created as admin:', userId)
  }

  return data
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }

  return data
}

// ============================================
// Source Audience Queries
// ============================================

export async function getSourceAudiences(
  userId: string
): Promise<SourceAudience[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('source_audiences')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching source audiences:', error)
    return []
  }

  return data
}

export async function createSourceAudience(
  sourceAudience: Omit<SourceAudience, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SourceAudience | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('source_audiences')
    .insert({
      ...sourceAudience,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating source audience:', error)
    return null
  }

  return data
}

export async function updateSourceAudience(
  id: string,
  updates: Partial<SourceAudience>
): Promise<SourceAudience | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('source_audiences')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating source audience:', error)
    return null
  }

  return data
}

export async function deleteSourceAudiences(
  ids: string[]
): Promise<boolean> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('source_audiences')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Error deleting source audiences:', error)
    return false
  }

  return true
}

// ============================================
// Shared Audience Queries
// ============================================

export async function getSharedAudiences(
  userId: string
): Promise<SharedAudience[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('shared_audiences')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching shared audiences:', error)
    return []
  }

  return data
}

export async function createSharedAudience(
  sharedAudience: Omit<SharedAudience, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SharedAudience | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('shared_audiences')
    .insert({
      ...sharedAudience,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating shared audience:', error)
    return null
  }

  return data
}

export async function updateSharedAudience(
  id: string,
  updates: Partial<SharedAudience>
): Promise<SharedAudience | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('shared_audiences')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating shared audience:', error)
    return null
  }

  return data
}

export async function deleteSharedAudiences(
  ids: string[]
): Promise<boolean> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('shared_audiences')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Error deleting shared audiences:', error)
    return false
  }

  return true
}

// ============================================
// Filter Queries
// ============================================

export async function getFilters(userId: string): Promise<Filter[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('filters')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching filters:', error)
    return []
  }

  return data
}

export async function createFilter(
  filter: Omit<Filter, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Filter | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('filters')
    .insert({
      ...filter,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating filter:', error)
    return null
  }

  return data
}

export async function updateFilter(
  id: string,
  updates: Partial<Filter>
): Promise<Filter | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('filters')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating filter:', error)
    return null
  }

  return data
}

export async function deleteFilter(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('filters')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting filter:', error)
    return false
  }

  return true
}

// ============================================
// Settings Queries
// ============================================

export async function getUserSettings(
  userId: string
): Promise<UserSettings | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching user settings:', error)
    return null
  }

  return data
}

export async function upsertUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<UserSettings | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('settings')
    .upsert({
      user_id: userId,
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting user settings:', error)
    return null
  }

  return data
}

// ============================================
// Cost Tracking Queries
// ============================================

export async function getCosts(userId: string): Promise<ServiceCost[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('cost_tracking')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching costs:', error)
    return []
  }

  return data
}

export async function createCost(
  cost: Omit<ServiceCost, 'id' | 'createdAt'>
): Promise<ServiceCost | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('cost_tracking')
    .insert({
      ...cost,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating cost entry:', error)
    return null
  }

  return data
}

export async function getTotalCost(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('cost_tracking')
    .select('cost')
    .eq('user_id', userId)

  if (error) {
    console.error('Error calculating total cost:', error)
    return 0
  }

  return data?.reduce((sum, record) => sum + Number(record.cost), 0) || 0
}

export async function getCostsByService(
  userId: string
): Promise<{ service: string; cost: number }[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('cost_tracking')
    .select('service, cost')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching costs by service:', error)
    return []
  }

  const costsByService: Record<string, number> = {}

  data?.forEach((record) => {
    const service = record.service
    const cost = Number(record.cost)
    costsByService[service] = (costsByService[service] || 0) + cost
  })

  return Object.entries(costsByService).map(([service, cost]) => ({
    service,
    cost,
  }))
}

// ============================================
// Log Queries (Admin Only)
// ============================================

export async function getLogs(userId: string): Promise<LogEntry[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) {
    console.error('Error fetching logs:', error)
    return []
  }

  return data
}

export async function createLog(
  log: Omit<LogEntry, 'id' | 'createdAt'>
): Promise<LogEntry | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('logs')
    .insert({
      ...log,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating log entry:', error)
    return null
  }

  return data
}

export async function clearLogs(userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('logs')
    .delete()
    .neq('user_id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (error) {
    console.error('Error clearing logs:', error)
    return false
  }

  return true
}

// ============================================
// Dashboard Statistics
// ============================================

export async function getDashboardStats(
  userId: string
): Promise<{
  totalSourceAudiences: number
  totalUrls: number
  totalContactsFound: number
  totalContactsUploaded: number
  totalCost: number
}> {
  const supabase = await createSupabaseServerClient()

  // Get source audiences count and total URLs
  const { data: sourceAudiences } = await supabase
    .from('source_audiences')
    .select('urls')
    .eq('user_id', userId)

  const totalSourceAudiences = sourceAudiences?.length || 0
  const totalUrls =
    sourceAudiences?.reduce((sum, sa) => sum + (sa.urls?.length || 0), 0) || 0

  // Get shared audiences for contacts count
  const { data: sharedAudiences } = await supabase
    .from('shared_audiences')
    .select('contacts, uploaded_to_meta')
    .eq('user_id', userId)

  const totalContactsFound =
    sharedAudiences?.reduce((sum, sa) => sum + (sa.contacts?.length || 0), 0) ||
    0

  const totalContactsUploaded =
    sharedAudiences?.filter((sa) => sa.uploaded_to_meta).length || 0

  // Get total cost
  const totalCost = await getTotalCost(userId)

  return {
    totalSourceAudiences,
    totalUrls,
    totalContactsFound,
    totalContactsUploaded,
    totalCost,
  }
}
