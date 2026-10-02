import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import Store from 'electron-store'
import {
  profileFileExtension,
  type OpenProfileResult,
  type ProfilesState
} from '../shared/profiles'
import {
  APPLICATION_ID,
  RESERVED_FILE_NAMES,
  SCHEMA_VERSION,
  SQLITE_SIDECAR_SUFFIXES
} from './constants'

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

function readProfileName(path: string): string | null {
  if (!existsSync(path)) return null

  try {
    const db = new DatabaseSync(path, { readOnly: true })
    try {
      const { application_id } = db.prepare('PRAGMA application_id').get() as {
        application_id: number
      }
      if (application_id !== APPLICATION_ID) return null

      const row = db.prepare("SELECT value FROM meta WHERE key = 'name'").get() as
        { value: string } | undefined
      return row?.value ?? null
    } finally {
      db.close()
    }
  } catch {
    return null
  }
}

export function getProfilesState(): ProfilesState {
  const profiles = store.get('paths').map((path) => {
    const name = readProfileName(path)
    return { path, name, isAvailable: name !== null }
  })

  return { profiles, activePath: store.get('activePath') }
}

export function createProfile(name: string, path: string): ProfilesState {
  const trimmedName = name.trim()
  if (!trimmedName) throw new Error('Profile name must not be empty')
  if (existsSync(path)) throw new Error(`File already exists: ${path}`)

  mkdirSync(dirname(path), { recursive: true })

  const db = new DatabaseSync(path)
  try {
    db.exec(`
      PRAGMA application_id = ${APPLICATION_ID};
      PRAGMA user_version = ${SCHEMA_VERSION};
      CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
    `)
    db.prepare("INSERT INTO meta (key, value) VALUES ('name', ?)").run(trimmedName)
    db.close()
  } catch (error) {
    db.close()
    rmSync(path, { force: true })
    throw error
  }

  const paths = store.get('paths').filter((known) => known !== path)
  store.set({ paths: [...paths, path], activePath: path })

  return getProfilesState()
}

export function renameProfile(path: string, name: string): ProfilesState {
  const trimmedName = name.trim()
  if (!trimmedName) throw new Error('Profile name must not be empty')
  if (!store.get('paths').includes(path)) throw new Error(`Unknown profile: ${path}`)
  if (readProfileName(path) === null) throw new Error(`Profile not available: ${path}`)

  const db = new DatabaseSync(path)
  try {
    db.prepare("UPDATE meta SET value = ? WHERE key = 'name'").run(trimmedName)
  } finally {
    db.close()
  }

  return getProfilesState()
}

export async function deleteProfile(path: string): Promise<ProfilesState> {
  const paths = store.get('paths')
  if (!paths.includes(path)) throw new Error(`Unknown profile: ${path}`)

  for (const file of [path, ...SQLITE_SIDECAR_SUFFIXES.map((suffix) => `${path}${suffix}`)]) {
    if (existsSync(file)) await shell.trashItem(file)
  }

  const remaining = paths.filter((known) => known !== path)
  const activePath = store.get('activePath')
  const nextActivePath =
    activePath === path
      ? (remaining.find((known) => readProfileName(known) !== null) ?? null)
      : activePath

  store.set({ paths: remaining, activePath: nextActivePath })
  return getProfilesState()
}

export function setActiveProfile(path: string): ProfilesState {
  if (!store.get('paths').includes(path)) throw new Error(`Unknown profile: ${path}`)

  store.set('activePath', path)
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
  if (readProfileName(path) === null) return { status: 'invalid' }

  const paths = store.get('paths')
  store.set({ paths: paths.includes(path) ? paths : [...paths, path], activePath: path })

  return { status: 'opened', state: getProfilesState() }
}

export function initProfiles(): void {
  ipcMain.handle('profiles:get', () => getProfilesState())
  ipcMain.handle('profiles:create', (_, name: string, path: string) => createProfile(name, path))
  ipcMain.handle('profiles:setActive', (_, path: string) => setActiveProfile(path))
  ipcMain.handle('profiles:rename', (_, path: string, name: string) => renameProfile(path, name))
  ipcMain.handle('profiles:delete', (_, path: string) => deleteProfile(path))
  ipcMain.handle('profiles:open', (event) =>
    openProfile(BrowserWindow.fromWebContents(event.sender))
  )
  ipcMain.handle('profiles:defaultPath', (_, name: string) => getDefaultProfilePath(name))
  ipcMain.handle('profiles:choosePath', (event, defaultPath: string) =>
    chooseProfilePath(BrowserWindow.fromWebContents(event.sender), defaultPath)
  )
}
