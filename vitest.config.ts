import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': resolve('src') }
  },
  test: {
    include: ['tests/main/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    // On the Windows runners of GitHub, SQLite writes are slow: a test with a few profiles takes
    // seconds there instead of milliseconds.
    testTimeout: 30_000
  }
})
