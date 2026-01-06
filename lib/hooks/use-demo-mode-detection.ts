'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/lib/stores/useSettingsStore'
import { useDemoStore } from '@/lib/stores/useDemoStore'

/**
 * Hook that automatically manages demo mode based on API key configuration
 * - If env vars have placeholders → Demo mode is forced ON
 * - If user has configured keys in settings → Demo mode can be toggled
 */
export function useDemoModeDetection() {
  const { apiKeys } = useSettingsStore()
  const { isDemoMode, setIsDemoMode } = useDemoStore()

  useEffect(() => {
    // Check if any API keys are configured in settings
    const hasUserConfiguredKeys = Object.keys(apiKeys).length > 0 &&
      Object.values(apiKeys).some(key => key && key.length > 0 && !key.startsWith('your-'))

    // Check if environment is using placeholders (server-side check)
    // We can't directly check server env vars from client, so we rely on:
    // 1. User has configured keys in settings → allow production mode
    // 2. No keys configured → keep demo mode on

    if (!hasUserConfiguredKeys && !isDemoMode) {
      // No keys configured and demo mode is off - force it on
      setIsDemoMode(true)
    }
  }, [apiKeys, isDemoMode, setIsDemoMode])

  return {
    isDemoMode,
    canDisableDemoMode: Object.keys(apiKeys).length > 0 &&
      Object.values(apiKeys).some(key => key && key.length > 0 && !key.startsWith('your-'))
  }
}
