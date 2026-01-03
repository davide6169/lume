import { create } from 'zustand'
import type { Filter, FilterRule } from '@/types'

interface FiltersState {
  filters: Filter[]
  setFilters: (filters: Filter[]) => void

  activeFilterId: string | null
  setActiveFilterId: (id: string | null) => void

  addFilter: (filter: Filter) => void
  updateFilter: (id: string, updates: Partial<Filter>) => void
  removeFilter: (id: string) => void

  // Export/Import
  exportAsJson: () => string
  importFromJson: (json: string) => boolean

  // Reset
  reset: () => void
}

export const useFiltersStore = create<FiltersState>((set, get) => ({
  filters: [],
  activeFilterId: null,

  setFilters: (filters) => set({ filters }),

  setActiveFilterId: (id) => set({ activeFilterId: id }),

  addFilter: (filter) =>
    set((state) => ({
      filters: [filter, ...state.filters],
    })),

  updateFilter: (id, updates) =>
    set((state) => ({
      filters: state.filters.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),

  removeFilter: (id) =>
    set((state) => ({
      filters: state.filters.filter((f) => f.id !== id),
      activeFilterId: state.activeFilterId === id ? null : state.activeFilterId,
    })),

  exportAsJson: () => {
    const filters = get().filters.map(
      ({ id, userId, createdAt, updatedAt, ...rest }) => rest
    )
    return JSON.stringify({ filters }, null, 2)
  },

  importFromJson: (json) => {
    try {
      const data = JSON.parse(json)
      if (!data.filters || !Array.isArray(data.filters)) {
        return false
      }

      // Add imported filters with new IDs and timestamps
      const imported = data.filters.map((f: any) => ({
        ...f,
        id: crypto.randomUUID(),
        userId: '', // Will be set on server
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      set((state) => ({
        filters: [...imported, ...state.filters],
      }))

      return true
    } catch {
      return false
    }
  },

  reset: () => set({ filters: [], activeFilterId: null }),
}))
