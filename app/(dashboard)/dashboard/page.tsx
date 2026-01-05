'use client'

import { useEffect, useState, useRef } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { useDemoStore } from '@/lib/stores/useDemoStore'
import { Card } from '@/components/ui/card'
import { Users, UserPlus, Database, Upload, DollarSign, TrendingUp, Activity } from 'lucide-react'

interface DashboardStats {
  totalSourceAudiences: number
  totalUrls: number
  totalContacts: number
  uploadedContacts: number
  totalCost: number
  costBreakdown: { service: string; cost: number }[]
  recentActivity: { date: string; operations: number }[]
}

const CACHE_KEY = 'dashboard_stats_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function DashboardPage() {
  const { profile } = useSupabase()
  const { isDemoMode } = useDemoStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isJobRunning, setIsJobRunning] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadStats()

    // Check for running job
    checkRunningJob()

    // In demo mode, also subscribe to demo store changes
    if (isDemoMode) {
      const unsubscribe = useDemoStore.subscribe((state, prevState) => {
        // Check if relevant data changed
        if (
          state.demoSourceAudiences !== prevState.demoSourceAudiences ||
          state.demoSharedAudiences !== prevState.demoSharedAudiences ||
          state.totalCost !== prevState.totalCost
        ) {
          // Reload stats when demo store data changes
          console.log('[Dashboard] Demo store changed, reloading stats')
          loadDemoStats()
        }
      })

      return () => {
        unsubscribe()
      }
    }
  }, [isDemoMode])

  // Check if there's a job in progress
  const checkRunningJob = async () => {
    const savedJobId = sessionStorage.getItem('current_search_job_id')
    if (!savedJobId) {
      setIsJobRunning(false)
      return
    }

    try {
      const response = await fetch(`/api/jobs/${savedJobId}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const jobData = await response.json()

        if (jobData.status === 'processing' || jobData.status === 'pending') {
          console.log('[Dashboard] Job is running, starting real-time updates')
          setIsJobRunning(true)
          startPolling(savedJobId)
        } else if (jobData.status === 'completed') {
          console.log('[Dashboard] Job completed, reloading stats')
          setIsJobRunning(false)
          sessionStorage.removeItem('current_search_job_id')
          loadStats()
        } else {
          setIsJobRunning(false)
        }
      }
    } catch (error) {
      console.error('[Dashboard] Error checking job status:', error)
    }
  }

  // Start polling for job updates
  const startPolling = (jobId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    pollingRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`, {
          credentials: 'include'
        })

        if (response.ok) {
          const jobData = await response.json()

          if (jobData.status === 'completed') {
            console.log('[Dashboard] Job completed, stopping polling')
            setIsJobRunning(false)
            sessionStorage.removeItem('current_search_job_id')
            loadStats() // Reload full stats
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
              pollingRef.current = null
            }
          } else if (jobData.status === 'processing' || jobData.status === 'pending') {
            // Extract contacts from timeline and update display
            const contactsFromJob = extractContactsFromJobTimeline(jobData)
            updateContactsDisplay(contactsFromJob)
          }
        }
      } catch (error) {
        console.error('[Dashboard] Error polling job:', error)
      }
    }, 2000) // Poll every 2 seconds
  }

  // Extract total contacts from job timeline
  const extractContactsFromJobTimeline = (jobData: any): number => {
    let totalContacts = 0

    jobData.timeline?.forEach((event: any) => {
      if (event.event === 'AUDIENCE_PROCESSING_COMPLETED' && event.details?.completeContacts) {
        totalContacts += event.details.completeContacts
      }
    })

    return totalContacts
  }

  // Update contacts display without full reload
  const updateContactsDisplay = (contactsFromJob: number) => {
    console.log('[Dashboard] Updating contacts display:', contactsFromJob)

    // In demo mode, always get fresh data from store
    if (isDemoMode) {
      loadDemoStats()
      return
    }

    // In production mode, update with job contacts
    setStats(prev => {
      if (!prev) return null
      return {
        ...prev,
        totalContacts: contactsFromJob
      }
    })
  }

  useEffect(() => {
    return () => {
      // Cleanup polling on unmount
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      // Read FRESH isDemoMode value from store to avoid stale closure values
      const currentIsDemoMode = useDemoStore.getState().isDemoMode

      // In demo mode, calculate stats from store
      if (currentIsDemoMode) {
        loadDemoStats()
        return
      }

      // In production mode, ALWAYS fetch fresh data (no cache)
      console.log('Dashboard: Loading PRODUCTION stats from API (isDemoMode =', currentIsDemoMode, ')')
      const response = await fetch('/api/dashboard?demoMode=false')
      if (response.ok) {
        const data = await response.json()
        console.log('Dashboard: PRODUCTION stats received', data)
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDemoStats = () => {
    console.log('Dashboard: Loading DEMO stats')
    const { demoSourceAudiences, demoSharedAudiences, totalCost, costBreakdown } = useDemoStore.getState()

    const totalSourceAudiences = demoSourceAudiences.length
    const totalUrls = demoSourceAudiences.reduce((sum, sa) => sum + (sa.urls?.length || 0), 0)
    const totalContacts = demoSharedAudiences.reduce((sum, sa) => sum + (sa.contacts?.length || 0), 0)
    const uploadedContacts = demoSharedAudiences.filter((sa) => sa.uploadedToMeta).length

    // Aggregate costs by service (to handle multiple operations per service like Hunter)
    const costsByService: Record<string, number> = {}
    costBreakdown.forEach((c) => {
      const service = c.service
      costsByService[service] = (costsByService[service] || 0) + c.cost
    })

    const aggregatedCostBreakdown = Object.entries(costsByService).map(([service, cost]) => ({
      service,
      cost,
    }))

    const demoStats: DashboardStats = {
      totalSourceAudiences,
      totalUrls,
      totalContacts,
      uploadedContacts,
      totalCost,
      costBreakdown: aggregatedCostBreakdown,
      recentActivity: Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        const dateStr = date.toISOString().split('T')[0]
        return {
          date: dateStr,
          operations: 0,
        }
      }),
    }

    console.log('Dashboard: DEMO stats', demoStats)
    setStats(demoStats)
    setLoading(false)
  }

  const statsCards = stats
    ? [
        {
          title: 'Source Audiences',
          value: stats.totalSourceAudiences.toString(),
          icon: Database,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950',
        },
        {
          title: 'Total URLs',
          value: stats.totalUrls.toString(),
          icon: Users,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-950',
        },
        {
          title: 'Contacts Found',
          value: stats.totalContacts.toString(),
          icon: UserPlus,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950',
        },
        {
          title: 'Uploaded to Meta',
          value: stats.uploadedContacts.toString(),
          icon: Upload,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 dark:bg-orange-950',
        },
        {
          title: 'Total Cost',
          value: `$${stats.totalCost.toFixed(2)}`,
          icon: DollarSign,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950',
        },
      ]
    : []

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Loading your statistics...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-2" />
              <div className="h-8 bg-muted rounded w-16" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {profile?.fullName || 'User'}! Here's an overview of your lead management.
          </p>
        </div>
        <button
          onClick={loadStats}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <TrendingUp className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          const showJobIndicator = stat.title === 'Contacts Found' && isJobRunning

          return (
            <Card key={stat.title} className={`${stat.bgColor} border-2 border-black/5 dark:border-white/10 p-6 relative`}>
              {showJobIndicator && (
                <div className="absolute top-2 right-2">
                  <div className="flex items-center gap-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                    <Activity className="h-3 w-3" />
                    <span className="font-medium">Live</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">{stat.title}</p>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                {showJobIndicator && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Updating in real-time...
                  </p>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Cost Breakdown */}
      {stats && stats.costBreakdown.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Cost Breakdown by Service</h2>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="space-y-4">
            {stats.costBreakdown.map((item, index) => {
              const percentage = stats.totalCost > 0 ? (item.cost / stats.totalCost) * 100 : 0
              const colors = [
                'bg-blue-500',
                'bg-purple-500',
                'bg-green-500',
                'bg-orange-500',
                'bg-pink-500',
                'bg-cyan-500'
              ]
              const bgColor = colors[index % colors.length]
              const bgLight = colors[index % colors.length].replace('500', '50').replace('bg-', 'bg-').replace('500', '950 dark:bg-')
              const textColor = colors[index % colors.length].replace('bg-', 'text-').replace('500', '600')

              return (
                <div key={item.service} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-medium">{item.service}</span>
                      <span className="text-muted-foreground">({percentage.toFixed(1)}%)</span>
                    </div>
                    <span className={`font-semibold ${textColor}`}>${item.cost.toFixed(2)}</span>
                  </div>
                  <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full ${bgColor} transition-all duration-500 ease-out`}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                </div>
              )
            })}

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total Cost</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  ${stats.totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Getting Started Card - Show only if no data */}
      {stats && stats.totalSourceAudiences === 0 && (
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>Welcome to Lume - your AI-powered lead management platform!</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to <strong>Settings</strong> to configure your API keys</li>
              <li>Create <strong>Source Audiences</strong> with Facebook/Instagram URLs</li>
              <li>Click <strong>Search</strong> to extract contacts using AI</li>
              <li>Review and filter your <strong>Shared Audiences</strong></li>
              <li><strong>Export</strong> contacts or upload directly to Meta Ads</li>
            </ol>
            <p className="mt-4">
              💡 Tip: Use <strong>Demo Mode</strong> in Settings to explore the platform without using real API calls.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
