import { expect, test } from './app'

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
    // A view shows a failed load as a message instead of throwing, so it is checked as text.
    await expect(window.getByText('Something went wrong. Please try again.'), view).toBeHidden()
    expect(errors, view).toEqual([])
  }
})

test('exports with own columns and saves them as a template', async ({ window, errors }) => {
  await window.getByRole('button', { name: 'Try sample profile' }).click()
  await expect(window.getByRole('button', { name: 'Try sample profile' })).toBeHidden()
  await window.evaluate(() => {
    location.hash = '#/export'
  })

  await window.getByRole('button', { name: 'Customize' }).click()
  await window.getByRole('button', { name: 'Remove Note' }).click()
  await expect(window.getByRole('button', { name: 'Customize Changed' })).toBeVisible()

  await window.getByRole('button', { name: 'Save as template…' }).click()
  await window.getByRole('dialog').getByRole('textbox', { name: 'Name' }).fill('Without notes')
  await window.getByRole('dialog').getByRole('button', { name: 'Save' }).click()

  await expect(window.getByRole('button', { name: 'Without notes Template' })).toBeVisible()
  await expect(window.getByRole('button', { name: 'Customize', exact: true })).toBeVisible()
  await expect(window.getByRole('columnheader', { name: 'note' })).toBeHidden()
  expect(errors).toEqual([])
})

test('shows the entries of a week and opens a day from it', async ({ window, errors }) => {
  await window.getByRole('button', { name: 'Try sample profile' }).click()
  await expect(window.getByRole('button', { name: 'Try sample profile' })).toBeHidden()
  await window.evaluate(() => {
    location.hash = '#/tracking'
  })

  await window.getByRole('radio', { name: 'Week', exact: true }).click()
  await expect(window.getByRole('heading', { name: 'This week' })).toBeVisible()
  await expect(window.getByRole('button', { name: /^Show / })).toHaveCount(7)

  await window.getByRole('radio', { name: 'Work week' }).click()
  await expect(window.getByRole('button', { name: /^Show / })).toHaveCount(5)
  await expect(window.getByRole('button', { name: /^Show (Saturday|Sunday)/ })).toHaveCount(0)

  await window.getByRole('button', { name: 'Previous week' }).click()
  await expect(window.getByRole('heading', { name: 'Last week' })).toBeVisible()
  await expect(window.getByRole('button', { name: /^Daily Standup, / }).first()).toBeVisible()

  await window.getByRole('button', { name: /^Show Monday/ }).click()
  await expect(window.getByRole('radio', { name: 'Day' })).toBeChecked()
  await expect(window.getByRole('heading', { name: 'Monday' })).toBeVisible()
  expect(errors).toEqual([])
})

test('books a gap between two entries', async ({ window, errors }) => {
  await window.getByRole('button', { name: 'Try sample profile' }).click()
  await expect(window.getByRole('button', { name: 'Try sample profile' })).toBeHidden()
  await window.evaluate(() => {
    location.hash = '#/tracking?range=workWeek'
  })
  await window.getByRole('button', { name: 'Previous week' }).click()
  await window.getByRole('button', { name: /^Show Monday/ }).click()

  const gap = window.getByRole('row', { name: /not tracked$/ }).first()
  await gap.click()

  const dialog = window.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'New entry' })).toBeVisible()
  await expect(dialog.getByRole('group', { name: 'Start' })).not.toContainText('––')
  await expect(dialog.getByRole('group', { name: 'End' })).not.toContainText('––')
  expect(errors).toEqual([])
})
