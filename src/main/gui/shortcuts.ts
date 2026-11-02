import { app, globalShortcut } from 'electron'
import { z } from 'zod'
import { AppError } from '../../shared/errors'
import { accelerator } from '../../shared/validation'
import type { Settings, ShortcutStatus } from '../../shared/settings'
import { events, settings } from '../core'
import { handle } from './ipc/handle'
import { toggleQuickStart } from './quickStart'

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
  const { quickStartShortcutEnabled, quickStartShortcut } = settings.get()
  if (isSuspended || !quickStartShortcutEnabled) {
    unregister()
    return
  }
  if (registered === quickStartShortcut) return

  unregister()
  if (register(quickStartShortcut)) registered = quickStartShortcut
}

function getStatus(): ShortcutStatus {
  if (!settings.get().quickStartShortcutEnabled) return 'disabled'
  return registered || isSuspended ? 'active' : 'unavailable'
}

function setQuickStartShortcut(accelerator: string): Settings {
  if (accelerator === settings.get().quickStartShortcut) return settings.get()

  if (settings.get().quickStartShortcutEnabled && !isSuspended) {
    if (!register(accelerator)) throw new AppError('SHORTCUT_UNAVAILABLE', accelerator)
    unregister()
    registered = accelerator
  }
  return settings.update({ quickStartShortcut: accelerator })
}

export function initShortcuts(): void {
  applyShortcut()
  events.onChanged('settings', applyShortcut)
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
