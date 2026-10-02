import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import Store from 'electron-store'
import {
  profileFileExtension,
  type OpenProfileResult,
  type ProfilesState
} from '../shared/profiles'
import { RESERVED_FILE_NAMES, SQLITE_SIDECAR_SUFFIXES } from './constants'
import {
  activateDatabase,
  closeActiveDatabase,
  isActiveDatabase,
  NewerProfileVersionError,
  openProfileDatabase,
  readProperty,
  withProfileDatabase,
  writeProperty
} from './db/database'

interface KnownProfiles {
  readonly paths: string[]
  readonly activePath: string | null
}

const store = new Store<KnownProfiles>({
  name: 'profiles',
  schema: {
    paths: { type: 'array', items: { type: 'string' }, default: [] },
    activePath: { type: ['string', 'null'], default: null }
  },
  clearInvalidConfig: true
})

interface ProfileInspection {
  readonly name: string | null
  readonly isNewerVersion: boolean
}

function inspectProfile(path: string): ProfileInspection {
  if (!existsSync(path)) return { name: null, isNewerVersion: false }

  try {
    const name = withProfileDatabase(path, { readOnly: true }, (db) => readProperty(db, 'name'))
    return { name, isNewerVersion: false }
  } catch (error) {
    return { name: null, isNewerVersion: error instanceof NewerProfileVersionError }
  }
}

function readProfileName(path: string): string | null {
  return inspectProfile(path).name
}

function syncActiveDatabase(): void {
  const activePath = store.get('activePath')

  try {
    activateDatabase(activePath && existsSync(activePath) ? activePath : null)
  } catch {
    activateDatabase(null)
  }
}

function updateKnownProfiles(paths: string[], activePath: string | null): void {
  store.set({ paths, activePath })
  syncActiveDatabase()
}

export function getProfilesState(): ProfilesState {
  const activePath = store.get('activePath')
  const profiles = store.get('paths').map((path) => {
    const { name, isNewerVersion } = inspectProfile(path)
    const isOpenable = path === activePath ? isActiveDatabase(path) : true
    return { path, name, isAvailable: name !== null && isOpenable, isNewerVersion }
  })

  return { profiles, activePath }
}

export function createProfile(name: string, path: string): ProfilesState {
  const trimmedName = name.trim()
  if (!trimmedName) throw new Error('Profile name must not be empty')
  if (existsSync(path)) throw new Error(`File already exists: ${path}`)

  mkdirSync(dirname(path), { recursive: true })

  try {
    const db = openProfileDatabase(path, { create: true })
    try {
      writeProperty(db, 'name', trimmedName)
    } finally {
      db.$client.close()
    }
  } catch (error) {
    rmSync(path, { force: true })
    throw error
  }

  const paths = store.get('paths').filter((known) => known !== path)
  updateKnownProfiles([...paths, path], path)

  return getProfilesState()
}

export function renameProfile(path: string, name: string): ProfilesState {
  const trimmedName = name.trim()
  if (!trimmedName) throw new Error('Profile name must not be empty')
  if (!store.get('paths').includes(path)) throw new Error(`Unknown profile: ${path}`)
  if (readProfileName(path) === null) throw new Error(`Profile not available: ${path}`)

  withProfileDatabase(path, {}, (db) => writeProperty(db, 'name', trimmedName))

  return getProfilesState()
}

export function removeProfile(path: string): ProfilesState {
  const paths = store.get('paths')
  if (!paths.includes(path)) throw new Error(`Unknown profile: ${path}`)

  const remaining = paths.filter((known) => known !== path)
  const activePath = store.get('activePath')
  const nextActivePath =
    activePath === path
      ? (remaining.find((known) => readProfileName(known) !== null) ?? null)
      : activePath

  updateKnownProfiles(remaining, nextActivePath)
  return getProfilesState()
}

export async function deleteProfile(path: string): Promise<ProfilesState> {
  if (!store.get('paths').includes(path)) throw new Error(`Unknown profile: ${path}`)
  if (store.get('activePath') === path) closeActiveDatabase()

  for (const file of [path, ...SQLITE_SIDECAR_SUFFIXES.map((suffix) => `${path}${suffix}`)]) {
    if (existsSync(file)) await shell.trashItem(file)
  }

  return removeProfile(path)
}

export function setActiveProfile(path: string): ProfilesState {
  if (!store.get('paths').includes(path)) throw new Error(`Unknown profile: ${path}`)

  updateKnownProfiles(store.get('paths'), path)
  return getProfilesState()
}

function slugify(value: string): string {
  const slug = value
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!slug) return 'profile'
  return RESERVED_FILE_NAMES.test(slug) ? `${slug}-profile` : slug
}

export function getDefaultProfilePath(name: string): string {
  const directory = join(app.getPath('userData'), 'profiles')
  const slug = slugify(name)

  let candidate = join(directory, `${slug}.${profileFileExtension}`)
  for (let counter = 2; existsSync(candidate); counter++) {
    candidate = join(directory, `${slug}-${counter}.${profileFileExtension}`)
  }

  return candidate
}

async function chooseProfilePath(
  window: BrowserWindow | null,
  defaultPath: string
): Promise<string | null> {
  const options = {
    defaultPath,
    filters: [{ name: 'Taktra', extensions: [profileFileExtension] }]
  }
  const result = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options)

  return result.canceled || !result.filePath ? null : result.filePath
}

async function openProfile(window: BrowserWindow | null): Promise<OpenProfileResult> {
  const options = {
    properties: ['openFile' as const],
    filters: [{ name: 'Taktra', extensions: [profileFileExtension] }]
  }
  const result = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options)

  const [path] = result.filePaths
  if (result.canceled || !path) return { status: 'canceled' }
  const { name, isNewerVersion } = inspectProfile(path)
  if (isNewerVersion) return { status: 'newerVersion' }
  if (name === null) return { status: 'invalid' }

  const paths = store.get('paths')
  updateKnownProfiles(paths.includes(path) ? paths : [...paths, path], path)

  return { status: 'opened', state: getProfilesState() }
}

export function initProfiles(): void {
  syncActiveDatabase()
  app.on('will-quit', closeActiveDatabase)

  ipcMain.handle('profiles:get', () => getProfilesState())
  ipcMain.handle('profiles:create', (_, name: string, path: string) => createProfile(name, path))
  ipcMain.handle('profiles:setActive', (_, path: string) => setActiveProfile(path))
  ipcMain.handle('profiles:rename', (_, path: string, name: string) => renameProfile(path, name))
  ipcMain.handle('profiles:delete', (_, path: string) => deleteProfile(path))
  ipcMain.handle('profiles:remove', (_, path: string) => removeProfile(path))
  ipcMain.handle('profiles:open', (event) =>
    openProfile(BrowserWindow.fromWebContents(event.sender))
  )
  ipcMain.handle('profiles:defaultPath', (_, name: string) => getDefaultProfilePath(name))
  ipcMain.handle('profiles:choosePath', (event, defaultPath: string) =>
    chooseProfilePath(BrowserWindow.fromWebContents(event.sender), defaultPath)
  )
}
