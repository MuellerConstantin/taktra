import { contextBridge, ipcRenderer } from 'electron'
import type { Activity, ActivityInput, ActivityWithTags } from '../shared/activities'
import type { Client, ClientInput } from '../shared/clients'
import type { IpcResponse } from '../shared/errors'
import type { ProfilesState } from '../shared/profiles'
import type { Project, ProjectInput } from '../shared/projects'
import type { AppInfo } from '../shared/about'
import type { ExportFormat, ExportPreview } from '../shared/export'
import type { UpdateStatus } from '../shared/updates'
import type { AggregateRow, Grouping, TimeFilter } from '../shared/reports'
import type { Settings, ShortcutStatus } from '../shared/settings'
import type { Tag, TagInput } from '../shared/tags'
import type {
  ActivityDetails,
  TimeEntry,
  TimeEntryDetails,
  TimeEntryInput,
  TimeEntryFilter
} from '../shared/timeEntries'

function invoke<T>(channel: string, ...args: unknown[]): Promise<IpcResponse<T>> {
  return ipcRenderer.invoke(channel, ...args)
}

function subscribe(channel: string, callback: () => void): () => void {
  const listener = (): void => callback()
  ipcRenderer.on(channel, listener)
  return () => {
    ipcRenderer.removeListener(channel, listener)
  }
}

const api = {
  settings: {
    get: () => invoke<Settings>('settings:get'),
    update: (patch: Partial<Settings>) => invoke<Settings>('settings:update', patch)
  },
  profiles: {
    get: () => invoke<ProfilesState>('profiles:get'),
    create: (name: string, path: string) => invoke<ProfilesState>('profiles:create', name, path),
    createSample: () => invoke<ProfilesState>('profiles:createSample'),
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
    get: (id: number) => invoke<Project>('projects:get', id),
    create: (input: ProjectInput) => invoke<Project>('projects:create', input),
    update: (id: number, patch: Partial<ProjectInput>) =>
      invoke<Project>('projects:update', id, patch),
    setArchived: (id: number, archived: boolean) =>
      invoke<Project>('projects:setArchived', id, archived),
    delete: (id: number) => invoke<void>('projects:delete', id)
  },
  clients: {
    list: (options?: { includeArchived?: boolean }) => invoke<Client[]>('clients:list', options),
    get: (id: number) => invoke<Client>('clients:get', id),
    create: (input: ClientInput) => invoke<Client>('clients:create', input),
    update: (id: number, patch: Partial<ClientInput>) =>
      invoke<Client>('clients:update', id, patch),
    setArchived: (id: number, archived: boolean) =>
      invoke<Client>('clients:setArchived', id, archived),
    delete: (id: number) => invoke<void>('clients:delete', id)
  },
  tags: {
    list: () => invoke<Tag[]>('tags:list'),
    get: (id: number) => invoke<Tag>('tags:get', id),
    create: (input: TagInput) => invoke<Tag>('tags:create', input),
    update: (id: number, patch: Partial<TagInput>) => invoke<Tag>('tags:update', id, patch),
    delete: (id: number) => invoke<void>('tags:delete', id)
  },
  activities: {
    list: (options?: { projectId?: number; includeArchived?: boolean }) =>
      invoke<ActivityWithTags[]>('activities:list', options),
    get: (id: number) => invoke<ActivityDetails>('activities:get', id),
    create: (input: ActivityInput) => invoke<Activity>('activities:create', input),
    rename: (id: number, name: string) => invoke<Activity>('activities:rename', id, name),
    move: (id: number, projectId: number, name: string) =>
      invoke<Activity>('activities:move', id, projectId, name),
    setArchived: (id: number, archived: boolean) =>
      invoke<Activity>('activities:setArchived', id, archived),
    setClient: (id: number, clientId: number | null) =>
      invoke<Activity>('activities:setClient', id, clientId),
    setTags: (id: number, tagIds: readonly number[]) =>
      invoke<void>('activities:setTags', id, tagIds),
    delete: (id: number) => invoke<void>('activities:delete', id)
  },
  reports: {
    aggregate: (filter: TimeFilter, groupBy: readonly Grouping[]) =>
      invoke<AggregateRow[]>('reports:aggregate', filter, groupBy)
  },
  updates: {
    status: () => invoke<UpdateStatus>('updates:status'),
    check: () => invoke<void>('updates:check'),
    install: () => invoke<void>('updates:install')
  },
  export: {
    preview: (filter: TimeFilter) => invoke<ExportPreview>('export:preview', filter),
    file: (filter: TimeFilter, format: ExportFormat) =>
      invoke<string | null>('export:file', filter, format)
  },
  timeEntries: {
    list: (filter: TimeEntryFilter) => invoke<TimeEntryDetails[]>('timeEntries:list', filter),
    create: (input: TimeEntryInput) => invoke<TimeEntry>('timeEntries:create', input),
    update: (id: number, input: TimeEntryInput) =>
      invoke<TimeEntry>('timeEntries:update', id, input),
    delete: (id: number) => invoke<void>('timeEntries:delete', id)
  },
  timer: {
    get: () => invoke<TimeEntryDetails | null>('timer:get'),
    start: (activityId: number) => invoke<TimeEntryDetails>('timer:start', activityId),
    stop: () => invoke<void>('timer:stop'),
    discard: () => invoke<void>('timer:discard'),
    recent: (limit: number) => invoke<ActivityDetails[]>('timer:recent', limit)
  },
  shortcuts: {
    status: () => invoke<ShortcutStatus>('shortcuts:status'),
    setQuickStart: (accelerator: string) =>
      invoke<Settings>('shortcuts:setQuickStart', accelerator),
    setRecording: (recording: boolean) => invoke<void>('shortcuts:setRecording', recording)
  },
  quick: {
    hide: () => invoke<void>('quick:hide'),
    toggle: () => invoke<void>('quick:toggle'),
    resize: (height: number) => invoke<void>('quick:resize', height)
  },
  donation: {
    hint: () => invoke<boolean>('donation:hint'),
    snooze: () => invoke<void>('donation:snooze'),
    dismiss: () => invoke<void>('donation:dismiss')
  },
  app: {
    showMainWindow: () => invoke<void>('app:showMainWindow'),
    quit: () => invoke<void>('app:quit'),
    info: () => invoke<AppInfo>('app:info'),
    openDataFolder: () => invoke<void>('app:openDataFolder'),
    setMainVisible: (visible: boolean) => invoke<void>('app:setMainVisible', visible)
  },
  events: {
    onTimerChanged: (callback: () => void) => subscribe('timer:changed', callback),
    onSettingsChanged: (callback: () => void) => subscribe('settings:changed', callback),
    onProfilesChanged: (callback: () => void) => subscribe('profiles:changed', callback),
    onQuickShown: (callback: () => void) => subscribe('quick:shown', callback),
    onShowAbout: (callback: () => void) => subscribe('about:show', callback),
    onUpdatesChanged: (callback: () => void) => subscribe('updates:changed', callback),
    onDonationChanged: (callback: () => void) => subscribe('donation:changed', callback)
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
