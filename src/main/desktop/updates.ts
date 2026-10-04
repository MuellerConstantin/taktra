import { readdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { z } from 'zod'
import type { UpdateStatus } from '../../shared/updates'
import { handle } from '../ipc'
import { getSettings } from '../settings'
import { prepareQuit } from './windows'

const FIRST_CHECK_DELAY_MS = 10_000
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000

let status: UpdateStatus = { state: 'idle' }

function setStatus(next: UpdateStatus): void {
  status = next
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send('updates:changed')
}

/**
 * The installer puts its uninstaller next to the executable, the portable zip does not. Only
 * an installed app may update itself: in the zip, the updater would run the installer and
 * leave a second, installed copy behind.
 */
function isInstalled(): boolean {
  return readdirSync(dirname(app.getPath('exe'))).some((name) => /^Uninstall .*\.exe$/i.test(name))
}

function isBusy(): boolean {
  return ['checking', 'downloading', 'ready'].includes(status.state)
}

export function checkForUpdates(): void {
  if (status.state === 'unsupported' || isBusy()) return
  // Failures arrive through the 'error' event as well, which sets the status and logs them.
  autoUpdater.checkForUpdates().catch(() => undefined)
}

function installUpdate(): void {
  if (status.state !== 'ready') return
  // quitAndInstall closes the windows before 'before-quit' fires, so the main window
  // would only hide itself without this.
  prepareQuit()
  autoUpdater.quitAndInstall(true, true)
}

function watchUpdater(installed: boolean): void {
  autoUpdater.autoDownload = installed
  autoUpdater.autoInstallOnAppQuit = installed

  autoUpdater.on('checking-for-update', () => setStatus({ state: 'checking' }))
  autoUpdater.on('update-not-available', () => setStatus({ state: 'upToDate' }))
  autoUpdater.on('update-available', ({ version }) =>
    setStatus(
      installed ? { state: 'downloading', version, percent: 0 } : { state: 'available', version }
    )
  )
  autoUpdater.on('download-progress', ({ percent }) => {
    if (status.state === 'downloading') setStatus({ ...status, percent: Math.round(percent) })
  })
  autoUpdater.on('update-downloaded', ({ version }) => setStatus({ state: 'ready', version }))
  autoUpdater.on('error', (error) => {
    console.error('Update check failed', error)
    setStatus({ state: 'error' })
  })
}

export function initUpdates(): void {
  handle('updates:status', z.tuple([]), () => status)
  handle('updates:check', z.tuple([]), () => checkForUpdates())
  handle('updates:install', z.tuple([]), () => installUpdate())

  if (!app.isPackaged) {
    status = { state: 'unsupported' }
    return
  }

  watchUpdater(isInstalled())
  const checkAutomatically = (): void => {
    if (getSettings().autoUpdate) checkForUpdates()
  }
  setTimeout(checkAutomatically, FIRST_CHECK_DELAY_MS)
  setInterval(checkAutomatically, CHECK_INTERVAL_MS)
}
