import { create } from 'zustand'
import type { ClipboardHistoryItem } from 'shared/types'

const { api } = window

interface HistoryStoreState {
  history: ClipboardHistoryItem[]
  currentCopiedId: string | null
  isLoading: boolean
  setHistory: (items: ClipboardHistoryItem[]) => void
  addItem: (item: ClipboardHistoryItem) => void
  deleteItem: (id: string) => Promise<void>
  clearHistory: () => Promise<void>
  setCopiedItem: (id: string | null) => void
}

const useHistoryStore = create<HistoryStoreState>((set, get) => ({
  history: [],
  currentCopiedId: null,
  isLoading: false,

  setHistory: (items: ClipboardHistoryItem[]) => {
    set({ history: items })
  },

  addItem: (item: ClipboardHistoryItem) => {
    set(state => {
      const existingIndex = state.history.findIndex(i => i.id === item.id)

      if (existingIndex >= 0) {
        const updatedHistory = [...state.history]
        updatedHistory.splice(existingIndex, 1)
        return { history: [item, ...updatedHistory] }
      }
      return { history: [item, ...state.history] }
    })
  },

  clearHistory: async () => {
    try {
      await api.clipboard.clearHistory()
      set({ history: [] })
    } catch (error) {
      console.error('Failed to clear clipboard history:', error)
    }
  },

  deleteItem: async (id: string) => {
    try {
      await api.clipboard.deleteHistoryItem(id)
      set(state => ({ history: state.history.filter(item => item.id !== id) }))
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  },

  setCopiedItem: (id: string | null) => {
    set({ currentCopiedId: id })

    if (id) {
      setTimeout(() => {
        set({ currentCopiedId: null })
      }, 1000)
    }
  },
}))

export default useHistoryStore
