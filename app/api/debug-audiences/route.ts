import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get all audiences for this user
  const { data: userAudiences } = await supabase
    .from('source_audiences')
    .select('*')

  // Get all audiences in database (bypass RLS with service role would be needed, but this shows what we have)

  return NextResponse.json({
    userId: user?.id,
    userEmail: user?.email,
    userAudiences,
    totalAudiences: userAudiences?.length || 0,
  })
}
