// import Store from 'electron-store'
import { Conf } from 'electron-conf/main'

interface StoreSchema {
  shortcut: string
}

export const store = new Conf<StoreSchema>({
  defaults: {
    shortcut: 'Control+Shift+`',
  },
})
