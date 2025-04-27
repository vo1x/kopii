import { useState, useEffect } from 'react'
import Fuse from 'fuse.js'
import useHistoryStore from 'renderer/stores/historyStore'
import { ClipboardItem } from 'renderer/components/clipboard-item'
import type { ClipboardHistoryItem } from 'shared/types'

const { api } = window

export function MainScreen() {
  const { history, setHistory, deleteItem, addItem } = useHistoryStore()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filteredHistory, setFilteredHistory] = useState<
    ClipboardHistoryItem[]
  >([])
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null)
  const [fuse, setFuse] = useState<Fuse<ClipboardHistoryItem> | null>(null)

  useEffect(() => {
    api.clipboard.startMonitoring()

    const fetchHistory = async () => {
      const historyItems = await api.clipboard.getHistory()
      setHistory(historyItems)
    }

    fetchHistory()

    const unsubscribe = api.clipboard.onClipboardChanged(newItem => {
      console.log('Received new clipboard item:', newItem)
      if (newItem) {
        addItem(newItem)
      }
    })

    return () => {
      api.clipboard.stopMonitoring()
      if (unsubscribe) unsubscribe()
    }
  }, [setHistory, addItem])

  useEffect(() => {
    if (history.length > 0) {
      const fuseInstance = new Fuse(history, {
        keys: ['text'],
        threshold: 0.3,
      })
      setFuse(fuseInstance)
    }
  }, [history])

  const handleItemCopy = (id: string | null) => {
    setCopiedItemId(id)
    setTimeout(() => {
      setCopiedItemId(null)
    }, 1000)
  }

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredHistory(history)
      return
    }

    if (fuse) {
      const results = fuse.search(searchTerm)
      setFilteredHistory(results.map(result => result.item))
    }
  }, [searchTerm, fuse, history])

  return (
    <div className="flex-col flex h-full gap-2 p-4 ">
      <input
        disabled={history?.length === 0}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder="Search clipboard history..."
        type="text"
        className="border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:border-teal-600 border placeholder:text-gray-500 bg-gray-900 outline-none w-full rounded-md p-2 mb-2 text-gray-200"
      />
      {filteredHistory.map(item => (
        <ClipboardItem
          key={item.id}
          item={item}
          deleteItem={deleteItem}
          handleItemCopy={handleItemCopy}
          copiedItemId={copiedItemId}
        />
      ))}
    </div>
  )
}
