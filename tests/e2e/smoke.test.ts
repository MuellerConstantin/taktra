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

test('drags entries in the week calendar', async ({ window, errors }) => {
  await window.setViewportSize({ width: 1200, height: 800 })
  await window.getByRole('button', { name: 'Try sample profile' }).click()
  await expect(window.getByRole('button', { name: 'Try sample profile' })).toBeHidden()
  await window.evaluate(() => {
    location.hash = '#/tracking?range=week'
  })
  await window.getByRole('button', { name: 'Previous week' }).click()

  const drag = async (
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): Promise<void> => {
    await window.mouse.move(from.x, from.y)
    await window.mouse.down()
    await window.mouse.move(from.x, from.y + 5)
    await window.mouse.move(to.x, to.y, { steps: 5 })
    await window.mouse.up()
  }
  const hourHeight = 64

  const meeting = window.getByRole('button', { name: /^Team Meeting, Internal, 4:00 PM/ })
  await expect(window.getByRole('heading', { name: 'Last week' })).toBeVisible()
  await expect(meeting).toBeVisible()
  await meeting.scrollIntoViewIfNeeded()
  const meetingBox = (await meeting.boundingBox())!
  const meetingCenter = { x: meetingBox.x + meetingBox.width / 2, y: meetingBox.y + 20 }
  await drag(meetingCenter, { x: meetingCenter.x, y: meetingCenter.y - hourHeight })
  await expect(
    window.getByRole('button', { name: 'Team Meeting, Internal, 3:00 PM – 4:00 PM, 1:00' })
  ).toBeVisible()
  await expect(window.getByRole('dialog')).toBeHidden()

  const triage = window.getByRole('button', { name: /^Issue Triage, Open Source, 9:15 AM/ }).first()
  await triage.scrollIntoViewIfNeeded()
  const triageBox = (await triage.boundingBox())!
  const triageBottom = {
    x: triageBox.x + triageBox.width / 2,
    y: triageBox.y + triageBox.height - 2
  }
  await drag(triageBottom, { x: triageBottom.x, y: triageBottom.y + hourHeight / 4 })
  await expect(
    window.getByRole('button', { name: 'Issue Triage, Open Source, 9:15 AM – 11:30 AM, 2:15' })
  ).toBeVisible()

  const sunday = window.getByRole('button', { name: /^Show Sunday/ })
  const sundayX = (await sunday.boundingBox())!.x + 20
  const moved = window.getByRole('button', { name: /^Team Meeting, Internal, 3:00 PM/ })
  await moved.scrollIntoViewIfNeeded()
  const movedBox = (await moved.boundingBox())!
  await drag(
    { x: movedBox.x + movedBox.width / 2, y: movedBox.y + 20 },
    { x: sundayX, y: movedBox.y + 20 }
  )
  await expect(sunday).toContainText('1:00')

  const standup = window.getByRole('button', { name: /^Daily Standup, / }).first()
  await standup.scrollIntoViewIfNeeded()
  const nine = (await standup.boundingBox())!.y + 3
  await drag({ x: sundayX, y: nine + hourHeight }, { x: sundayX, y: nine + hourHeight * 2.5 })
  const dialog = window.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'New entry' })).toBeVisible()
  await expect(dialog.getByRole('group', { name: 'Start' })).toContainText('10:00')
  await expect(dialog.getByRole('group', { name: 'End' })).toContainText('11:30')
  await dialog.getByRole('button', { name: 'Cancel' }).click()

  await window.getByRole('button', { name: /^Team Meeting, Internal, 3:00 PM/ }).click()
  await expect(dialog.getByRole('heading', { name: 'Edit entry' })).toBeVisible()
  expect(errors).toEqual([])
})
