import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app, BrowserWindow, dialog, shell } from 'electron'
import Store from 'electron-store'
import { z } from 'zod'
import {
  profileFileExtension,
  type ProfilesState,
  type UnavailableReason
} from '../shared/profiles'
import { AppError, isAppError } from '../shared/errors'
import { filePath, name } from '../shared/validation'
import { RESERVED_FILE_NAMES, SQLITE_SIDECAR_SUFFIXES } from './constants'
import {
  activateDatabase,
  closeActiveDatabase,
  getActiveDatabase,
  isActiveDatabase,
  openProfileDatabase,
  readProperty,
  withProfileDatabase,
  writeProperty,
  type ProfileDatabase
} from './db/database'
import { SAMPLE_PROFILE_NAME, seedSampleData } from './db/sample'
import { stopTimer } from './domain/timer'
import { handle } from './ipc'

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
    return { name: null, isNewerVersion: isAppError(error, 'PROFILE_NEWER_VERSION') }
  }
}

function readProfileName(path: string): string | null {
  return inspectProfile(path).name
}

let failedMigrationPath: string | null = null

function syncActiveDatabase(): void {
  const activePath = store.get('activePath')
  failedMigrationPath = null

  try {
    activateDatabase(activePath && existsSync(activePath) ? activePath : null)
  } catch (error) {
    console.error(`Could not open profile "${activePath}"`, error)
    if (isAppError(error, 'PROFILE_MIGRATION_FAILED')) failedMigrationPath = activePath
    activateDatabase(null)
  }
}

function unavailableReasonOf(
  path: string,
  activePath: string | null,
  { name, isNewerVersion }: ProfileInspection
): UnavailableReason | null {
  if (isNewerVersion) return 'newerVersion'
  if (path === failedMigrationPath) return 'migrationFailed'
  if (name === null) return 'missing'
  if (path === activePath && !isActiveDatabase(path)) return 'missing'
  return null
}

function notifyProfilesChanged(): void {
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send('profiles:changed')
}

function updateKnownProfiles(paths: string[], activePath: string | null): void {
  const previousPath = store.get('activePath')
  if (previousPath && previousPath !== activePath && isActiveDatabase(previousPath)) stopTimer()

  store.set({ paths, activePath })
  syncActiveDatabase()
  notifyProfilesChanged()
}

export function getActiveProfileName(): string {
  return readProperty(getActiveDatabase(), 'name') ?? ''
}

export function getProfilesState(): ProfilesState {
  const activePath = store.get('activePath')
  const profiles = store.get('paths').map((path) => {
    const inspection = inspectProfile(path)
    const unavailableReason = unavailableReasonOf(path, activePath, inspection)
    return {
      path,
      name: inspection.name,
      isAvailable: unavailableReason === null,
      unavailableReason
    }
  })

  return { profiles, activePath }
}

export function createProfile(
  name: string,
  path: string,
  populate?: (db: ProfileDatabase) => void
): ProfilesState {
  if (existsSync(path)) throw new AppError('PROFILE_FILE_EXISTS', path)

  mkdirSync(dirname(path), { recursive: true })

  try {
    const db = openProfileDatabase(path, { create: true })
    try {
      db.transaction(() => {
        writeProperty(db, 'uid', randomUUID())
        writeProperty(db, 'name', name)
        populate?.(db)
      })
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

export function createSampleProfile(): ProfilesState {
  return createProfile(
    SAMPLE_PROFILE_NAME,
    getDefaultProfilePath(SAMPLE_PROFILE_NAME),
    seedSampleData
  )
}

export function renameProfile(path: string, name: string): ProfilesState {
  if (!store.get('paths').includes(path)) throw new AppError('PROFILE_NOT_FOUND', path)
  if (readProfileName(path) === null) throw new AppError('PROFILE_UNAVAILABLE', path)

  withProfileDatabase(path, {}, (db) => writeProperty(db, 'name', name))
  notifyProfilesChanged()

  return getProfilesState()
}

export function removeProfile(path: string): ProfilesState {
  const paths = store.get('paths')
  if (!paths.includes(path)) throw new AppError('PROFILE_NOT_FOUND', path)

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
  if (!store.get('paths').includes(path)) throw new AppError('PROFILE_NOT_FOUND', path)
  if (store.get('activePath') === path) closeActiveDatabase()

  for (const file of [path, ...SQLITE_SIDECAR_SUFFIXES.map((suffix) => `${path}${suffix}`)]) {
    if (existsSync(file)) await shell.trashItem(file)
  }

  return removeProfile(path)
}

export function setActiveProfile(path: string): ProfilesState {
  if (!store.get('paths').includes(path)) throw new AppError('PROFILE_NOT_FOUND', path)

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

function profilesDirectory(): string {
  return join(app.getPath('userData'), 'profiles')
}

export function getDefaultProfilePath(name: string): string {
  const directory = profilesDirectory()
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

async function openProfile(window: BrowserWindow | null): Promise<ProfilesState | null> {
  const defaultPath = profilesDirectory()
  mkdirSync(defaultPath, { recursive: true })

  const options = {
    defaultPath,
    properties: ['openFile' as const],
    filters: [{ name: 'Taktra', extensions: [profileFileExtension] }]
  }
  const result = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options)

  const [path] = result.filePaths
  if (result.canceled || !path) return null
  const { name, isNewerVersion } = inspectProfile(path)
  if (isNewerVersion) throw new AppError('PROFILE_NEWER_VERSION', path)
  if (name === null) throw new AppError('PROFILE_INVALID', path)

  const paths = store.get('paths')
  updateKnownProfiles(paths.includes(path) ? paths : [...paths, path], path)

  return getProfilesState()
}

export function initProfiles(): void {
  syncActiveDatabase()
  app.on('will-quit', closeActiveDatabase)

  handle('profiles:get', z.tuple([]), () => getProfilesState())
  handle('profiles:create', z.tuple([name, filePath]), (_, profileName, path) =>
    createProfile(profileName, path)
  )
  handle('profiles:createSample', z.tuple([]), () => createSampleProfile())
  handle('profiles:setActive', z.tuple([filePath]), (_, path) => setActiveProfile(path))
  handle('profiles:rename', z.tuple([filePath, name]), (_, path, profileName) =>
    renameProfile(path, profileName)
  )
  handle('profiles:delete', z.tuple([filePath]), (_, path) => deleteProfile(path))
  handle('profiles:remove', z.tuple([filePath]), (_, path) => removeProfile(path))
  handle('profiles:open', z.tuple([]), (event) =>
    openProfile(BrowserWindow.fromWebContents(event.sender))
  )
  handle('profiles:defaultPath', z.tuple([z.string()]), (_, profileName) =>
    getDefaultProfilePath(profileName)
  )
  handle('profiles:choosePath', z.tuple([filePath]), (event, defaultPath) =>
    chooseProfilePath(BrowserWindow.fromWebContents(event.sender), defaultPath)
  )
}
