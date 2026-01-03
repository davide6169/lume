import { create } from 'zustand'
import type { SharedAudience, Contact } from '@/types'

interface SharedAudiencesState {
  sharedAudiences: SharedAudience[]
  setSharedAudiences: (audiences: SharedAudience[]) => void

  addSharedAudience: (audience: SharedAudience) => void
  updateSharedAudience: (id: string, updates: Partial<SharedAudience>) => void
  removeSharedAudiences: (ids: string[]) => void

  // Selection
  toggleSelectAll: (selected: boolean) => void
  toggleSelectOne: (id: string) => void

  // Stats
  getSelectedCount: () => number
  getTotalContactsCount: () => number
  getSelectedContactsCount: () => number

  // Filters
  applyFilters: (filters: any) => SharedAudience[]

  // Export
  exportSelectedAsCsv: () => string
  exportSharedAudienceAsCsv: (id: string) => string

  // Reset
  reset: () => void
}

// Helper function to convert contacts to CSV format (Meta Ads compliant)
function contactsToCsv(contacts: Contact[]): string {
  if (contacts.length === 0) return ''

  const headers = ['Email', 'FirstName', 'LastName', 'Phone', 'City', 'Country', 'Interests']

  const rows = contacts.map((contact) => [
    contact.email || '',
    contact.firstName || '',
    contact.lastName || '',
    contact.phone || '',
    contact.city || '',
    contact.country || '',
    contact.interests ? contact.interests.join(', ') : '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

export const useSharedAudiencesStore = create<SharedAudiencesState>((set, get) => ({
  sharedAudiences: [],

  setSharedAudiences: (audiences) => set({ sharedAudiences: audiences }),

  addSharedAudience: (audience) =>
    set((state) => ({
      sharedAudiences: [audience, ...state.sharedAudiences],
    })),

  updateSharedAudience: (id, updates) =>
    set((state) => ({
      sharedAudiences: state.sharedAudiences.map((sa) =>
        sa.id === id ? { ...sa, ...updates } : sa
      ),
    })),

  removeSharedAudiences: (ids) =>
    set((state) => ({
      sharedAudiences: state.sharedAudiences.filter((sa) => !ids.includes(sa.id)),
    })),

  toggleSelectAll: (selected) =>
    set((state) => ({
      sharedAudiences: state.sharedAudiences.map((sa) => ({
        ...sa,
        selected,
      })),
    })),

  toggleSelectOne: (id) =>
    set((state) => ({
      sharedAudiences: state.sharedAudiences.map((sa) =>
        sa.id === id ? { ...sa, selected: !sa.selected } : sa
      ),
    })),

  getSelectedCount: () => {
    return get().sharedAudiences.filter((sa) => sa.selected).length
  },

  getTotalContactsCount: () => {
    return get().sharedAudiences.reduce((sum, sa) => sum + sa.contacts.length, 0)
  },

  getSelectedContactsCount: () => {
    return get()
      .sharedAudiences.filter((sa) => sa.selected)
      .reduce((sum, sa) => sum + sa.contacts.length, 0)
  },

  applyFilters: (filters) => {
    const audiences = get().sharedAudiences

    // If no filters, return all
    if (!filters || filters.length === 0) {
      return audiences
    }

    // Apply filters to each shared audience's contacts
    return audiences.map((sa) => ({
      ...sa,
      contacts: sa.contacts.filter((contact) => {
        // Apply each filter rule
        return filters.every((rule: any) => {
          const contactValue = contact[rule.field]

          switch (rule.operator) {
            case 'CONTAINS':
              return String(contactValue || '')
                .toLowerCase()
                .includes(String(rule.value).toLowerCase())
            case 'EQUALS':
              return contactValue === rule.value
            case 'GT':
              return Number(contactValue) > Number(rule.value)
            case 'LT':
              return Number(contactValue) < Number(rule.value)
            case 'NOT':
              return contactValue !== rule.value
            default:
              return true
          }
        })
      }),
    }))
  },

  exportSelectedAsCsv: () => {
    const selectedAudiences = get().sharedAudiences.filter((sa) => sa.selected)
    const allContacts = selectedAudiences.flatMap((sa) => sa.contacts)
    return contactsToCsv(allContacts)
  },

  exportSharedAudienceAsCsv: (id) => {
    const audience = get().sharedAudiences.find((sa) => sa.id === id)
    if (!audience) return ''
    return contactsToCsv(audience.contacts)
  },

  reset: () => set({ sharedAudiences: [] }),
}))
