import { expect, goTo, openSampleProfile, test } from './app'

test('creates a project and opens it', async ({ window }) => {
  await openSampleProfile(window)
  await goTo(window, '#/projects')

  await window.getByRole('button', { name: 'New project' }).click()
  const dialog = window.getByRole('dialog')
  await dialog.getByRole('textbox', { name: 'Name' }).fill('Website Relaunch 2027')
  await dialog.getByRole('button', { name: 'Create' }).click()
  await expect(dialog).toBeHidden()

  await window.getByRole('row', { name: /Website Relaunch 2027/ }).click()
  await expect(window.getByRole('heading', { name: 'Website Relaunch 2027' })).toBeVisible()
})

test('refuses a second project with the same name', async ({ window }) => {
  await openSampleProfile(window)
  await goTo(window, '#/projects')

  await window.getByRole('button', { name: 'New project' }).click()
  const dialog = window.getByRole('dialog')
  await dialog.getByRole('textbox', { name: 'Name' }).fill('internal')
  await dialog.getByRole('button', { name: 'Create' }).click()

  await expect(dialog.getByText('A project with this name already exists.')).toBeVisible()
})
