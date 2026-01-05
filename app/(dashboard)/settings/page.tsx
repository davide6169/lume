'use client'

import { useState } from 'react'
import { useSettingsStore } from '@/lib/stores/useSettingsStore'
import { useDemoStore } from '@/lib/stores/useDemoStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertCircle, Eye, EyeOff, Save, Download, Upload, FileText, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { getTestScenarios } from '@/lib/services/api-test-definitions'

const apiServices = [
  { key: 'meta' as const, name: 'Meta (Facebook/Instagram)', description: 'For accessing social media data' },
  { key: 'openrouter' as const, name: 'OpenRouter', description: 'LLM API for AI processing' },
  { key: 'mixedbread' as const, name: 'Mixedbread', description: 'Embeddings API for contact analysis' },
  { key: 'apollo' as const, name: 'Apollo.io', description: 'Contact data enrichment' },
  { key: 'hunter' as const, name: 'Hunter.io', description: 'Email verification and finding' },
] as const

export default function SettingsPage() {
  const { isDemoMode } = useDemoStore()
  const {
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

  // Wrapper functions to sync with database
  const handleSetLogsEnabled = (enabled: boolean) => {
    setLogsEnabled(enabled)
    setSaveMessage('Logging ' + (enabled ? 'enabled' : 'disabled'))
    setTimeout(() => setSaveMessage(''), 3000)

    // Sync to database in background
    fetch('/api/settings/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ demoMode: isDemoMode, logsEnabled: enabled }),
    }).catch(err => console.error('Error syncing logs enabled:', err))
  }

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [tempKeys, setTempKeys] = useState(apiKeys)
  const [importJson, setImportJson] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [exportDialog, setExportDialog] = useState(false)
  const [exportFileName, setExportFileName] = useState(`lume-settings-${new Date().toISOString().split('T')[0]}.json`)

  // API Test states
  const [testDialog, setTestDialog] = useState<{
    open: boolean
    serviceKey: string
    serviceName: string
  } | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<string>('')
  const [testRunning, setTestRunning] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  // API Keys save confirmation dialog
  const [saveConfirmDialog, setSaveConfirmDialog] = useState(false)
  const [savedKeysCount, setSavedKeysCount] = useState(0)

  const handleSaveKeys = () => {
    let count = 0
    Object.entries(tempKeys).forEach(([service, key]) => {
      if (key) {
        setApiKey(service as keyof typeof apiKeys, key)
        count++
      }
    })
    setSavedKeysCount(count)
    setSaveConfirmDialog(true)
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

  const openTestDialog = (serviceKey: string, serviceName: string) => {
    const scenarios = getTestScenarios(serviceKey)
    if (scenarios.length === 0) {
      setSaveMessage('No test scenarios available for this service')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }

    // Select first scenario by default
    setSelectedScenario(scenarios[0].id)
    setTestResult(null)
    setTestDialog({ open: true, serviceKey, serviceName })
  }

  const runTest = async () => {
    if (!testDialog || !selectedScenario) return

    setTestRunning(true)
    setTestResult(null)

    // Use isDemoMode from useDemoStore (the same as toolbar)
    const currentDemoMode = useDemoStore.getState().isDemoMode

    console.log('[Frontend] Demo mode from useDemoStore:', currentDemoMode)
    console.log('[Frontend] Test scenario:', testDialog.serviceKey, selectedScenario)

    try {
      const response = await fetch('/api/settings/test-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          serviceKey: testDialog.serviceKey,
          scenarioId: selectedScenario,
          apiKey: tempKeys[testDialog.serviceKey as keyof typeof apiKeys] || apiKeys[testDialog.serviceKey as keyof typeof apiKeys],
          isDemoMode: currentDemoMode,
        }),
      })

      const data = await response.json()
      setTestResult(data)

      if (data.error) {
        setSaveMessage(`Test failed: ${data.error}`)
      } else {
        setSaveMessage(`Test ${data.outcome}: ${data.details}`)
      }
      setTimeout(() => setSaveMessage(''), 5000)
    } catch (error) {
      console.error('Error running test:', error)
      setTestResult({
        success: false,
        outcome: 'ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
      setSaveMessage('Test failed: Network error')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setTestRunning(false)
    }
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

            {apiServices.map((service) => {
              const scenarios = getTestScenarios(service.key)
              return (
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => openTestDialog(service.key, service.name)}
                      title={`Test ${service.name} API`}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}

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
                onCheckedChange={handleSetLogsEnabled}
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

      {/* API Test Dialog */}
      {testDialog && (
        <Dialog open={testDialog.open} onOpenChange={(open) => setTestDialog(open ? testDialog : null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Test {testDialog.serviceName} API</DialogTitle>
              <DialogDescription>
                Run a test call to verify your API key is working correctly
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Scenario Selection */}
              <div className="space-y-2">
                <Label>Test Scenario</Label>
                <Select value={selectedScenario} onValueChange={setSelectedScenario} disabled={testRunning}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a test scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTestScenarios(testDialog.serviceKey).map((scenario) => (
                      <SelectItem key={scenario.id} value={scenario.id}>
                        {scenario.name} - {scenario.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Test Result */}
              {testResult && (
                <div className="space-y-3">
                  {/* Status */}
                  <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                    testResult.outcome === 'PASS'
                      ? 'bg-green-50 dark:bg-green-950 border-green-500'
                      : 'bg-red-50 dark:bg-red-950 border-red-500'
                  }`}>
                    {testResult.outcome === 'PASS' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">
                        Test {testResult.outcome}
                        {testResult.simulated && ' (Demo Mode - Simulated)'}
                      </div>
                      <div className="text-sm text-muted-foreground">{testResult.details}</div>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Request Details</Label>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg space-y-1 text-xs font-mono">
                      <div><span className="font-semibold">Endpoint:</span> {testResult.request?.endpoint}</div>
                      <div><span className="font-semibold">Method:</span> {testResult.request?.method}</div>
                      {testResult.request?.body && (
                        <div>
                          <span className="font-semibold">Body:</span>
                          <pre className="mt-1 overflow-x-auto">{JSON.stringify(testResult.request.body, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Response Details */}
                  {(testResult.response?.status || testResult.response?.data || testResult.response?.error) && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Response Details</Label>
                      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg space-y-1 text-xs font-mono">
                        {testResult.response?.status && (
                          <div><span className="font-semibold">Status:</span> {testResult.response.status}</div>
                        )}
                        {testResult.response?.responseTime && (
                          <div><span className="font-semibold">Response Time:</span> {testResult.response.responseTime}ms</div>
                        )}
                        {testResult.response?.data && (
                          <div>
                            <span className="font-semibold">Data:</span>
                            <pre className="mt-1 overflow-x-auto max-h-40 overflow-y-auto">{JSON.stringify(testResult.response.data, null, 2)}</pre>
                          </div>
                        )}
                        {testResult.response?.error && (
                          <div className="text-red-600">
                            <span className="font-semibold">Error:</span> {testResult.response.error}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setTestDialog(null)} disabled={testRunning}>
                Close
              </Button>
              <Button onClick={runTest} disabled={testRunning || !selectedScenario}>
                {testRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Test
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* API Keys Save Confirmation Dialog */}
      <Dialog open={saveConfirmDialog} onOpenChange={setSaveConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              API Keys Saved Successfully
            </DialogTitle>
            <DialogDescription>
              {savedKeysCount === 1
                ? '1 API key has been saved to your browser storage.'
                : `${savedKeysCount} API keys have been saved to your browser storage.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Alert className="bg-green-50 dark:bg-green-950 border-green-500">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm">
                Your API keys are stored locally in your browser and will be used for all API calls.
                Keys are never sent to the server.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={() => setSaveConfirmDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
