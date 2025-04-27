import {
  contextBridge,
  ipcRenderer,
  type IpcRendererEvent,
  shell,
} from 'electron'

declare global {
  interface Window {
    api: typeof API
  }
}

const API = {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    close: () => ipcRenderer.send('window:close'),
  },
  settings: {
    getShortcut: () => ipcRenderer.invoke('settings:getShortcut'),
    updateShortcut: (shortcut: string) =>
      ipcRenderer.invoke('settings:updateShortcut', shortcut),
    disableShortcut: () => ipcRenderer.invoke('settings:disableShortcut'),
    enableShortcut: () => ipcRenderer.invoke('settings:enableShortcut'),
  },
  clipboard: {
    readText: () => ipcRenderer.invoke('clipboard:readText'),
    writeText: (text: string) =>
      ipcRenderer.invoke('clipboard:writeText', text),
    getHistory: () => ipcRenderer.invoke('clipboard:getHistory'),
    clearHistory: () => ipcRenderer.invoke('clipboard:clearHistory'),
    deleteHistoryItem: (id: string) =>
      ipcRenderer.invoke('clipboard:deleteHistoryItem', id),
    startMonitoring: () => ipcRenderer.invoke('clipboard:startMonitoring'),
    stopMonitoring: () => ipcRenderer.invoke('clipboard:stopMonitoring'),
    getImageData: (imagePath: string) =>
      ipcRenderer.invoke('clipboard:getImageData', imagePath),
    onClipboardChanged: (callback: (newItem: any) => void) => {
      const subscription: (_event: IpcRendererEvent, newItem: any) => void = (
        _event,
        newItem
      ) => callback(newItem)
      ipcRenderer.on('clipboard:changed', subscription)
      return () => {
        ipcRenderer.removeListener('clipboard:changed', subscription)
      }
    },
    copyToClipboardAndNotify: (item: any) =>
      ipcRenderer.invoke('clipboard:copyToClipboardAndNotify', item),
  },
  shell: {
    openExternal: (url: string) => shell.openExternal(url),
  },
  dialog: {
    showConfirmation: (options: any) =>
      ipcRenderer.invoke('dialog:showConfirmation', options),
  },
}

contextBridge.exposeInMainWorld('api', API)
