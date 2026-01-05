'use client'

import { useEffect, useState, useRef } from 'react'
import { useDemoStore } from '@/lib/stores/useDemoStore'
import { useSupabase } from './supabase-provider'
import { CheckCircle, X } from 'lucide-react'

interface JobNotificationProviderProps {
  children: React.ReactNode
}

interface Notification {
  id: string
  title: string
  description: string
}

export function JobNotificationProvider({ children }: JobNotificationProviderProps) {
  const { profile } = useSupabase()
  const { isDemoMode } = useDemoStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const processedJobsRef = useRef<Set<string>>(new Set())
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const addNotification = (title: string, description: string) => {
    const id = crypto.randomUUID()
    setNotifications(prev => [...prev, { id, title, description }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(t => t.id !== id))
  }

  // Check for completed jobs periodically
  useEffect(() => {
    if (!isDemoMode) return

    const checkCompletedJobs = async () => {
      const savedJobId = sessionStorage.getItem('current_search_job_id')
      if (!savedJobId) return

      // Skip if already processed
      if (processedJobsRef.current.has(savedJobId)) return

      try {
        const response = await fetch(`/api/jobs/${savedJobId}`, {
          credentials: 'include'
        })

        if (!response.ok) return

        const jobData = await response.json()

        if (jobData.status === 'completed' && jobData.result?.data?.sharedAudiences) {
          console.log('[JobNotificationProvider] Found completed job, processing...')

          const { addDemoSharedAudience, demoSharedAudiences, addCost } = useDemoStore.getState()

          let addedCount = 0
          for (const sharedAudience of jobData.result.data.sharedAudiences) {
            const existing = demoSharedAudiences.find(sa => sa.sourceAudienceId === sharedAudience.sourceAudienceId)
            if (!existing) {
              addDemoSharedAudience(sharedAudience)
              addedCount++
            }
          }

          // Add costs from job result
          if (jobData.result.data.costBreakdown) {
            for (const cost of jobData.result.data.costBreakdown) {
              addCost(cost)
            }
          }

          if (addedCount > 0) {
            const totalContacts = jobData.result.data.sharedAudiences.reduce(
              (sum: number, sa: any) => sum + sa.contacts.length,
              0
            )
            const totalCost = jobData.result.data.totalCost || 0

            // Show notification
            addNotification(
              'Search Complete',
              `Found ${totalContacts} contacts from ${jobData.result.data.sharedAudiences.length} audience(s). Cost: $${totalCost.toFixed(4)}. Check Shared Audiences to view results.`
            )
          }

          // Mark as processed and clear from sessionStorage
          processedJobsRef.current.add(savedJobId)
          sessionStorage.removeItem('current_search_job_id')
        }
      } catch (error) {
        console.error('[JobNotificationProvider] Error checking job status:', error)
      }
    }

    // Check immediately
    checkCompletedJobs()

    // Then poll every 3 seconds
    pollingRef.current = setInterval(checkCompletedJobs, 3000)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [isDemoMode])

  return (
    <>
      {children}

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className="bg-green-50 dark:bg-green-950 border-2 border-green-500 rounded-lg p-4 shadow-lg max-w-md animate-in slide-in-from-bottom-5"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-green-900 dark:text-green-100">
                  {notification.title}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {notification.description}
                </div>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
