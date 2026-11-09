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

test('moves the start of the running timer back', async ({ window }) => {
  await openSampleProfile(window)
  await window
    .getByRole('button', { name: /^Start timer for / })
    .first()
    .click()

  const earlier = await window.evaluate(() => {
    const date = new Date(Date.now() - 30 * 60_000)
    return {
      hour: String(date.getHours() % 12 || 12).padStart(2, '0'),
      minute: String(date.getMinutes()).padStart(2, '0'),
      period: date.getHours() < 12 ? 'A' : 'P',
      label: new Intl.DateTimeFormat('en', { timeStyle: 'short' }).format(date)
    }
  })

  await window.getByRole('button', { name: /^Change start time/ }).click()
  const dialog = window.getByRole('dialog')
  await dialog.getByRole('spinbutton', { name: 'hour, Start' }).click()
  await window.keyboard.type(earlier.hour + earlier.minute + earlier.period)
  await dialog.getByRole('button', { name: 'Save' }).click()

  await expect(dialog).toBeHidden()
  await expect(window.getByText(`Running since ${earlier.label}`)).toBeVisible()
  await expect(window.getByRole('main').getByText(/^0:(29|30):\d\d$/)).toBeVisible()
})
