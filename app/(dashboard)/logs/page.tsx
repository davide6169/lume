'use client'

import { useSupabase } from '@/components/providers/supabase-provider'
import { LogViewer } from '@/components/common/LogViewer'

export default function LogsPage() {
  const { profile } = useSupabase()

  // Check if user is admin
  if (profile?.role !== 'admin') {
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
        <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
        <p className="text-muted-foreground mt-2">
          Real-time logs from all background processes and API calls
        </p>
      </div>

      {/* Log Viewer */}
      <LogViewer autoRefresh={true} />
    </div>
  )
}
