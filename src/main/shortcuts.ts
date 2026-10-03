import { app, globalShortcut } from 'electron'
import { AppError } from '../shared/errors'
import type { Settings, ShortcutStatus } from '../shared/settings'
import { handle } from './ipc'
import { toggleQuickStart } from './quickStart'
import { getSettings, onSettingsChanged, updateSettings } from './settings'

let registered: string | null = null
let isSuspended = false

function register(accelerator: string): boolean {
  try {
    return globalShortcut.register(accelerator, toggleQuickStart)
  } catch {
    return false
  }
}

function unregister(): void {
  if (registered) globalShortcut.unregister(registered)
  registered = null
}

function applyShortcut(): void {
  const { quickStartShortcutEnabled, quickStartShortcut } = getSettings()
  if (isSuspended || !quickStartShortcutEnabled) {
    unregister()
    return
  }
  if (registered === quickStartShortcut) return

  unregister()
  if (register(quickStartShortcut)) registered = quickStartShortcut
}

function getStatus(): ShortcutStatus {
  if (!getSettings().quickStartShortcutEnabled) return 'disabled'
  return registered || isSuspended ? 'active' : 'unavailable'
}

function setQuickStartShortcut(accelerator: string): Settings {
  if (typeof accelerator !== 'string' || !accelerator.includes('+'))
    throw new AppError('VALIDATION_FAILED', `Invalid accelerator: ${accelerator}`)
  if (accelerator === getSettings().quickStartShortcut) return getSettings()

  if (getSettings().quickStartShortcutEnabled && !isSuspended) {
    if (!register(accelerator)) throw new AppError('SHORTCUT_UNAVAILABLE', accelerator)
    unregister()
    registered = accelerator
  }
  return updateSettings({ quickStartShortcut: accelerator })
}

export function initShortcuts(): void {
  applyShortcut()
  onSettingsChanged(applyShortcut)
  app.on('will-quit', () => globalShortcut.unregisterAll())

  handle('shortcuts:status', () => getStatus())
  handle('shortcuts:setQuickStart', (_, accelerator: string) => setQuickStartShortcut(accelerator))
  handle('shortcuts:setRecording', (_, recording: boolean) => {
    if (typeof recording !== 'boolean') throw new AppError('VALIDATION_FAILED', 'Invalid flag')
    isSuspended = recording
    applyShortcut()
  })
}
