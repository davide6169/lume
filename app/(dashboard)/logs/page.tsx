'use client'

import { useSupabase } from '@/components/providers/supabase-provider'
import { useDemoStore } from '@/lib/stores/useDemoStore'
import { LogViewer } from '@/components/common/LogViewer'

export default function LogsPage() {
  const { profile } = useSupabase()
  const { isDemoMode } = useDemoStore()

  // Check if user is admin OR in demo mode (for testing)
  const isAdmin = profile?.role === 'admin'
  const canAccessLogs = isAdmin || isDemoMode

  if (!canAccessLogs) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-muted-foreground mt-2">
            Real-time logs from all background processes and API calls
          </p>
        </div>

        <div className="text-center py-12 bg-destructive/10 rounded-lg">
          <div className="text-destructive font-semibold mb-2">Access Restricted</div>
          <p className="text-muted-foreground">
            You need administrator privileges to view system logs.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          {isDemoMode && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Demo Mode
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-2">
          Real-time logs from all background processes and API calls
          {isDemoMode && " (simulated data for testing)"}
        </p>
      </div>

      {/* Log Viewer */}
      <LogViewer autoRefresh={true} />
    </div>
  )
}
