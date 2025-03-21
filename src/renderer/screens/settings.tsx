import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, X } from 'lucide-react'

const { App } = window

export function Settings() {
  const navigate = useNavigate()
  const [shortcut, setShortcut] = useState('')
  const [pendingShortcut, setPendingShortcut] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    App.settings.disableShortcut()

    const loadShortcut = async () => {
      const shortcut = await App.settings.getShortcut()
      setShortcut(shortcut)
      setPendingShortcut(shortcut)
    }

    loadShortcut()

    return () => {
      App.settings.enableShortcut()
    }
  }, [])

  const handleShortcutSave = async () => {
    try {
      if (!pendingShortcut.trim()) throw new Error('Invalid shortcut')
      await App.settings.updateShortcut(pendingShortcut)
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
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const cancelRecording = () => {
    setPendingShortcut(shortcut)
    setIsRecording(false)
  }

  return (
    <div className="flex flex-col p-4">
      <div className='flex items-center gap-4 mb-4'>
        <button
          className='cursor-pointer text-gray-400 hover:text-teal-500'
          onClick={() => navigate('/')}><ArrowLeft /></button>
        
        <span className="self-start font-semibold text-2xl">Settings</span>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="shortcut" className="font-medium text-gray-300">Show/Hide Shortcut</label>
        <div className="flex items-center justify-between">
          {!isRecording ? (
            <div
              onClick={startRecording}
              className="border w-80 rounded-md bg-gray-900 border-gray-700 p-2 cursor-pointer hover:border-teal-500 flex items-center justify-between"
            >
              <span>{shortcut || 'Click to record shortcut'}</span>
              <span className="text-xs text-gray-400">{shortcut ? 'Click to change' : ''}</span>
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
              <button onClick={cancelRecording} className="text-gray-400 hover:text-red-500 ml-2">
                <X size={18} />
              </button>
            </div>
          )}
          
          {isRecording && pendingShortcut !== shortcut && (
            <button 
              onClick={handleShortcutSave}
              className="ml-2 p-1 rounded-md hover:bg-gray-800"
            >
              <Save size={24} className='text-teal-500'/>
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
