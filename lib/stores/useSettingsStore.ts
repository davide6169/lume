import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExportableSettings } from '@/types'
import { encryptApiKeys, decryptApiKeys, encryptSupabaseConfig, decryptSupabaseConfig } from '@/lib/utils/encryption'

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

  // API Keys (encrypted, stored client-side)
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

      setApiKey: (service, key) => {
        // Encrypt the API key before storing
        const encrypted = encryptApiKeys({ [service]: key })
        set((state) => ({
          apiKeys: { ...state.apiKeys, ...encrypted },
        }))
      },

      removeApiKey: (service) =>
        set((state) => {
          const newKeys = { ...state.apiKeys }
          delete newKeys[service]
          return { apiKeys: newKeys }
        }),

      setSupabaseConfig: (url, anonKey) => {
        // Encrypt Supabase config before storing
        const encrypted = encryptSupabaseConfig({
          url: url.trim(),
          anonKey: anonKey.trim(),
        })
        set(() => ({
          supabaseConfig: encrypted,
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
        // Decrypt config before checking
        const decrypted = decryptSupabaseConfig(supabaseConfig)
        return (
          decrypted.url !== '' &&
          decrypted.anonKey !== '' &&
          !decrypted.url.includes('your-project') &&
          !decrypted.anonKey.includes('your-anon-key')
        )
      },

      exportSettings: () => {
        const { apiKeys, demoMode, logsEnabled, selectedLlmModel, selectedEmbeddingModel, supabaseConfig, maxItemsFacebook, maxItemsInstagram } = get()
        // Decrypt sensitive data before export (WARNING: this still exposes keys!)
        const decryptedApiKeys = decryptApiKeys(apiKeys)
        const decryptedSupabaseConfig = decryptSupabaseConfig(supabaseConfig)
        return {
          apiKeys: decryptedApiKeys,
          demoMode,
          logsEnabled,
          selectedLlmModel,
          selectedEmbeddingModel,
          supabaseConfig: decryptedSupabaseConfig,
          maxItemsFacebook,
          maxItemsInstagram,
        }
      },

      importSettings: (settings) => {
        // Encrypt sensitive data on import
        const encryptedApiKeys = settings.apiKeys ? encryptApiKeys(settings.apiKeys) : {}
        const encryptedSupabaseConfig = settings.supabaseConfig
          ? encryptSupabaseConfig(settings.supabaseConfig)
          : { url: '', anonKey: '' }

        set({
          apiKeys: encryptedApiKeys,
          demoMode: settings.demoMode ?? true,
          logsEnabled: settings.logsEnabled ?? (settings.demoMode ?? true), // Default based on demo mode
          selectedLlmModel: settings.selectedLlmModel || 'mistral-7b-instruct:free',
          selectedEmbeddingModel: settings.selectedEmbeddingModel || 'mxbai-embed-large-v1',
          maxItemsFacebook: settings.maxItemsFacebook ?? 100,
          maxItemsInstagram: settings.maxItemsInstagram ?? 100,
          supabaseConfig: encryptedSupabaseConfig,
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
        apiKeys: state.apiKeys, // Already encrypted
        supabaseConfig: state.supabaseConfig, // Already encrypted
      }),
      // Decrypt state on hydration from localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Decrypt API keys on load (safeDecrypt handles both encrypted and plain text)
          if (state.apiKeys && Object.keys(state.apiKeys).length > 0) {
            state.apiKeys = decryptApiKeys(state.apiKeys)
          }

          // Decrypt Supabase config on load (safeDecrypt handles both encrypted and plain text)
          if (state.supabaseConfig && (state.supabaseConfig.url || state.supabaseConfig.anonKey)) {
            state.supabaseConfig = decryptSupabaseConfig(state.supabaseConfig)
          }
        }
      },
    }
  )
)
