import { AppError } from '../../../shared/model/errors'
import {
  DEFAULT_QUICK_START_SHORTCUT,
  languages,
  themeSources,
  type Settings
} from '../../../shared/model/settings'
import { emit } from '../events'
import { lazyStore } from './store'

const store = lazyStore<Settings>('settings', {
  theme: { type: 'string', enum: [...themeSources], default: 'system' },
  language: { type: 'string', enum: [...languages], default: 'en' },
  miniTimer: { type: 'boolean', default: true },
  quickStartShortcutEnabled: { type: 'boolean', default: true },
  quickStartShortcut: { type: 'string', minLength: 1, default: DEFAULT_QUICK_START_SHORTCUT },
  autoUpdate: { type: 'boolean', default: true }
})

export function getSettings(): Settings {
  return store().store
}

export function updateSettings(patch: Partial<Settings>): Settings {
  try {
    store().set({ ...store().store, ...patch })
  } catch (error) {
    throw new AppError('VALIDATION_FAILED', String(error))
  }
  emit('signal:settings')
  return store().store
}
