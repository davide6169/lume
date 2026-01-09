/**
 * Background Job Processor
 * Handles async job processing for Search, Upload, and Workflow operations
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

// Configuration constants
const MAX_JOBS = 100 // Maximum jobs to keep in memory
const CLEANUP_INTERVAL = 5 * 60 * 1000 // Cleanup every 5 minutes
const DEFAULT_JOB_MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours

export class JobProcessor {
  private static instance: JobProcessor
  private jobs: Map<string, Job>
  private processing: Set<string>
  private cleanupTimer: NodeJS.Timeout | null = null

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

    // Start automatic cleanup
    this.startCleanupTimer()
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
   * Create a new job with guaranteed unique ID
   */
  createJob(
    userId: string,
    type: 'SEARCH' | 'UPLOAD_TO_META' | 'WORKFLOW',
    payload: Record<string, any>
  ): Job {
    // Use crypto.randomUUID() for guaranteed unique IDs (fixes race condition)
    const job: Job = {
      id: crypto.randomUUID(), // Replaces Date.now() + random - guaranteed unique
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

    // Enforce max jobs limit (fixes memory leak)
    this.enforceJobLimit()

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
   * Start processing a job with atomic lock (fixes race condition)
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

    // Atomic check-and-set for processing status (fixes race condition)
    if (this.processing.has(jobId)) {
      throw new Error(`Job ${jobId} is already processing`)
    }

    // Add to processing set BEFORE updating status (atomic operation)
    this.processing.add(jobId)

    try {
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
      // Only clean jobs that are not currently processing
      if (job.createdAt < cutoff && !this.processing.has(jobId)) {
        this.jobs.delete(jobId)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * Enforce maximum job limit to prevent memory leaks
   * Removes oldest completed/failed jobs first
   */
  private enforceJobLimit(): void {
    if (this.jobs.size <= MAX_JOBS) return

    console.log(`[JobProcessor] Job limit exceeded (${this.jobs.size}/${MAX_JOBS}), cleaning up...`)

    // Convert to array and sort by creation time
    const sortedJobs = Array.from(this.jobs.entries())
      .sort(([, a], [, b]) => a.createdAt.getTime() - b.createdAt.getTime())

    let removed = 0
    for (const [jobId, job] of sortedJobs) {
      // Only remove completed, failed, or cancelled jobs (not processing)
      if (this.jobs.size <= MAX_JOBS) break

      if (
        !this.processing.has(jobId) &&
        (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled')
      ) {
        this.jobs.delete(jobId)
        removed++
      }
    }

    console.log(`[JobProcessor] Removed ${removed} old jobs to enforce limit`)
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    // Clear any existing timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    // Run cleanup periodically
    this.cleanupTimer = setInterval(() => {
      const cleaned = this.cleanupOldJobs(24)
      if (cleaned > 0) {
        console.log(`[JobProcessor] Auto-cleanup: removed ${cleaned} old jobs`)
      }
      this.enforceJobLimit()
    }, CLEANUP_INTERVAL)

    console.log('[JobProcessor] Started automatic cleanup timer')
  }

  /**
   * Stop cleanup timer (call when shutting down)
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
      console.log('[JobProcessor] Stopped cleanup timer')
    }
  }

  /**
   * Get job statistics
   */
  getStats(): { total: number; processing: number; completed: number; failed: number; pending: number } {
    const jobs = Array.from(this.jobs.values())
    return {
      total: jobs.length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      pending: jobs.filter(j => j.status === 'pending').length
    }
  }
}

// Singleton instance
export const jobProcessor = JobProcessor.getInstance()
