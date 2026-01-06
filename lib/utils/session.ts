/**
 * Client-side session cleanup utilities
 * Call these when user logs out or session expires
 */

/**
 * Complete logout cleanup - clears all local data
 * Call this before redirecting to login page
 */
export function cleanupSession(): void {
  try {
    // Clear all localStorage data
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }

    console.log('[Session] All local data cleared')
  } catch (error) {
    console.error('[Session] Error clearing local data:', error)
  }
}

/**
 * Clear specific app data without clearing everything
 * Useful for partial cleanup
 */
export function clearAppData(): void {
  try {
    if (typeof window !== 'undefined') {
      // Clear app-specific keys
      const keysToRemove = [
        'lume-settings', // Zustand persist key
        'lume-debug',
      ]

      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      })

      console.log('[Session] App data cleared')
    }
  } catch (error) {
    console.error('[Session] Error clearing app data:', error)
  }
}

/**
 * Get all stored keys for debugging
 */
export function getStoredKeys(): string[] {
  if (typeof window === 'undefined') return []

  const keys: string[] = []

  // Get localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) keys.push(`localStorage: ${key}`)
  }

  // Get sessionStorage keys
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key) keys.push(`sessionStorage: ${key}`)
  }

  return keys
}

/**
 * Get storage usage statistics
 */
export function getStorageStats(): {
  localStorage: { items: number; sizeKB: number }
  sessionStorage: { items: number; sizeKB: number }
} {
  if (typeof window === 'undefined') {
    return { localStorage: { items: 0, sizeKB: 0 }, sessionStorage: { items: 0, sizeKB: 0 } }
  }

  const calculateSize = (storage: Storage) => {
    let total = 0
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key) {
        const value = storage.getItem(key)
        if (value) {
          total += key.length + value.length
        }
      }
    }
    return Math.round(total / 1024) // Convert to KB
  }

  return {
    localStorage: {
      items: localStorage.length,
      sizeKB: calculateSize(localStorage),
    },
    sessionStorage: {
      items: sessionStorage.length,
      sizeKB: calculateSize(sessionStorage),
    },
  }
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Safe localStorage operations with error handling
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value)
      return true
    } catch {
      return false
    }
  },

  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },

  clear: (): boolean => {
    try {
      localStorage.clear()
      return true
    } catch {
      return false
    }
  },
}
