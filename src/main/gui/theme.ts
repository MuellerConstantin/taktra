import { nativeTheme } from 'electron'
import { events, settings } from '@/main/core'

function applyTheme(): void {
  nativeTheme.themeSource = settings.get().theme
}

export function initTheme(): void {
  applyTheme()
  events.on('signal:settings', applyTheme)
}
