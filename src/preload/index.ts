import { contextBridge, ipcRenderer } from 'electron'
import type { IpcResponse } from '../shared/errors'
import type { ProfilesState } from '../shared/profiles'
import type { Project, ProjectInput } from '../shared/projects'
import type { Settings } from '../shared/settings'

function invoke<T>(channel: string, ...args: unknown[]): Promise<IpcResponse<T>> {
  return ipcRenderer.invoke(channel, ...args)
}

const api = {
  settings: {
    get: () => invoke<Settings>('settings:get'),
    update: (patch: Partial<Settings>) => invoke<Settings>('settings:update', patch)
  },
  profiles: {
    get: () => invoke<ProfilesState>('profiles:get'),
    create: (name: string, path: string) => invoke<ProfilesState>('profiles:create', name, path),
    setActive: (path: string) => invoke<ProfilesState>('profiles:setActive', path),
    rename: (path: string, name: string) => invoke<ProfilesState>('profiles:rename', path, name),
    delete: (path: string) => invoke<ProfilesState>('profiles:delete', path),
    remove: (path: string) => invoke<ProfilesState>('profiles:remove', path),
    open: () => invoke<ProfilesState | null>('profiles:open'),
    defaultPath: (name: string) => invoke<string>('profiles:defaultPath', name),
    choosePath: (defaultPath: string) => invoke<string | null>('profiles:choosePath', defaultPath)
  },
  projects: {
    list: (options?: { includeArchived?: boolean }) => invoke<Project[]>('projects:list', options),
    create: (input: ProjectInput) => invoke<Project>('projects:create', input),
    update: (id: number, patch: Partial<ProjectInput>) =>
      invoke<Project>('projects:update', id, patch),
    setArchived: (id: number, archived: boolean) =>
      invoke<Project>('projects:setArchived', id, archived),
    delete: (id: number) => invoke<void>('projects:delete', id)
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
