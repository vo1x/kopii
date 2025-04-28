import { app } from 'electron'
import { MainWindow } from 'main/windows/main'
import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance'
import { makeAppSetup } from 'lib/electron-app/factories/app/setup'

let mainWindow: Awaited<ReturnType<typeof MainWindow>> | null = null
let clipboardMonitoringActive = false

makeAppWithSingleInstanceLock(async () => {
  app.whenReady().then(async () => {
    mainWindow = await makeAppSetup(MainWindow)

    if (!clipboardMonitoringActive && mainWindow) {
      console.log('Starting clipboard monitoring on app launch')
      mainWindow.webContents.send('clipboard:initMonitoring')
      clipboardMonitoringActive = true
    }
  })
})

app.on('before-quit', () => {
  if (clipboardMonitoringActive && mainWindow) {
    console.log('Stopping clipboard monitoring on app quit')
    mainWindow.webContents.send('clipboard:stopMonitoring')
    clipboardMonitoringActive = false
  }
})
