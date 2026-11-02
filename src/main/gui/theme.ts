import { nativeTheme } from 'electron'
import { getSettings } from '../core/app/settings'
import { onChanged } from '../core/events'

function applyTheme(): void {
  nativeTheme.themeSource = getSettings().theme
}

export function initTheme(): void {
  applyTheme()
  onChanged('settings', applyTheme)
}
