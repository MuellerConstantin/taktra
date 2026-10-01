import { contextBridge, ipcRenderer } from 'electron'
import type { Settings } from '../shared/settings'

const api = {
  settings: {
    get: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
    update: (patch: Partial<Settings>): Promise<Settings> =>
      ipcRenderer.invoke('settings:update', patch)
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
