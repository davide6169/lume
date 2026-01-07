'use client'

import React, { useState, useEffect } from 'react'
import { useSettingsStore } from '@/lib/stores/useSettingsStore'
import { useDemoStore } from '@/lib/stores/useDemoStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertCircle, Eye, EyeOff, Save, Download, Upload, FileText, Play, CheckCircle, XCircle, Loader2, Database } from 'lucide-react'
import { getTestScenarios } from '@/lib/services/api-test-definitions'

const apiServices = [
  { key: 'apify' as const, name: 'Apify', description: 'Web scraping for Facebook/Instagram (Recommended)' },
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
    maxItemsFacebook,
    setMaxItemsFacebook,
    maxItemsInstagram,
    setMaxItemsInstagram,
    logRetentionDays,
    setLogRetentionDays,
    apiKeys,
    setApiKey,
    removeApiKey,
    exportSettings,
    importSettings,
    supabaseConfig,
    setSupabaseConfig,
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
  const [saveMessage, setSaveMessage] = useState('')

  const [exportDialog, setExportDialog] = useState(false)
  const [exportFileName, setExportFileName] = useState(`lume-settings-${new Date().toISOString().split('T')[0]}.json`)

  // Supabase config state
  const [tempSupabaseUrl, setTempSupabaseUrl] = useState(supabaseConfig.url)
  const [tempSupabaseAnonKey, setTempSupabaseAnonKey] = useState(supabaseConfig.anonKey)

  // Import file state
  const importFileRef = React.useRef<HTMLInputElement>(null)

  // API Test states
  const [testDialog, setTestDialog] = useState<{
    open: boolean
    serviceKey: string
    serviceName: string
  } | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<string>('')
  const [testRunning, setTestRunning] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  // Database Test states
  const [dbTestRunning, setDbTestRunning] = useState(false)
  const [dbTestResult, setDbTestResult] = useState<any>(null)
  const [dbTestDialogOpen, setDbTestDialogOpen] = useState(false)

  // API Keys save confirmation dialog
  const [saveConfirmDialog, setSaveConfirmDialog] = useState(false)
  const [savedKeysCount, setSavedKeysCount] = useState(0)
  const [savingType, setSavingType] = useState<'api-keys' | 'database' | 'preferences'>('api-keys')

  const handleSaveKeys = () => {
    let count = 0
    Object.entries(tempKeys).forEach(([service, key]) => {
      if (key) {
        setApiKey(service as keyof typeof apiKeys, key)
        count++
      }
    })

    setSavedKeysCount(count)
    setSavingType('api-keys')
    setSaveConfirmDialog(true)
  }

  const handleSaveSupabase = () => {
    // Validate inputs
    if (!tempSupabaseUrl.trim() || !tempSupabaseAnonKey.trim()) {
      setSaveMessage('Error: Please fill in both Supabase URL and anon key')
      setTimeout(() => setSaveMessage(''), 5000)
      return
    }

    // Basic URL validation
    if (!tempSupabaseUrl.startsWith('https://')) {
      setSaveMessage('Error: Supabase URL must start with https://')
      setTimeout(() => setSaveMessage(''), 5000)
      return
    }

    // Save configuration
    setSupabaseConfig(tempSupabaseUrl.trim(), tempSupabaseAnonKey.trim())
    setSaveMessage('✅ Database configuration saved successfully!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleSaveSupabaseWithConfirm = () => {
    // Validate inputs first
    if (!tempSupabaseUrl.trim() || !tempSupabaseAnonKey.trim()) {
      setSaveMessage('Error: Please fill in both Supabase URL and anon key')
      setTimeout(() => setSaveMessage(''), 5000)
      return
    }

    // Show confirmation dialog
    setSavingType('database')
    setSaveConfirmDialog(true)
  }

  const handleTestDatabase = async () => {
    // Validate inputs first
    if (!tempSupabaseUrl.trim() || !tempSupabaseAnonKey.trim()) {
      setSaveMessage('Error: Please fill in both Supabase URL and anon key before testing')
      setTimeout(() => setSaveMessage(''), 5000)
      return
    }

    // Open dialog to show test is running
    setDbTestDialogOpen(true)
    setDbTestRunning(true)
    setDbTestResult(null)

    try {
      const response = await fetch('/api/settings/test-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: tempSupabaseUrl.trim(),
          anonKey: tempSupabaseAnonKey.trim()
        }),
      })

      const result = await response.json()
      setDbTestResult(result)

      // Dialog stays open to show results
    } catch (error: any) {
      setDbTestResult({
        success: false,
        error: 'Test failed',
        details: { message: error.message || 'Unknown error' }
      })
    } finally {
      setDbTestRunning(false)
    }
  }

  const handleSavePreferences = () => {
    // Preferences are automatically saved by Zustand persist
    // Just show confirmation dialog
    setSavingType('preferences')
    setSaveConfirmDialog(true)
  }

  const confirmSave = () => {
    if (savingType === 'database') {
      handleSaveSupabase()
    } else if (savingType === 'preferences') {
      setSaveMessage('✅ Preferences have been saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } else {
      const count = savedKeysCount
      if (count > 0) {
        setSaveMessage(`✅ ${count === 1 ? '1 API key has' : `${count} API keys have`} been saved!`)
        setTimeout(() => setSaveMessage(''), 3000)
      }
    }
    setSaveConfirmDialog(false)
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

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string
        const settings = JSON.parse(json)
        importSettings(settings)
        setSaveMessage('✅ Settings imported successfully!')
        setTimeout(() => setSaveMessage(''), 3000)
      } catch {
        setSaveMessage('Error: Invalid JSON format')
        setTimeout(() => setSaveMessage(''), 5000)
      }
    }
    reader.readAsText(file)

    // Reset input
    if (importFileRef.current) {
      importFileRef.current.value = ''
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

      <Tabs defaultValue="database" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="import-export">Import/Export</TabsTrigger>
        </TabsList>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-6">
          <Card className="p-6 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Database className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Supabase Database Configuration</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure your Supabase project credentials to store and manage your data in production mode.
              </p>
            </div>

            <Alert className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950">
              <Database className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                <strong>Required for Production Mode:</strong> To use real data instead of demo mode, you need to configure your Supabase database.
                Each user in your organization should use the same database credentials.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="supabase-url">Project URL</Label>
                <Input
                  id="supabase-url"
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={tempSupabaseUrl}
                  onChange={(e) => setTempSupabaseUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Found in your Supabase dashboard: Settings → API
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supabase-anon-key">anon / public Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="supabase-anon-key"
                    type={showKeys['supabase-anon'] ? 'text' : 'password'}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={tempSupabaseAnonKey}
                    onChange={(e) => setTempSupabaseAnonKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKeys({ ...showKeys, 'supabase-anon': !showKeys['supabase-anon'] })}
                  >
                    {showKeys['supabase-anon'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleTestDatabase}
                    disabled={dbTestRunning}
                    title="Test database connection"
                  >
                    {dbTestRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Found in your Supabase dashboard: Settings → API
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">Need a Supabase Project?</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>If you don't have a Supabase project yet:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">supabase.com</a> and create a free account</li>
                  <li>Create a new project (takes about 2 minutes)</li>
                  <li>Go to Settings → API in your project dashboard</li>
                  <li>Copy the Project URL and anon/public key</li>
                  <li>Paste them above, click Test button (▶), then "Save Database Configuration"</li>
                </ol>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t">
              <Button onClick={handleSaveSupabaseWithConfirm} className="w-full" size="lg">
                <Save className="h-4 w-4 mr-2" />
                Save Database Configuration
              </Button>
              {saveMessage && savingType === 'database' && (
                <p className="text-sm text-center text-muted-foreground mt-2">{saveMessage}</p>
              )}
            </div>
          </Card>
        </TabsContent>

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
                  {service.key === 'apollo' && (
                    <Alert className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>Requires Paid Plan:</strong> Apollo.io People Enrichment API is only available on paid plans.
                        Free API keys will return <code className="text-xs">API_INACCESSIBLE</code> errors.
                        <a
                          href="https://app.apollo.io/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 underline hover:text-primary"
                        >
                          Upgrade your plan →
                        </a>
                      </AlertDescription>
                    </Alert>
                  )}
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

          {/* Scraping Limits Settings */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Scraping Limits</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure maximum number of items to retrieve from Facebook and Instagram
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-items-facebook">Facebook Posts Limit</Label>
                <Input
                  id="max-items-facebook"
                  type="number"
                  min="1"
                  max="10000"
                  value={maxItemsFacebook}
                  onChange={(e) => setMaxItemsFacebook(Math.max(1, Math.min(10000, parseInt(e.target.value) || 100)))}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of Facebook posts to retrieve (default: 100, max: 10,000)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-items-instagram">Instagram Comments Limit</Label>
                <Input
                  id="max-items-instagram"
                  type="number"
                  min="1"
                  max="10000"
                  value={maxItemsInstagram}
                  onChange={(e) => setMaxItemsInstagram(Math.max(1, Math.min(10000, parseInt(e.target.value) || 100)))}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of Instagram comments to retrieve (default: 100, max: 10,000)
                </p>
              </div>
            </div>
          </Card>

          {/* Log Retention Settings */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Log Retention</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure how long to keep system logs before automatic cleanup
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="log-retention-days">Log Retention Days</Label>
              <Input
                id="log-retention-days"
                type="number"
                min="1"
                max="30"
                value={logRetentionDays}
                onChange={(e) => setLogRetentionDays(Math.max(1, Math.min(30, parseInt(e.target.value) || 3)))}
              />
              <p className="text-xs text-muted-foreground">
                Number of days to keep logs before automatic deletion (default: 3, range: 1-30 days)
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Logs older than the specified number of days will be automatically deleted to save database space.
                Set to a higher value if you need longer audit trails, or lower value to minimize database storage.
              </p>
            </div>
          </Card>

          {/* Save Preferences Button */}
          <Card className="p-6">
            <Button onClick={handleSavePreferences} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </Button>
            {saveMessage && (
              <p className="text-sm text-center mt-3 text-muted-foreground">{saveMessage}</p>
            )}
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
                  Upload a settings JSON file to import your configuration
                </p>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-settings-file"
                />
                <Button
                  onClick={() => importFileRef.current?.click()}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import Settings
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Select a JSON file previously exported from Lume
                </p>
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

          {/* Security Warning */}
          <Alert variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900 dark:text-amber-100">⚠️ Security Warning</AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
              <div className="space-y-2">
                <p><strong>This export contains sensitive credentials in plain text:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                  <li>API keys (Apify, OpenRouter, Mixedbread, Apollo, Hunter)</li>
                  <li>Supabase database URL and anon key</li>
                </ul>
                <p className="text-xs font-semibold mt-2">
                  DO NOT share this file publicly or commit it to version control!
                </p>
              </div>
            </AlertDescription>
          </Alert>

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
            <Button onClick={confirmExport} variant="default">
              I Understand, Export
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

      {/* Database Test Dialog */}
      <Dialog open={dbTestDialogOpen} onOpenChange={setDbTestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Test Database Connection
            </DialogTitle>
            <DialogDescription>
              Verify your Supabase database credentials are working correctly
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Test Status */}
            {dbTestRunning && (
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <div>
                  <p className="font-medium">Testing connection...</p>
                  <p className="text-xs text-muted-foreground">Please wait</p>
                </div>
              </div>
            )}

            {/* Test Result */}
            {!dbTestRunning && dbTestResult && (
              <div className={`p-4 rounded-lg border ${
                dbTestResult.success
                  ? 'bg-green-50 dark:bg-green-950 border-green-500'
                  : 'bg-red-50 dark:bg-red-950 border-red-500'
              }`}>
                <div className="flex items-start gap-3">
                  {dbTestResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold mb-1">
                      {dbTestResult.success ? 'Connection Successful' : 'Connection Failed'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {dbTestResult.success ? dbTestResult.message : dbTestResult.error}
                    </p>
                    {dbTestResult.details && (
                      <div className="text-xs space-y-1">
                        {dbTestResult.details.url && (
                          <p className="text-muted-foreground">URL: {dbTestResult.details.url}</p>
                        )}
                        {dbTestResult.details.responseTime && (
                          <p className="text-muted-foreground">Response time: {dbTestResult.details.responseTime}</p>
                        )}
                        {dbTestResult.details.status && (
                          <p className="text-muted-foreground">Status: {dbTestResult.details.status}</p>
                        )}
                        {dbTestResult.details.message && !dbTestResult.success && (
                          <p className="text-red-600 dark:text-red-400">{dbTestResult.details.message}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setDbTestDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <Dialog open={saveConfirmDialog} onOpenChange={setSaveConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {savingType === 'database' ? 'Save Database Configuration' :
               savingType === 'preferences' ? 'Save Preferences' :
               'Save API Keys'}
            </DialogTitle>
            <DialogDescription>
              {savingType === 'database'
                ? 'Are you sure you want to save your Supabase database configuration? This will update your connection settings.'
                : savingType === 'preferences'
                ? 'Your preferences will be saved to your browser storage. This includes LLM models, embedding settings, and scraping limits.'
                : (savedKeysCount === 1
                  ? '1 API key will be saved to your browser storage.'
                  : `${savedKeysCount} API keys will be saved to your browser storage.`
                )
              }
            </DialogDescription>
          </DialogHeader>

          {savingType === 'database' ? (
            <div className="py-4">
              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-500">
                <Database className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  Your database credentials will be stored locally in your browser and used to connect to your Supabase project.
                  Credentials are never sent to the server.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="py-4">
              <Alert className="bg-green-50 dark:bg-green-950 border-green-500">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm">
                  Your API keys are stored locally in your browser and will be used for all API calls.
                  Keys are never sent to the server.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSave}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
