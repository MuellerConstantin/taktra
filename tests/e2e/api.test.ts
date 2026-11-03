import { expect, test } from './app'

const PORT = 47123

test('enables the local API, answers with the shown key and updates the views', async ({
  window,
  errors
}) => {
  await window.getByRole('button', { name: 'Try sample profile' }).click()
  await expect(window.getByRole('button', { name: 'Try sample profile' })).toBeHidden()
  await window.evaluate(() => {
    location.hash = '#/settings/integrations'
  })

  const port = window.getByRole('textbox', { name: 'Port' })
  await port.fill(String(PORT))
  await port.press('Enter')
  // react-aria keeps the input of a switch visually hidden, so it is operated by keyboard.
  const enabled = window.getByRole('switch', { name: 'Enable local API' })
  await enabled.focus()
  await enabled.press('Space')
  await expect(window.getByText(`Running at http://127.0.0.1:${PORT}/api/v1`)).toBeVisible()
  const key = await window.getByLabel('New API key').textContent()

  const response = await fetch(`http://127.0.0.1:${PORT}/api/v1/projects`, {
    headers: { authorization: `Bearer ${key}` }
  })
  expect(response.status).toBe(200)
  expect(((await response.json()) as unknown[]).length).toBeGreaterThan(0)

  const refused = await fetch(`http://127.0.0.1:${PORT}/api/v1/projects`)
  expect(refused.status).toBe(401)

  // A change through the API shows up in an open view without reloading it.
  await window.evaluate(() => {
    location.hash = '#/projects'
  })
  await expect(window.getByRole('heading', { name: 'Projects' })).toBeVisible()
  const created = await fetch(`http://127.0.0.1:${PORT}/api/v1/projects`, {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Created through the API' })
  })
  expect(created.status).toBe(201)
  await expect(window.getByText('Created through the API')).toBeVisible()
  expect(errors).toEqual([])
})
