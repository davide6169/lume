'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/auth/actions'
import { useSupabase } from '@/components/providers/supabase-provider'
import { useSettingsStore } from '@/lib/stores/useSettingsStore'
import { useDemoStore } from '@/lib/stores/useDemoStore'
import { JobNotificationProvider } from '@/components/providers/job-notification-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { ThemeToggle } from '@/components/theme-toggle'
import { LumeLogo } from '@/components/icons/lume-logo'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Filter,
  Settings,
  FileText,
  LogOut,
  Menu,
  X,
  Facebook,
  Instagram,
  Sparkles,
  BookOpen,
} from 'lucide-react'

const navItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Source Audiences',
    href: '/source-audiences',
    icon: Users,
    badge: 'Source',
  },
  {
    name: 'Shared Audiences',
    href: '/shared-audiences',
    icon: UserPlus,
    badge: 'Shared',
  },
  {
    name: 'Filters',
    href: '/filters',
    icon: Filter,
  },
  {
    name: 'Logs',
    href: '/logs',
    icon: FileText,
    adminOnly: true,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    name: 'Docs',
    href: '/docs',
    icon: BookOpen,
  },
]

const demoBadgeLabels = {
  'Source Audiences': 'Demo',
  'Shared Audiences': 'Demo',
} as Record<string, string>

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { profile } = useSupabase()
  const { logsEnabled } = useSettingsStore()
  const { isDemoMode, setIsDemoMode } = useDemoStore()
  const [mounted, setMounted] = useState(false)

  // Ensure client-side hydration is complete before using logsEnabled
  useEffect(() => {
    setMounted(true)
  }, [])

  const userInitials = profile?.fullName
    ? profile.fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <JobNotificationProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10">
                  <LumeLogo className="w-full h-full" />
                </div>
                <span className="font-bold text-xl">Lume</span>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  if (item.adminOnly && profile?.role !== 'admin') {
                    return null
                  }

                  // Hide Logs if logging is disabled (even for admins)
                  // Only apply this check after client-side hydration to avoid mismatch
                  if (item.name === 'Logs' && mounted && !logsEnabled) {
                    return null
                  }

                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  const Icon = item.icon

                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-2 ${isActive ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Button>
                    </Link>
                  )
                })}
                <Separator orientation="vertical" className="h-6 mx-2" />
                {/* Demo Mode Switch */}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-md ${isDemoMode ? 'bg-purple-50 dark:bg-purple-950' : 'bg-gray-50 dark:bg-gray-950'}`}>
                  <Sparkles className={`h-4 w-4 ${isDemoMode ? 'text-purple-600' : 'text-gray-600'}`} />
                  <span className="text-sm font-medium">Demo</span>
                  <Switch
                    checked={isDemoMode}
                    onCheckedChange={(checked) => {
                      setIsDemoMode(checked)
                      // Also sync with settings store
                      useSettingsStore.getState().setDemoMode(checked)
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {isDemoMode ? 'ON' : 'OFF'}
                  </span>
                </div>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile?.fullName || 'User'}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile?.email}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {profile?.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-6 px-4">
          {children}
        </main>
      </div>
    </JobNotificationProvider>
  )
}
