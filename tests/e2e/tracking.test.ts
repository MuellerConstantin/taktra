import { expect, goTo, openSampleProfile, test } from './app'
import { openMondayWithTeamMeeting } from './calendar'

test('shows the entries of a week and opens a day from it', async ({ window }) => {
  await openSampleProfile(window)
  await goTo(window, '#/tracking')

  await window.getByRole('radio', { name: 'Week', exact: true }).click()
  await expect(window.getByRole('heading', { name: 'This week' })).toBeVisible()
  await expect(window.getByText(/^Week \d+ · /)).toBeVisible()
  await expect(window.getByRole('button', { name: /^Show / })).toHaveCount(7)

  await window.getByRole('radio', { name: 'Work week' }).click()
  await expect(window.getByRole('button', { name: /^Show / })).toHaveCount(5)
  await expect(window.getByRole('button', { name: /^Show (Saturday|Sunday)/ })).toHaveCount(0)

  await window.getByRole('button', { name: 'Previous week' }).click()
  await expect(window.getByRole('heading', { name: 'Last week' })).toBeVisible()
  await expect(window.locator('[data-entry-id]').first()).toBeVisible()

  await window.getByRole('button', { name: /^Show Monday/ }).click()
  await expect(window.getByRole('radio', { name: 'Day' })).toBeChecked()
  await expect(window.getByRole('heading', { name: 'Monday' })).toBeVisible()
})

test('books, edits and deletes an entry by hand', async ({ window }) => {
  await openSampleProfile(window)
  await goTo(window, '#/tracking')

  await window.getByRole('button', { name: 'New entry' }).click()
  const dialog = window.getByRole('dialog')
  await dialog.getByRole('button', { name: /Project/ }).click()
  await window.getByRole('option', { name: 'Internal' }).click()
  await dialog.getByRole('radio', { name: 'Duration' }).click()
  await dialog.getByRole('textbox', { name: 'Duration' }).fill('1:30')
  await dialog.getByRole('combobox', { name: 'Activity' }).fill('Release planning')
  // The suggestions would cover the buttons of the dialog.
  await dialog.getByRole('combobox', { name: 'Activity' }).press('Escape')
  await dialog.getByRole('button', { name: 'Create' }).click()
  await expect(dialog).toBeHidden()

  const row = window.getByRole('row', { name: /Release planning/ })
  await expect(row).toContainText('1:30')

  await window.getByRole('button', { name: 'Edit entry for Release planning' }).click()
  await dialog.getByRole('textbox', { name: 'Duration' }).fill('2h')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(row).toContainText('2:00')

  await window.getByRole('button', { name: 'Delete entry for Release planning' }).click()
  await window.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  await expect(row).toHaveCount(0)
})

test('books a gap between two entries', async ({ window }) => {
  await openMondayWithTeamMeeting(window)

  await window
    .getByRole('row', { name: /not tracked$/ })
    .first()
    .click()

  const dialog = window.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'New entry' })).toBeVisible()
  await expect(dialog.getByRole('group', { name: 'Start' })).not.toContainText('––')
  await expect(dialog.getByRole('group', { name: 'End' })).not.toContainText('––')
})

test('moves an entry to another day', async ({ window }) => {
  await openMondayWithTeamMeeting(window)
  const meetings = window.getByRole('row', { name: /Team Meeting/ })
  await expect(meetings).toHaveCount(1)

  await window.getByRole('button', { name: 'More actions for Team Meeting' }).click()
  await window.getByRole('menuitem', { name: 'Move to another day…' }).click()
  const dialog = window.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Move entry' })).toBeVisible()
  await window.keyboard.press('ArrowRight')
  await window.keyboard.press('Enter')
  await dialog.getByRole('button', { name: 'Move' }).click()

  await expect(meetings).toHaveCount(0)
  await expect(window.getByText(/^Moved to Tuesday/)).toBeVisible()
  await window.getByRole('button', { name: 'Show', exact: true }).click()
  await expect(window.getByRole('heading', { name: 'Tuesday' })).toBeVisible()
  await expect(window.getByRole('row', { name: /Team Meeting/ })).toBeVisible()
})
