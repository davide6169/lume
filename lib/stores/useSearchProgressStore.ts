import { create } from 'zustand'
import type { SearchProgress, OverallProgress } from '@/types'

interface SearchProgressState {
  // Individual progress per source audience
  progressItems: SearchProgress[]
  setProgressItems: (items: SearchProgress[]) => void

  updateProgress: (sourceAudienceId: string, updates: Partial<SearchProgress>) => void
  addProgressItem: (item: SearchProgress) => void
  removeProgressItem: (sourceAudienceId: string) => void

  // Overall progress
  overallProgress: OverallProgress
  updateOverallProgress: (updates: Partial<OverallProgress>) => void
  recalculateOverallProgress: () => void

  // Search state
  isSearching: boolean
  setIsSearching: (searching: boolean) => void

  // Control
  cancelRequested: boolean
  setCancelRequested: (requested: boolean) => void

  // Reset
  reset: () => void
}

const initialOverallProgress: OverallProgress = {
  totalSourceAudiences: 0,
  processedSourceAudiences: 0,
  totalUrls: 0,
  processedUrls: 0,
  percentage: 0,
  isRunning: false,
  canCancel: true,
}

export const useSearchProgressStore = create<SearchProgressState>((set, get) => ({
  progressItems: [],
  overallProgress: initialOverallProgress,
  isSearching: false,
  cancelRequested: false,

  setProgressItems: (items) => {
    set({ progressItems: items })
    get().recalculateOverallProgress()
  },

  updateProgress: (sourceAudienceId, updates) =>
    set((state) => {
      const newItems = state.progressItems.map((item) =>
        item.sourceAudienceId === sourceAudienceId
          ? { ...item, ...updates }
          : item
      )
      get().recalculateOverallProgress()
      return { progressItems: newItems }
    }),

  addProgressItem: (item) =>
    set((state) => {
      const newItems = [...state.progressItems, item]
      get().recalculateOverallProgress()
      return { progressItems: newItems }
    }),

  removeProgressItem: (sourceAudienceId) =>
    set((state) => {
      const newItems = state.progressItems.filter(
        (item) => item.sourceAudienceId !== sourceAudienceId
      )
      get().recalculateOverallProgress()
      return { progressItems: newItems }
    }),

  updateOverallProgress: (updates) =>
    set((state) => ({
      overallProgress: { ...state.overallProgress, ...updates },
    })),

  recalculateOverallProgress: () => {
    const items = get().progressItems

    if (items.length === 0) {
      set({ overallProgress: initialOverallProgress })
      return
    }

    const totalSourceAudiences = items.length
    const processedSourceAudiences = items.filter(
      (item) => item.status === 'completed'
    ).length

    const totalUrls = items.reduce((sum, item) => sum + item.totalUrls, 0)
    const processedUrls = items.reduce((sum, item) => sum + item.processedUrls, 0)

    const isRunning = items.some((item) => item.status === 'processing')

    // Calculate percentage based on both source audiences and URLs
    const audienceProgress = (processedSourceAudiences / totalSourceAudiences) * 100
    const urlProgress = totalUrls > 0 ? (processedUrls / totalUrls) * 100 : 0
    const percentage = (audienceProgress + urlProgress) / 2

    set({
      overallProgress: {
        totalSourceAudiences,
        processedSourceAudiences,
        totalUrls,
        processedUrls,
        percentage,
        isRunning,
        canCancel: isRunning,
      },
    })
  },

  setIsSearching: (searching) => set({ isSearching: searching }),

  setCancelRequested: (requested) => set({ cancelRequested: requested }),

  reset: () =>
    set({
      progressItems: [],
      overallProgress: initialOverallProgress,
      isSearching: false,
      cancelRequested: false,
    }),
}))
