import { expect, openSampleProfile, test } from './app'

test('starts and stops a recently used activity on the timer view', async ({ window }) => {
  await openSampleProfile(window)

  const start = window.getByRole('button', { name: /^Start timer for / }).first()
  const name = (await start.getAttribute('aria-label'))!.replace('Start timer for ', '')
  await start.click()

  await expect(window.getByText(/^Running since/)).toBeVisible()
  await expect(window.getByRole('link', { name: `Open timer for ${name}` })).toBeVisible()

  await window.getByRole('button', { name: 'Stop', exact: true }).click()
  await expect(window.getByText('No timer running.')).toBeVisible()
  await expect(window.getByRole('link', { name: `Open timer for ${name}` })).toBeHidden()
})

test('starts a timer from the quick start window', async ({ window, electronApp }) => {
  await openSampleProfile(window)

  // The quick start window is created hidden at start and only shown by the shortcut.
  const quickStart = electronApp.windows().find((page) => page.url().endsWith('#/quick'))!
  await window.keyboard.press('Control+K')
  await quickStart.getByRole('searchbox', { name: 'Search activities' }).fill('Team Meeting')
  await quickStart.keyboard.press('Enter')

  await expect(window.getByRole('link', { name: 'Open timer for Team Meeting' })).toBeVisible()
})
