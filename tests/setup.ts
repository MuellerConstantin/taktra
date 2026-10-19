import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync } from 'node:fs'
import { afterAll, vi } from 'vitest'

/**
 * The main process code runs under plain Node in tests. better-sqlite3 loads there as well, so
 * only Electron and electron-store, which need a running Electron app, are replaced.
 */
vi.mock('electron', () => {
  const userData = mkdtempSync(join(tmpdir(), 'taktra-test-'))
  return {
    app: {
      isPackaged: false,
      getAppPath: () => process.cwd(),
      getPath: () => userData
    },
    ipcMain: { handle: () => {} },
    BrowserWindow: { getAllWindows: () => [] },
    nativeTheme: {},
    dialog: {}
  }
})

vi.mock('electron-store', () => ({
  default: class {
    readonly store: Record<string, unknown> = { language: 'en' }

    get(key: string): unknown {
      return this.store[key]
    }
  }
}))

// Hooks of the test file run first, so profiles they opened are closed again by now.
afterAll(async () => {
  const { app } = await import('electron')
  rmSync(app.getPath('userData'), { recursive: true, force: true })
})
