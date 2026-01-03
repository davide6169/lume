'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Card } from '@/components/ui/card'
import { Users, UserPlus, Database, Upload, DollarSign, TrendingUp } from 'lucide-react'

interface DashboardStats {
  totalSourceAudiences: number
  totalUrls: number
  totalContacts: number
  uploadedContacts: number
  totalCost: number
  costBreakdown: { service: string; cost: number }[]
  recentActivity: { date: string; operations: number }[]
}

export default function DashboardPage() {
  const { profile } = useSupabase()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
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
          return (
            <Card key={stat.title} className={`${stat.bgColor} border-2 border-black/5 dark:border-white/10 p-6`}>
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">{stat.title}</p>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Cost Breakdown */}
      {stats && stats.costBreakdown.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Cost Breakdown by Service</h2>
          <div className="space-y-3">
            {stats.costBreakdown.map((item) => (
              <div key={item.service} className="flex items-center justify-between">
                <span className="capitalize text-sm">{item.service}</span>
                <span className="font-medium">${item.cost.toFixed(4)}</span>
              </div>
            ))}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>${stats.totalCost.toFixed(2)}</span>
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
