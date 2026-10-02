import { nativeTheme } from 'electron'
import Store from 'electron-store'
import { AppError } from '../shared/errors'
import { languages, themeSources, type Settings } from '../shared/settings'
import { handle } from './ipc'

const store = new Store<Settings>({
  name: 'settings',
  schema: {
    theme: { type: 'string', enum: [...themeSources], default: 'system' },
    language: { type: 'string', enum: [...languages], default: 'en' },
    miniTimer: { type: 'boolean', default: true }
  },
  clearInvalidConfig: true
})

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
  return store.store
}

export function initSettings(): void {
  applyTheme()
  handle('settings:get', () => getSettings())
  handle('settings:update', (_, patch: Partial<Settings>) => updateSettings(patch))
}
