'use client'

import { useState } from 'react'
import { SourceAudience } from '@/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2, RotateCw, Copy, Check, Download } from 'lucide-react'
import { Facebook as FacebookIcon } from '@/components/icons/facebook'
import { Instagram as InstagramIcon } from '@/components/icons/instagram'

interface SourceAudienceCardProps {
  audience: SourceAudience
  selected: boolean
  onToggleSelect: () => void
  onDelete: () => void
  totalSelectedUrls: number
}

export function SourceAudienceCard({
  audience,
  selected,
  onToggleSelect,
  onDelete,
}: SourceAudienceCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [copied, setCopied] = useState(false)
  const [exportDialog, setExportDialog] = useState<{ open: boolean; fileName: string } | null>(null)

  const getIcon = () => {
    if (audience.type === 'facebook') {
      return <FacebookIcon className="h-6 w-6" />
    }
    return <InstagramIcon className="h-6 w-6" />
  }

  const getStatusBadge = () => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const },
      processing: { label: 'Processing', variant: 'default' as const },
      completed: { label: 'Completed', variant: 'outline' as const },
      failed: { label: 'Failed', variant: 'destructive' as const },
    }

    const config = statusConfig[audience.status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // Colori diversi per Facebook e Instagram
  const getCardColor = () => {
    if (audience.type === 'facebook') {
      return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
    }
    return 'bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-800'
  }

  const handleClick = () => {
    setIsFlipped(!isFlipped)
  }

  const handleCopyUrls = async () => {
    const urlsText = audience.urls.join('\n')
    try {
      await navigator.clipboard.writeText(urlsText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleExport = () => {
    const now = new Date()
    const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14) // YYYYMMDDHHMMSS
    const defaultFileName = `lume-source-${timestamp}.txt`
    setExportDialog({ open: true, fileName: defaultFileName })
  }

  const confirmExport = () => {
    if (!exportDialog) return

    const content = formatSourceAsText()
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportDialog.fileName
    a.click()
    URL.revokeObjectURL(url)
    setExportDialog(null)
  }

  const formatSourceAsText = () => {
    const lines = [
      `Source Audience: ${audience.name}`,
      `Type: ${audience.type}`,
      `Status: ${audience.status}`,
      `Created: ${new Date(audience.createdAt).toISOString()}`,
      '',
      'URLs:',
      ...audience.urls.map((url, index) => `${index + 1}. ${url}`),
      '',
      `Total URLs: ${audience.urls.length}`,
    ]
    return lines.join('\n')
  }

  return (
    <>
    <div className="group" style={{ perspective: '1000px' }}>
      <div
        className="relative"
        style={{
          width: '100%',
          height: '240px',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front Side */}
        <Card
          className={`${getCardColor()} ${selected ? 'ring-2 ring-blue-500' : ''}`}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            top: 0,
            left: 0,
          }}
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) => {
                    onToggleSelect()
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-6 w-6 border-2 border-primary"
                />
                <div className="flex items-center gap-3">
                  {getIcon()}
                  <div>
                    <h3 className="font-bold text-lg">{audience.name}</h3>
                    <p className="mt-2">
                      <span className="font-bold text-lg">{audience.urls.length}</span>
                      <span className="text-lg"> {audience.urls.length === 1 ? 'URL' : 'URLs'}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge()}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 rounded-lg"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>

            {/* Flip indicator and Export button */}
            <div className="mt-auto pt-4 flex items-center justify-between w-full">
              <button
                onClick={handleClick}
                className="flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                <span>View URLs</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleExport()
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded flex items-center gap-1"
                title="Export to TXT"
              >
                <Download className="h-4 w-4" />
                <span className="text-xs">Export</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Back Side */}
        <Card
          className={`${getCardColor()}`}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            top: 0,
            left: 0,
          }}
        >
          <div className="p-6 h-full flex flex-col relative">
            {/* Copy button - top right corner */}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleCopyUrls()
              }}
              className="absolute top-4 right-4 h-8 px-3 gap-2 z-10"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="text-sm">Copy URLs</span>
                </>
              )}
            </Button>

            <div className="flex-1 overflow-y-auto space-y-1 mt-8">
              {audience.urls.map((url, index) => (
                <div
                  key={index}
                  className="text-sm font-mono break-all"
                >
                  {url}
                </div>
              ))}
              {audience.urls.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No URLs added yet
                </div>
              )}
            </div>

            {/* Flip back button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsFlipped(false)
              }}
              className="pt-4 flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              <span>Flip Back</span>
            </button>
          </div>
        </Card>
      </div>
    </div>

    {/* Export Dialog */}
    {exportDialog && (
      <Dialog open={exportDialog.open} onOpenChange={() => setExportDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Source Audience to TXT</DialogTitle>
            <DialogDescription>
              Choose a filename for this source audience export. The file will be saved in plain text format.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={exportDialog.fileName}
              onChange={(e) => setExportDialog({ ...exportDialog, fileName: e.target.value })}
              placeholder="filename.txt"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialog(null)}>
              Cancel
            </Button>
            <Button onClick={confirmExport}>
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
  </>
  )
}
