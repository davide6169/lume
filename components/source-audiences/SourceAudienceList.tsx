'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSourceAudiencesStore } from '@/lib/stores/useSourceAudiencesStore'
import { useSharedAudiencesStore } from '@/lib/stores/useSharedAudiencesStore'
import { useDemoStore } from '@/lib/stores/useDemoStore'
import { SourceAudienceCard } from './SourceAudienceCard'
import { CreateSourceAudienceDialog } from './CreateSourceAudienceDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, Upload, Download, Search, Sparkles, CheckCircle } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SourceAudience, SharedAudience } from '@/types'

export function SourceAudienceList() {
  const router = useRouter()
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; description?: string; variant?: 'default' | 'destructive' }>>([])
  const [confirmationModal, setConfirmationModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)

  const addToast = (title: string, description?: string, variant?: 'default' | 'destructive') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, title, description, variant }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmationModal({ title, message, onConfirm })
  }
  const {
    sourceAudiences,
    setSourceAudiences,
    addSourceAudience,
    removeSourceAudiences,
    toggleSelectAll,
    toggleSelectOne,
    getSelectedCount,
    getTotalUrlsCount,
    getSelectedUrlsCount,
    exportAsJson,
  } = useSourceAudiencesStore()

  const { setSharedAudiences } = useSharedAudiencesStore()

  const {
    demoSourceAudiences,
    addDemoSourceAudience,
    clearDemoSourceAudiences,
    clearDemoSharedAudiences,
    deselectAllDemoSourceAudiences,
    toggleDemoSourceAudienceSelection,
    isDemoMode,
    setIsDemoMode,
  } = useDemoStore()

  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [hasRealAudiences, setHasRealAudiences] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [exportDialog, setExportDialog] = useState(false)
  const [exportFileName, setExportFileName] = useState(`source-audiences-${new Date().toISOString().split('T')[0]}.json`)

  // Use demo or real audiences based on mode
  const audiences = isDemoMode ? demoSourceAudiences : sourceAudiences

  // Check if there are real audiences in DB on mount
  useEffect(() => {
    checkRealAudiences()
    if (isDemoMode) {
      // Load demo data on mount if in demo mode
      if (demoSourceAudiences.length === 0) {
        loadDemoData()
      }
    } else {
      // Load real data on mount if not in demo mode
      loadAudiences()
      loadSharedAudiences()
    }
  }, [])

  const checkRealAudiences = async () => {
    try {
      const response = await fetch('/api/source-audiences')
      if (response.ok) {
        const data = await response.json()
        const hasAudiences = data.sourceAudiences && data.sourceAudiences.length > 0
        setHasRealAudiences(hasAudiences)
      }
    } catch (error) {
      console.error('Error checking audiences:', error)
    }
  }

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

  const loadDemoData = () => {
    // Clear existing demo source audiences
    clearDemoSourceAudiences()

    // Define all demo audiences with new IDs
    const allDemoAudiences: SourceAudience[] = [
      {
        id: crypto.randomUUID(),
        userId: '',
        name: 'Facebook Tech Groups',
        type: 'facebook',
        urls: [
          'https://www.facebook.com/groups/tech.startups.milan',
          'https://www.facebook.com/groups/italian.tech.community',
          'https://www.facebook.com/groups/developers.italy',
          'https://www.facebook.com/groups/ai.machinelearning.italia',
          'https://www.facebook.com/groups/blockchain.developers.milan',
        ],
        selected: true,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        userId: '',
        name: 'Instagram Business Pages',
        type: 'instagram',
        urls: [
          'https://www.instagram.com/techstartupmilano',
          'https://www.instagram.com/innovationhub.rome',
          'https://www.instagram.com/digitalbusiness.it',
        ],
        selected: true,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        userId: '',
        name: 'Facebook Local Communities',
        type: 'facebook',
        urls: [
          'https://www.facebook.com/groups/milano.iniziative.imprenditoriali',
          'https://www.facebook.com/groups/napoli.startup.scene',
          'https://www.facebook.com/groups/torino.tech.innovation',
        ],
        selected: true,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    // Add all demo audiences
    allDemoAudiences.forEach((audience) => addDemoSourceAudience(audience))
  }

  const handleToggleDemoMode = (enabled: boolean) => {
    setIsDemoMode(enabled)
    if (!enabled) {
      // Disabling demo mode: load real data from database
      loadAudiences()
      loadSharedAudiences()
    } else {
      // Enabling demo mode: reset and load demo data
      clearDemoSharedAudiences()
      loadDemoData()
    }
  }

  // Filter audiences based on search query
  const filteredAudiences = audiences.filter((audience) =>
    audience.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    audience.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const allSelected = filteredAudiences.length > 0 && filteredAudiences.every((a) => a.selected)
  const someSelected = filteredAudiences.some((a) => a.selected)

  // Calculate counters based on current mode (demo or real)
  const selectedCount = filteredAudiences.filter((a) => a.selected).length
  const selectedUrlsCount = audiences.filter((a) => a.selected).reduce((sum, a) => sum + a.urls.length, 0)
  const totalUrlsCount = audiences.reduce((sum, a) => sum + a.urls.length, 0)

  // Wrapper function for toggle that uses the correct store based on demo mode
  const handleToggleSelect = (id: string) => {
    if (isDemoMode) {
      toggleDemoSourceAudienceSelection(id)
    } else {
      toggleSelectOne(id)
    }
  }

  const handleCreate = async (data: { name: string; type: 'facebook' | 'instagram'; urls: string[] }) => {
    const newAudience: Omit<SourceAudience, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      name: data.name,
      type: data.type,
      urls: data.urls,
      selected: true, // Auto-select on creation
      status: 'pending',
    }

    // If demo mode, create locally without API call
    if (isDemoMode) {
      const demoAudience: SourceAudience = {
        ...newAudience,
        id: crypto.randomUUID(),
        userId: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      addDemoSourceAudience(demoAudience)
      return
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

      // Update hasRealAudiences after first creation
      setHasRealAudiences(true)
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

    const selectedIds = audiences.filter((a) => a.selected).map((a) => a.id)

    if (isDemoMode) {
      // In demo mode, just remove from local state
      const { removeDemoSourceAudience } = useDemoStore.getState()
      selectedIds.forEach(id => removeDemoSourceAudience(id))
      setDeleteConfirmation(null)
      return
    }

    try {
      const response = await fetch('/api/source-audiences', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })

      if (!response.ok) throw new Error('Failed to delete')

      removeSourceAudiences(selectedIds)

      // Check if there are still audiences
      const remaining = sourceAudiences.filter(a => !selectedIds.includes(a.id))
      setHasRealAudiences(remaining.length > 0)
    } catch (error) {
      console.error('Error deleting audiences:', error)
      // Fallback: remove locally
      removeSourceAudiences(selectedIds)
    }

    setDeleteConfirmation(null)
  }

  const handleExport = () => {
    setExportFileName(`source-audiences-${new Date().toISOString().split('T')[0]}.json`)
    setExportDialog(true)
  }

  const confirmExport = () => {
    const json = exportAsJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFileName
    a.click()
    URL.revokeObjectURL(url)
    setExportDialog(false)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.sourceAudiences || !Array.isArray(data.sourceAudiences)) {
        addToast('Invalid JSON', 'The file format is not valid.', 'destructive')
        return
      }

      // In demo mode, add to demo store directly
      if (isDemoMode) {
        for (const audience of data.sourceAudiences) {
          const demoAudience: SourceAudience = {
            id: crypto.randomUUID(),
            userId: '',
            name: audience.name,
            type: audience.type,
            urls: audience.urls,
            selected: true,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          addDemoSourceAudience(demoAudience)
        }
        addToast('Import Complete', `Successfully imported ${data.sourceAudiences.length} audience(s) to demo.`)
      } else {
        // Import each audience to the database
        let importedCount = 0
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
              importedCount++
            }
          } catch (error) {
            console.error('Error importing audience:', error)
          }
        }

        // Reload from database after import
        await loadAudiences()
        setHasRealAudiences(true)

        addToast('Import Complete', `Successfully imported ${importedCount}/${data.sourceAudiences.length} audience(s).`)
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch {
      addToast('Invalid JSON', 'The file format is not valid.', 'destructive')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    // Only select/deselect filtered audiences
    const filteredIds = filteredAudiences.map((a) => a.id)
    audiences.forEach((audience) => {
      if (filteredIds.includes(audience.id) && audience.selected !== checked) {
        handleToggleSelect(audience.id)
      }
    })
  }

  const handleSearch = async () => {
    const selectedIds = audiences.filter((a) => a.selected).map((a) => a.id)

    if (selectedIds.length === 0) {
      addToast('No Selection', 'Please select at least one audience', 'destructive')
      return
    }

    // In demo mode, simulate search without API call
    if (isDemoMode) {
      setIsSearching(true)

      const startTime = new Date().toISOString()
      const timeline: Array<{ timestamp: string; event: string; details?: any }> = []
      const selectedAudiences = audiences.filter((a) => a.selected)

      // Create request payload
      const requestPayload = {
        sourceAudienceIds: selectedIds,
        mode: 'demo',
        timestamp: startTime
      }

      timeline.push({
        timestamp: startTime,
        event: 'SEARCH_STARTED',
        details: {
          audiencesCount: selectedIds.length,
          totalUrls: selectedAudiences.reduce((sum, a) => sum + a.urls.length, 0)
        }
      })

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Create demo shared audiences for each selected source audience
      const { addDemoSharedAudience, updateDemoSharedAudience, demoSharedAudiences } = useDemoStore.getState()

      for (const sourceAudience of selectedAudiences) {
        const processingTime = new Date().toISOString()

        // Simulate API request/response for this audience
        const apiRequest = {
          endpoint: '/api/source-audiences/search',
          method: 'POST',
          body: {
            sourceAudienceId: sourceAudience.id,
            urls: sourceAudience.urls
          }
        }

        const contactsPerUrl = 3
        const contactCount = sourceAudience.urls.length * contactsPerUrl

        // Simulate API response
        const apiResponse = {
          status: 200,
          body: {
            sourceAudienceId: sourceAudience.id,
            status: 'completed',
            contactsFound: contactCount,
            urlsProcessed: sourceAudience.urls.length,
            processingTimeMs: Math.floor(Math.random() * 2000) + 500
          }
        }

        timeline.push({
          timestamp: processingTime,
          event: 'AUDIENCE_PROCESSING',
          details: {
            audienceName: sourceAudience.name,
            audienceId: sourceAudience.id,
            urlCount: sourceAudience.urls.length,
            request: apiRequest,
            response: apiResponse
          }
        })

        const demoContacts = Array.from({ length: contactCount }, (_, i) => ({
          firstName: `FirstName${i + 1}`,
          lastName: `LastName${i + 1}`,
          email: `contact${i + 1}@example.com`,
          phone: `+12345678${(i + 1).toString().padStart(2, '0')}`,
          city: 'Milan',
          country: 'Italy',
          interests: ['technology', 'business', 'marketing'].slice(0, Math.floor(Math.random() * 3) + 1),
        }))

        // Check if a shared audience already exists for this source
        const existingShared = demoSharedAudiences.find(sa => sa.sourceAudienceId === sourceAudience.id)

        if (existingShared) {
          // Update existing shared audience with new contacts
          updateDemoSharedAudience(existingShared.id, {
            contacts: demoContacts,
            selected: true,
            updatedAt: new Date(),
          })
        } else {
          // Create new shared audience
          const sharedAudience: SharedAudience = {
            id: crypto.randomUUID(),
            userId: '',
            sourceAudienceId: sourceAudience.id,
            sourceAudienceType: sourceAudience.type,
            name: sourceAudience.name,
            contacts: demoContacts,
            selected: true,
            uploadedToMeta: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          addDemoSharedAudience(sharedAudience)
        }

        timeline.push({
          timestamp: new Date().toISOString(),
          event: 'CONTACTS_EXTRACTED',
          details: {
            audienceName: sourceAudience.name,
            contactsCount: contactCount
          }
        })
      }

      const totalContacts = selectedAudiences.reduce((sum, a) => sum + (a.urls.length * 3), 0)
      const endTime = new Date().toISOString()

      const responsePayload = {
        status: 'completed',
        results: selectedAudiences.map(a => ({
          sourceAudienceId: a.id,
          sourceAudienceName: a.name,
          contactsFound: a.urls.length * 3,
          urlsProcessed: a.urls.length
        })),
        totalContacts,
        startTime,
        endTime
      }

      timeline.push({
        timestamp: endTime,
        event: 'SEARCH_COMPLETED',
        details: {
          totalContacts,
          durationMs: new Date(endTime).getTime() - new Date(startTime).getTime(),
          response: responsePayload
        }
      })

      // Create single log with full timeline
      try {
        const logEntry = {
          id: crypto.randomUUID(),
          level: 'info' as const,
          message: `Search completed: ${totalContacts} contacts from ${selectedAudiences.length} audience(s)`,
          created_at: new Date().toISOString(),
          metadata: {
            operation: 'SEARCH',
            mode: 'demo',
            timeline,
            request: requestPayload,
            response: responsePayload
          }
        }

        // In demo mode, save to store instead of API
        const { setDemoLogs, demoLogs } = useDemoStore.getState()
        setDemoLogs([...demoLogs, logEntry])
      } catch (error) {
        console.error('Failed to create demo log:', error)
      }

      showConfirmation('Search Complete', `Found ${totalContacts} contacts total.`, () => {
        // Deselect all source audiences after search
        deselectAllDemoSourceAudiences()
        // Navigate to shared audiences
        router.push('/shared-audiences')
      })

      setIsSearching(false)

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

      // Reload shared audiences to get the new/updated ones
      await loadSharedAudiences()

      const totalContacts = data.results.reduce((sum: number, r: any) => sum + r.contactsFound, 0)

      showConfirmation('Search Complete', `Found ${totalContacts} contacts total.`, () => {
        // Deselect all source audiences after search (in real mode, update each one)
        selectedIds.forEach(id => {
          const audience = sourceAudiences.find(a => a.id === id)
          if (audience && audience.selected) {
            toggleSelectOne(id)
          }
        })
        // Navigate to shared audiences
        router.push('/shared-audiences')
      })
    } catch (error) {
      console.error('Error searching:', error)
      addToast('Search Failed', 'Please try again', 'destructive')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Toggle */}

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
            {selectedCount} of {filteredAudiences.length} selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground mr-4">
            <span className="font-medium text-foreground">{selectedUrlsCount}</span> selected URLs
            <span className="mx-2">•</span>
            <span className="font-medium text-foreground">{totalUrlsCount}</span> total URLs
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
          <Button variant="outline" onClick={handleExport} disabled={audiences.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {someSelected && (
            <Button variant="destructive" onClick={() => setDeleteConfirmation('bulk')}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedCount})
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
              {selectedUrlsCount} URLs selected from {selectedCount} audience(s)
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
            onToggleSelect={() => handleToggleSelect(audience.id)}
            onDelete={() => handleDelete(audience.id)}
            totalSelectedUrls={selectedUrlsCount}
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
              Are you sure you want to delete {selectedCount} audience(s)? This action cannot be undone.
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
            <DialogTitle>Export Source Audiences</DialogTitle>
            <DialogDescription>
              Choose a filename for your export. The file will be saved in JSON format.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={exportFileName}
              onChange={(e) => setExportFileName(e.target.value)}
              placeholder="filename.json"
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
