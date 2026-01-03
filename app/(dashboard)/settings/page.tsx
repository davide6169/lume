'use client'

import { useState } from 'react'
import { useSettingsStore } from '@/lib/stores/useSettingsStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Eye, EyeOff, Save, Download, Upload, Sparkles } from 'lucide-react'

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
    selectedLlmModel,
    setSelectedLlmModel,
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
    const settings = exportSettings()
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lume-settings.json'
    a.click()
    URL.revokeObjectURL(url)
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

  const handleExportDemoSourceAudiences = () => {
    const demoData = {
      sourceAudiences: [
        {
          id: crypto.randomUUID(),
          name: 'Facebook Tech Groups',
          type: 'facebook',
          urls: [
            'https://www.facebook.com/groups/techenthusiasts',
            'https://www.facebook.com/groups/developerscommunity',
            'https://www.facebook.com/groups/startupfounders',
            'https://www.facebook.com/groups/aiandmachinelearning',
            'https://www.facebook.com/groups/webdevpros',
          ],
          selected: true,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          name: 'Instagram Business Pages',
          type: 'instagram',
          urls: [
            'https://www.instagram.com/entrepreneurregistry',
            'https://www.instagram.com/digitalmarketingtips',
            'https://www.instagram.com/businessinsider',
            'https://www.instagram.com/startuplife',
          ],
          selected: true,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          name: 'Facebook Local Communities',
          type: 'facebook',
          urls: [
            'https://www.facebook.com/groups/milanbusinessnetwork',
            'https://www.facebook.com/groups/romeprofessionals',
            'https://www.facebook.com/groups/turinstartupscene',
          ],
          selected: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }

    const blob = new Blob([JSON.stringify(demoData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lume-demo-source-audiences.json'
    a.click()
    URL.revokeObjectURL(url)

    setSaveMessage('Demo data exported! Go to Source Audiences to import it.')
    setTimeout(() => setSaveMessage(''), 5000)
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

      {/* Demo Mode Alert */}
      {demoMode && (
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Demo Mode is Active:</strong> All API calls will be simulated with dummy data. No actual API calls will be made.
          </AlertDescription>
        </Alert>
      )}

      {/* Save Message */}
      {saveMessage && (
        <Alert className={saveMessage.includes('Error') || saveMessage.includes('Invalid') ? 'border-destructive' : 'border-green-500'}>
          <AlertDescription>{saveMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="demo">Demo Mode</TabsTrigger>
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
                      disabled={demoMode}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => toggleShowKey(service.key)}
                    disabled={demoMode}
                  >
                    {showKeys[service.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}

            <Button onClick={handleSaveKeys} className="w-full" disabled={demoMode}>
              <Save className="mr-2 h-4 w-4" />
              Save API Keys
            </Button>

            {demoMode && (
              <p className="text-sm text-muted-foreground text-center">
                API key management is disabled in demo mode
              </p>
            )}
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
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
        </TabsContent>

        {/* Demo Mode Tab */}
        <TabsContent value="demo" className="space-y-6">
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Demo Mode</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enable demo mode to explore the platform without using real API calls
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="demo-mode">Enable Demo Mode</Label>
                <p className="text-xs text-muted-foreground">
                  All external API calls will be simulated with dummy data
                </p>
              </div>
              <Switch
                id="demo-mode"
                checked={demoMode}
                onCheckedChange={setDemoMode}
              />
            </div>

            {demoMode && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Demo mode is active. No actual API calls will be made. All data will be simulated.
                </AlertDescription>
              </Alert>
            )}
          </Card>

          {/* Demo Data Export - Only visible when Demo Mode is active */}
          {demoMode && (
            <Card className="p-6 space-y-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Demo Data Generator
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Get started quickly with pre-configured Source Audiences for testing
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Export a JSON file containing <strong>3 example Source Audiences</strong> with Facebook groups and Instagram pages ready to import.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                  <li>• Facebook Tech Groups (5 URLs)</li>
                  <li>• Instagram Business Pages (4 URLs)</li>
                  <li>• Facebook Local Communities (3 URLs)</li>
                </ul>
              </div>

              <Button onClick={handleExportDemoSourceAudiences} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export Demo Source Audiences
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                After exporting, go to <strong>Source Audiences</strong> → <strong>Import JSON</strong> to load the data
              </p>
            </Card>
          )}
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
    </div>
  )
}
