import {
  app,
  globalShortcut,
  ipcMain,
  clipboard,
  nativeImage,
  Notification,
  type IpcMainInvokeEvent,
  BrowserWindow,
  dialog,
} from 'electron'
import { join } from 'node:path'
import fs from 'node:fs'

import { createWindow } from 'lib/electron-app/factories/windows/create'
import { ENVIRONMENT } from 'shared/constants'
import { displayName } from '~/package.json'
import { store } from 'shared/store'
import ClipboardHistoryManager from 'main/clipboard/history'

import { createTray } from 'main/tray'

const DEFAULT_SHORTCUT = 'CommandOrControl+Shift+`'
interface ClipboardHistoryItem {
  id: string
  type: 'text' | 'image'
  text?: string
  imagePath?: string
  timestamp: number
}
let isMonitoring = false
let monitorInterval: NodeJS.Timeout | null = null
let lastClipboardText = ''

export async function MainWindow() {
  const window = createWindow({
    id: 'main',
    title: displayName,
    width: 400,
    height: 600,
    show: false,
    center: true,
    movable: true,
    resizable: false,
    maximizable: false,
    alwaysOnTop: false,
    autoHideMenuBar: true,
    frame: false,

    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
    },
  })

  window.webContents.on('did-finish-load', () => {
    if (ENVIRONMENT.IS_DEV) {
      // window.webContents.openDevTools({ mode: 'detach' })
    }

    window.show()
  })

  let currentShortcut = store.get('settings.shortcut', DEFAULT_SHORTCUT)

  const registerShortcut = (shortcut: string) => {
    try {
      globalShortcut.unregister(currentShortcut)
    } catch (error) {
      console.error('Failed to unregister previous shortcut', error)
    }

    try {
      globalShortcut.register(shortcut, () => {
        if (window.isVisible()) {
          window.hide()
        } else {
          window.show()
          window.focus()
        }
      })
      currentShortcut = shortcut
      store.set('settings.shortcut', shortcut)
      return true
    } catch (error) {
      console.error('Failed to register shortcut', error)
      return false
    }
  }

  registerShortcut(currentShortcut)

  ipcMain.handle('dialog:showConfirmation', async (event, options) => {
    const window = BrowserWindow.fromWebContents(event.sender)

    const result = await dialog.showMessageBox(window, {
      title: options.title || 'Confirmation',
      message: options.message || 'Are you sure?',
      detail: options.detail,
      type: options.type || 'question',
      buttons: options.buttons || ['Cancel', 'OK'],
      cancelId: options.cancelId || 0,
      defaultId: options.defaultId || 0,
    })

    return result
  })

  ipcMain.handle('settings:getShortcut', () => {
    return store.get('settings.shortcut', DEFAULT_SHORTCUT)
  })

  ipcMain.handle('settings:enableShortcut', () => {
    try {
      globalShortcut.register(currentShortcut, () => {
        if (window.isVisible()) {
          window.hide()
        } else {
          window.show()
          window.focus()
        }
      })
      return true
    } catch (error) {
      console.error('Error enabling shortcut:', error)
      return false
    }
  })

  ipcMain.handle('settings:disableShortcut', () => {
    try {
      globalShortcut.unregister(currentShortcut)
      return true
    } catch (error) {
      console.error('Error disabling shortcut:', error)
      return false
    }
  })

  ipcMain.handle('settings:updateShortcut', (_, shortcut) => {
    console.log('shortcut saved')
    return registerShortcut(shortcut)
  })

  ipcMain.on('window:close', e => {
    e.preventDefault()
    window.hide()
  })

  ipcMain.on('window:minimize', () => {
    if (window && !window.isDestroyed()) {
      window.minimize()
    }
  })

  createTray(window)

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  })

  const clipboardHistory = new ClipboardHistoryManager()

  ipcMain.handle('clipboard:readText', async (): Promise<string> => {
    return clipboard.readText()
  })

  ipcMain.handle(
    'clipboard:writeText',
    async (_event: IpcMainInvokeEvent, text: string): Promise<void> => {
      clipboard.writeText(text)
      clipboardHistory.addItem(text)
    }
  )

  ipcMain.handle(
    'clipboard:getHistory',
    async (): Promise<ClipboardHistoryItem[]> => {
      const history = clipboardHistory.getHistory()
      return history
    }
  )

  ipcMain.handle('clipboard:clearHistory', async (): Promise<void> => {
    clipboardHistory.clearHistory()
  })

  ipcMain.handle(
    'clipboard:deleteHistoryItem',
    async (_event: IpcMainInvokeEvent, id: string): Promise<void> => {
      clipboardHistory.deleteItem(id)
    }
  )

  ipcMain.handle(
    'clipboard:copyToClipboardAndNotify',
    async (
      _event: IpcMainInvokeEvent,
      item: ClipboardHistoryItem
    ): Promise<void> => {
      if (item.type === 'text' && item.text) clipboard.writeText(item.text)
      else if (item.type === 'image' && item.imagePath) {
        try {
          const imageData = fs.readFileSync(item.imagePath)
          const image = nativeImage.createFromBuffer(imageData)
          clipboard.writeImage(image)
        } catch (error) {
          console.error('Failed to read image for paste:', error)
          return
        }
      }

      if (window) {
        window.hide()

        new Notification({
          title: 'Copied to clipboard',
          body: `Paste using (${process.platform === 'darwin' ? 'CMD + V' : 'CTRL + V'})`,
          silent: false,
        }).show()
      }
    }
  )

  ipcMain.handle('clipboard:startMonitoring', async (): Promise<void> => {
    if (isMonitoring) {
      console.log('Already monitoring clipboard - skipping')
      return
    }

    console.log('Started monitoring clipboard')

    isMonitoring = true

    lastClipboardText = clipboard.readText()
    let lastImageHash = ''

    const initialItem = clipboardHistory.checkClipboard()
    if (initialItem && window) {
      window.webContents.send('clipboard:changed', initialItem)
    }

    monitorInterval = setInterval(() => {
      if (window?.isDestroyed()) {
        clearInterval(monitorInterval)
        monitorInterval = null
        isMonitoring = false
        return
      }

      try {
        const currentText = clipboard.readText()
        if (currentText !== lastClipboardText && currentText.trim()) {
          console.log('Detected text change in clipboard')
          lastClipboardText = currentText
          const newItem = clipboardHistory.addItem(currentText)

          if (window && newItem) {
            window.webContents.send('clipboard:changed', newItem)
          }
          return
        }

        const currentImage = clipboard.readImage()
        if (!currentImage.isEmpty()) {
          try {
            const imageSize = currentImage.getSize()
            const aspectRatio = imageSize.width / imageSize.height

            const pngData = currentImage.toPNG()
            const dataFingerprint = pngData
              .slice(0, Math.min(1000, pngData.length))
              .reduce((sum, byte, index) => sum + byte * ((index % 7) + 1), 0)

            const imageHash = `${imageSize.width}x${imageSize.height}:${aspectRatio.toFixed(2)}:${dataFingerprint}`

            if (imageHash !== lastImageHash) {
              console.log('Detected image change in clipboard')
              lastImageHash = imageHash
              const newItem = clipboardHistory.addImage(currentImage)

              if (window && newItem) {
                window.webContents.send('clipboard:changed', newItem)
              }
            }
          } catch (error) {
            console.error('Error processing clipboard image:', error)
          }
        }
      } catch (error) {
        console.error('Error monitoring clipboard:', error)
      }
    }, 500)
  })

  ipcMain.handle('clipboard:stopMonitoring', async (): Promise<void> => {
    if (!isMonitoring) return

    isMonitoring = false
    if (monitorInterval) {
      clearInterval(monitorInterval)
      monitorInterval = null
    }
  })

  ipcMain.handle(
    'clipboard:getImageData',
    async (
      _event: IpcMainInvokeEvent,
      imagePath: string
    ): Promise<string | null> => {
      try {
        const imageData = fs.readFileSync(imagePath)
        const image = nativeImage.createFromBuffer(imageData)
        return image.toDataURL()
      } catch (error) {
        console.error('Failed to get image data:', error)
        return null
      }
    }
  )

  return window
}
