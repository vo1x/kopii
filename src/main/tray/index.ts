import { Tray, Menu, nativeImage, type BrowserWindow, app } from 'electron'
import path from 'node:path'
import { ENVIRONMENT } from 'shared/constants'

let tray: Tray | null = null

export function createTray(window: BrowserWindow) {
  let iconPath: string

  if (app.isPackaged) {
    iconPath = path.join(process.resourcesPath, 'build/icons/icon.ico')
  } else {
    iconPath = path.join(app.getAppPath(), 'src/resources/build/icons/icon.ico')

    console.log('Current working directory:', process.cwd())
    console.log('App path:', app.getAppPath())
    console.log('Icon path:', iconPath)
  }

  try {
    if (ENVIRONMENT.IS_DEV ) {
      const icon = nativeImage.createFromPath(iconPath)
      if (icon.isEmpty()) {
        console.error('Icon image is empty, trying alternative path')
        const altPath = path.join(
          process.cwd(),
          'src/resources/build/icons/icon.ico'
        )
        console.log('Trying alternative path:', altPath)
        tray = new Tray(altPath)
      } else {
        tray = new Tray(icon.resize({ width: 16, height: 16 }))
      }
    } else {
      tray = new Tray(iconPath)
    }
  } catch (error) {
    console.error('Failed to load tray icon:', error)
    tray = new Tray(nativeImage.createEmpty())
  }

  const updateContextMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: window.isVisible() ? 'Hide App' : 'Show App',
        click: () => {
          if (window.isVisible()) {
            window.hide()
          } else {
            window.show()
          }
        },
      },
      {
        label: 'Quit',
        click: () => {
          tray?.destroy()
          window.destroy()
        },
      },
    ])
    tray?.setContextMenu(contextMenu)
  }

  tray.setToolTip('kopii')
  updateContextMenu()

  tray.on('click', () => {
    window.show()
  })

  window.on('show', updateContextMenu)
  window.on('hide', updateContextMenu)
}
