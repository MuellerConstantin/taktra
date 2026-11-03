import { BrowserWindow, shell, type BrowserWindowConstructorOptions } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import type { WindowMessage } from '../../shared/gui/ipc'
import { events } from '../core'

let mainWindow: BrowserWindow | null = null
let quitting = false

/** From here on, closing the main window closes it instead of hiding it in the tray. */
export function prepareQuit(): void {
  quitting = true
}

export function isQuitting(): boolean {
  return quitting
}

export function setMainWindow(window: BrowserWindow): void {
  mainWindow = window
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = null
  })
}

export function hasMainWindow(): boolean {
  return mainWindow !== null && !mainWindow.isDestroyed()
}

export function showMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

export function send(window: BrowserWindow, message: WindowMessage): void {
  window.webContents.send(message)
}

export function sendToAllWindows(message: WindowMessage): void {
  for (const window of BrowserWindow.getAllWindows()) send(window, message)
}

export function sendToMainWindow(message: WindowMessage): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  send(mainWindow, message)
}

export function initWindowEvents(): void {
  for (const signal of events.signals) {
    events.on(`signal:${signal}`, () => sendToAllWindows(`${signal}:changed`))
  }
}

export function createRendererWindow(
  options: BrowserWindowConstructorOptions,
  route: string
): BrowserWindow {
  const window = new BrowserWindow({
    ...options,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true
    }
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/${route}`)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'), { hash: `/${route}` })
  }

  return window
}
