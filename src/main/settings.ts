import { BrowserWindow, nativeTheme } from 'electron'
import Store from 'electron-store'
import { z } from 'zod'
import { AppError } from '../shared/errors'
import {
  DEFAULT_QUICK_START_SHORTCUT,
  languages,
  themeSources,
  type Settings
} from '../shared/settings'
import { settingsPatch } from '../shared/validation'
import { handle } from './ipc'

const store = new Store<Settings>({
  name: 'settings',
  schema: {
    theme: { type: 'string', enum: [...themeSources], default: 'system' },
    language: { type: 'string', enum: [...languages], default: 'en' },
    miniTimer: { type: 'boolean', default: true },
    quickStartShortcutEnabled: { type: 'boolean', default: true },
    quickStartShortcut: { type: 'string', minLength: 1, default: DEFAULT_QUICK_START_SHORTCUT },
    autoUpdate: { type: 'boolean', default: true },
    mcpAccess: { type: 'boolean', default: false }
  },
  clearInvalidConfig: true
})

const listeners = new Set<() => void>()

export function onSettingsChanged(listener: () => void): void {
  listeners.add(listener)
}

function applyTheme(): void {
  nativeTheme.themeSource = store.get('theme')
}

export function getSettings(): Settings {
  return store.store
}

export function updateSettings(patch: Partial<Settings>): Settings {
  try {
    store.set({ ...store.store, ...patch })
  } catch (error) {
    throw new AppError('VALIDATION_FAILED', String(error))
  }
  applyTheme()
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send('settings:changed')
  for (const listener of listeners) listener()
  return store.store
}

export function initSettings(): void {
  applyTheme()
  handle('settings:get', z.tuple([]), () => getSettings())
  handle('settings:update', z.tuple([settingsPatch]), (_, patch) => updateSettings(patch))
}
