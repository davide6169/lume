'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSharedAudiencesStore } from '@/lib/stores/useSharedAudiencesStore'
import { useDemoStore } from '@/lib/stores/useDemoStore'
import { useFiltersStore } from '@/lib/stores/useFiltersStore'
import { SharedAudienceCard } from './SharedAudienceCard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Download, Upload, Sparkles, CheckCircle, Filter as FilterIcon } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { applyFilterRules } from '@/lib/utils/filters'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function SharedAudienceList() {
  const router = useRouter()
  const [confirmationModal, setConfirmationModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmationModal({ title, message, onConfirm })
  }
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

  const {
    demoSharedAudiences,
    clearDemoSharedAudiences,
    deselectAllDemoSharedAudiences,
    toggleDemoSharedAudienceSelection,
    isDemoMode,
    setIsDemoMode,
  } = useDemoStore()

  const {
    filters,
    activeFilterId,
    setActiveFilterId,
    setFilters,
  } = useFiltersStore()

  const [deleteConfirmation, setDeleteConfirmation] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; description?: string; variant?: 'default' | 'destructive' }>>([])
  const [exportDialog, setExportDialog] = useState(false)
  const [exportFileName, setExportFileName] = useState(`shared-audiences-${new Date().toISOString().split('T')[0]}.csv`)

  // Use demo or real audiences based on mode
  const audiences = isDemoMode ? demoSharedAudiences : sharedAudiences

  // Load filters on mount
  useEffect(() => {
    loadFilters()
  }, [])

  const loadFilters = async () => {
    try {
      const response = await fetch('/api/filters')
      if (response.ok) {
        const data = await response.json()
        setFilters(data.filters || [])
      }
    } catch (error) {
      console.error('Error loading filters:', error)
    }
  }

  // Get active filter
  const activeFilter = useMemo(() => {
    return filters.find(f => f.id === activeFilterId)
  }, [filters, activeFilterId])

  // Filter audiences based on active filter
  const filteredAudiences = useMemo(() => {
    if (!activeFilter || !activeFilter.rules || activeFilter.rules.length === 0) {
      return audiences
    }

    return audiences.map(audience => ({
      ...audience,
      contacts: applyFilterRules(audience.contacts, activeFilter.rules)
    }))
  }, [audiences, activeFilter])

  // Use filtered audiences for display and operations
  const displayAudiences = filteredAudiences

  // Calculate original contact counts for each audience
  const originalContactCounts = useMemo(() => {
    return audiences.reduce((acc, audience) => {
      acc[audience.id] = audience.contacts.length
      return acc
    }, {} as Record<string, number>)
  }, [audiences])

  // Check which audiences have been filtered (reduced contact count)
  const filteredAudienceIds = useMemo(() => {
    return displayAudiences
      .filter(a => a.contacts.length < originalContactCounts[a.id])
      .map(a => a.id)
  }, [displayAudiences, originalContactCounts])

  // When filter changes, deselect audiences with 0 contacts
  useEffect(() => {
    if (activeFilter) {
      displayAudiences.forEach(audience => {
        if (audience.contacts.length === 0 && audience.selected) {
          handleToggleSelect(audience.id)
        }
      })
    }
  }, [activeFilterId])

  // Debug: log when audiences change in demo mode
  useEffect(() => {
    if (isDemoMode && demoSharedAudiences.length > 0) {
      console.log('Demo shared audiences:', demoSharedAudiences.map(a => ({ name: a.name, selected: a.selected })))
    }
  }, [demoSharedAudiences, isDemoMode])

  // Load shared audiences from database on mount or when demo mode changes
  useEffect(() => {
    if (!isDemoMode) {
      loadSharedAudiences()
    }
    // If switching to demo mode, shared audiences are cleared by SourceAudienceList
  }, [isDemoMode])

  const addToast = (title: string, description?: string, variant?: 'default' | 'destructive') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, title, description, variant }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

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
  const searchFilteredAudiences = displayAudiences.filter((audience) =>
    audience.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const allSelected = searchFilteredAudiences.length > 0 && searchFilteredAudiences.every((a) => a.selected)
  const someSelected = searchFilteredAudiences.some((a) => a.selected)

  // Calculate counters based on current mode (demo or real) - using filtered contacts
  const selectedCount = searchFilteredAudiences.filter((a) => a.selected).length
  const selectedContactsCount = displayAudiences.filter((a) => a.selected).reduce((sum, a) => sum + a.contacts.length, 0)
  const totalContactsCount = displayAudiences.reduce((sum, a) => sum + a.contacts.length, 0)

  // Wrapper function for toggle that uses the correct store based on demo mode
  const handleToggleSelect = (id: string) => {
    if (isDemoMode) {
      toggleDemoSharedAudienceSelection(id)
    } else {
      toggleSelectOne(id)
    }
  }

  const handleDelete = () => {
    setDeleteConfirmation(true)
  }

  const confirmDelete = async () => {
    const selectedIds = audiences.filter((a) => a.selected).map((a) => a.id)

    if (isDemoMode) {
      // In demo mode, just remove from local state
      const { removeDemoSharedAudience } = useDemoStore.getState()
      selectedIds.forEach(id => removeDemoSharedAudience(id))
      addToast('Deleted', `Deleted ${selectedIds.length} audience(s) from demo.`)
      setDeleteConfirmation(false)
      return
    }

    try {
      const response = await fetch('/api/shared-audiences', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })

      if (!response.ok) throw new Error('Failed to delete')

      removeSharedAudiences(selectedIds)
      addToast('Success', `Deleted ${selectedIds.length} audience(s).`)
    } catch (error) {
      console.error('Error deleting shared audiences:', error)
      addToast('Error', 'Failed to delete audiences', 'destructive')
      // Fallback: remove locally
      removeSharedAudiences(selectedIds)
    }

    setDeleteConfirmation(false)
  }

  const handleExportCsv = () => {
    // Get selected audiences from displayAudiences (filtered by active filter)
    const selectedAudiences = displayAudiences.filter((a) => a.selected)

    if (selectedAudiences.length === 0) {
      addToast('Error', 'No contacts to export', 'destructive')
      return
    }

    // Show export dialog
    setExportFileName(`shared-audiences-${new Date().toISOString().split('T')[0]}.csv`)
    setExportDialog(true)
  }

  const confirmExport = () => {
    const selectedAudiences = displayAudiences.filter((a) => a.selected)

    // Generate CSV from selected audiences
    const headers = 'Email,FirstName,LastName,Phone,City,Country,Interests'
    const rows = selectedAudiences.flatMap((audience) =>
      audience.contacts.map((contact) =>
        [
          contact.email,
          contact.firstName,
          contact.lastName,
          contact.phone || '',
          contact.city || '',
          contact.country || '',
          contact.interests ? `"${contact.interests.join(', ')}"` : '',
        ].join(',')
      )
    )

    const csv = [headers, ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFileName
    a.click()
    URL.revokeObjectURL(url)
    addToast('Success', `Exported ${rows.length} contacts to CSV successfully.`)
    setExportDialog(false)
  }

  const handleSelectAll = (checked: boolean) => {
    // Only select/deselect filtered audiences
    const filteredIds = searchFilteredAudiences.map((a) => a.id)
    audiences.forEach((audience) => {
      if (filteredIds.includes(audience.id) && audience.selected !== checked) {
        handleToggleSelect(audience.id)
      }
    })
  }

  const handleUploadMeta = async () => {
    const selectedIds = audiences.filter((a) => a.selected).map((a) => a.id)

    if (selectedIds.length === 0) {
      addToast('Error', 'Please select at least one audience', 'destructive')
      return
    }

    // In demo mode, simulate upload
    if (isDemoMode) {
      setIsUploading(true)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Deselect all shared audiences after upload
      deselectAllDemoSharedAudiences()

      setIsUploading(false)
      showConfirmation('Upload Complete', `Successfully uploaded ${selectedIds.length} audience(s) with ${selectedContactsCount} contacts to Meta (demo).`, () => {
        // Do nothing - just confirmation
      })
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
      showConfirmation('Upload Complete', `${successCount}/${data.results.length} audiences uploaded successfully.`, () => {
        // Deselect all shared audiences after upload (in real mode, update each one)
        selectedIds.forEach(id => {
          const audience = sharedAudiences.find(a => a.id === id)
          if (audience && audience.selected) {
            toggleSelectOne(id)
          }
        })
      })
    } catch (error) {
      console.error('Error uploading to Meta:', error)
      addToast('Upload Failed', 'Please try again', 'destructive')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Active Filter Alert */}
      {activeFilter && (
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <FilterIcon className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200 flex items-center justify-between">
            <span>
              Active filter: <strong>{activeFilter.name}</strong> - {activeFilter.rules.length} rule{activeFilter.rules.length !== 1 ? 's' : ''} applied
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveFilterId(null)}
              className="ml-4"
            >
              Clear Filter
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg ${
              toast.variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-background border border-border'
            }`}
          >
            <div className="font-semibold">{toast.title}</div>
            {toast.description && (
              <div className="text-sm opacity-90">{toast.description}</div>
            )}
          </div>
        ))}
      </div>
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedCount} of {searchFilteredAudiences.length} selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground mr-4">
            <span className="font-medium text-foreground">{selectedContactsCount}</span> selected contacts
            <span className="mx-2">•</span>
            <span className="font-medium text-foreground">{totalContactsCount}</span> total contacts
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
          {/* Filter Selector */}
          <Select value={activeFilterId || 'none'} onValueChange={(value) => setActiveFilterId(value === 'none' ? null : value)}>
            <SelectTrigger className="w-48">
              <FilterIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Filter</SelectItem>
              {filters.map((filter) => (
                <SelectItem key={filter.id} value={filter.id}>
                  {filter.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={selectedCount === 0}
            className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
          <Button
            variant="default"
            onClick={handleUploadMeta}
            disabled={selectedCount === 0 || isUploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload to Meta'}
          </Button>
          {someSelected && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedCount})
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
              {selectedCount} audience(s) selected with {selectedContactsCount} contacts
              {activeFilter && filteredAudienceIds.length > 0 && (
                <span className="ml-2 text-purple-600 dark:text-purple-300">
                  ({filteredAudienceIds.length} filtered by active filter)
                </span>
              )}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleExportCsv}
              >
                Export to CSV
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
      {searchFilteredAudiences.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchQuery ? 'No audiences match your search' : 'No shared audiences yet'}
          </div>
          {!searchQuery && (
            <div className="max-w-md mx-auto">
              <p className="text-sm text-muted-foreground mb-4">
                Shared audiences will appear here after you run a search on your source audiences.
              </p>
              <Button onClick={() => router.push('/source-audiences')}>
                Go to Source Audiences
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Audience Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {searchFilteredAudiences.map((audience) => {
          const isFiltered = filteredAudienceIds.includes(audience.id)
          const hasNoContacts = audience.contacts.length === 0
          const originalCount = originalContactCounts[audience.id] || 0

          return (
            <SharedAudienceCard
              key={audience.id}
              audience={audience}
              selected={audience.selected}
              onToggleSelect={() => handleToggleSelect(audience.id)}
              onDelete={() => {
                handleToggleSelect(audience.id)
                handleDelete()
              }}
              isFiltered={isFiltered}
              hasNoContacts={hasNoContacts}
              originalContactCount={originalCount}
            />
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Confirm Deletion</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete {selectedCount} audience(s) with {selectedContactsCount} contacts?
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

      {/* Confirmation Modal */}
      {confirmationModal && (
        <Dialog open={!!confirmationModal} onOpenChange={() => setConfirmationModal(null)}>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <DialogTitle>{confirmationModal.title}</DialogTitle>
              </div>
            </DialogHeader>
            <DialogDescription className="text-base">
              {confirmationModal.message}
            </DialogDescription>
            <DialogFooter>
              <Button onClick={() => {
                confirmationModal?.onConfirm()
                setConfirmationModal(null)
              }}>
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Export Dialog */}
      <Dialog open={exportDialog} onOpenChange={setExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export to CSV</DialogTitle>
            <DialogDescription>
              Choose a filename for your export. The file will be saved in your browser's default download location.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={exportFileName}
              onChange={(e) => setExportFileName(e.target.value)}
              placeholder="filename.csv"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmExport}>
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
