/**
 * Background Job Processor
 * Handles async job processing for Search and Upload operations
 */

import { Job } from '@/types'

// Extend globalThis for HMR persistence
declare global {
  var __jobProcessorJobs: Map<string, Job> | undefined
  var __jobProcessorProcessing: Set<string> | undefined
}

export interface JobProcessorOptions {
  onProgress?: (jobId: string, progress: number, timeline: any[]) => void
  onComplete?: (jobId: string, result: any) => void
  onError?: (jobId: string, error: string) => void
}

export class JobProcessor {
  private static instance: JobProcessor
  private jobs: Map<string, Job>
  private processing: Set<string>

  private constructor() {
    // Use globalThis to persist across HMR in development
    console.log('[JobProcessor] Constructor called')
    if (typeof globalThis !== 'undefined') {
      console.log('[JobProcessor] globalThis exists')
      console.log('[JobProcessor] globalThis.__jobProcessorJobs:', globalThis.__jobProcessorJobs)
      if (!globalThis.__jobProcessorJobs) {
        console.log('[JobProcessor] Creating new global Map')
        globalThis.__jobProcessorJobs = new Map()
      }
      if (!globalThis.__jobProcessorProcessing) {
        console.log('[JobProcessor] Creating new global Set')
        globalThis.__jobProcessorProcessing = new Set()
      }
      this.jobs = globalThis.__jobProcessorJobs
      this.processing = globalThis.__jobProcessorProcessing
      console.log('[JobProcessor] Using global Map with', this.jobs.size, 'jobs')
    } else {
      console.log('[JobProcessor] No globalThis, creating new Map/Set')
      this.jobs = new Map()
      this.processing = new Set()
    }
  }

  static getInstance(): JobProcessor {
    console.log('[JobProcessor] getInstance called, instance exists:', !!JobProcessor.instance)
    if (!JobProcessor.instance) {
      console.log('[JobProcessor] Creating new instance')
      JobProcessor.instance = new JobProcessor()
    }
    return JobProcessor.instance
  }

  /**
   * Create a new job
   */
  createJob(
    userId: string,
    type: 'SEARCH' | 'UPLOAD_TO_META',
    payload: Record<string, any>
  ): Job {
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      status: 'pending',
      progress: 0,
      payload,
      timeline: [{
        timestamp: new Date().toISOString(),
        event: 'JOB_CREATED',
        details: { type, payload }
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log(`[JobProcessor] Creating job ${job.id} for user ${userId}`)
    console.log(`[JobProcessor] Current jobs in Map before: ${this.jobs.size}`)
    this.jobs.set(job.id, job)
    console.log(`[JobProcessor] Current jobs in Map after: ${this.jobs.size}`)
    console.log(`[JobProcessor] Jobs in Map:`, Array.from(this.jobs.keys()))
    return job
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): Job | undefined {
    console.log(`[JobProcessor] Getting job ${jobId}`)
    console.log(`[JobProcessor] Jobs in Map:`, Array.from(this.jobs.keys()))
    console.log(`[JobProcessor] Has job: ${this.jobs.has(jobId)}`)
    const job = this.jobs.get(jobId)
    console.log(`[JobProcessor] Job found: ${!!job}`)
    return job
  }

  /**
   * Get all jobs for a user
   */
  getUserJobs(userId: string): Job[] {
    return Array.from(this.jobs.values()).filter(job => job.userId === userId)
  }

  /**
   * Update job progress
   */
  updateJobProgress(
    jobId: string,
    progress: number,
    timelineEvent?: { timestamp: string; event: string; details?: any }
  ): Job | undefined {
    const job = this.jobs.get(jobId)
    if (!job) return undefined

    // Round to integer
    job.progress = Math.round(Math.min(100, Math.max(0, progress)))
    job.updatedAt = new Date()

    if (timelineEvent) {
      job.timeline.push(timelineEvent)
    }

    return job
  }

  /**
   * Mark job as completed
   */
  completeJob(jobId: string, result: any): Job | undefined {
    const job = this.jobs.get(jobId)
    if (!job) return undefined

    job.status = 'completed'
    job.progress = 100
    // Only set result if not already set by the processor
    if (!job.result) {
      job.result = { success: true, data: result }
    }
    job.completedAt = new Date()
    job.updatedAt = new Date()

    job.timeline.push({
      timestamp: new Date().toISOString(),
      event: 'JOB_COMPLETED',
      details: { result }
    })

    this.processing.delete(jobId)
    return job
  }

  /**
   * Mark job as failed
   */
  failJob(jobId: string, error: string): Job | undefined {
    const job = this.jobs.get(jobId)
    if (!job) return undefined

    job.status = 'failed'
    job.result = { success: false, error }
    job.completedAt = new Date()
    job.updatedAt = new Date()

    job.timeline.push({
      timestamp: new Date().toISOString(),
      event: 'JOB_FAILED',
      details: { error }
    })

    this.processing.delete(jobId)
    return job
  }

  /**
   * Start processing a job
   */
  async startJob(
    jobId: string,
    processor: (job: Job, updateProgress: (progress: number, event?: any) => void) => Promise<void>,
    options?: JobProcessorOptions
  ): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }

    if (this.processing.has(jobId)) {
      throw new Error(`Job ${jobId} is already processing`)
    }

    this.processing.add(jobId)
    job.status = 'processing'
    job.startedAt = new Date()
    job.updatedAt = new Date()

    job.timeline.push({
      timestamp: new Date().toISOString(),
      event: 'JOB_STARTED',
      details: { type: job.type }
    })

    // Update progress callback
    const updateProgress = (progress: number, event?: any) => {
      const updatedJob = this.updateJobProgress(jobId, progress, event)
      if (updatedJob && options?.onProgress) {
        options.onProgress(jobId, progress, updatedJob.timeline)
      }
    }

    try {
      await processor(job, updateProgress)
      const completedJob = this.completeJob(jobId, null)
      if (completedJob && options?.onComplete) {
        options.onComplete(jobId, completedJob.result)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const failedJob = this.failJob(jobId, errorMessage)
      if (failedJob && options?.onError) {
        options.onError(jobId, errorMessage)
      }
    }
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): Job | undefined {
    const job = this.jobs.get(jobId)
    if (!job) return undefined

    if (job.status === 'completed' || job.status === 'failed') {
      return job
    }

    job.status = 'cancelled'
    job.completedAt = new Date()
    job.updatedAt = new Date()

    job.timeline.push({
      timestamp: new Date().toISOString(),
      event: 'JOB_CANCELLED',
      details: {}
    })

    this.processing.delete(jobId)
    return job
  }

  /**
   * Clean up old jobs (older than specified hours)
   */
  cleanupOldJobs(maxAgeHours: number = 24): number {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)
    let cleaned = 0

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.createdAt < cutoff && !this.processing.has(jobId)) {
        this.jobs.delete(jobId)
        cleaned++
      }
    }

    return cleaned
  }
}

// Singleton instance
export const jobProcessor = JobProcessor.getInstance()
