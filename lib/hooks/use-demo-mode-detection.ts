'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/lib/stores/useSettingsStore'
import { useDemoStore } from '@/lib/stores/useDemoStore'

/**
 * Hook that automatically manages demo mode based on:
 * 1. Demo user authentication (JWT token in cookie)
 * 2. API key configuration
 * - If user is demo user OR env vars have placeholders → Demo mode is forced ON
 * - If user has configured keys in settings → Demo mode can be toggled
 */
export function useDemoModeDetection() {
  const { apiKeys } = useSettingsStore()
  const { isDemoMode, setIsDemoMode } = useDemoStore()

  useEffect(() => {
    const checkDemoStatus = async () => {
      try {
        // Check if current user is a demo user
        const response = await fetch('/api/user/demo')
        const data = await response.json()

        if (data.isDemo) {
          // User is authenticated as demo user - force demo mode ON
          setIsDemoMode(true)
          return
        }

        // Check if any API keys are configured in settings
        const hasUserConfiguredKeys = Object.keys(apiKeys).length > 0 &&
          Object.values(apiKeys).some(key => key && key.length > 0 && !key.startsWith('your-'))

        // No keys configured and demo mode is off - force it on
        if (!hasUserConfiguredKeys && !isDemoMode) {
          setIsDemoMode(true)
        }
      } catch (error) {
        console.error('Failed to check demo status:', error)
      }
    }

    checkDemoStatus()
  }, [apiKeys, isDemoMode, setIsDemoMode])

  return {
    isDemoMode,
    canDisableDemoMode: Object.keys(apiKeys).length > 0 &&
      Object.values(apiKeys).some(key => key && key.length > 0 && !key.startsWith('your-'))
  }
}
