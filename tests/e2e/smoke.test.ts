import { expect, test } from './app'

const views = [
  'timer',
  'tracking',
  'projects',
  'clients',
  'tags',
  'reports',
  'export',
  'export/templates/new',
  'profile/general',
  'profile/fields',
  'settings/appearance',
  'settings/controls',
  'settings/updates',
  'help'
]

test('starts on the welcome view without a profile', async ({ window, errors }) => {
  await expect(window.getByRole('button', { name: 'Try sample profile' })).toBeVisible()
  expect(errors).toEqual([])
})

test('opens every view with the sample profile', async ({ window, errors }) => {
  await window.getByRole('button', { name: 'Try sample profile' }).click()
  await expect(window.getByRole('button', { name: 'Try sample profile' })).toBeHidden()

  for (const view of views) {
    await window.evaluate(async (hash) => {
      location.hash = hash
      // React renders the new route within the next frames; errors surface only then.
      for (let frame = 0; frame < 2; frame++) await new Promise(requestAnimationFrame)
    }, `#/${view}`)
    await expect(window.getByText('Unexpected Application Error'), view).toBeHidden()
    expect(errors, view).toEqual([])
  }
})
