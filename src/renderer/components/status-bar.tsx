import { Settings, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useHistoryStore from 'renderer/stores/historyStore'

const { App } = window

export const StatusBar = () => {
  const { clearHistory, history } = useHistoryStore()
  const navigate = useNavigate()
  const [isClearing, setIsClearing] = useState(false)

  const handleEraseHistory = async () => {
    if (history.length === 0) return

    setIsClearing(true)
    try {
      const result = await App.dialog.showConfirmation({
        title: 'Clear Clipboard History',
        message: 'Are you sure you want to clear all clipboard history?',
        detail: 'This action cannot be undone.',
        buttons: ['Cancel', 'Clear History'],
        cancelId: 0,
        defaultId: 1,
        type: 'warning',
      })

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
    <div className="flex w-full items-center mx-auto mb-4 justify-center gap-4">
      <button
        onClick={() => navigate('/settings')}
        className="bg-gray-900 p-2 rounded-md text-gray-400 hover:text-teal-400 cursor-pointer"
      >
        <Settings />
      </button>
      <button
        onClick={handleEraseHistory}
        disabled={history.length === 0 || isClearing}
        className="bg-gray-900 p-2 
        disabled:opacity-50
        rounded-md text-gray-400 hover:text-red-500 disabled:cursor-not-allowed cursor-pointer disabled:hover:text-gray-400"
      >
        <Trash2 />
      </button>
    </div>
  )
}
