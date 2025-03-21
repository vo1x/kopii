import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save } from 'lucide-react'

const { App } = window

export function Settings() {
  const navigate = useNavigate()
  const [shortcut, setShortcut] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    App.settings.disableShortcut()

    const loadShortcut = async () => {
      const shortcut = await App.settings.getShortcut()
      setShortcut(shortcut)
    }

    loadShortcut()
  }, [])

  const handleShortcutSave = async () => {
    setIsSaving(true)

    try {
      if (!shortcut.trim()) throw new Error('Invalid shortcut')
      await App.settings.updateShortcut(shortcut)
      // navigate('/')
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
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
      key !== 'META'
    ) {
      newShortcut += key
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

    setShortcut(newShortcut)
  }

  return (
    <div className="flex flex-col p-4 items-center">
      <span className="self-start font-semibold text-2xl mb-4">Settings</span>

      <div className="flex items-center border">
        <div className="self-start flex flex-col gap-2">
          <label htmlFor="shortcut">Show/Hide Shortcut</label>
          <input
            type="text"
            value={shortcut}
            onKeyDown={handleKeyDown}
            readOnly
            className="border w-80 rounded-md bg-gray-900 border-gray-700 p-2 focus:border-teal-500 outline-none"
          />
        </div>
        <button onClick={handleShortcutSave}>
          <Save />
        </button>
      </div>
      <button onClick={() => navigate('/')}>back</button>
    </div>
  )
}
