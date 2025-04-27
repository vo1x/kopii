import { Minus, X } from 'lucide-react'

const { api } = window

export function TitleBar() {
  const handleMinimize = () => {
    console.log('clicked')
    api.window.minimize()
  }

  const handleClose = () => {
    api.window.close()
  }

  return (
    <div className="draggable h-9 bg-gray-900 flex items-center justify-between px-3 z-50">
      <div className="flex items-center">
        <img src="/app-icon.png" alt="App Logo" className="h-5 w-5 mr-2" />
        <span className="text-sm text-gray-300">kopii</span>
      </div>

      <div className="flex undraggable">
        <button
          onClick={handleMinimize}
          className="h-7 w-10 flex items-center justify-center hover:bg-gray-700 transition-colors outline-none"
        >
          <Minus size={18} />
        </button>

        <button
          onClick={handleClose}
          className="h-7 w-10 flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
