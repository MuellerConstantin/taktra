import { nativeTheme } from 'electron'
import Store from 'electron-store'
import { AppError } from '../shared/errors'
import {
  DEFAULT_QUICK_START_SHORTCUT,
  languages,
  themeSources,
  type Settings
} from '../shared/settings'
import { handle } from './ipc'

const store = new Store<Settings>({
  name: 'settings',
  schema: {
    theme: { type: 'string', enum: [...themeSources], default: 'system' },
    language: { type: 'string', enum: [...languages], default: 'en' },
    miniTimer: { type: 'boolean', default: true },
    quickStartShortcutEnabled: { type: 'boolean', default: true },
    quickStartShortcut: { type: 'string', minLength: 1, default: DEFAULT_QUICK_START_SHORTCUT }
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
  for (const listener of listeners) listener()
  return store.store
}

export function initSettings(): void {
  applyTheme()
  handle('settings:get', () => getSettings())
  handle('settings:update', (_, patch: Partial<Settings>) => updateSettings(patch))
}
