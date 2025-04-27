import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Save, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const { api } = window

export function Settings() {
  const navigate = useNavigate()
  const [shortcut, setShortcut] = useState<string>('')
  const [pendingShortcut, setPendingShortcut] = useState<string>('')
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.settings.disableShortcut()

    const loadShortcut = async () => {
      const shortcut = await api.settings.getShortcut()
      setShortcut(shortcut)
      setPendingShortcut(shortcut)
    }

    loadShortcut()

    return () => {
      api.settings.enableShortcut()
    }
  }, [])

  const handleShortcutSave = async () => {
    try {
      if (!pendingShortcut.trim()) throw new Error('Invalid shortcut')
      await api.settings.updateShortcut(pendingShortcut)
      setShortcut(pendingShortcut)
      setIsRecording(false)
    } catch (error) {
      console.error(error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault()

    let newShortcut = ''
    if (e.ctrlKey) newShortcut += 'Ctrl+'
    if (e.shiftKey) newShortcut += 'Shift+'
    if (e.altKey) newShortcut += 'Alt+'
    if (e.metaKey) newShortcut += 'Command+'

    const key = e.key.toUpperCase()

    if (
      key !== 'CONTROL' &&
      key !== 'SHIFT' &&
      key !== 'ALT' &&
      key !== 'META' &&
      key !== 'ESCAPE'
    ) {
      newShortcut += key
    } else if (key === 'ESCAPE') {
      setPendingShortcut(shortcut)
      setIsRecording(false)
      inputRef.current?.blur()
      return
    }

    const nonModifierKey = newShortcut
      .split('+')
      .filter(
        key =>
          key !== 'Ctrl' &&
          key !== 'Shift' &&
          key !== 'Alt' &&
          key !== 'Command'
      )
      .pop()

    if (!nonModifierKey || nonModifierKey.trim() === '') {
      return
    }

    setPendingShortcut(newShortcut)
  }

  const startRecording = () => {
    setIsRecording(true)
    setPendingShortcut('')
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const cancelRecording = () => {
    setIsRecording(false)
    setPendingShortcut(shortcut)
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-1 rounded-md hover:bg-gray-800"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-semibold ml-2">Settings</h1>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-medium mb-2">Keyboard Shortcut</h2>
        <p className="text-gray-400 text-sm mb-4">
          Set a global shortcut to quickly access Kopii from anywhere.
        </p>

        <div className="flex items-center">
          {!isRecording ? (
            <div
              onClick={startRecording}
              className="border w-80 rounded-md bg-gray-900 border-gray-700 p-2 cursor-pointer hover:border-teal-500 flex items-center justify-between"
            >
              <span>{shortcut || 'Click to record shortcut'}</span>
              <span className="text-xs text-gray-400">
                {shortcut ? 'Click to change' : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center w-80 border rounded-md bg-gray-900 border-teal-500 p-2">
              <input
                ref={inputRef}
                type="text"
                value={pendingShortcut}
                onKeyDown={handleKeyDown}
                readOnly
                placeholder="Press keys..."
                className="bg-transparent outline-none flex-grow"
                autoFocus
              />
              <button
                onClick={cancelRecording}
                className="text-gray-400 hover:text-red-500 ml-2"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {isRecording && pendingShortcut !== shortcut && (
            <button
              onClick={handleShortcutSave}
              className="ml-2 p-1 rounded-md hover:bg-gray-800"
            >
              <Save size={24} className="text-teal-500" />
            </button>
          )}
        </div>
        {isRecording && (
          <p className="text-xs text-gray-400 mt-1">
            Press desired key combination. Press Escape to cancel.
          </p>
        )}
      </div>
    </div>
  )
}
