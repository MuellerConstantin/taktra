import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import Store from 'electron-store'
import { profileFileExtension, type ProfilesState } from '../shared/profiles'
import { APPLICATION_ID, SCHEMA_VERSION } from './constants'

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

export function setActiveProfile(path: string): ProfilesState {
  if (!store.get('paths').includes(path)) throw new Error(`Unknown profile: ${path}`)

  store.set('activePath', path)
  return getProfilesState()
}

export function getDefaultProfilePath(name: string): string {
  const directory = join(app.getPath('userData'), 'profiles')
  const baseName =
    name
      .trim()
      .replace(/[<>:"/\\|?*]/g, '')
      .trim() || 'profile'

  let candidate = join(directory, `${baseName}.${profileFileExtension}`)
  for (let counter = 2; existsSync(candidate); counter++) {
    candidate = join(directory, `${baseName} (${counter}).${profileFileExtension}`)
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

export function initProfiles(): void {
  ipcMain.handle('profiles:get', () => getProfilesState())
  ipcMain.handle('profiles:create', (_, name: string, path: string) => createProfile(name, path))
  ipcMain.handle('profiles:setActive', (_, path: string) => setActiveProfile(path))
  ipcMain.handle('profiles:defaultPath', (_, name: string) => getDefaultProfilePath(name))
  ipcMain.handle('profiles:choosePath', (event, defaultPath: string) =>
    chooseProfilePath(BrowserWindow.fromWebContents(event.sender), defaultPath)
  )
}
