import { contextBridge, ipcRenderer } from 'electron'
import type { Activity, ActivityInput, ActivityWithTags } from '../shared/activities'
import type { IpcResponse } from '../shared/errors'
import type { ProfilesState } from '../shared/profiles'
import type { Project, ProjectInput } from '../shared/projects'
import type { Settings } from '../shared/settings'
import type { Tag, TagInput } from '../shared/tags'
import type {
  TimeEntry,
  TimeEntryDetails,
  TimeEntryInput,
  TimeEntryRange
} from '../shared/timeEntries'

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
  },
  tags: {
    list: () => invoke<Tag[]>('tags:list'),
    create: (input: TagInput) => invoke<Tag>('tags:create', input),
    update: (id: number, patch: Partial<TagInput>) => invoke<Tag>('tags:update', id, patch),
    delete: (id: number) => invoke<void>('tags:delete', id)
  },
  activities: {
    list: (options?: { projectId?: number; includeArchived?: boolean }) =>
      invoke<ActivityWithTags[]>('activities:list', options),
    create: (input: ActivityInput) => invoke<Activity>('activities:create', input),
    rename: (id: number, name: string) => invoke<Activity>('activities:rename', id, name),
    setArchived: (id: number, archived: boolean) =>
      invoke<Activity>('activities:setArchived', id, archived),
    setTags: (id: number, tagIds: readonly number[]) =>
      invoke<void>('activities:setTags', id, tagIds),
    delete: (id: number) => invoke<void>('activities:delete', id)
  },
  timeEntries: {
    list: (range: TimeEntryRange) => invoke<TimeEntryDetails[]>('timeEntries:list', range),
    create: (input: TimeEntryInput) => invoke<TimeEntry>('timeEntries:create', input),
    update: (id: number, input: TimeEntryInput) =>
      invoke<TimeEntry>('timeEntries:update', id, input),
    delete: (id: number) => invoke<void>('timeEntries:delete', id)
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
