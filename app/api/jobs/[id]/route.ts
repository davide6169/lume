import { createSupabaseServerClient } from '@/lib/supabase/server'
import { jobProcessor } from '@/lib/services/job-processor'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyDemoToken } from '@/lib/auth/demo-auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    console.log(`[Jobs API] GET /api/jobs/${jobId} - Fetching job status`)

    // Create Supabase client (will be used for non-demo users)
    const supabase = await createSupabaseServerClient()

    // Check if user is authenticated (either demo user or real Supabase user)
    let user: any = null
    let isDemoUser = false

    // First, check if this is a demo user
    const cookieStore = await cookies()
    const demoToken = cookieStore.get('demo_token')?.value

    if (demoToken) {
      const demoUser = await verifyDemoToken(demoToken)
      if (demoUser) {
        console.log(`[Jobs API] Job ${jobId} - Demo user authenticated: ${demoUser.email}`)
        user = { id: 'demo-user', email: demoUser.email }
        isDemoUser = true
      }
    }

    // If not demo user, check Supabase auth
    if (!user) {
      const {
        data: { user: supabaseUser },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !supabaseUser) {
        console.error(`[Jobs API] Job ${jobId} - Authentication failed`)
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }

      user = supabaseUser
      console.log(`[Jobs API] Job ${jobId} - User authenticated: ${user.id}`)
    }

    // Get job from processor
    const job = jobProcessor.getJob(jobId)
    console.log(`[Jobs API] Job ${jobId} - Job found: ${!!job}`)

    if (!job) {
      console.error(`[Jobs API] Job ${jobId} - Not found in processor`)
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    console.log(`[Jobs API] Job ${jobId} - Status: ${job.status}, Progress: ${job.progress}%, User: ${job.userId}`)

    // Verify job belongs to user
    if (job.userId !== user.id) {
      console.error(`[Jobs API] Job ${jobId} - Unauthorized: job user ${job.userId} != request user ${user.id}`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    console.log(`[Jobs API] Job ${jobId} - Returning job data`)
    if (job.status === 'completed') {
      console.log(`[Jobs API] Job ${jobId} - Result:`, JSON.stringify(job.result, null, 2))
    }
    return NextResponse.json({
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      timeline: job.timeline,
      result: job.result,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    })
  } catch (error) {
    console.error('Error fetching job status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()

    // Check if user is authenticated (either demo user or real Supabase user)
    let user: any = null

    // First, check if this is a demo user
    const cookieStore = await cookies()
    const demoToken = cookieStore.get('demo_token')?.value

    if (demoToken) {
      const demoUser = await verifyDemoToken(demoToken)
      if (demoUser) {
        user = { id: 'demo-user', email: demoUser.email }
      }
    }

    // If not demo user, check Supabase auth
    if (!user) {
      const {
        data: { user: supabaseUser },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !supabaseUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }

      user = supabaseUser
    }

    const { id: jobId } = await params

    // Get job from processor
    const job = jobProcessor.getJob(jobId)

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify job belongs to user
    if (job.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Cancel job
    const cancelledJob = jobProcessor.cancelJob(jobId)

    return NextResponse.json({
      id: cancelledJob!.id,
      status: cancelledJob!.status,
      message: 'Job cancelled'
    })
  } catch (error) {
    console.error('Error cancelling job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
