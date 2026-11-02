import { mkdirSync } from 'node:fs'
import { BrowserWindow, dialog } from 'electron'
import { z } from 'zod'
import { profileFileExtension, type ProfilesState } from '../../../shared/profiles'
import { filePath, name } from '../../../shared/validation'
import {
  addProfile,
  createProfile,
  createSampleProfile,
  deleteProfile,
  getDefaultProfilePath,
  getProfilesState,
  profilesDirectory,
  removeProfile,
  renameProfile,
  setActiveProfile
} from '../../core/app/profiles'
import { handle } from './handle'

const fileFilters = [{ name: 'Taktra', extensions: [profileFileExtension] }]

async function chooseProfilePath(
  window: BrowserWindow | null,
  defaultPath: string
): Promise<string | null> {
  const options = { defaultPath, filters: fileFilters }
  const result = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options)

  return result.canceled || !result.filePath ? null : result.filePath
}

async function openProfile(window: BrowserWindow | null): Promise<ProfilesState | null> {
  const defaultPath = profilesDirectory()
  mkdirSync(defaultPath, { recursive: true })

  const options = { defaultPath, properties: ['openFile' as const], filters: fileFilters }
  const result = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options)

  const [path] = result.filePaths
  if (result.canceled || !path) return null
  return addProfile(path)
}

export function initProfiles(): void {
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
