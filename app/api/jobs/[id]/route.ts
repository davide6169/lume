import { createSupabaseServerClient } from '@/lib/supabase/server'
import { jobProcessor } from '@/lib/services/job-processor'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    console.log(`[Jobs API] GET /api/jobs/${jobId} - Fetching job status`)

    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error(`[Jobs API] Job ${jobId} - Authentication failed`)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log(`[Jobs API] Job ${jobId} - User authenticated: ${user.id}`)

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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
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
