import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  _electron as electron,
  expect,
  test as base,
  type ElectronApplication,
  type Page
} from '@playwright/test'

/** The quick start and mini timer are windows of their own, opened in no fixed order. */
function isMainWindow(page: Page): boolean {
  return page.url().startsWith('file:') && !/#\/(quick|mini)$/.test(page.url())
}

async function findMainWindow(app: ElectronApplication): Promise<Page> {
  await expect.poll(() => app.windows().some(isMainWindow)).toBe(true)
  return app.windows().find(isMainWindow)!
}

/**
 * The built app (`out/`) with its own user data folder, and its main window. Errors thrown in
 * the window are collected, so a test can assert that a view rendered without any.
 */
export const test = base.extend<{ window: Page; errors: string[] }>({
  // Playwright reads the fixtures a fixture depends on from this pattern, so it must stay.
  // eslint-disable-next-line no-empty-pattern
  errors: async ({}, provide) => {
    await provide([])
  },
  window: async ({ errors }, provide) => {
    const userData = mkdtempSync(join(tmpdir(), 'taktra-e2e-'))
    const app = await electron.launch({
      args: ['.'],
      env: { ...process.env, TAKTRA_USER_DATA: userData }
    })
    try {
      const window = await findMainWindow(app)
      window.on('pageerror', (error) => errors.push(error.message))
      window.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })
      await provide(window)
    } finally {
      await app.close()
      rmSync(userData, { recursive: true, force: true })
    }
  }
})

export { expect } from '@playwright/test'
