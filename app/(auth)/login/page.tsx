'use client'

import { login } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LumeLogo } from '@/components/icons/lume-logo'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const [dbConfigured, setDbConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if database is configured
    fetch('/api/settings/db-configured')
      .then(res => res.json())
      .then(data => setDbConfigured(data.configured))
      .catch(() => setDbConfigured(false))
  }, [])

  // Show loading state while checking
  if (dbConfigured === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-64 h-64">
                <LumeLogo className="w-full h-full" showTagline={true} />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to Lume</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-64 h-64">
              <LumeLogo className="w-full h-full" showTagline={true} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Lume</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!dbConfigured && (
            <Alert className="mb-4 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                First time setup? Use the demo account to configure your database.
              </AlertDescription>
            </Alert>
          )}

          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          {dbConfigured ? (
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                Sign up
              </Link>
            </div>
          ) : (
            <div className="mt-4 text-center text-xs text-muted-foreground">
              Sign up will be available after database configuration
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
