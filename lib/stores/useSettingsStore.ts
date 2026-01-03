import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExportableSettings } from '@/types'

interface SettingsState {
  // Demo mode
  demoMode: boolean
  setDemoMode: (enabled: boolean) => void

  // LLM Settings
  selectedLlmModel: string
  setSelectedLlmModel: (model: string) => void

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
}

const defaultSettings = {
  demoMode: true,
  selectedLlmModel: 'mistral-7b-instruct:free',
  apiKeys: {},
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      setDemoMode: (enabled) => set({ demoMode: enabled }),

      setSelectedLlmModel: (model) => set({ selectedLlmModel: model }),

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
        const { apiKeys, demoMode, selectedLlmModel } = get()
        return {
          apiKeys,
          demoMode,
          selectedLlmModel,
        }
      },

      importSettings: (settings) => {
        set({
          apiKeys: settings.apiKeys || {},
          demoMode: settings.demoMode ?? true,
          selectedLlmModel: settings.selectedLlmModel || 'mistral-7b-instruct:free',
        })
      },

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'lume-settings',
    }
  )
)
