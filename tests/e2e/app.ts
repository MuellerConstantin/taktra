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
 * The built app (`out/`) with its own user data folder (`userData`), and its main window.
 * Errors thrown or logged in the main window are collected in `errors`; a test fails if there
 * are any when it ends.
 */
export const test = base.extend<{
  errors: string[]
  userData: string
  electronApp: ElectronApplication
  window: Page
}>({
  // Playwright reads the fixtures a fixture depends on from this pattern, so it must stay.
  // eslint-disable-next-line no-empty-pattern
  errors: async ({}, provide) => {
    const errors: string[] = []
    await provide(errors)
    expect(errors, 'errors in the main window').toEqual([])
  },
  // eslint-disable-next-line no-empty-pattern
  userData: async ({}, provide) => {
    const userData = mkdtempSync(join(tmpdir(), 'taktra-e2e-'))
    try {
      await provide(userData)
    } finally {
      rmSync(userData, { recursive: true, force: true })
    }
  },
  electronApp: async ({ userData }, provide) => {
    const app = await electron.launch({
      args: ['.'],
      env: { ...process.env, TAKTRA_USER_DATA: userData }
    })
    try {
      await provide(app)
    } finally {
      await app.close()
    }
  },
  window: async ({ electronApp, errors }, provide) => {
    const window = await findMainWindow(electronApp)
    window.on('pageerror', (error) => errors.push(error.message))
    window.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await provide(window)
  }
})

export { expect } from '@playwright/test'

export async function openSampleProfile(window: Page): Promise<void> {
  await window.getByRole('button', { name: 'Try sample profile' }).click()
  await expect(window.getByRole('button', { name: 'Try sample profile' })).toBeHidden()
}

export async function goTo(window: Page, hash: string): Promise<void> {
  await window.evaluate((target) => {
    location.hash = target
  }, hash)
}
