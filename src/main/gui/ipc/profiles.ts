import { mkdirSync } from 'node:fs'
import { BrowserWindow, dialog } from 'electron'
import { z } from 'zod'
import { profileFileExtension, type ProfilesState } from '../../../shared/profiles'
import { filePath, name } from '../../../shared/validation'
import { profiles } from '../../core'
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
  const defaultPath = profiles.directory()
  mkdirSync(defaultPath, { recursive: true })

  const options = { defaultPath, properties: ['openFile' as const], filters: fileFilters }
  const result = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options)

  const [path] = result.filePaths
  if (result.canceled || !path) return null
  return profiles.add(path)
}

export function registerProfilesHandlers(): void {
  handle('profiles:get', z.tuple([]), () => profiles.getState())
  handle('profiles:create', z.tuple([name, filePath]), (_, profileName, path) =>
    profiles.create(profileName, path)
  )
  handle('profiles:createSample', z.tuple([]), () => profiles.createSample())
  handle('profiles:setActive', z.tuple([filePath]), (_, path) => profiles.setActive(path))
  handle('profiles:rename', z.tuple([filePath, name]), (_, path, profileName) =>
    profiles.rename(path, profileName)
  )
  handle('profiles:delete', z.tuple([filePath]), (_, path) => profiles.delete(path))
  handle('profiles:remove', z.tuple([filePath]), (_, path) => profiles.remove(path))
  handle('profiles:open', z.tuple([]), (event) =>
    openProfile(BrowserWindow.fromWebContents(event.sender))
  )
  handle('profiles:defaultPath', z.tuple([z.string()]), (_, profileName) =>
    profiles.defaultPath(profileName)
  )
  handle('profiles:choosePath', z.tuple([filePath]), (event, defaultPath) =>
    chooseProfilePath(BrowserWindow.fromWebContents(event.sender), defaultPath)
  )
}
