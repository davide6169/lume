import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExportableSettings } from '@/types'

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

  // API Keys (encrypted, stored client-side)
  apiKeys: {
    meta?: string
    supabase?: string
    openrouter?: string
    mixedbread?: string
    apollo?: string
    hunter?: string
  }
  setApiKey: (service: keyof SettingsState['apiKeys'], key: string) => void
  removeApiKey: (service: keyof SettingsState['apiKeys']) => void

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
  apiKeys: {},
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

      setApiKey: (service, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [service]: key },
        })),

      removeApiKey: (service) =>
        set((state) => {
          const newKeys = { ...state.apiKeys }
          delete newKeys[service]
          return { apiKeys: newKeys }
        }),

      exportSettings: () => {
        const { apiKeys, demoMode, logsEnabled, selectedLlmModel, selectedEmbeddingModel } = get()
        return {
          apiKeys,
          demoMode,
          logsEnabled,
          selectedLlmModel,
          selectedEmbeddingModel,
        }
      },

      importSettings: (settings) => {
        set({
          apiKeys: settings.apiKeys || {},
          demoMode: settings.demoMode ?? true,
          logsEnabled: settings.logsEnabled ?? (settings.demoMode ?? true), // Default based on demo mode
          selectedLlmModel: settings.selectedLlmModel || 'mistral-7b-instruct:free',
          selectedEmbeddingModel: settings.selectedEmbeddingModel || 'mxbai-embed-large-v1',
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
    }
  )
)
