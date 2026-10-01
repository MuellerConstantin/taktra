import { ipcMain, nativeTheme } from 'electron'
import Store from 'electron-store'
import { themeSources, type Settings } from '../shared/settings'

const store = new Store<Settings>({
  name: 'settings',
  schema: {
    theme: { type: 'string', enum: [...themeSources], default: 'system' }
  },
  clearInvalidConfig: true
})

function applyTheme(): void {
  nativeTheme.themeSource = store.get('theme')
}

export function getSettings(): Settings {
  return store.store
}

export function updateSettings(patch: Partial<Settings>): Settings {
  store.set({ ...store.store, ...patch })
  applyTheme()
  return store.store
}

export function initSettings(): void {
  applyTheme()
  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:update', (_, patch: Partial<Settings>) => updateSettings(patch))
}
