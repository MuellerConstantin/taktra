import { app, globalShortcut } from 'electron'
import { z } from 'zod'
import { AppError } from '../shared/errors'
import { accelerator } from '../shared/validation'
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

  handle('shortcuts:status', z.tuple([]), () => getStatus())
  handle('shortcuts:setQuickStart', z.tuple([accelerator]), (_, value) =>
    setQuickStartShortcut(value)
  )
  handle('shortcuts:setRecording', z.tuple([z.boolean()]), (_, recording) => {
    isSuspended = recording
    applyShortcut()
  })
}
