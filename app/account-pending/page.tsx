'use client'

import { useSupabase } from '@/components/providers/supabase-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, Mail, LogOut, Sparkles, Loader2 } from 'lucide-react'
import { logout } from '@/app/auth/actions'

export default function AccountPendingPage() {
  const { profile, user } = useSupabase()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full">
              <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Account Pending Approval</h1>
          <p className="text-muted-foreground">
            Your account is waiting for administrator approval
          </p>
        </div>

        {/* Info Card */}
        <Alert className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950">
          <Sparkles className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm">
            <strong>What happens next?</strong> Your account has been created but requires approval from an administrator before you can access the system.
          </AlertDescription>
        </Alert>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>Your Account</CardTitle>
            <CardDescription>
              Account details and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium">
                  {profile?.fullName || 'Not provided'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm font-medium capitalize">
                  {profile?.role}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Approval
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 font-semibold text-xs">
                  1
                </div>
                <div>
                  <p className="font-medium">Contact Your Administrator</p>
                  <p className="text-muted-foreground">
                    Reach out to your organization's administrator to request account approval
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 font-semibold text-xs">
                  2
                </div>
                <div>
                  <p className="font-medium">Wait for Approval</p>
                  <p className="text-muted-foreground">
                    Once approved, you'll receive an email and can access the full system
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 font-semibold text-xs">
                  3
                </div>
                <div>
                  <p className="font-medium">Log In Again</p>
                  <p className="text-muted-foreground">
                    After approval, simply log in to access all features
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" onClick={handleLogout} className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Demo Mode Notice */}
        <Alert className="border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-sm">
            <strong>Demo Mode Available:</strong> While waiting for approval, you can explore the system in Demo Mode by clicking the Demo switch in the header.
          </AlertDescription>
        </Alert>

        {/* Contact Admin */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                If you don't know who your administrator is, or if you've been waiting longer than expected, please contact support.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:support@yourcompany.com" className="text-blue-600 hover:underline">
                  Contact Support
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
