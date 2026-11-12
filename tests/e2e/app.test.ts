import { spawn } from 'node:child_process'
import electron from 'electron'
import { expect, goTo, openSampleProfile, test } from './app'

const views = [
  'timer',
  'tracking',
  'projects',
  'clients',
  'tags',
  'reports',
  'export',
  'profile/general',
  'profile/fields',
  'profile/templates',
  'settings/appearance',
  'settings/controls',
  'settings/updates',
  'settings/integrations',
  'help'
]

test('starts on the welcome view without a profile', async ({ window }) => {
  await expect(window.getByRole('button', { name: 'Try sample profile' })).toBeVisible()
})

test('opens every view with the sample profile', async ({ window, errors }) => {
  await openSampleProfile(window)

  for (const view of views) {
    await goTo(window, `#/${view}`)
    // React renders the new route within the next frames; errors surface only then.
    await window.evaluate(async () => {
      for (let frame = 0; frame < 2; frame++) await new Promise(requestAnimationFrame)
    })
    await expect(window.getByText('Unexpected Application Error'), view).toBeHidden()
    // A view shows a failed load as a message instead of throwing, so it is checked as text.
    await expect(window.getByText('Something went wrong. Please try again.'), view).toBeHidden()
    expect(errors, view).toEqual([])
  }
})

test('switches the language of the app', async ({ window }) => {
  await expect(window.getByRole('button', { name: 'Try sample profile' })).toBeVisible()
  await goTo(window, '#/settings/appearance')
  await window.getByRole('button', { name: /Language/ }).click()
  await window.getByRole('option', { name: 'Deutsch' }).click()

  await expect(window.getByRole('link', { name: 'Einstellungen' })).toBeVisible()
  await expect(window.getByRole('button', { name: /Sprache/ })).toBeVisible()
})

test('starts and stops a timer from the launch options of a second start', async ({
  window,
  userData
}) => {
  await openSampleProfile(window)
  const recent = await window.evaluate(async () => {
    const { api } = globalThis as unknown as {
      api: {
        timer: {
          recent: (
            limit: number
          ) => Promise<{ value: { activity: { id: number; name: string } }[] }>
        }
      }
    }
    return (await api.timer.recent(1)).value[0].activity
  })

  // A jump list entry starts the app again with launch options; the second start hands them
  // over to the running one and quits.
  const startAgain = (arg: string): Promise<unknown> =>
    new Promise((resolve, reject) => {
      const child = spawn(electron as unknown as string, ['.', arg], {
        env: { ...process.env, TAKTRA_USER_DATA: userData },
        stdio: 'ignore'
      })
      child.on('exit', resolve)
      child.on('error', reject)
    })

  await startAgain(`--start-activity=${recent.id}`)
  await expect(window.getByText(/^Running since/)).toBeVisible()
  await expect(window.getByRole('button', { name: `Stop timer for ${recent.name}` })).toBeVisible()

  await startAgain('--stop-timer')
  await expect(window.getByText('No timer running.')).toBeVisible()
})
