'use client'

import { useState } from 'react'
import { useSettingsStore } from '@/lib/stores/useSettingsStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertCircle, Eye, EyeOff, Save, Download, Upload, FileText } from 'lucide-react'

const apiServices = [
  { key: 'meta' as const, name: 'Meta (Facebook/Instagram)', description: 'For accessing social media data' },
  { key: 'openrouter' as const, name: 'OpenRouter', description: 'LLM API for AI processing' },
  { key: 'mixedbread' as const, name: 'Mixedbread', description: 'Embeddings API for contact analysis' },
  { key: 'apollo' as const, name: 'Apollo.io', description: 'Contact data enrichment' },
  { key: 'hunter' as const, name: 'Hunter.io', description: 'Email verification and finding' },
] as const

export default function SettingsPage() {
  const {
    demoMode,
    setDemoMode,
    logsEnabled,
    setLogsEnabled,
    selectedLlmModel,
    setSelectedLlmModel,
    selectedEmbeddingModel,
    setSelectedEmbeddingModel,
    apiKeys,
    setApiKey,
    removeApiKey,
    exportSettings,
    importSettings,
  } = useSettingsStore()

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [tempKeys, setTempKeys] = useState(apiKeys)
  const [importJson, setImportJson] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [exportDialog, setExportDialog] = useState(false)
  const [exportFileName, setExportFileName] = useState(`lume-settings-${new Date().toISOString().split('T')[0]}.json`)

  const handleSaveKeys = () => {
    Object.entries(tempKeys).forEach(([service, key]) => {
      if (key) {
        setApiKey(service as keyof typeof apiKeys, key)
      }
    })
    setSaveMessage('Settings saved successfully!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleExport = () => {
    setExportFileName(`lume-settings-${new Date().toISOString().split('T')[0]}.json`)
    setExportDialog(true)
  }

  const confirmExport = () => {
    const settings = exportSettings()
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFileName
    a.click()
    URL.revokeObjectURL(url)
    setExportDialog(false)
  }

  const handleImport = () => {
    try {
      const settings = JSON.parse(importJson)
      importSettings(settings)
      setImportJson('')
      setSaveMessage('Settings imported successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch {
      setSaveMessage('Invalid JSON format')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const toggleShowKey = (service: string) => {
    setShowKeys((prev) => ({ ...prev, [service]: !prev[service] }))
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your API keys and application preferences
        </p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <Alert className={saveMessage.includes('Error') || saveMessage.includes('Invalid') ? 'border-destructive' : 'border-green-500'}>
          <AlertDescription>{saveMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="import-export">Import/Export</TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-6">
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">API Keys</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure your API keys for external services. Keys are stored locally in your browser.
              </p>
            </div>

            {apiServices.map((service) => (
              <div key={service.key} className="space-y-2">
                <Label htmlFor={service.key}>{service.name}</Label>
                <p className="text-xs text-muted-foreground">{service.description}</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={service.key}
                      type={showKeys[service.key] ? 'text' : 'password'}
                      placeholder={`Enter your ${service.name} API key`}
                      value={tempKeys[service.key] || ''}
                      onChange={(e) =>
                        setTempKeys((prev) => ({ ...prev, [service.key]: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => toggleShowKey(service.key)}
                  >
                    {showKeys[service.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}

            <Button onClick={handleSaveKeys} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Save API Keys
            </Button>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          {/* General Settings */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">General Settings</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure application behavior and modes
              </p>
            </div>

            {/* Demo Mode Switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="demo-mode">Demo Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Use demo data instead of real API calls. Recommended for testing.
                </p>
              </div>
              <Switch
                id="demo-mode"
                checked={demoMode}
                onCheckedChange={(checked) => {
                  setDemoMode(checked)
                  setSaveMessage('Demo mode ' + (checked ? 'enabled' : 'disabled'))
                  setTimeout(() => setSaveMessage(''), 3000)
                }}
              />
            </div>

            {/* Logs Enabled Switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="logs-enabled">Enable Logging</Label>
                <p className="text-xs text-muted-foreground">
                  Save system logs for debugging and monitoring. Admin-only access.
                </p>
              </div>
              <Switch
                id="logs-enabled"
                checked={logsEnabled}
                onCheckedChange={(checked) => {
                  setLogsEnabled(checked)
                  setSaveMessage('Logging ' + (checked ? 'enabled' : 'disabled'))
                  setTimeout(() => setSaveMessage(''), 3000)
                }}
              />
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">LLM Settings</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure the AI model used for contact extraction
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="llm-model">LLM Model</Label>
              <Input
                id="llm-model"
                value={selectedLlmModel}
                onChange={(e) => setSelectedLlmModel(e.target.value)}
                placeholder="mistral-7b-instruct:free"
              />
              <p className="text-xs text-muted-foreground">
                Default model is mistral-7b-instruct:free. You can use any model supported by OpenRouter.
              </p>
            </div>
          </Card>

          {/* Embedding Settings */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Embedding Settings</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure the embeddings model used for contact analysis on Mixedbread
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="embedding-model">Embedding Model</Label>
              <Input
                id="embedding-model"
                value={selectedEmbeddingModel}
                onChange={(e) => setSelectedEmbeddingModel(e.target.value)}
                placeholder="mxbai-embed-large-v1"
              />
              <p className="text-xs text-muted-foreground">
                Default model is mxbai-embed-large-v1. This model is used for semantic search and contact similarity analysis.
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Import/Export Tab */}
        <TabsContent value="import-export" className="space-y-6">
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Import/Export Settings</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Backup or restore your application settings
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Export Settings</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Download your settings as a JSON file
                </p>
                <Button onClick={handleExport} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Settings
                </Button>
              </div>

              <div className="border-t pt-4">
                <Label>Import Settings</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Paste your settings JSON below to import
                </p>
                <Textarea
                  placeholder='{"demoMode": true, "selectedLlmModel": "mistral-7b-instruct:free", ...}'
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  rows={6}
                  className="mb-2"
                />
                <Button onClick={handleImport} variant="outline" className="w-full" disabled={!importJson.trim()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Settings
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onOpenChange={setExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Settings</DialogTitle>
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
    </div>
  )
}
