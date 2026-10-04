import { app, BrowserWindow, dialog, type MessageBoxOptions } from 'electron'
import { z } from 'zod'
import type { Language } from '../../shared/settings'
import { getRunningTimer, hasRunningTimer, stopTimer } from '../domain/timer'
import { handle } from '../ipc'
import { getSettings } from '../settings'

const labels: Record<
  Language,
  {
    readonly message: (activity: string) => string
    readonly detail: string
    readonly stop: string
    readonly keep: string
    readonly cancel: string
  }
> = {
  en: {
    message: (activity) => `The timer for “${activity}” is still running.`,
    detail: 'Stop it and book the time, or let it keep running until you start Taktra again.',
    stop: 'Stop and quit',
    keep: 'Keep running and quit',
    cancel: 'Cancel'
  },
  de: {
    message: (activity) => `Der Timer für „${activity}“ läuft noch.`,
    detail:
      'Stoppe ihn und buche die Zeit, oder lass ihn weiterlaufen, bis du Taktra wieder startest.',
    stop: 'Stoppen und beenden',
    keep: 'Weiterlaufen lassen und beenden',
    cancel: 'Abbrechen'
  }
}

const enum Choice {
  Stop,
  Keep,
  Cancel
}

/**
 * Quits on the user's request, asking first while a timer runs. Not hooked into `before-quit`,
 * which also fires on OS shutdown, where a dialog would block the session from ending.
 */
export async function requestQuit(window: BrowserWindow | null): Promise<void> {
  const running = hasRunningTimer() ? getRunningTimer() : null
  if (!running) {
    app.quit()
    return
  }

  const text = labels[getSettings().language]
  const options: MessageBoxOptions = {
    type: 'question',
    message: text.message(running.activity.name),
    detail: text.detail,
    buttons: [text.stop, text.keep, text.cancel],
    defaultId: Choice.Stop,
    cancelId: Choice.Cancel,
    noLink: true
  }
  const { response } = window
    ? await dialog.showMessageBox(window, options)
    : await dialog.showMessageBox(options)

  if (response === Choice.Cancel) return
  if (response === Choice.Stop) stopTimer()
  app.quit()
}

export function initQuit(): void {
  handle('app:quit', z.tuple([]), (event) =>
    requestQuit(BrowserWindow.fromWebContents(event.sender))
  )
}
