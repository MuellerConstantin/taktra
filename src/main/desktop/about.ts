import { arch, release, type } from 'node:os'
import { app, shell } from 'electron'
import { z } from 'zod'
import { author } from '../../../package.json'
import type { AppInfo } from '../../shared/about'
import { handle } from '../ipc'
import { sendToMainWindow, showMainWindow } from './windows'

function appInfo(): AppInfo {
  return {
    version: app.getVersion(),
    author: author.name,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    os: `${type()} ${release()} (${arch()})`
  }
}

async function openDataFolder(): Promise<void> {
  const error = await shell.openPath(app.getPath('userData'))
  if (error) throw new Error(error)
}

export function showAbout(): void {
  showMainWindow()
  sendToMainWindow('about:show')
}

export function initAbout(): void {
  handle('app:info', z.tuple([]), () => appInfo())
  handle('app:openDataFolder', z.tuple([]), () => openDataFolder())
}
