import { Settings, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useHistoryStore from 'renderer/stores/historyStore'

const { api } = window

interface DialogOptions {
  title?: string
  message?: string
  detail?: string
  type?: 'info' | 'error' | 'question' | 'warning' | 'none'
  buttons?: string[]
  cancelId?: number
  defaultId?: number
}

export const StatusBar = () => {
  const { clearHistory, history } = useHistoryStore()
  const navigate = useNavigate()
  const [isClearing, setIsClearing] = useState<boolean>(false)

  const handleEraseHistory = async () => {
    if (history.length === 0) return

    setIsClearing(true)
    try {
      const options: DialogOptions = {
        title: 'Clear Clipboard History',
        message: 'Are you sure you want to clear all clipboard history?',
        detail: 'This action cannot be undone.',
        buttons: ['Cancel', 'Clear History'],
        cancelId: 0,
        defaultId: 1,
        type: 'warning',
      }

      const result = await api.dialog.showConfirmation(options)

      if (result.response === 1) {
        await clearHistory()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="flex items-center justify-between bg-gray-800 border-t border-gray-700 p-3">
      <div className="text-xs text-gray-400">
        {history.length} {history.length === 1 ? 'item' : 'items'}
      </div>
      <div className="flex space-x-4">
        <button
          className="text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleEraseHistory}
          disabled={isClearing || history.length === 0}
        >
          <Trash2 size={18} />
        </button>
        <button
          className="text-gray-400 hover:text-teal-500"
          onClick={() => navigate('/settings')}
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  )
}
