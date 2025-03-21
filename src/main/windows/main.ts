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
    alwaysOnTop: true,
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

  // window.on('close', () => {
  //   for (const window of BrowserWindow.getAllWindows()) {
  //     window.destroy()
  //   }
  // })

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

  // Clipboard monitoring

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
      console.log('Getting clipboard history, count:', history.length)
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
    console.log('Initial clipboard text:', lastClipboardText)

    let lastImageHash = ''

    monitorInterval = setInterval(() => {
      const currentText = clipboard.readText()
      const currentImage = clipboard.readImage()

      const textChanged = currentText !== lastClipboardText
      const imageChanged =
        !currentImage.isEmpty() && currentImage.toDataURL() !== lastImageHash

      if (textChanged) {
        console.log('Text changed in clipboard:', currentText)
      }

      if (imageChanged) {
        console.log('Image changed in clipboard')
      }

      if (textChanged || imageChanged) {
        console.log('Clipboard content changed, checking clipboard')
        lastClipboardText = currentText

        if (!currentImage.isEmpty()) {
          lastImageHash = currentImage.toDataURL()
        }

        const newItem = clipboardHistory.checkClipboard()
        console.log('New clipboard item:', newItem)

        if (window && newItem) {
          console.log('Sending clipboard:changed event to renderer')
          window.webContents.send('clipboard:changed', newItem)
        } else {
          console.log(
            'Not sending event: window exists?',
            !!window,
            'newItem exists?',
            !!newItem
          )
        }
      }
    }, 100)
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
    async (_event: IpcMainInvokeEvent, imagePath: string): Promise<string> => {
      try {
        // Log to confirm the path is correct
        console.log('Loading image from path:', imagePath)

        if (!fs.existsSync(imagePath)) {
          console.error('Image file does not exist:', imagePath)
          return ''
        }

        // Convert to data URL
        const imageBuffer = fs.readFileSync(imagePath)
        const base64Data = imageBuffer.toString('base64')
        return `data:image/png;base64,${base64Data}`
      } catch (error) {
        console.error('Error loading image data:', error)
        return ''
      }
    }
  )

  return window
}
