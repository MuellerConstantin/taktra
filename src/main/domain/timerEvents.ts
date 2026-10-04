import { BrowserWindow } from 'electron'

const listeners = new Set<() => void>()

export function onTimerChanged(listener: () => void): void {
  listeners.add(listener)
}

export function notifyTimerChanged(): void {
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send('timer:changed')
  for (const listener of listeners) listener()
}
