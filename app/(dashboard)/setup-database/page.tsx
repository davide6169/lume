'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSettingsStore } from '@/lib/stores/useSettingsStore'
import { Database, AlertCircle, ArrowRight, Sparkles } from 'lucide-react'

export default function SetupDatabasePage() {
  const router = useRouter()
  const { supabaseConfig, setSupabaseConfig, hasUserSupabaseConfig, setDemoMode } = useSettingsStore()

  const [url, setUrl] = useState(supabaseConfig.url)
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey)
  const [error, setError] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  const handleBackToDemo = () => {
    setDemoMode(true)
    router.push('/')
  }

  const handleSaveAndContinue = async () => {
    setError('')

    // Validate inputs
    if (!url.trim() || !anonKey.trim()) {
      setError('Please fill in both fields')
      return
    }

    // Basic URL validation
    if (!url.startsWith('https://')) {
      setError('Supabase URL must start with https://')
      return
    }

    if (url.includes('your-project')) {
      setError('Please enter your actual Supabase project URL, not the placeholder')
      return
    }

    if (anonKey.includes('your-anon-key')) {
      setError('Please enter your actual Supabase anon key, not the placeholder')
      return
    }

    setIsValidating(true)

    try {
      // Validate credentials by trying to create a Supabase client
      const { createBrowserClient } = await import('@supabase/ssr')
      const client = createBrowserClient(url.trim(), anonKey.trim())

      // Try a simple query to validate
      const { error: fetchError } = await client.from('profiles').select('id').limit(1)

      if (fetchError) {
        setError(`Invalid credentials: ${fetchError.message}`)
        setIsValidating(false)
        return
      }

      // Save configuration
      setSupabaseConfig(url.trim(), anonKey.trim())

      // Disable demo mode and redirect to home
      setDemoMode(false)
      router.push('/')
    } catch (err) {
      setError(`Failed to validate credentials: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Database className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Setup Your Database</h1>
          <p className="text-muted-foreground">
            Connect your own Supabase project to use production mode
          </p>
        </div>

        {/* Info Card */}
        <Alert className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm">
            <strong>Why configure a database?</strong> Demo mode is great for testing, but to store your real data
            you need to connect to Supabase. Each user can have their own database for complete privacy.
          </AlertDescription>
        </Alert>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Supabase Configuration</CardTitle>
            <CardDescription>
              Enter your Supabase project credentials below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supabase-url">Project URL</Label>
              <Input
                id="supabase-url"
                type="url"
                placeholder="https://your-project.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isValidating}
              />
              <p className="text-xs text-muted-foreground">
                Found in your Supabase project dashboard under Settings → API
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supabase-anon-key">anon / public Key</Label>
              <Input
                id="supabase-anon-key"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                disabled={isValidating}
              />
              <p className="text-xs text-muted-foreground">
                Found in your Supabase project dashboard under Settings → API
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleBackToDemo}
                disabled={isValidating}
                className="flex-1"
              >
                Back to Demo Mode
              </Button>
              <Button
                onClick={handleSaveAndContinue}
                disabled={isValidating}
                className="flex-1"
              >
                {isValidating ? 'Validating...' : 'Save & Continue'}
                {!isValidating && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Don't have a Supabase project?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">supabase.com</a> and create a free account</li>
              <li>Create a new project (takes about 2 minutes)</li>
              <li>Go to Settings → API in your project dashboard</li>
              <li>Copy the Project URL and anon/public key</li>
              <li>Paste them above and click Save & Continue</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
