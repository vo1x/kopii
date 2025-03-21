import { useMemo, useEffect, useState } from 'react'
import { TitleBar } from 'renderer/components/TitleBar'
import { useNavigate } from 'react-router-dom'
import { ClipboardItem } from 'renderer/components/clipboard-item'
import useHistoryStore from 'renderer/stores/historyStore'
// The "App" comes from the context bridge in preload/index.ts
import Fuse from 'fuse.js'

const { App } = window

export function MainScreen() {
  // const [history, setHistory] = useState([])
  const { history, loadHistory, startMonitoring, stopMonitoring, deleteItem } =
    useHistoryStore()

  const [searchTerm, setSearchTerm] = useState('')

  const [copiedItemId, setCopiedItemId] = useState<string | null>(null)

  const handleItemCopy = (id: string | null) => {
    if (!id) setCopiedItemId(null)
    setCopiedItemId(id)
    setTimeout(() => setCopiedItemId(null), 1000)
  }

  useEffect(() => {
    loadHistory()
    startMonitoring()

    return () => stopMonitoring()
  }, [])

  const fuse = useMemo(() => {
    return new Fuse(history, {
      keys: ['text'],
      threshold: 0.4,
      ignoreLocation: true,
    })
  }, [history])

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) {
      return history
    }

    const results = fuse.search(searchTerm)
    return results.map(result => result.item)
  }, [searchTerm, fuse, history])

  return (
    <div className="flex-col flex h-full gap-2 p-4 ">
      <input
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder="Search clipboard history..."
        type="text"
        className="border-gray-700 focus:border-teal-600 border placeholder:text-gray-500 bg-gray-900 outline-none w-full rounded-md p-2 mb-2 text-gray-200"
      />
      {filteredHistory.map((item: any) => (
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
