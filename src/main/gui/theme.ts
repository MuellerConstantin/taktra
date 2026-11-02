import { nativeTheme } from 'electron'
import { events, settings } from '../core'

function applyTheme(): void {
  nativeTheme.themeSource = settings.get().theme
}

export function initTheme(): void {
  applyTheme()
  events.onChanged('settings', applyTheme)
}
