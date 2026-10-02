import { contextBridge, ipcRenderer } from 'electron'
import type { OpenProfileResult, ProfilesState } from '../shared/profiles'
import type { Settings } from '../shared/settings'

const api = {
  settings: {
    get: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
    update: (patch: Partial<Settings>): Promise<Settings> =>
      ipcRenderer.invoke('settings:update', patch)
  },
  profiles: {
    get: (): Promise<ProfilesState> => ipcRenderer.invoke('profiles:get'),
    create: (name: string, path: string): Promise<ProfilesState> =>
      ipcRenderer.invoke('profiles:create', name, path),
    setActive: (path: string): Promise<ProfilesState> =>
      ipcRenderer.invoke('profiles:setActive', path),
    rename: (path: string, name: string): Promise<ProfilesState> =>
      ipcRenderer.invoke('profiles:rename', path, name),
    delete: (path: string): Promise<ProfilesState> => ipcRenderer.invoke('profiles:delete', path),
    remove: (path: string): Promise<ProfilesState> => ipcRenderer.invoke('profiles:remove', path),
    open: (): Promise<OpenProfileResult> => ipcRenderer.invoke('profiles:open'),
    defaultPath: (name: string): Promise<string> =>
      ipcRenderer.invoke('profiles:defaultPath', name),
    choosePath: (defaultPath: string): Promise<string | null> =>
      ipcRenderer.invoke('profiles:choosePath', defaultPath)
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
