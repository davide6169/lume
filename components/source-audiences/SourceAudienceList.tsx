'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSourceAudiencesStore } from '@/lib/stores/useSourceAudiencesStore'
import { useSharedAudiencesStore } from '@/lib/stores/useSharedAudiencesStore'
import { useDemoStore } from '@/lib/stores/useDemoStore'
import { useSettingsStore } from '@/lib/stores/useSettingsStore'
import { useSupabase } from '@/components/providers/supabase-provider'
import { SourceAudienceCard } from './SourceAudienceCard'
import { CreateSourceAudienceDialog } from './CreateSourceAudienceDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
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

  const { profile } = useSupabase()

  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobProgress, setJobProgress] = useState(0)
  const [jobStats, setJobStats] = useState({
    completedSources: 0,
    totalSources: 0,
    totalUrls: 0,
    totalContacts: 0
  })
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const [hasRealAudiences, setHasRealAudiences] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [exportDialog, setExportDialog] = useState(false)
  const [exportFileName, setExportFileName] = useState(`source-audiences-${new Date().toISOString().split('T')[0]}.json`)

  // Use demo or real audiences based on mode
  const audiences = isDemoMode ? demoSourceAudiences : sourceAudiences

  // Check if there are real audiences in DB on mount
  useEffect(() => {
    checkRealAudiences()

    // Check for any in-progress job when component mounts
    const checkInProgressJob = async () => {
      const savedJobId = sessionStorage.getItem('current_search_job_id')
      if (savedJobId) {
        console.log('[Frontend] Found in-progress job:', savedJobId)
        setJobId(savedJobId)
        setIsSearching(true)

        // Check job status
        try {
          const response = await fetch(`/api/jobs/${savedJobId}`, {
            credentials: 'include'
          })
          if (response.ok) {
            const jobData = await response.json()

            if (jobData.status === 'completed') {
              console.log('[Frontend] Job was completed while away, processing result')
              sessionStorage.removeItem('current_search_job_id')

              // Process the completed job result (inline code to avoid ordering issues)

              // First, update progress to 100% so UI shows it
              setJobProgress(100)

              // Small delay to ensure UI updates with 100% before showing toast
              await new Promise(resolve => setTimeout(resolve, 500))

              setIsSearching(false)
              setJobId(null)

              // Create log entry for completed job
              const createJobLog = async () => {
                const userId = profile?.id || 'unknown'
                const logEntry = {
                  userId,
                  level: 'info' as const,
                  message: `Search job completed - Found ${jobData.result?.data?.totalContacts || 0} contacts from ${jobData.result?.data?.sharedAudiences?.length || 0} audience(s)`,
                  metadata: {
                    jobId: jobData.id,
                    jobType: jobData.type,
                    status: jobData.status,
                    progress: jobData.progress,
                    timeline: jobData.timeline,
                    result: {
                      totalContacts: jobData.result?.data?.totalContacts,
                      sharedAudiencesCreated: jobData.result?.data?.sharedAudiences?.length || 0,
                      totalCost: jobData.result?.data?.totalCost
                    }
                  }
                }

                try {
                  // In demo mode, add to demo store
                  if (isDemoMode) {
                    const { addDemoLog } = useDemoStore.getState()
                    addDemoLog(logEntry)
                  } else {
                    // In production mode, save to database
                    await fetch('/api/logs', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify(logEntry)
                    })
                  }
                } catch (error) {
                  console.error('Error creating job log:', error)
                }
              }

              // Create log entry
              createJobLog()

              // In demo mode, add shared audiences to store
              if (isDemoMode && jobData.result?.data?.sharedAudiences) {
                const { addDemoSharedAudience, demoSharedAudiences, addCost, clearCosts } = useDemoStore.getState()

                // Clear previous costs for this job
                clearCosts()

                for (const sharedAudience of jobData.result.data.sharedAudiences) {
                  // Check if already exists
                  const existing = demoSharedAudiences.find(sa => sa.sourceAudienceId === sharedAudience.sourceAudienceId)
                  if (existing) {
                    // Update existing
                    useDemoStore.getState().updateDemoSharedAudience?.(existing.id, {
                      contacts: sharedAudience.contacts,
                      selected: true,
                      updatedAt: new Date()
                    })
                  } else {
                    // Add new
                    addDemoSharedAudience(sharedAudience)
                  }
                }

                // Add costs from job result
                if (jobData.result.data.costBreakdown) {
                  for (const cost of jobData.result.data.costBreakdown) {
                    addCost(cost)
                  }
                }

                const totalContacts = jobData.result.data.sharedAudiences.reduce(
                  (sum: number, sa: any) => sum + sa.contacts.length,
                  0
                )

                const totalCost = jobData.result.data.totalCost || 0
                addToast('Search Complete', `Found ${totalContacts} contacts from ${jobData.result.data.sharedAudiences.length} audience(s). Cost: $${totalCost.toFixed(4)}. Check Shared Audiences to view results.`)

                // Deselect all source audiences
                deselectAllDemoSourceAudiences()

                // Redirect to Shared Audiences after a short delay
                setTimeout(() => {
                  router.push('/shared-audiences')
                }, 1500)
              } else {
                addToast('Search Complete', 'Search completed successfully. Check Shared Audiences to view results.')

                // Redirect to Shared Audiences after a short delay
                setTimeout(() => {
                  router.push('/shared-audiences')
                }, 1500)
              }
            } else if (jobData.status === 'failed') {
              console.log('[Frontend] Job failed while away')
              setIsSearching(false)
              setJobId(null)
              sessionStorage.removeItem('current_search_job_id')
            } else {
              console.log('[Frontend] Job still in progress, resuming polling')
              setJobProgress(jobData.progress)
              // Start polling will be handled by the useEffect below
            }
          }
        } catch (error) {
          console.error('[Frontend] Error checking job status:', error)
          setIsSearching(false)
          setJobId(null)
          sessionStorage.removeItem('current_search_job_id')
        }
      }
    }

    checkInProgressJob()

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
  }, [router])

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

    setIsSearching(true)
    setJobProgress(0)

    try {
      // Start async job (works in both demo and production mode)
      const selectedAudiences = audiences.filter((a) => a.selected)

      // Get API keys and settings from settings store (for production mode)
      const { apiKeys, maxItemsFacebook, maxItemsInstagram } = useSettingsStore.getState()

      const requestBody: any = {
        sourceAudienceIds: selectedIds,
        mode: isDemoMode ? 'demo' : 'production'
      }

      // In production mode, pass API keys securely and scraping limits
      if (!isDemoMode) {
        requestBody.apiKeys = {
          apify: apiKeys.apify,
          apollo: apiKeys.apollo,
          hunter: apiKeys.hunter,
          openrouter: apiKeys.openrouter,
          mixedbread: apiKeys.mixedbread,
          meta: apiKeys.meta
        }
        requestBody.scrapingLimits = {
          facebook: maxItemsFacebook,
          instagram: maxItemsInstagram
        }
        console.log('[Frontend] Production mode - sending API keys for services:', Object.keys(requestBody.apiKeys).filter(k => requestBody.apiKeys[k]))
        console.log('[Frontend] Production mode - scraping limits:', requestBody.scrapingLimits)
      }

      // In demo mode, pass the audience data directly (they're in the store, not DB)
      if (isDemoMode) {
        requestBody.sourceAudiences = selectedAudiences.map(sa => ({
          id: sa.id,
          name: sa.name,
          type: sa.type,
          urls: sa.urls
        }))
        console.log('[Frontend] Sending demo mode request with audiences:', requestBody.sourceAudiences.length)
      }

      console.log('[Frontend] Request body:', JSON.stringify(requestBody, null, 2))

      const response = await fetch('/api/source-audiences/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error starting job:', errorText)
        throw new Error('Failed to start search job')
      }

      const data = await response.json()
      const { jobId: newJobId } = data

      console.log('[Frontend] Job started:', newJobId)
      setJobId(newJobId)

      // Reset job statistics
      setJobStats({
        completedSources: 0,
        totalSources: 0,
        totalUrls: 0,
        totalContacts: 0
      })

      // Save job ID to sessionStorage for persistence across navigation
      sessionStorage.setItem('current_search_job_id', newJobId)

      // Start polling job status
      pollJobStatus(newJobId)
    } catch (error) {
      console.error('Error starting search:', error)
      addToast('Search Failed', 'Failed to start search job', 'destructive')
      setIsSearching(false)
      setJobId(null)
      setJobProgress(0)
    }
  }

  // Extract job statistics from timeline
  const extractJobStats = (jobData: any) => {
    const stats = {
      completedSources: 0,
      totalSources: 0,
      totalUrls: 0,
      totalContacts: 0
    }

    // Get total sources from initial SEARCH_STARTED event
    const startedEvent = jobData.timeline?.find((e: any) => e.event === 'SEARCH_STARTED')
    if (startedEvent?.details?.audiencesCount) {
      stats.totalSources = startedEvent.details.audiencesCount
    }

    // Count completed sources and gather URLs/contacts from timeline
    jobData.timeline?.forEach((event: any) => {
      if (event.event === 'AUDIENCE_PROCESSING_COMPLETED') {
        stats.completedSources++
        if (event.details?.contactsFound) {
          stats.totalContacts += event.details.contactsFound
        }
      }

      // Track URLs processed from LLM_EXTRACTION_COMPLETED events
      if (event.event === 'LLM_EXTRACTION_COMPLETED') {
        stats.totalUrls++
      }
    })

    return stats
  }

  // Handle job completion - extracted for reusability
  const handleJobCompletion = useCallback(async (jobData: any) => {
    console.log('[Frontend] Job completed!')

    // First, update progress to 100% so UI shows it
    setJobProgress(100)

    // Small delay to ensure UI updates with 100% before showing toast
    await new Promise(resolve => setTimeout(resolve, 500))

    setIsSearching(false)
    setJobId(null)

    // Clear sessionStorage
    sessionStorage.removeItem('current_search_job_id')

    // Create log entry for completed job
    const createJobLog = async () => {
      const userId = profile?.id || 'unknown'

      const logEntry = {
        userId,
        level: 'info' as const,
        message: `Search Job Completed - ${jobData.result?.data?.totalContacts || 0} contacts found`,
        metadata: {
          jobId: jobData.id,
          jobType: jobData.type,
          status: jobData.status,
          progress: jobData.progress,
          timeline: jobData.timeline,
          result: {
            totalContacts: jobData.result?.data?.totalContacts,
            sharedAudiencesCreated: jobData.result?.data?.sharedAudiences?.length || 0
          }
        }
      }

      try {
        // In demo mode, add to demo store
        if (isDemoMode) {
          const { addDemoLog } = useDemoStore.getState()
          addDemoLog(logEntry)
        } else {
          // In production mode, save to database
          await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(logEntry)
          })
        }
      } catch (error) {
        console.error('Error creating job log:', error)
      }
    }

    // Create log entry
    createJobLog()

    // Create shared audiences in demo store
    if (isDemoMode && jobData.result?.data?.sharedAudiences) {
      const { addDemoSharedAudience, demoSharedAudiences, addCost, clearCosts } = useDemoStore.getState()

      // Clear previous costs for this job
      clearCosts()

      for (const sharedAudience of jobData.result.data.sharedAudiences) {
        // Check if already exists
        const existing = demoSharedAudiences.find(sa => sa.sourceAudienceId === sharedAudience.sourceAudienceId)
        if (existing) {
          // Update existing
          useDemoStore.getState().updateDemoSharedAudience?.(existing.id, {
            contacts: sharedAudience.contacts,
            selected: true,
            updatedAt: new Date()
          })
        } else {
          // Add new
          addDemoSharedAudience(sharedAudience)
        }
      }

      // Add costs from job result
      if (jobData.result.data.costBreakdown) {
        for (const cost of jobData.result.data.costBreakdown) {
          addCost(cost)
        }
      }

      const totalContacts = jobData.result.data.sharedAudiences.reduce(
        (sum: number, sa: any) => sum + sa.contacts.length,
        0
      )

      const totalCost = jobData.result.data.totalCost || 0
      addToast('Search Complete', `Found ${totalContacts} contacts from ${jobData.result.data.sharedAudiences.length} audience(s). Cost: $${totalCost.toFixed(4)}. Check Shared Audiences to view results.`)

      // Deselect all source audiences
      deselectAllDemoSourceAudiences()

      // Redirect to Shared Audiences after a short delay
      setTimeout(() => {
        router.push('/shared-audiences')
      }, 1500)
    } else {
      addToast('Search Complete', 'Search completed successfully. Check Shared Audiences to view results.')

      // Redirect to Shared Audiences after a short delay
      setTimeout(() => {
        router.push('/shared-audiences')
      }, 1500)
    }

    // Stop polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [isDemoMode, deselectAllDemoSourceAudiences, addToast, profile, router])

  // Poll job status
  const pollJobStatus = useCallback(async (jobIdToPoll: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobIdToPoll}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        console.error('Error fetching job status')
        return
      }

      const jobData = await response.json()
      console.log('[Frontend] Job status:', jobData.status, 'Progress:', jobData.progress)

      setJobProgress(jobData.progress)

      // Extract and update job statistics
      const stats = extractJobStats(jobData)
      setJobStats(stats)

      if (jobData.status === 'completed') {
        handleJobCompletion(jobData)
      } else if (jobData.status === 'failed') {
        console.error('[Frontend] Job failed:', jobData.result?.error)
        addToast('Search Failed', jobData.result?.error || 'Search job failed', 'destructive')
        setIsSearching(false)
        setJobId(null)
        setJobProgress(0)
        sessionStorage.removeItem('current_search_job_id')

        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
      }
      // If still processing, continue polling
    } catch (error) {
      console.error('Error polling job status:', error)
    }
  }, [isDemoMode, deselectAllDemoSourceAudiences, addToast, handleJobCompletion, profile])

  // Start polling when jobId changes
  useEffect(() => {
    if (jobId && isSearching) {
      // Poll every 2 seconds
      pollingRef.current = setInterval(() => {
        if (jobId) {
          pollJobStatus(jobId)
        }
      }, 2000)
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [jobId, isSearching, pollJobStatus])

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

      {/* Progress Bar - shown when searching */}
      {isSearching && jobId && (
        <div className="bg-muted/50 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Processing Search...</span>
            <span className="text-sm text-muted-foreground">{jobProgress}%</span>
          </div>
          <Progress value={jobProgress} className="h-2" />

          {/* Job Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {jobStats.completedSources}/{jobStats.totalSources}
              </div>
              <div className="text-xs text-muted-foreground">Sources</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {jobStats.totalUrls}
              </div>
              <div className="text-xs text-muted-foreground">URLs Processed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {jobStats.totalContacts}
              </div>
              <div className="text-xs text-muted-foreground">Contacts Found</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {jobStats.totalSources - jobStats.completedSources}
              </div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            You can continue using the app. Results will appear in Shared Audiences when complete.
            Check the Logs page for detailed progress.
          </p>
        </div>
      )}

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
