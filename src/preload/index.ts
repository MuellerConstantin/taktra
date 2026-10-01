import { contextBridge } from 'electron'

// Typed API exposed to the renderer as `window.api`. Main-process features
// (database access, etc.) get added here as IPC calls.
const api = {}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
