import { useState, useEffect } from 'react'
import { ClipboardCopy, Image, Trash, ClipboardCheck } from 'lucide-react'

const { App } = window

export const ClipboardItem: React.FC<{
  item: any
  deleteItem: any
  handleItemCopy: (id: string | null) => void
  copiedItemId: string | null
}> = ({ item, deleteItem, handleItemCopy, copiedItemId }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const [imageData, setImageData] = useState<string | null>(null)

  useEffect(() => {
    const loadImageData = async () => {
      if (item.type === 'image' && item.imagePath) {
        try {
          const data = await App.clipboard.getImageData(item.imagePath)
          setImageData(data)
        } catch (error) {
          console.error('Failed to load image data:', error)
        }
      }
    }

    loadImageData()
  }, [item])

  const handleDoubleClick = async () => {
    try {
      await App.clipboard.copyToClipboardAndNotify(item)
    } catch (error) {
      console.error('Failed to copy item:', error)
    }
  }

  const copyToClipboard = async () => {
    try {
      if (item.type === 'text' && item.text) {
        await App.clipboard.writeText(item.text)
        handleItemCopy(item.id)
      } else if (item.type === 'image' && imageData) {
        const img = document.createElement('img')

        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
          } else {
            console.error('Failed to get 2D context')
          }

          canvas.toBlob(blob => {
            if (blob && navigator.clipboard && navigator.clipboard.write) {
              navigator.clipboard
                .write([new window.ClipboardItem({ 'image/png': blob })])
                .then(() => {
                  handleItemCopy(item.id)
                })
            } else {
              console.error('Clipboard API not supported')
            }
          }, 'image/png')
        }

        img.src = imageData
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      handleItemCopy(null)
    }
  }

  const isUrl = (text: string) => {
    const urlRegex = /^(https?:\/\/[^\s]+)$/
    return urlRegex.test(text.trim())
  }

  const handleUrlClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault()
    e.stopPropagation()

    console.log('Opening URL in system browser:', url) // Add logging

    if (App?.shell?.openExternal) {
      try {
        App.shell.openExternal(url)
      } catch (error) {
        console.error('Failed to open URL externally:', error)
      }
    } else {
      console.warn('App.shell.openExternal is not available, using fallback')
    }
  }

  return (
    <div
      key={item.id}
      className={`${copiedItemId === item.id ? 'bg-teal-950 border-teal-800' : 'bg-gray-900 hover:bg-gray-950/75 border-gray-800 hover:border-gray-700'} text-gray-100 border-2 p-3 transition-all duration-150 rounded-lg`}
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-400">
          {formatTime(item.timestamp)}
          {item.type === 'image' && <Image size={12} className="ml-1 inline" />}
        </span>

        <div className="flex space-x-2 mb-2">
          <button
            type="button"
            onClick={copyToClipboard}
            className="text-gray-500 hover:text-teal-600 cursor-copy"
          >
            {copiedItemId === item.id ? (
              <ClipboardCheck size={18} />
            ) : (
              <ClipboardCopy size={18} />
            )}
          </button>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              deleteItem(item.id)
            }}
            className="text-gray-500 hover:text-red-600 cursor-pointer"
          >
            <Trash size={18} />
          </button>
        </div>
      </div>

      {item.type === 'text' && (
        <pre className="break-words whitespace-pre-wrap text-sm overflow-auto max-h-48">
          {isUrl(item.text) ? (
            <a
              href={item.text}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 hover:underline"
              onClick={e => handleUrlClick(e, item.text)}
            >
              {item.text.length > 72
                ? `${item.text.substring(0, 72)}...`
                : item.text}
            </a>
          ) : item.text.length > 72 ? (
            `${item.text.substring(0, 72)}...`
          ) : (
            item.text
          )}
        </pre>
      )}

      {item.type === 'image' && imageData && (
        <div className="mt-1">
          <img
            src={imageData}
            alt="Clipboard content"
            className="max-w-full max-h-48 object-contain rounded"
          />
        </div>
      )}
    </div>
  )
}
