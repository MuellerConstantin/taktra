import { contextBridge, ipcRenderer } from 'electron'
import type { InvokeChannel, IpcContract, IpcResponse, WindowMessage } from '@/shared/gui/ipc'

type Result<Channel extends InvokeChannel> = Awaited<ReturnType<IpcContract[Channel]>>

/** The function the renderer calls for a channel, typed by the IPC contract. */
function invoker<Channel extends InvokeChannel>(
  channel: Channel
): (...args: Parameters<IpcContract[Channel]>) => Promise<IpcResponse<Result<Channel>>> {
  return (...args) => ipcRenderer.invoke(channel, ...args)
}

function subscribe(channel: WindowMessage, callback: () => void): () => void {
  const listener = (): void => callback()
  ipcRenderer.on(channel, listener)
  return () => {
    ipcRenderer.removeListener(channel, listener)
  }
}

const api = {
  settings: {
    get: invoker('settings:get'),
    update: invoker('settings:update')
  },
  profiles: {
    get: invoker('profiles:get'),
    create: invoker('profiles:create'),
    createSample: invoker('profiles:createSample'),
    setActive: invoker('profiles:setActive'),
    rename: invoker('profiles:rename'),
    delete: invoker('profiles:delete'),
    remove: invoker('profiles:remove'),
    open: invoker('profiles:open'),
    defaultPath: invoker('profiles:defaultPath'),
    choosePath: invoker('profiles:choosePath')
  },
  projects: {
    list: invoker('projects:list'),
    get: invoker('projects:get'),
    create: invoker('projects:create'),
    update: invoker('projects:update'),
    setArchived: invoker('projects:setArchived'),
    delete: invoker('projects:delete')
  },
  clients: {
    list: invoker('clients:list'),
    get: invoker('clients:get'),
    create: invoker('clients:create'),
    update: invoker('clients:update'),
    setArchived: invoker('clients:setArchived'),
    delete: invoker('clients:delete')
  },
  tags: {
    list: invoker('tags:list'),
    get: invoker('tags:get'),
    create: invoker('tags:create'),
    update: invoker('tags:update'),
    delete: invoker('tags:delete')
  },
  activities: {
    list: invoker('activities:list'),
    get: invoker('activities:get'),
    create: invoker('activities:create'),
    rename: invoker('activities:rename'),
    move: invoker('activities:move'),
    setArchived: invoker('activities:setArchived'),
    setClient: invoker('activities:setClient'),
    setTags: invoker('activities:setTags'),
    merge: invoker('activities:merge'),
    delete: invoker('activities:delete')
  },
  customFields: {
    list: invoker('customFields:list'),
    create: invoker('customFields:create'),
    rename: invoker('customFields:rename'),
    setArchived: invoker('customFields:setArchived'),
    delete: invoker('customFields:delete'),
    createOption: invoker('customFields:createOption'),
    renameOption: invoker('customFields:renameOption'),
    setOptionArchived: invoker('customFields:setOptionArchived'),
    deleteOption: invoker('customFields:deleteOption'),
    values: invoker('customFields:values'),
    setValues: invoker('customFields:setValues')
  },
  reports: {
    aggregate: invoker('reports:aggregate')
  },
  updates: {
    status: invoker('updates:status'),
    check: invoker('updates:check'),
    install: invoker('updates:install')
  },
  export: {
    preview: invoker('export:preview'),
    file: invoker('export:file')
  },
  exportTemplates: {
    list: invoker('exportTemplates:list'),
    get: invoker('exportTemplates:get'),
    create: invoker('exportTemplates:create'),
    update: invoker('exportTemplates:update'),
    delete: invoker('exportTemplates:delete')
  },
  timeEntries: {
    list: invoker('timeEntries:list'),
    create: invoker('timeEntries:create'),
    update: invoker('timeEntries:update'),
    setNote: invoker('timeEntries:note'),
    delete: invoker('timeEntries:delete')
  },
  timer: {
    get: invoker('timer:get'),
    start: invoker('timer:start'),
    stop: invoker('timer:stop'),
    discard: invoker('timer:discard'),
    recent: invoker('timer:recent')
  },
  shortcuts: {
    status: invoker('shortcuts:status'),
    setQuickStart: invoker('shortcuts:setQuickStart'),
    setRecording: invoker('shortcuts:setRecording')
  },
  quick: {
    hide: invoker('quick:hide'),
    toggle: invoker('quick:toggle'),
    resize: invoker('quick:resize')
  },
  donation: {
    hint: invoker('donation:hint'),
    snooze: invoker('donation:snooze'),
    dismiss: invoker('donation:dismiss')
  },
  app: {
    showMainWindow: invoker('app:showMainWindow'),
    quit: invoker('app:quit'),
    info: invoker('app:info'),
    openDataFolder: invoker('app:openDataFolder'),
    setMainVisible: invoker('app:setMainVisible')
  },
  events: {
    onTimerChanged: (callback: () => void) => subscribe('timer:changed', callback),
    onSettingsChanged: (callback: () => void) => subscribe('settings:changed', callback),
    onProfilesChanged: (callback: () => void) => subscribe('profiles:changed', callback),
    onQuickShown: (callback: () => void) => subscribe('quick:shown', callback),
    onShowAbout: (callback: () => void) => subscribe('about:show', callback),
    onUpdatesChanged: (callback: () => void) => subscribe('updates:changed', callback),
    onDonationChanged: (callback: () => void) => subscribe('donation:changed', callback),
    onDataChanged: (callback: () => void) => subscribe('data:changed', callback)
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
