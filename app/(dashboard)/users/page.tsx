'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSupabase } from '@/components/providers/supabase-provider'
import { useDemoStore } from '@/lib/stores/useDemoStore'
import { Shield, Users, AlertCircle, Crown, User, Loader2, Check, Clock } from 'lucide-react'
import { AlertConfirmDialog } from '@/components/alert-confirm-dialog'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'user'
  status: 'pending' | 'approved'
  created_at: string
}

export default function UsersPage() {
  const { profile } = useSupabase()
  const { isDemoMode } = useDemoStore()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Check if current user is admin OR in demo mode (for testing)
  const isAdmin = profile?.role === 'admin'
  const canAccessUsers = isAdmin || isDemoMode

  // Demo data for testing
  const demoUsers: Profile[] = [
    {
      id: 'demo-admin-1',
      email: 'admin@company.com',
      full_name: 'Admin User',
      role: 'admin',
      status: 'approved',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    },
    {
      id: 'demo-user-2',
      email: 'john.doe@company.com',
      full_name: 'John Doe',
      role: 'user',
      status: 'approved',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    },
    {
      id: 'demo-user-3',
      email: 'jane.smith@company.com',
      full_name: 'Jane Smith',
      role: 'user',
      status: 'pending',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
    {
      id: 'demo-user-4',
      email: 'bob.wilson@company.com',
      full_name: 'Bob Wilson',
      role: 'user',
      status: 'pending',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
  ]

  useEffect(() => {
    if (canAccessUsers) {
      if (isDemoMode) {
        // Use demo data
        setUsers(demoUsers)
        setLoading(false)
        setError('')
      } else {
        // Fetch real data
        fetchUsers()
      }
    }
  }, [canAccessUsers, isDemoMode])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/users')

      if (!response.ok) {
        if (response.status === 403) {
          setError('You do not have permission to view this page.')
        } else {
          setError('Failed to fetch users')
        }
        return
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to fetch users. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRole = async (userId: string, currentRole: string, userEmail: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    const action = newRole === 'admin' ? 'promote' : 'demote'

    const confirmed = await AlertConfirmDialog({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      description: (
        <div className="space-y-2">
          <p>Are you sure you want to <strong>{action}</strong> this user?</p>
          <p className="text-sm text-muted-foreground">
            <strong>User:</strong> {userEmail}
          </p>
          <p className="text-sm">
            New role: <Badge variant={newRole === 'admin' ? 'default' : 'secondary'}>{newRole}</Badge>
          </p>
          {action === 'demote' && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              ⚠️ This user will lose access to admin features like the Logs page.
            </p>
          )}
        </div>
      ),
      confirmText: 'Yes, continue',
      cancelText: 'Cancel',
    })

    if (!confirmed) return

    try {
      setActionLoading(userId)

      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to update user role')
        return
      }

      // Refresh users list
      await fetchUsers()
    } catch (err) {
      console.error('Error updating user role:', err)
      setError('Failed to update user role. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleApproveUser = async (userId: string, userEmail: string) => {
    const confirmed = await AlertConfirmDialog({
      title: 'Approve User Account',
      description: (
        <div className="space-y-2">
          <p>Are you sure you want to <strong>approve</strong> this user?</p>
          <p className="text-sm text-muted-foreground">
            <strong>User:</strong> {userEmail}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            ✓ This user will be able to access the system and use all features based on their role.
          </p>
        </div>
      ),
      confirmText: 'Approve',
      cancelText: 'Cancel',
      variant: 'default',
    })

    if (!confirmed) return

    try {
      setActionLoading(userId)

      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: 'approved' }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to approve user')
        return
      }

      // Refresh users list
      await fetchUsers()
    } catch (err) {
      console.error('Error approving user:', err)
      setError('Failed to approve user. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  if (!canAccessUsers) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage users and permissions</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access this page. This feature is only available to administrators.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage users and permissions</p>
        </div>

        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          </div>
          <p className="text-muted-foreground">
            Manage users and their roles in your organization
            {isDemoMode && " (simulated data for testing)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Demo Mode
            </span>
          )}
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            Admin View
          </Badge>
        </div>
      </div>

      {/* Info Card */}
      <Alert className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm">
          <strong>Admin Privileges:</strong> Admins can access the Logs page and manage user roles.
          Approve pending users to grant them access to the system. The first user was automatically promoted to admin.
        </AlertDescription>
      </Alert>

      {/* Pending Users Alert */}
      {users.filter(u => u.status === 'pending').length > 0 && (
        <Alert className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm">
            <strong>Pending Approvals:</strong> You have {users.filter(u => u.status === 'pending').length} user(s) waiting for approval.
            Pending users cannot access the system until approved.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
          <CardDescription>
            View and manage user roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No users found. Once users sign up, they will appear here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {user.full_name
                            ? user.full_name.split(' ')[0][0].toUpperCase()
                            : user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.full_name || 'No name'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.status === 'approved' ? (
                        <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                          <Check className="h-3 w-3" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.role === 'admin' ? (
                        <Badge className="gap-1 bg-purple-600 hover:bg-purple-700">
                          <Crown className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <User className="h-3 w-3" />
                          User
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.status === 'pending' ? (
                        <Button
                          size="sm"
                          onClick={() => handleApproveUser(user.id, user.email)}
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant={user.role === 'admin' ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleToggleRole(user.id, user.role, user.email)}
                          disabled={actionLoading === user.id || user.id === profile?.id}
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : user.role === 'admin' ? (
                            'Demote to User'
                          ) : (
                            'Promote to Admin'
                          )}
                        </Button>
                      )}
                      {user.id === profile?.id && (
                        <div className="text-xs text-muted-foreground mt-1">
                          (Your account)
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
