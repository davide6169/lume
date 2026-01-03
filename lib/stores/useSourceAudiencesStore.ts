import { create } from 'zustand'
import type { SourceAudience } from '@/types'

interface SourceAudiencesState {
  sourceAudiences: SourceAudience[]
  setSourceAudiences: (audiences: SourceAudience[]) => void

  addSourceAudience: (audience: SourceAudience) => void
  updateSourceAudience: (id: string, updates: Partial<SourceAudience>) => void
  removeSourceAudiences: (ids: string[]) => void

  // Selection
  toggleSelectAll: (selected: boolean) => void
  toggleSelectOne: (id: string) => void

  // Stats
  getSelectedCount: () => number
  getTotalUrlsCount: () => number
  getSelectedUrlsCount: () => number

  // Export/Import
  exportAsJson: () => string
  importFromJson: (json: string) => boolean

  // Reset
  reset: () => void
}

export const useSourceAudiencesStore = create<SourceAudiencesState>((set, get) => ({
  sourceAudiences: [],

  setSourceAudiences: (audiences) => set({ sourceAudiences: audiences }),

  addSourceAudience: (audience) =>
    set((state) => ({
      sourceAudiences: [audience, ...state.sourceAudiences],
    })),

  updateSourceAudience: (id, updates) =>
    set((state) => ({
      sourceAudiences: state.sourceAudiences.map((sa) =>
        sa.id === id ? { ...sa, ...updates } : sa
      ),
    })),

  removeSourceAudiences: (ids) =>
    set((state) => ({
      sourceAudiences: state.sourceAudiences.filter(
        (sa) => !ids.includes(sa.id)
      ),
    })),

  toggleSelectAll: (selected) =>
    set((state) => ({
      sourceAudiences: state.sourceAudiences.map((sa) => ({
        ...sa,
        selected,
      })),
    })),

  toggleSelectOne: (id) =>
    set((state) => ({
      sourceAudiences: state.sourceAudiences.map((sa) =>
        sa.id === id ? { ...sa, selected: !sa.selected } : sa
      ),
    })),

  getSelectedCount: () => {
    return get().sourceAudiences.filter((sa) => sa.selected).length
  },

  getTotalUrlsCount: () => {
    return get().sourceAudiences.reduce((sum, sa) => sum + sa.urls.length, 0)
  },

  getSelectedUrlsCount: () => {
    return get()
      .sourceAudiences.filter((sa) => sa.selected)
      .reduce((sum, sa) => sum + sa.urls.length, 0)
  },

  exportAsJson: () => {
    const audiences = get().sourceAudiences.map(
      ({ id, userId, createdAt, updatedAt, ...rest }) => rest
    )
    return JSON.stringify({ sourceAudiences: audiences }, null, 2)
  },

  importFromJson: (json) => {
    try {
      const data = JSON.parse(json)
      if (!data.sourceAudiences || !Array.isArray(data.sourceAudiences)) {
        return false
      }

      // Add imported audiences with new IDs and timestamps
      const imported = data.sourceAudiences.map((sa: any) => ({
        ...sa,
        id: crypto.randomUUID(),
        userId: '', // Will be set on server
        createdAt: new Date(),
        updatedAt: new Date(),
        selected: true,
      }))

      set((state) => ({
        sourceAudiences: [...imported, ...state.sourceAudiences],
      }))

      return true
    } catch {
      return false
    }
  },

  reset: () => set({ sourceAudiences: [] }),
}))
