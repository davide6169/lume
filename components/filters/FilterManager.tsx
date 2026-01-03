'use client'

import { useState, useEffect } from 'react'
import { useFiltersStore } from '@/lib/stores/useFiltersStore'
import { FilterBuilder } from './FilterBuilder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Save, Trash2, Upload, Download } from 'lucide-react'
import type { Filter, FilterRule } from '@/types'

export function FilterManager() {
  const {
    filters,
    setFilters,
    addFilter,
    updateFilter,
    removeFilter,
    exportAsJson,
    importFromJson,
  } = useFiltersStore()

  const [currentRules, setCurrentRules] = useState<FilterRule[]>([])
  const [currentFilterName, setCurrentFilterName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleSaveFilter = async () => {
    if (!currentFilterName.trim()) {
      alert('Please enter a filter name')
      return
    }

    if (currentRules.length === 0) {
      alert('Please add at least one rule')
      return
    }

    const newFilter: Omit<Filter, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      name: currentFilterName,
      rules: currentRules,
    }

    try {
      const response = await fetch('/api/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFilter),
      })

      if (!response.ok) throw new Error('Failed to save filter')

      const saved = await response.json()
      addFilter(saved)

      // Reset
      setCurrentRules([])
      setCurrentFilterName('')
      setShowSaveDialog(false)
    } catch (error) {
      console.error('Error saving filter:', error)
      // Fallback: save locally
      const tempFilter: Filter = {
        ...newFilter,
        id: crypto.randomUUID(),
        userId: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      addFilter(tempFilter)
      setCurrentRules([])
      setCurrentFilterName('')
      setShowSaveDialog(false)
    }
  }

  const handleLoadFilter = (filter: Filter) => {
    setCurrentRules(filter.rules)
    setCurrentFilterName(filter.name)
  }

  const handleDeleteFilter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this filter?')) return

    try {
      const response = await fetch(`/api/filters?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete filter')

      removeFilter(id)
    } catch (error) {
      console.error('Error deleting filter:', error)
      // Fallback: remove locally
      removeFilter(id)
    }
  }

  const handleExport = () => {
    const json = exportAsJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `filters-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    if (!importJson.trim()) return

    const success = importFromJson(importJson)
    if (success) {
      setShowImportDialog(false)
      setImportJson('')
      // TODO: Sync with server
    } else {
      alert('Invalid JSON format')
    }
  }

  const filteredFilters = filters.filter((filter) =>
    filter.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search filters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Current Filter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Filter</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-name">Filter Name</Label>
                  <Input
                    id="filter-name"
                    placeholder="My Filter"
                    value={currentFilterName}
                    onChange={(e) => setCurrentFilterName(e.target.value)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  This filter has {currentRules.length} rule{currentRules.length !== 1 ? 's' : ''}
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveFilter}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={filters.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filter Builder */}
      <Card className="p-6">
        <FilterBuilder rules={currentRules} onChange={setCurrentRules} />
      </Card>

      {/* Saved Filters */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Saved Filters</h2>
        {filteredFilters.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No filters match your search' : 'No saved filters yet'}
            </p>
            {!searchQuery && (
              <p className="text-sm text-muted-foreground">
                Create a filter above and save it to use it later
              </p>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFilters.map((filter) => (
              <Card key={filter.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{filter.name}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFilter(filter.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {filter.rules.length} rule{filter.rules.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleLoadFilter(filter)}>
                    Load
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => {
                      handleLoadFilter(filter)
                      // Apply filter logic would go here
                      alert(`Filter "${filter.name}" loaded! Ready to apply to shared audiences.`)
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Import Filters</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Paste your JSON export below to import filters.
            </p>
            <textarea
              className="w-full h-48 p-3 border rounded-lg font-mono text-sm"
              placeholder='{"filters": [{"name": "My Filter", "rules": [...]}]}'
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!importJson.trim()}>
                Import
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
