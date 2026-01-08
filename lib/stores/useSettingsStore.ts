import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExportableSettings } from '@/types'
import { encryptApiKeys, decryptApiKeys, encryptSupabaseConfig, decryptSupabaseConfig } from '@/lib/utils/encryption'

// Note: Encryption/decryption is handled by the storage middleware
// The state always stores decrypted data for easy access

interface SettingsState {
  // Demo mode
  demoMode: boolean
  setDemoMode: (enabled: boolean) => void

  // Logs enabled
  logsEnabled: boolean
  setLogsEnabled: (enabled: boolean) => void

  // LLM Settings
  selectedLlmModel: string
  setSelectedLlmModel: (model: string) => void

  // Embedding Settings
  selectedEmbeddingModel: string
  setSelectedEmbeddingModel: (model: string) => void

  // Scraping limits
  maxItemsFacebook: number
  setMaxItemsFacebook: (limit: number) => void
  maxItemsInstagram: number
  setMaxItemsInstagram: (limit: number) => void

  // Log retention
  logRetentionDays: number
  setLogRetentionDays: (days: number) => void

  // API Keys (encrypted in localStorage, decrypted in state)
  apiKeys: {
    apify?: string
    meta?: string
    supabase?: string
    openrouter?: string
    mixedbread?: string
    apollo?: string
    hunter?: string
  }
  setApiKey: (service: keyof SettingsState['apiKeys'], key: string) => void
  removeApiKey: (service: keyof SettingsState['apiKeys']) => void

  // Supabase user configuration (for multi-tenant setup)
  supabaseConfig: {
    url: string
    anonKey: string
  }
  setSupabaseConfig: (url: string, anonKey: string) => void
  clearSupabaseConfig: () => void
  hasUserSupabaseConfig: () => boolean

  // Import/Export
  exportSettings: () => ExportableSettings
  importSettings: (settings: ExportableSettings) => void

  // Reset
  resetSettings: () => void

  // Sync with database
  syncToDatabase: () => Promise<void>
  loadFromDatabase: () => Promise<void>
}

const defaultSettings = {
  demoMode: true,
  logsEnabled: true, // Enabled by default in demo mode
  selectedLlmModel: 'mistral-7b-instruct:free',
  selectedEmbeddingModel: 'mxbai-embed-large-v1',
  maxItemsFacebook: 100,
  maxItemsInstagram: 100,
  logRetentionDays: 3, // Keep logs for 3 days by default
  apiKeys: {},
  supabaseConfig: {
    url: '',
    anonKey: '',
  },
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      setDemoMode: (enabled) => {
        // When switching to demo mode, enable logs by default
        // When switching to production, disable logs by default
        set({
          demoMode: enabled,
          logsEnabled: enabled,
        })
      },

      setLogsEnabled: (enabled) => set({ logsEnabled: enabled }),

      setSelectedLlmModel: (model) => set({ selectedLlmModel: model }),

      setSelectedEmbeddingModel: (model) => set({ selectedEmbeddingModel: model }),

      setMaxItemsFacebook: (limit) => set({ maxItemsFacebook: limit }),

      setMaxItemsInstagram: (limit) => set({ maxItemsInstagram: limit }),

      setLogRetentionDays: (days) => set({ logRetentionDays: days }),

      setApiKey: (service, key) => {
        // Store the API key as-is (will be encrypted by storage middleware)
        set((state) => ({
          apiKeys: { ...state.apiKeys, [service]: key },
        }))
      },

      removeApiKey: (service) =>
        set((state) => {
          const newKeys = { ...state.apiKeys }
          delete newKeys[service]
          return { apiKeys: newKeys }
        }),

      setSupabaseConfig: (url, anonKey) => {
        // Store Supabase config as-is (will be encrypted by storage middleware)
        set(() => ({
          supabaseConfig: {
            url: url.trim(),
            anonKey: anonKey.trim(),
          },
        }))
      },

      clearSupabaseConfig: () =>
        set((state) => ({
          supabaseConfig: {
            url: '',
            anonKey: '',
          },
        })),

      hasUserSupabaseConfig: () => {
        const { supabaseConfig } = get()
        // Config is now always decrypted in state
        return (
          supabaseConfig.url !== '' &&
          supabaseConfig.anonKey !== '' &&
          !supabaseConfig.url.includes('your-project') &&
          !supabaseConfig.anonKey.includes('your-anon-key')
        )
      },

      exportSettings: () => {
        const { apiKeys, demoMode, logsEnabled, selectedLlmModel, selectedEmbeddingModel, supabaseConfig, maxItemsFacebook, maxItemsInstagram, logRetentionDays } = get()
        // Data is now always decrypted in state (WARNING: this still exposes keys in export!)
        return {
          apiKeys,
          demoMode,
          logsEnabled,
          selectedLlmModel,
          selectedEmbeddingModel,
          supabaseConfig,
          maxItemsFacebook,
          maxItemsInstagram,
          logRetentionDays,
        }
      },

      importSettings: (settings) => {
        // Import data as-is (will be encrypted by storage middleware when saved)
        set({
          apiKeys: settings.apiKeys || {},
          demoMode: settings.demoMode ?? true,
          logsEnabled: settings.logsEnabled ?? (settings.demoMode ?? true), // Default based on demo mode
          selectedLlmModel: settings.selectedLlmModel || 'mistral-7b-instruct:free',
          selectedEmbeddingModel: settings.selectedEmbeddingModel || 'mxbai-embed-large-v1',
          maxItemsFacebook: settings.maxItemsFacebook ?? 100,
          maxItemsInstagram: settings.maxItemsInstagram ?? 100,
          logRetentionDays: settings.logRetentionDays ?? 3,
          supabaseConfig: settings.supabaseConfig || { url: '', anonKey: '' },
        })
      },

      resetSettings: () => set(defaultSettings),

      syncToDatabase: async () => {
        const { demoMode, logsEnabled } = get()
        try {
          const response = await fetch('/api/settings/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ demoMode, logsEnabled }),
          })

          if (!response.ok) {
            console.error('[Settings] Failed to sync to database')
          }
        } catch (error) {
          console.error('[Settings] Error syncing to database:', error)
        }
      },

      loadFromDatabase: async () => {
        try {
          const response = await fetch('/api/settings/save', {
            method: 'GET',
            credentials: 'include',
          })

          if (response.ok) {
            const data = await response.json()
            set({
              demoMode: data.demoMode,
              logsEnabled: data.logsEnabled,
            })
          } else if (response.status === 404) {
            // Settings don't exist in DB yet, keep localStorage values
            console.log('[Settings] No settings in database, using localStorage values')
          }
        } catch (error) {
          console.error('[Settings] Error loading from database:', error)
        }
      },
    }),
    {
      name: 'lume-settings',
      // Transform state to/from storage for encryption
      partialize: (state) => ({
        demoMode: state.demoMode,
        logsEnabled: state.logsEnabled,
        selectedLlmModel: state.selectedLlmModel,
        selectedEmbeddingModel: state.selectedEmbeddingModel,
        maxItemsFacebook: state.maxItemsFacebook,
        maxItemsInstagram: state.maxItemsInstagram,
        apiKeys: state.apiKeys, // Will be transformed by storage
        supabaseConfig: state.supabaseConfig, // Will be transformed by storage
      }),
      // Transform state before saving to storage (encrypt sensitive data)
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          try {
            const data = JSON.parse(str)
            // Decrypt on load from storage
            if (data.state?.apiKeys) {
              data.state.apiKeys = decryptApiKeys(data.state.apiKeys)
            }
            if (data.state?.supabaseConfig) {
              data.state.supabaseConfig = decryptSupabaseConfig(data.state.supabaseConfig)
            }
            return data
          } catch {
            return null
          }
        },
        setItem: (name, value) => {
          try {
            // value is already an object (StorageValue), not a string
            const data = value
            // Encrypt before saving to storage
            if (data.state?.apiKeys) {
              data.state.apiKeys = encryptApiKeys(data.state.apiKeys)
            }
            if (data.state?.supabaseConfig) {
              data.state.supabaseConfig = encryptSupabaseConfig(data.state.supabaseConfig)
            }
            localStorage.setItem(name, JSON.stringify(data))
          } catch (e) {
            console.error('Error saving to storage:', e)
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        },
      },
    }
  )
)
