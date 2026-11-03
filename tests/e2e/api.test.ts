import { expect, test } from './app'

const PORT = 47123

test('enables the local API and answers with the shown key', async ({ window, errors }) => {
  await window.getByRole('button', { name: 'Try sample profile' }).click()
  await expect(window.getByRole('button', { name: 'Try sample profile' })).toBeHidden()
  await window.evaluate(() => {
    location.hash = '#/settings/api'
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
  expect(errors).toEqual([])
})
