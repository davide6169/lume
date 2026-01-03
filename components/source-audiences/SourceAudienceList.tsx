'use client'

import { useState, useEffect, useRef } from 'react'
import { useSourceAudiencesStore } from '@/lib/stores/useSourceAudiencesStore'
import { SourceAudienceCard } from './SourceAudienceCard'
import { CreateSourceAudienceDialog } from './CreateSourceAudienceDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, Upload, Download, Search } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import type { SourceAudience } from '@/types'

export function SourceAudienceList() {
  const {
    sourceAudiences,
    setSourceAudiences,
    addSourceAudience,
    updateSourceAudience,
    removeSourceAudiences,
    toggleSelectAll,
    toggleSelectOne,
    getSelectedCount,
    getTotalUrlsCount,
    getSelectedUrlsCount,
    exportAsJson,
    importFromJson,
  } = useSourceAudiencesStore()

  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load audiences from database on mount
  useEffect(() => {
    loadAudiences()
  }, [])

  const loadAudiences = async () => {
    try {
      const response = await fetch('/api/source-audiences')
      if (response.ok) {
        const data = await response.json()
        setSourceAudiences(data.sourceAudiences || [])
      }
    } catch (error) {
      console.error('Error loading audiences:', error)
    }
  }

  // Filter audiences based on search query
  const filteredAudiences = sourceAudiences.filter((audience) =>
    audience.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    audience.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const allSelected = filteredAudiences.length > 0 && filteredAudiences.every((a) => a.selected)
  const someSelected = filteredAudiences.some((a) => a.selected)

  const handleCreate = async (data: { name: string; type: 'facebook' | 'instagram'; urls: string[] }) => {
    const newAudience: Omit<SourceAudience, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      name: data.name,
      type: data.type,
      urls: data.urls,
      selected: true, // Auto-select on creation
      status: 'pending',
    }

    // Call API to create
    try {
      const response = await fetch('/api/source-audiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAudience),
      })

      if (!response.ok) throw new Error('Failed to create audience')

      const created = await response.json()
      addSourceAudience(created)
    } catch (error) {
      console.error('Error creating audience:', error)
      // For now, add locally (will be synced when we implement real API)
      const tempAudience: SourceAudience = {
        ...newAudience,
        id: crypto.randomUUID(),
        userId: '', // Will be set by server
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      addSourceAudience(tempAudience)
    }
  }

  const handleDelete = (id: string) => {
    setDeleteConfirmation(id)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmation) return

    const selectedIds = sourceAudiences.filter((a) => a.selected).map((a) => a.id)

    try {
      const response = await fetch('/api/source-audiences', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })

      if (!response.ok) throw new Error('Failed to delete')

      removeSourceAudiences(selectedIds)
    } catch (error) {
      console.error('Error deleting audiences:', error)
      // Fallback: remove locally
      removeSourceAudiences(selectedIds)
    }

    setDeleteConfirmation(null)
  }

  const handleExport = () => {
    const json = exportAsJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `source-audiences-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.sourceAudiences || !Array.isArray(data.sourceAudiences)) {
        alert('Invalid JSON format')
        return
      }

      // Import each audience to the database
      for (const audience of data.sourceAudiences) {
        try {
          const response = await fetch('/api/source-audiences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: audience.name,
              type: audience.type,
              urls: audience.urls,
            }),
          })

          if (!response.ok) {
            console.error('Failed to import audience:', audience.name)
          } else {
            const created = await response.json()
            addSourceAudience(created)
          }
        } catch (error) {
          console.error('Error importing audience:', error)
        }
      }

      alert(`Successfully imported ${data.sourceAudiences.length} audience(s)!`)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch {
      alert('Invalid JSON format')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    // Only select/deselect filtered audiences
    const filteredIds = filteredAudiences.map((a) => a.id)
    sourceAudiences.forEach((audience) => {
      if (filteredIds.includes(audience.id) && audience.selected !== checked) {
        toggleSelectOne(audience.id)
      }
    })
  }

  const handleSearch = async () => {
    const selectedIds = sourceAudiences.filter((a) => a.selected).map((a) => a.id)

    if (selectedIds.length === 0) {
      alert('Please select at least one audience')
      return
    }

    setIsSearching(true)

    try {
      const response = await fetch('/api/source-audiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceAudienceIds: selectedIds }),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error('Search failed')
      }

      const data = await response.json()

      // Reload audiences to get updated status
      await loadAudiences()

      alert(`Search completed! Found ${data.results.reduce((sum: number, r: any) => sum + r.contactsFound, 0)} contacts total.`)

      // Navigate to shared audiences
      window.location.href = '/shared-audiences'
    } catch (error) {
      console.error('Error searching:', error)
      alert('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

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
            <span className="font-medium text-foreground">{getSelectedUrlsCount()}</span> selected URLs
            <span className="mx-2">•</span>
            <span className="font-medium text-foreground">{getTotalUrlsCount()}</span> total URLs
          </div>
          <CreateSourceAudienceDialog onCreate={handleCreate} />
        </div>
      </div>

      {/* Search and Actions Bar */}
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
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={sourceAudiences.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {someSelected && (
            <Button variant="destructive" onClick={() => setDeleteConfirmation('bulk')}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({getSelectedCount()})
            </Button>
          )}
        </div>
      </div>

      {/* Search Action */}
      {someSelected && (
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <Search className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200 flex items-center justify-between">
            <span>
              {getSelectedUrlsCount()} URLs selected from {getSelectedCount()} audience(s)
            </span>
            <Button size="sm" className="ml-4" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Start Search'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {filteredAudiences.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchQuery ? 'No audiences match your search' : 'No source audiences yet'}
          </div>
          {!searchQuery && <CreateSourceAudienceDialog onCreate={handleCreate} />}
        </div>
      )}

      {/* Audience Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAudiences.map((audience) => (
          <SourceAudienceCard
            key={audience.id}
            audience={audience}
            selected={audience.selected}
            onToggleSelect={() => toggleSelectOne(audience.id)}
            onDelete={() => handleDelete(audience.id)}
            totalSelectedUrls={getSelectedUrlsCount()}
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
              Are you sure you want to delete {getSelectedCount()} audience(s)? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmation(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  )
}
