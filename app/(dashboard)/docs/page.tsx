'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  UserPlus,
  Filter,
  FileText,
  Settings,
  Sparkles,
  BookOpen,
  Upload,
  Download,
  Search,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Zap,
  Database,
  Shield,
  DollarSign,
  Clock,
} from 'lucide-react'

export default function DocsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        </div>
        <p className="text-muted-foreground">
          Complete guide to using Lume for audience discovery and management
        </p>
      </div>

      {/* Main Documentation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Lume</CardTitle>
              <CardDescription>
                Your all-in-one platform for discovering, enriching, and managing custom audiences for Meta Ads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Source Audiences</h3>
                    <p className="text-sm text-muted-foreground">
                      Collect contacts from Facebook & Instagram
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Search className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">AI Extraction</h3>
                    <p className="text-sm text-muted-foreground">
                      Extract contacts using advanced AI
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <UserPlus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Shared Audiences</h3>
                    <p className="text-sm text-muted-foreground">
                      Export to Meta Ads Custom Audiences
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Quick start guide in 3 simple steps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Create Source Audiences</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Add Facebook/Instagram URLs where you want to find contacts
                    </p>
                    <Badge variant="outline">Navigate to: Source Audiences</Badge>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Run Search</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Select audiences and start AI-powered contact extraction
                    </p>
                    <Badge variant="outline">Click: Start Search</Badge>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Export to Meta</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Review contacts in Shared Audiences and upload to Meta Ads
                    </p>
                    <Badge variant="outline">Navigate to: Shared Audiences</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Multi-Tenant Architecture</CardTitle>
              <CardDescription>
                How Lume works without server-side configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold">Zero Server Configuration Required</h4>
                  <Badge variant="secondary">Multi-Tenant</Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Lume is designed as a <strong>multi-tenant application</strong>. Each user can configure their own Supabase project, giving them complete data isolation and privacy.
                  </p>
                  <ul className="space-y-1 ml-4">
                    <li>• No server-side API keys needed for deployment</li>
                    <li>• Each user has their own private database</li>
                    <li>• Your deployment only needs the code - no credentials!</li>
                    <li>• Users configure their own database in the app</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold">Demo Mode → Production Mode</h4>
                  <Badge>Automatic Setup</Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Start immediately in <strong>Demo Mode</strong> without any setup. When you're ready to use real data:
                  </p>
                  <ol className="list-decimal space-y-1 ml-4">
                    <li>Click the <strong>Demo</strong> switch to turn it OFF</li>
                    <li>If you haven't configured a database, you'll see the "Setup Database" page</li>
                    <li>Enter your Supabase URL and anon key</li>
                    <li>That's it! You're now in Production Mode</li>
                  </ol>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold">First User = Admin</h4>
                  <Badge>Automatic</Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    When you configure your database and sign up for the first time:
                  </p>
                  <ul className="space-y-1 ml-4">
                    <li>• First registered user: <strong>Admin role</strong> + <strong>Approved</strong></li>
                    <li>• All subsequent users: <strong>User role</strong> + <strong>Pending Approval</strong></li>
                    <li>• Admins must approve new users before they can access the system</li>
                    <li>• Admins can view <strong>Logs</strong> page and manage users</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <h4 className="font-semibold">User Approval System</h4>
                  <Badge variant="secondary">Security</Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    New users require admin approval before accessing the system:
                  </p>
                  <ul className="space-y-1 ml-4">
                    <li>• <strong>Pending users</strong> are redirected to "Account Pending" page</li>
                    <li>• <strong>Demo mode is locked ON</strong> for pending users</li>
                    <li>• <strong>Admins approve users</strong> via the Users page (with demo data for testing)</li>
                    <li>• <strong>Approved users</strong> can disable Demo mode and use the system</li>
                  </ul>
                  <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900 rounded text-xs">
                    <strong>Account Pending Page:</strong> Shows user account details and instructs them to wait for admin approval. Includes logout functionality and clear notice about Demo mode being locked.
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                    ⚠️ This prevents unauthorized access to your database.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demo Mode vs Production</CardTitle>
              <CardDescription>
                Understanding the two modes of operation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold">Demo Mode</h4>
                  <Badge variant="secondary">Recommended for Testing</Badge>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Uses simulated data - no API costs</li>
                  <li>• Perfect for learning the workflow</li>
                  <li>• Test all features without risk</li>
                  <li>• Data stored locally in browser</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold">Production Mode</h4>
                  <Badge>Real APIs</Badge>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Real data from Facebook & Instagram</li>
                  <li>• Actual AI extraction (OpenRouter LLM)</li>
                  <li>• Contact enrichment (Apollo.io)</li>
                  <li>• Email verification (Hunter.io)</li>
                  <li>• Requires API credentials in Settings</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FEATURES TAB */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Source Audiences</CardTitle>
              <CardDescription>Manage your social media sources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" />
                    Creating Source Audiences
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Source Audiences represent Facebook/Instagram locations where you want to find contacts:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Facebook:</strong> Pages, Groups, or specific Post URLs</li>
                      <li><strong>Instagram:</strong> Business/Creator profile URLs</li>
                    </ul>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Upload className="h-4 w-4" />
                    Import & Export
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Import:</strong> Upload JSON files with source audience definitions</p>
                    <p><strong>Export:</strong> Download all source audiences as JSON for backup</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Search className="h-4 w-4" />
                    Running Searches
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>To extract contacts from your sources:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Select one or more audiences using checkboxes</li>
                      <li>Click "Start Search" button</li>
                      <li>Monitor progress in real-time</li>
                      <li>Results appear in Shared Audiences when complete</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shared Audiences</CardTitle>
              <CardDescription>Manage extracted and enriched contacts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Contact Data</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Each contact includes:
                  </p>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span><strong>Email</strong> - Required for Meta Ads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span><strong>First Name & Last Name</strong> - Required for Meta Ads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span><strong>Phone</strong> - Optional</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span><strong>Location</strong> - City, Country</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Exporting to Meta Ads</h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>To upload contacts to Meta Custom Audiences:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Select shared audiences to export</li>
                      <li>Click "Upload to Meta" button</li>
                      <li>Contacts are uploaded to Meta Custom Audiences</li>
                      <li>Status updates to "Uploaded" when complete</li>
                    </ol>
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-xs">
                        <strong>Note:</strong> Only contacts with complete triplet (email + first_name + last_name) are included
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Filters</h4>
                  <p className="text-sm text-muted-foreground">
                    Create filters to segment contacts by location, interests, or other criteria
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Bulk Operations</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• <strong>Delete:</strong> Remove selected shared audiences</p>
                    <p>• <strong>Export:</strong> Download as JSON for backup</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure API credentials and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-1">Database Configuration</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure your Supabase database connection:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
                    <li>• <strong>Supabase URL:</strong> Your project URL from Supabase dashboard</li>
                    <li>• <strong>Supabase Anon Key:</strong> Your public/anon key from Supabase dashboard</li>
                    <li>• <strong>Save Confirmation:</strong> Confirmation dialog validates inputs before saving</li>
                    <li>• <strong>Multi-Tenant:</strong> Each user configures their own database</li>
                  </ul>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-1">API Configuration</h4>
                  <p className="text-sm text-muted-foreground">
                    Add your API keys for production mode:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
                    <li>• <strong>OpenRouter:</strong> For LLM-based contact extraction</li>
                    <li>• <strong>Mixedbread:</strong> For embedding generation</li>
                    <li>• <strong>Apollo.io:</strong> For contact enrichment</li>
                    <li>• <strong>Hunter.io:</strong> For email verification</li>
                    <li>• <strong>Meta GraphAPI:</strong> For Facebook/Instagram data</li>
                  </ul>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-1">Import/Export Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Share your configuration with team members:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
                    <li>• <strong>Export:</strong> Download all settings as JSON file (includes Supabase config)</li>
                    <li>• <strong>Import:</strong> Upload JSON file to restore settings</li>
                    <li>• <strong>Team Sharing:</strong> Admins can export config for new team members</li>
                  </ul>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-1">Demo Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    Toggle demo mode to test without using API credits
                  </p>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-1">Logging</h4>
                  <p className="text-sm text-muted-foreground">
                    Enable detailed logs for debugging (admin only)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logs</CardTitle>
              <CardDescription>Monitor system activity and debugging</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>View detailed logs of all operations including:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Job processing timeline</li>
                  <li>API calls and responses</li>
                  <li>Contact filtering and enrichment</li>
                  <li>Errors and warnings</li>
                </ul>
                <p className="mt-2">
                  <Badge variant="secondary">Admin Only</Badge>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage users, roles, and approvals (admin only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>User Management:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>View all users in your organization</li>
                  <li>See user roles (admin/user) and status (pending/approved)</li>
                  <li><strong>Approve pending users</strong> to grant system access</li>
                  <li>Promote users to admin or demote admins to user</li>
                  <li><strong>Demo Mode:</strong> Shows dummy data (1 admin + 3 users) for testing</li>
                </ul>
                <p className="mt-2">
                  <Badge variant="secondary">Admin Only</Badge>
                </p>
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-xs">
                    <strong>Approval System:</strong> New users sign up as "pending" and are locked in Demo mode until an admin approves them via this page.
                  </p>
                </div>
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <p className="text-xs">
                    <strong>Important:</strong> First user = admin + approved. All subsequent users = user + pending (must be approved).
                  </p>
                </div>
                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <p className="text-xs">
                    <strong>Demo Mode Data:</strong> When Demo mode is ON, this page shows 4 dummy users (1 admin + 3 users with 2 pending) to demonstrate the approval workflow without real data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WORKFLOW TAB */}
        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complete Workflow</CardTitle>
              <CardDescription>From source selection to Meta Ads export</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <div className="flex-1 pb-8">
                    <h4 className="font-semibold mb-1">Add Source Audiences</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Create Source Audiences with Facebook/Instagram URLs
                    </p>
                    <Badge variant="outline">Source Audiences → Create New</Badge>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">2</span>
                  </div>
                  <div className="flex-1 pb-8">
                    <h4 className="font-semibold mb-1">Select & Search</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Select audiences and start AI-powered contact extraction
                    </p>
                    <Badge variant="outline">Check boxes → Start Search</Badge>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">3</span>
                  </div>
                  <div className="flex-1 pb-8">
                    <h4 className="font-semibold mb-1">AI Processing</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      System automatically extracts, filters, and enriches contacts:
                    </p>
                    <div className="text-sm space-y-1 ml-4">
                      <p>✓ Extracts from social media posts/comments</p>
                      <p>✓ Filters partial contacts (missing email/name)</p>
                      <p>✓ Enriches missing data (Hunter Finder + Apollo)</p>
                      <p>✓ Verifies email validity (Hunter Verifier)</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">4</span>
                  </div>
                  <div className="flex-1 pb-8">
                    <h4 className="font-semibold mb-1">Review Shared Audiences</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Check extracted contacts in Shared Audiences
                    </p>
                    <Badge variant="outline">Navigate to Shared Audiences</Badge>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">5</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Export to Meta Ads</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload contacts to Meta Custom Audiences for targeting
                    </p>
                    <Badge variant="outline">Shared Audiences → Upload to Meta</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Quality & Filtering</CardTitle>
              <CardDescription>How we ensure high-quality contacts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Required Fields
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Meta Ads Custom Audiences require a complete triplet:
                  </p>
                  <div className="grid gap-2 mt-2 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Email address</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>First name</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Last name</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Partial Contact Handling
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Contacts missing required fields go through enrichment:
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>Missing email?</strong> → Hunter Email Finder attempts to find it</p>
                    <p><strong>Missing name?</strong> → Apollo Enrichment attempts to recover it</p>
                    <p><strong>Still incomplete?</strong> → Contact is discarded (logged in CSV)</p>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Email Verification
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    All emails are verified for validity:
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>• SMTP server check</p>
                    <p>• MX records validation</p>
                    <p>• Confidence score (0-100)</p>
                    <p>• Disposable email detection</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TECHNICAL TAB */}
        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Architecture & Services</CardTitle>
              <CardDescription>Technical overview of the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold mb-2">Data Pipeline</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>1. Meta GraphAPI:</strong> Fetch posts/comments from FB/IG</p>
                    <p><strong>2. OpenRouter LLM:</strong> Extract contact information (Claude 3.5 Sonnet)</p>
                    <p><strong>3. Contact Filtering:</strong> Separate complete vs partial contacts</p>
                    <p><strong>4. Hunter Email Finder:</strong> Find missing emails</p>
                    <p><strong>5. Apollo Enrichment:</strong> Recover missing names, enrich data</p>
                    <p><strong>6. Hunter Email Verifier:</strong> Verify email validity</p>
                    <p><strong>7. Mixedbread Embeddings:</strong> Generate vector embeddings</p>
                    <p><strong>8. Shared Audience:</strong> Store only complete contacts</p>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold mb-2">Services & APIs</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Database className="h-4 w-4 mt-0.5 text-blue-600" />
                      <div>
                        <span className="font-semibold">Meta GraphAPI</span>
                        <span className="text-muted-foreground"> - Facebook/Instagram data</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Zap className="h-4 w-4 mt-0.5 text-yellow-600" />
                      <div>
                        <span className="font-semibold">OpenRouter</span>
                        <span className="text-muted-foreground"> - LLM extraction (Claude 3.5 Sonnet)</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Database className="h-4 w-4 mt-0.5 text-purple-600" />
                      <div>
                        <span className="font-semibold">Mixedbread</span>
                        <span className="text-muted-foreground"> - Embedding generation (mxbai-embed-large-v1)</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 mt-0.5 text-green-600" />
                      <div>
                        <span className="font-semibold">Apollo.io</span>
                        <span className="text-muted-foreground"> - Contact enrichment</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 mt-0.5 text-orange-600" />
                      <div>
                        <span className="font-semibold">Hunter.io</span>
                        <span className="text-muted-foreground"> - Email finder & verifier</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Database className="h-4 w-4 mt-0.5 text-cyan-600" />
                      <div>
                        <span className="font-semibold">Supabase</span>
                        <span className="text-muted-foreground"> - Database & authentication</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cost Considerations
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><strong>API Costs (per contact):</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>OpenRouter LLM: ~$0.0001 - $0.001 per extraction</li>
                      <li>Mixedbread Embeddings: ~$0.00001 per embedding</li>
                      <li>Apollo Enrichment: ~$0.01 - $0.05 per contact</li>
                      <li>Hunter Email Finder: ~$0.02 per search (2 credits)</li>
                      <li>Hunter Verifier: ~$0.001 per verification (1 credit)</li>
                    </ul>
                    <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                      <p className="text-xs">
                        <strong>Tip:</strong> Demo mode is free and perfect for testing!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Privacy & Security</CardTitle>
              <CardDescription>How we protect your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <p><strong>Secure Storage:</strong> All data stored in encrypted Supabase database</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <p><strong>API Keys:</strong> Encrypted and stored securely in Settings</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <p><strong>Public Data Only:</strong> Only extracts from publicly available posts/comments</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <p><strong>Meta Compliance:</strong> Follows Meta's Custom Audience requirements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started with API Keys</CardTitle>
              <CardDescription>Configure your own API credentials for production mode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold">User-Configured API Keys</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Lume is designed so each user can configure their own API keys. Your deployment doesn't need any credentials on the server.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Step 1: Start in Demo Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    When you first open Lume, it runs in <strong>Demo Mode</strong> with simulated data. You can explore all features without any setup or costs.
                  </p>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">Step 2: Configure Your Database (Supabase)</h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>To switch to production mode, click the <strong>Demo switch</strong> in the header to turn it OFF. You'll be prompted to configure your database:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">supabase.com</a></li>
                      <li>Copy your <strong>Project URL</strong> and <strong>anon/public key</strong> from Settings → API</li>
                      <li>Enter them in the "Setup Database" page</li>
                    </ul>
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                      <strong>Important:</strong> Each user configures their own Supabase project. Your data stays in your database, completely private!
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">Step 3: Configure Additional API Keys</h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>After configuring your database, navigate to <strong>Settings → API Keys</strong> to add more services:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>OpenRouter:</strong> Your API key for LLM extraction</li>
                      <li><strong>Mixedbread:</strong> Your API key for embeddings</li>
                      <li><strong>Apollo.io:</strong> Your API key for contact enrichment</li>
                      <li><strong>Hunter.io:</strong> Your API key for email verification</li>
                      <li><strong>Meta:</strong> Your app credentials for Facebook/Instagram</li>
                    </ul>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">Step 4: Start Production Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    Once your database is configured, Demo mode turns OFF automatically and Lume will use your real database. Configure additional API keys as needed for specific features.
                  </p>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">Security & Privacy</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>✓ API keys are stored in your browser (encrypted)</p>
                    <p>✓ Keys are never sent to any server except the intended API services</p>
                    <p>✓ Each user has their own isolated configuration</p>
                    <p>✓ Clearing browser data removes your API keys</p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">Getting API Keys</h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><strong>OpenRouter:</strong> Get key at <a href="https://openrouter.ai" target="_blank" rel="noopener" className="text-blue-600 hover:underline">openrouter.ai</a></p>
                    <p><strong>Mixedbread:</strong> Get key at <a href="https://www.mixedbread.ai" target="_blank" rel="noopener" className="text-blue-600 hover:underline">mixedbread.ai</a></p>
                    <p><strong>Apollo.io:</strong> Get key at <a href="https://www.apollo.io" target="_blank" rel="noopener" className="text-blue-600 hover:underline">apollo.io</a></p>
                    <p><strong>Hunter.io:</strong> Get key at <a href="https://hunter.io" target="_blank" rel="noopener" className="text-blue-600 hover:underline">hunter.io</a></p>
                    <p><strong>Meta:</strong> Create app at <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">developers.facebook.com</a></p>
                    <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-950 rounded text-xs">
                      <strong>Note:</strong> Supabase configuration is handled in Step 2 when you disable Demo mode.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting</CardTitle>
              <CardDescription>Common issues and solutions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold mb-1">Job stuck at "Processing..."</h4>
                  <p className="text-sm text-muted-foreground">
                    Check the Logs page for detailed error messages. Ensure all API keys are configured in Settings.
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold mb-1">No contacts found</h4>
                  <p className="text-sm text-muted-foreground">
                    Verify the source URLs are accessible and public. Some private groups/profiles cannot be accessed.
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold mb-1">Upload to Meta failed</h4>
                  <p className="text-sm text-muted-foreground">
                    Ensure Meta GraphAPI token is valid and has permissions for Custom Audiences management.
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold mb-1">High rate of partial contacts</h4>
                  <p className="text-sm text-muted-foreground">
                    This is normal! Social media comments often lack complete information. Enrichment services help recover missing data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
