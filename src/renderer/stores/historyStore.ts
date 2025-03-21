import { create } from 'zustand'

const { App } = window

interface HistoryStoreState {
  history: any[]
  currentCopiedId: string | null
  isLoading: boolean
  loadHistory: () => Promise<void>
  deleteItem: (id: string) => Promise<void>
  clearHistory: () => Promise<void>
  setCopiedItem: (id: string | null) => void
  startMonitoring: () => void
  stopMonitoring: () => void
}

const useHistoryStore = create<HistoryStoreState>((set, get) => ({
  history: [],
  currentCopiedId: null,
  isLoading: false,

  loadHistory: async () => {
    set({ isLoading: true })
    try {
      const items = await App.clipboard.getHistory()
      set({ history: items, isLoading: false })
    } catch (error) {
      console.error('Failed to load clipboard history:', error)
      set({ isLoading: false })
    }
  },

  clearHistory: async () => {
    try {
      await App.clipboard.clearHistory()
      set({ history: [] })
    } catch (error) {
      console.error('Failed to clear clipboard history:', error)
    }
  },

  deleteItem: async (id: string) => {
    try {
      await App.clipboard.deleteHistoryItem(id)
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

  startMonitoring: () => {
    App.clipboard.startMonitoring()

    const unsubscribe = App.clipboard.onClipboardChanged(() => {
      console.log('Clipboard changed, reloading history')
      get().loadHistory()
    })
  },

  stopMonitoring: () => {
    App.clipboard.stopMonitoring()
  },
}))

export default useHistoryStore
