'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Download, RefreshCw, AlertCircle, AlertTriangle, Info, Bug } from 'lucide-react'
import type { LogEntry } from '@/types'

interface LogViewerProps {
  autoRefresh?: boolean
}

export function LogViewer({ autoRefresh = true }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [levelFilter, setLevelFilter] = useState<'all' | LogEntry['level']>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadLogs()

    if (autoRefresh) {
      const interval = setInterval(loadLogs, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [levelFilter, autoRefresh])

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Error loading logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/logs', {
        method: 'DELETE',
      })

      if (response.ok) {
        setLogs([])
      }
    } catch (error) {
      console.error('Error clearing logs:', error)
    }
  }

  const handleExport = () => {
    const text = logs
      .map(
        (log) =>
          `[${new Date(log.createdAt).toISOString()}] [${log.level.toUpperCase()}] ${log.message}${
            log.metadata ? ' | ' + JSON.stringify(log.metadata) : ''
          }`
      )
      .join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredLogs =
    levelFilter === 'all' ? logs : logs.filter((log) => log.level === levelFilter)

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
      case 'debug':
        return <Bug className="h-4 w-4 text-gray-600" />
    }
  }

  const getLevelBadgeVariant = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'destructive'
      case 'warn':
        return 'default'
      case 'info':
        return 'secondary'
      case 'debug':
        return 'outline'
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={levelFilter} onValueChange={(value: any) => setLevelFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => setAutoScroll(!autoScroll)}>
            {autoScroll ? 'Auto-scroll: ON' : 'Auto-scroll: OFF'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClearLogs} disabled={logs.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Logs Display */}
      <Card className="p-4">
        <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {logs.length === 0 ? 'No logs yet' : 'No logs match the selected filter'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log, index) => (
                <div key={log.id || index} className="flex items-start gap-3 py-1">
                  <div className="flex-shrink-0 mt-0.5">{getLevelIcon(log.level)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={getLevelBadgeVariant(log.level)} className="text-xs">
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-200 mt-1 break-all">{log.message}</div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="text-slate-400 text-xs mt-1">
                        {JSON.stringify(log.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Total: {logs.length} entries</span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-red-600" />
          {logs.filter((l) => l.level === 'error').length} errors
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-yellow-600" />
          {logs.filter((l) => l.level === 'warn').length} warnings
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Info className="h-3 w-3 text-blue-600" />
          {logs.filter((l) => l.level === 'info').length} info
        </span>
      </div>
    </div>
  )
}
