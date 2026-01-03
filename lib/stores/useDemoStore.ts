import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SourceAudience, SharedAudience } from '@/types'

interface DemoState {
  // Demo source audiences
  demoSourceAudiences: SourceAudience[]
  addDemoSourceAudience: (audience: SourceAudience) => void
  updateDemoSourceAudience: (id: string, updates: Partial<SourceAudience>) => void
  removeDemoSourceAudience: (id: string) => void
  clearDemoSourceAudiences: () => void
  toggleDemoSourceAudienceSelection: (id: string) => void
  deselectAllDemoSourceAudiences: () => void

  // Demo shared audiences
  demoSharedAudiences: SharedAudience[]
  addDemoSharedAudience: (audience: SharedAudience) => void
  updateDemoSharedAudience: (id: string, updates: Partial<SharedAudience>) => void
  removeDemoSharedAudience: (id: string) => void
  clearDemoSharedAudiences: () => void
  toggleDemoSharedAudienceSelection: (id: string) => void
  deselectAllDemoSharedAudiences: () => void

  // Demo mode management
  isDemoMode: boolean
  setIsDemoMode: (enabled: boolean) => void
  canToggleDemoMode: () => boolean // Returns true if there are no real DB audiences
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      // Initial demo data
      demoSourceAudiences: [],
      demoSharedAudiences: [],
      isDemoMode: true,

      addDemoSourceAudience: (audience) =>
        set((state) => ({
          demoSourceAudiences: [...state.demoSourceAudiences, audience],
        })),

      updateDemoSourceAudience: (id, updates) =>
        set((state) => ({
          demoSourceAudiences: state.demoSourceAudiences.map((aud) =>
            aud.id === id ? { ...aud, ...updates } : aud
          ),
        })),

      removeDemoSourceAudience: (id) =>
        set((state) => ({
          demoSourceAudiences: state.demoSourceAudiences.filter((aud) => aud.id !== id),
        })),

      clearDemoSourceAudiences: () => set({ demoSourceAudiences: [] }),

      addDemoSharedAudience: (audience) =>
        set((state) => ({
          demoSharedAudiences: [...state.demoSharedAudiences, audience],
        })),

      removeDemoSharedAudience: (id) =>
        set((state) => ({
          demoSharedAudiences: state.demoSharedAudiences.filter((aud) => aud.id !== id),
        })),

      clearDemoSharedAudiences: () => set({ demoSharedAudiences: [] }),

      toggleDemoSourceAudienceSelection: (id) =>
        set((state) => ({
          demoSourceAudiences: state.demoSourceAudiences.map((aud) =>
            aud.id === id ? { ...aud, selected: !aud.selected } : aud
          ),
        })),

      deselectAllDemoSourceAudiences: () =>
        set((state) => ({
          demoSourceAudiences: state.demoSourceAudiences.map((aud) => ({
            ...aud,
            selected: false,
          })),
        })),

      updateDemoSharedAudience: (id, updates) =>
        set((state) => ({
          demoSharedAudiences: state.demoSharedAudiences.map((aud) =>
            aud.id === id ? { ...aud, ...updates } : aud
          ),
        })),

      toggleDemoSharedAudienceSelection: (id) =>
        set((state) => ({
          demoSharedAudiences: state.demoSharedAudiences.map((aud) =>
            aud.id === id ? { ...aud, selected: !aud.selected } : aud
          ),
        })),

      deselectAllDemoSharedAudiences: () =>
        set((state) => ({
          demoSharedAudiences: state.demoSharedAudiences.map((aud) => ({
            ...aud,
            selected: false,
          })),
        })),

      setIsDemoMode: (enabled) => set({ isDemoMode: enabled }),

      canToggleDemoMode: () => {
        // Demo mode can only be enabled if there are no real DB audiences
        const state = get()
        return !state.isDemoMode // Can always disable demo mode
      },
    }),
    {
      name: 'lume-demo-storage', // localStorage key
    }
  )
)
