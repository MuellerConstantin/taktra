import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  // Every test starts its own app; in parallel they would compete for focus and the tray.
  workers: 1,
  forbidOnly: !!process.env['CI'],
  reporter: process.env['CI'] ? 'github' : 'list'
})
