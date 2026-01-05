'use client'

import { useState, useEffect, useRef } from 'react'
import { useDemoStore } from '@/lib/stores/useDemoStore'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2, Download, RefreshCw, AlertCircle, AlertTriangle, Info, Bug, Copy, Check } from 'lucide-react'
import type { LogEntry } from '@/types'

interface LogViewerProps {
  autoRefresh?: boolean
}

export function LogViewer({ autoRefresh = true }: LogViewerProps) {
  const { isDemoMode, demoLogs, setDemoLogs } = useDemoStore()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [levelFilter, setLevelFilter] = useState<'all' | LogEntry['level']>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null)
  const [exportDialog, setExportDialog] = useState<{ log?: any; fileName: string } | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadLogs()

    if (autoRefresh && !isDemoMode) {
      const interval = setInterval(loadLogs, 5000) // Refresh every 5 seconds only in production mode
      return () => clearInterval(interval)
    }
  }, [levelFilter, autoRefresh, isDemoMode])

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const loadLogs = async () => {
    setLoading(true)
    try {
      // In demo mode, use demo logs from store
      if (isDemoMode) {
        setLogs(demoLogs)
        setLoading(false)
        return
      }

      // In production mode, fetch from API
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
      // In demo mode, clear demo logs in store
      if (isDemoMode) {
        setDemoLogs([])
        setLogs([])
        return
      }

      // In production mode, call API
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

  const handleDeleteSingleLog = async (logId: string) => {
    try {
      // In demo mode, remove from store
      if (isDemoMode) {
        const updatedLogs = demoLogs.filter(l => l.id !== logId)
        setDemoLogs(updatedLogs)
        setLogs(updatedLogs)
        return
      }

      // In production mode, call API
      const response = await fetch(`/api/logs/${logId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const updatedLogs = logs.filter(l => l.id !== logId)
        setLogs(updatedLogs)
      }
    } catch (error) {
      console.error('Error deleting log:', error)
    }
  }

  const handleExport = () => {
    const now = new Date()
    const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14) // YYYYMMDDHHMMSS
    const defaultFileName = `lume-log-${timestamp}.txt`
    setExportDialog({ fileName: defaultFileName })
  }

  const handleExportSingleLog = (log: any) => {
    const now = new Date()
    const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14) // YYYYMMDDHHMMSS
    const defaultFileName = `lume-log-${timestamp}.txt`
    setExportDialog({ log, fileName: defaultFileName })
  }

  const confirmExportSingleLog = () => {
    if (!exportDialog) return

    let text: string

    if (exportDialog.log) {
      // Single log export
      text = formatLogAsText(exportDialog.log)
    } else {
      // All logs export
      text = logs
        .map(
          (log) => {
            const timestamp = log.createdAt || log.created_at || new Date()
            return `[${new Date(timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.message}${
              log.metadata ? ' | ' + JSON.stringify(log.metadata) : ''
            }`
          }
        )
        .join('\n')
    }

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportDialog.fileName
    a.click()
    URL.revokeObjectURL(url)
    setExportDialog(null)
  }

  const toggleFlip = (logId: string) => {
    const newFlipped = new Set(flippedCards)
    if (newFlipped.has(logId)) {
      newFlipped.delete(logId)
    } else {
      newFlipped.add(logId)
    }
    setFlippedCards(newFlipped)
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

  const getAlternatingCardColor = (index: number) => {
    // Alternate between 3 distinct colors for consecutive cards
    const colors = [
      'bg-blue-50 dark:bg-blue-950',
      'bg-purple-50 dark:bg-purple-950',
      'bg-green-50 dark:bg-green-950'
    ]
    return colors[index % 3]
  }

  const getLevelBorderColor = (level: LogEntry['level'], hasError: boolean = false, hasWarning: boolean = false) => {
    // Red border if log contains errors
    if (hasError || level === 'error') {
      return 'border-red-500'
    }
    // Orange border if log contains warnings
    if (hasWarning || level === 'warn') {
      return 'border-orange-500'
    }
    // Green border if no errors or warnings
    return 'border-green-500'
  }

  const logHasError = (log: any): boolean => {
    // Check if log level is error
    if (log.level === 'error') return true

    // Check if timeline contains errors
    if (log.metadata?.timeline) {
      return log.metadata.timeline.some((entry: any) =>
        entry.event?.includes('ERROR') || entry.event?.includes('FAILED')
      )
    }

    return false
  }

  const logHasWarning = (log: any): boolean => {
    // Check if log level is warning
    if (log.level === 'warn') return true

    // Check if timeline contains warnings
    if (log.metadata?.timeline) {
      return log.metadata.timeline.some((entry: any) =>
        entry.event?.includes('WARN') || entry.event?.includes('WARNING')
      )
    }

    return false
  }

  const formatDate = (dateInput: Date | string | null | undefined) => {
    if (!dateInput) return 'N/A'

    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput

      // Check if date is invalid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateInput)
        return 'Invalid date'
      }

      // Format: YYYY-MM-DD HH:MM:SS
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    } catch (error) {
      console.error('Error formatting date:', error, dateInput)
      return 'Invalid date'
    }
  }

  const getLevelCode = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'E'
      case 'warn':
        return 'W'
      case 'debug':
        return 'D'
      case 'info':
        return 'I'
    }
  }

  const formatLogAsText = (log: any) => {
    const timestamp = formatDate(log.created_at || log.createdAt)
    const levelCode = getLevelCode(log.level)

    // If log has a timeline, format it as multiple lines
    if (log.metadata?.timeline) {
      const lines = [`${timestamp} ${levelCode} ${log.message}`]

      log.metadata.timeline.forEach((entry: any) => {
        const entryTimestamp = entry.timestamp
          .replace('T', ' ')
          .split('.')[0]
        lines.push(`${entryTimestamp} ${levelCode} ${entry.event}`)

        if (entry.details) {
          if (typeof entry.details === 'object') {
            Object.entries(entry.details).forEach(([key, value]) => {
              lines.push(`  ${key}:`)
              if (typeof value === 'object') {
                // Pretty print JSON for request/response and other objects
                lines.push(`  ${JSON.stringify(value, null, 2).split('\n').join('\n  ')}`)
              } else {
                lines.push(`  ${value}`)
              }
            })
          }
        }
      })

      return lines.join('\n')
    }

    // If log has request/response metadata (API tests), format them
    if (log.metadata?.request || log.metadata?.response) {
      const lines = [`${timestamp} ${levelCode} ${log.message}`]

      if (log.metadata.request) {
        lines.push('\n  Request:')
        lines.push(`    Endpoint: ${log.metadata.request.endpoint}`)
        lines.push(`    Method: ${log.metadata.request.method}`)
        if (log.metadata.request.headers) {
          lines.push(`    Headers: ${JSON.stringify(log.metadata.request.headers, null, 2).split('\n').join('\n    ')}`)
        }
        if (log.metadata.request.body) {
          lines.push(`    Body: ${JSON.stringify(log.metadata.request.body, null, 2).split('\n').join('\n    ')}`)
        }
      }

      if (log.metadata.response) {
        lines.push('\n  Response:')
        if (log.metadata.response.status) {
          lines.push(`    Status: ${log.metadata.response.status}`)
        }
        if (log.metadata.response.responseTime) {
          lines.push(`    Response Time: ${log.metadata.response.responseTime}ms`)
        }
        if (log.metadata.response.data) {
          lines.push(`    Data: ${JSON.stringify(log.metadata.response.data, null, 2).split('\n').join('\n    ')}`)
        }
        if (log.metadata.response.error) {
          lines.push(`    Error: ${log.metadata.response.error}`)
        }
      }

      if (log.metadata.details) {
        lines.push(`\n  Details: ${log.metadata.details}`)
      }

      return lines.join('\n')
    }

    // If log has other metadata, show them
    if (log.metadata && Object.keys(log.metadata).length > 0) {
      const lines = [`${timestamp} ${levelCode} ${log.message}`]
      lines.push(`\n  Metadata:`)
      lines.push(`    ${JSON.stringify(log.metadata, null, 2).split('\n').join('\n    ')}`)
      return lines.join('\n')
    }

    // Regular log format
    return `${timestamp} ${levelCode} ${log.message}`
  }

  const handleCopyLog = async (log: any) => {
    const logText = formatLogAsText(log)
    try {
      await navigator.clipboard.writeText(logText)
      setCopiedLogId(log.id)
      setTimeout(() => setCopiedLogId(null), 2000)
    } catch (error) {
      console.error('Failed to copy log:', error)
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

      {/* Logs Display - Flip Cards */}
      {filteredLogs.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            {logs.length === 0 ? 'No logs yet' : 'No logs match the selected filter'}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLogs.map((log, index) => {
            const isFlipped = flippedCards.has(log.id || '')
            const hasError = logHasError(log)
            const hasWarning = logHasWarning(log)
            const borderColor = getLevelBorderColor(log.level, hasError, hasWarning)
            const alternatingColor = getAlternatingCardColor(index)

            return (
              <div
                key={log.id || Math.random()}
                className="group"
                style={{ perspective: '1000px' }}
              >
                <div
                  className={`
                    relative w-full h-48 transition-transform duration-500 cursor-pointer
                    ${isFlipped ? 'rotate-x-180' : ''}
                  `}
                  onClick={() => toggleFlip(log.id || '')}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
                  }}
                >
                  {/* Front - Summary */}
                  <div
                    className={`
                      absolute w-full h-full backface-hidden rounded-lg border-2 p-4
                      ${borderColor} ${alternatingColor}
                    `}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getLevelIcon(log.level)}
                          <span className="text-sm font-bold uppercase">
                            LOG
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(log.created_at || log.createdAt)}
                          </span>
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSingleLog(log.id || '')
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                          title="Delete log"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Message */}
                      <div className="flex-1 flex items-center">
                        <h3 className="font-semibold text-base line-clamp-4">
                          {log.message}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          Click to expand
                        </div>
                        {/* Export button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleExportSingleLog(log)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded flex items-center gap-1"
                          title="Export log to TXT"
                        >
                          <Download className="h-4 w-4" />
                          <span className="text-xs">Export</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Back - Details */}
                  <div
                    className={`
                      absolute w-full h-full backface-hidden rounded-lg border-2 p-4 overflow-hidden
                      ${borderColor} ${alternatingColor}
                    `}
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateX(180deg)',
                    }}
                  >
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getLevelIcon(log.level)}
                          <span className="text-xs font-bold uppercase text-muted-foreground">
                            LOG
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(log.created_at || log.createdAt)}
                          </span>
                        </div>
                        {/* Copy button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopyLog(log)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                          title="Copy log"
                        >
                          {copiedLogId === log.id ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </button>
                      </div>

                      {/* Log content - scrollable text */}
                      <div className="flex-1 overflow-hidden">
                        <div className="h-full overflow-y-auto custom-scrollbar">
                          <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                            {formatLogAsText(log)}
                          </pre>
                        </div>
                      </div>

                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-muted-foreground">Click to collapse</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

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

      {/* Export Dialog */}
      <Dialog open={!!exportDialog} onOpenChange={() => setExportDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{exportDialog?.log ? 'Export Log to TXT' : 'Export All Logs to TXT'}</DialogTitle>
            <DialogDescription>
              {exportDialog?.log
                ? 'Choose a filename for this log export. The file will be saved in plain text format.'
                : 'Choose a filename for your logs export. All logs will be saved in plain text format.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={exportDialog?.fileName || ''}
              onChange={(e) => setExportDialog(exportDialog ? { ...exportDialog, fileName: e.target.value } : null)}
              placeholder="filename.txt"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialog(null)}>
              Cancel
            </Button>
            <Button onClick={confirmExportSingleLog}>
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
