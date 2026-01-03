'use client'

import { useState, useEffect } from 'react'
import { useSharedAudiencesStore } from '@/lib/stores/useSharedAudiencesStore'
import { SharedAudienceCard } from './SharedAudienceCard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, Download, Upload } from 'lucide-react'
import { AlertCircle } from 'lucide-react'

export function SharedAudienceList() {
  const {
    sharedAudiences,
    setSharedAudiences,
    addSharedAudience,
    removeSharedAudiences,
    toggleSelectAll,
    toggleSelectOne,
    getSelectedCount,
    getTotalContactsCount,
    getSelectedContactsCount,
    exportSelectedAsCsv,
  } = useSharedAudiencesStore()

  const [deleteConfirmation, setDeleteConfirmation] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // Load shared audiences from database on mount
  useEffect(() => {
    loadSharedAudiences()
  }, [])

  const loadSharedAudiences = async () => {
    try {
      const response = await fetch('/api/shared-audiences')
      if (response.ok) {
        const data = await response.json()
        setSharedAudiences(data.sharedAudiences || [])
      }
    } catch (error) {
      console.error('Error loading shared audiences:', error)
    }
  }

  // Filter audiences based on search query
  const filteredAudiences = sharedAudiences.filter((audience) =>
    audience.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const allSelected = filteredAudiences.length > 0 && filteredAudiences.every((a) => a.selected)
  const someSelected = filteredAudiences.some((a) => a.selected)

  const handleDelete = () => {
    setDeleteConfirmation(true)
  }

  const confirmDelete = async () => {
    const selectedIds = sharedAudiences.filter((a) => a.selected).map((a) => a.id)

    try {
      const response = await fetch('/api/shared-audiences', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })

      if (!response.ok) throw new Error('Failed to delete')

      removeSharedAudiences(selectedIds)
    } catch (error) {
      console.error('Error deleting shared audiences:', error)
      // Fallback: remove locally
      removeSharedAudiences(selectedIds)
    }

    setDeleteConfirmation(false)
  }

  const handleExportCsv = () => {
    const csv = exportSelectedAsCsv()

    if (!csv) {
      alert('No contacts to export')
      return
    }

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shared-audiences-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSelectAll = (checked: boolean) => {
    // Only select/deselect filtered audiences
    const filteredIds = filteredAudiences.map((a) => a.id)
    sharedAudiences.forEach((audience) => {
      if (filteredIds.includes(audience.id) && audience.selected !== checked) {
        toggleSelectOne(audience.id)
      }
    })
  }

  const handleUploadMeta = async () => {
    const selectedIds = sharedAudiences.filter((a) => a.selected).map((a) => a.id)

    if (selectedIds.length === 0) {
      alert('Please select at least one audience')
      return
    }

    if (!confirm(`Upload ${getSelectedCount()} audience(s) with ${totalSelectedContacts} contacts to Meta Ads?`)) {
      return
    }

    setIsUploading(true)

    try {
      const response = await fetch('/api/upload-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharedAudienceIds: selectedIds }),
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()

      // Reload audiences to get updated status
      await loadSharedAudiences()

      const successCount = data.results.filter((r: any) => r.success).length
      alert(`Upload completed! ${successCount}/${data.results.length} audiences uploaded successfully.`)
    } catch (error) {
      console.error('Error uploading to Meta:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const totalSelectedContacts = sharedAudiences
    .filter((a) => a.selected)
    .reduce((sum, a) => sum + a.contacts.length, 0)

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            {getSelectedCount()} of {filteredAudiences.length} selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground mr-4">
            <span className="font-medium text-foreground">{getSelectedContactsCount()}</span> selected contacts
            <span className="mx-2">•</span>
            <span className="font-medium text-foreground">{getTotalContactsCount()}</span> total contacts
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search audiences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={handleExportCsv}
            disabled={getSelectedCount() === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="default"
            onClick={handleUploadMeta}
            disabled={getSelectedCount() === 0 || isUploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload to Meta'}
          </Button>
          {someSelected && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({getSelectedCount()})
            </Button>
          )}
        </div>
      </div>

      {/* Selection Info */}
      {someSelected && (
        <Alert className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
          <AlertCircle className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-800 dark:text-purple-200 flex items-center justify-between">
            <span>
              {getSelectedCount()} audience(s) selected with {totalSelectedContacts} contacts
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleExportCsv}
              >
                Export CSV
              </Button>
              <Button
                size="sm"
                onClick={handleUploadMeta}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? 'Uploading...' : 'Upload to Meta'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {filteredAudiences.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchQuery ? 'No audiences match your search' : 'No shared audiences yet'}
          </div>
          {!searchQuery && (
            <div className="max-w-md mx-auto">
              <p className="text-sm text-muted-foreground mb-4">
                Shared audiences will appear here after you run a search on your source audiences.
              </p>
              <Button onClick={() => (window.location.href = '/source-audiences')}>
                Go to Source Audiences
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Audience Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAudiences.map((audience) => (
          <SharedAudienceCard
            key={audience.id}
            audience={audience}
            selected={audience.selected}
            onToggleSelect={() => toggleSelectOne(audience.id)}
            onDelete={() => {
              toggleSelectOne(audience.id)
              handleDelete()
            }}
          />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Confirm Deletion</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete {getSelectedCount()} audience(s) with {totalSelectedContacts} contacts?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmation(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
