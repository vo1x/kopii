import fs from 'node:fs'
import path from 'node:path'
import { app, clipboard, type NativeImage } from 'electron'
import crypto from 'node:crypto'

interface ClipboardHistoryItem {
  id: string
  type: 'text' | 'image'
  text?: string
  imagePath?: string
  timestamp: number
}

class ClipboardHistoryManager {
  private historyFilePath: string
  private imageDir: string
  private maxHistoryItems: number
  private history: ClipboardHistoryItem[] = []

  constructor(maxItems = 50) {
    this.maxHistoryItems = maxItems
    this.historyFilePath = path.join(
      app.getPath('userData'),
      'clipboard-history.json'
    )
    this.imageDir = path.join(app.getPath('userData'), 'clipboard-images')

    if (!fs.existsSync(this.imageDir)) {
      fs.mkdirSync(this.imageDir, { recursive: true })
    }

    this.loadHistory()
  }

  private loadHistory(): void {
    try {
      if (fs.existsSync(this.historyFilePath)) {
        const data = fs.readFileSync(this.historyFilePath, 'utf8')
        this.history = JSON.parse(data)
      }
    } catch (error) {
      console.error('Failed to load clipboard history:', error)
      this.history = []
    }
  }

  private saveHistory(): void {
    try {
      fs.writeFileSync(
        this.historyFilePath,
        JSON.stringify(this.history),
        'utf8'
      )
    } catch (error) {
      console.error('Failed to save clipboard history:', error)
    }
  }

  checkClipboard(): ClipboardHistoryItem | null {
    const image = clipboard.readImage()
    if (!image.isEmpty()) {
      return this.addImage(image)
    }

    const text = clipboard.readText().trim()
    if (text) {
      return this.addItem(text)
    }

    return null
  }

  addItem(text: string): ClipboardHistoryItem | null {
    if (!text.trim()) {
      return null
    }

    if (
      this.history.length > 0 &&
      this.history[0].type === 'text' &&
      this.history[0].text === text
    ) {
      return this.history[0]
    }

    const existingIndex = this.history.findIndex(
      item => item.type === 'text' && item.text === text
    )

    let newItem: ClipboardHistoryItem

    if (existingIndex > 0) {
      newItem = this.history[existingIndex]

      newItem.timestamp = Date.now()

      this.history.splice(existingIndex, 1)

      this.history.unshift(newItem)
    } else if (existingIndex === -1) {
      newItem = {
        id: Date.now().toString(),
        type: 'text',
        text,
        timestamp: Date.now(),
      }

      this.history.unshift(newItem)

      this.pruneHistory()
    } else {
      return this.history[0]
    }

    this.saveHistory()
    return newItem
  }

  addImage(image: NativeImage): ClipboardHistoryItem | null {
    if (image.isEmpty()) {
      return null
    }

    const imageBuffer = image.toPNG()
    const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex')

    const existingIndex = this.history.findIndex(
      item =>
        item.type === 'image' &&
        item.id &&
        item.id.includes(hash.substring(0, 10))
    )

    let newItem: ClipboardHistoryItem
    let imagePath: string

    if (existingIndex >= 0) {
      newItem = this.history[existingIndex]
      if (newItem.imagePath) {
        imagePath = newItem.imagePath
      } else {
        console.error('Image path is undefined')
        return null
      }

      newItem.timestamp = Date.now()

      if (existingIndex > 0) {
        this.history.splice(existingIndex, 1)
        this.history.unshift(newItem)
      }
    } else {
      const fileName = `${Date.now()}_${hash.substring(0, 10)}.png`
      imagePath = path.join(this.imageDir, fileName)

      try {
        fs.writeFileSync(imagePath, imageBuffer)
      } catch (error) {
        console.error('Failed to save image:', error)
        return null
      }

      newItem = {
        id: `img_${hash.substring(0, 10)}_${Date.now()}`,
        type: 'image',
        imagePath,
        timestamp: Date.now(),
      }

      this.history.unshift(newItem)

      this.pruneHistory()
    }

    this.saveHistory()
    return newItem
  }

  private pruneHistory(): void {
    if (this.history.length > this.maxHistoryItems) {
      const itemsToRemove = this.history.splice(this.maxHistoryItems)

      for (const item of itemsToRemove) {
        if (item.type === 'image' && item.imagePath) {
          try {
            if (fs.existsSync(item.imagePath)) {
              fs.unlinkSync(item.imagePath)
            }
          } catch (error) {
            console.error('Failed to delete image file:', error)
          }
        }
      }
    }
  }

  getHistory(): ClipboardHistoryItem[] {
    return [...this.history]
  }

  clearHistory(): void {
    for (const item of this.history) {
      if (item.type === 'image' && item.imagePath) {
        try {
          if (fs.existsSync(item.imagePath)) {
            fs.unlinkSync(item.imagePath)
          }
        } catch (error) {
          console.error('Failed to delete image file:', error)
        }
      }
    }

    this.history = []
    clipboard.clear()
    this.saveHistory()
  }

  deleteItem(id: string): void {
    const item = this.history.find(item => item.id === id)

    if (item && item.type === 'image' && item.imagePath) {
      try {
        if (fs.existsSync(item.imagePath)) {
          fs.unlinkSync(item.imagePath)
        }
      } catch (error) {
        console.error('Failed to delete image file:', error)
      }
    }

    this.history = this.history.filter(item => item.id !== id)
    this.saveHistory()
  }

 
}

export default ClipboardHistoryManager
