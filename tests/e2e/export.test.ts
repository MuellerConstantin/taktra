import { expect, goTo, openSampleProfile, test } from './app'

test('exports with own columns and saves them as a template', async ({ window }) => {
  await openSampleProfile(window)
  await goTo(window, '#/export')

  await window.getByRole('button', { name: 'Customize' }).click()
  await window.getByRole('button', { name: 'Remove Note' }).click()
  await expect(window.getByRole('button', { name: 'Customize Changed' })).toBeVisible()

  await window.getByRole('button', { name: 'Save as template…' }).click()
  await window.getByRole('dialog').getByRole('textbox', { name: 'Name' }).fill('Without notes')
  await window.getByRole('dialog').getByRole('button', { name: 'Save' }).click()

  await expect(window.getByRole('button', { name: 'Without notes Template' })).toBeVisible()
  await expect(window.getByRole('button', { name: 'Customize', exact: true })).toBeVisible()
  await expect(window.getByRole('columnheader', { name: 'note' })).toBeHidden()
})
