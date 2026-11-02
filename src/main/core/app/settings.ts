import Store from 'electron-store'
import { AppError } from '../../../shared/errors'
import {
  DEFAULT_QUICK_START_SHORTCUT,
  languages,
  themeSources,
  type Settings
} from '../../../shared/settings'
import { notifyChanged } from '../events'

const store = new Store<Settings>({
  name: 'settings',
  schema: {
    theme: { type: 'string', enum: [...themeSources], default: 'system' },
    language: { type: 'string', enum: [...languages], default: 'en' },
    miniTimer: { type: 'boolean', default: true },
    quickStartShortcutEnabled: { type: 'boolean', default: true },
    quickStartShortcut: { type: 'string', minLength: 1, default: DEFAULT_QUICK_START_SHORTCUT },
    autoUpdate: { type: 'boolean', default: true }
  },
  clearInvalidConfig: true
})

export function getSettings(): Settings {
  return store.store
}

export function updateSettings(patch: Partial<Settings>): Settings {
  try {
    store.set({ ...store.store, ...patch })
  } catch (error) {
    throw new AppError('VALIDATION_FAILED', String(error))
  }
  notifyChanged('settings')
  return store.store
}
