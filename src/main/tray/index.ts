import { Tray, Menu, nativeImage, type BrowserWindow } from 'electron'

let tray: Tray | null = null

export function createTray(window: BrowserWindow) {
  tray = new Tray(nativeImage.createEmpty())

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
