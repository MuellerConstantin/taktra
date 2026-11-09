import { spawn } from 'node:child_process'
import type { Locator, Page } from '@playwright/test'
import electron from 'electron'
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
  await expect(window.getByText(/^Week \d+ · /)).toBeVisible()
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

const hourHeight = 64

/** The duration a day header of the week calendar shows, in minutes. */
async function totalOf(dayButton: Locator): Promise<number> {
  const [hours, minutes] = (await dayButton.locator('span').last().textContent())!
    .split(':')
    .map(Number)
  return hours * 60 + minutes
}

async function drag(
  window: Page,
  from: { x: number; y: number },
  to: { x: number; y: number }
): Promise<void> {
  await window.mouse.move(from.x, from.y)
  await window.mouse.down()
  await window.mouse.move(from.x, from.y + 5)
  await window.mouse.move(to.x, to.y, { steps: 5 })
  await window.mouse.up()
}

/**
 * Opens a past week of the sample profile in the calendar whose Monday has the team meeting from
 * 4 to 5 PM. The sample data are laid out relative to today and skip a few workdays at random, so
 * the calendar tests rely on this meeting and on empty weekends only.
 */
async function openWeekWithTeamMeeting(window: Page): Promise<Locator> {
  await window.getByRole('button', { name: 'Try sample profile' }).click()
  await expect(window.getByRole('button', { name: 'Try sample profile' })).toBeHidden()
  await window.evaluate(() => {
    location.hash = '#/tracking?range=week'
  })
  const meeting = window.getByRole('button', { name: /^Team Meeting, Internal, 4:00 PM/ })
  for (let weeks = 1; weeks <= 4; weeks++) {
    const heading = await window.getByRole('heading').first().textContent()
    await window.getByRole('button', { name: 'Previous week' }).click()
    await expect(window.getByRole('heading').first()).not.toHaveText(heading!)
    await expect(window.locator('[data-entry-id]').first()).toBeVisible()
    if ((await meeting.count()) > 0) return meeting
  }
  throw new Error('No week with a team meeting in the sample profile')
}

test('drags entries in the week calendar', async ({ window, errors }) => {
  await window.setViewportSize({ width: 1200, height: 800 })
  const meeting = await openWeekWithTeamMeeting(window)

  await meeting.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  const meetingBox = (await meeting.boundingBox())!
  const meetingCenter = { x: meetingBox.x + meetingBox.width / 2, y: meetingBox.y + 20 }
  await drag(window, meetingCenter, { x: meetingCenter.x, y: meetingCenter.y + hourHeight })
  const later = window.getByRole('button', {
    name: 'Team Meeting, Internal, 5:00 PM – 6:00 PM, 1:00'
  })
  await expect(later).toBeVisible()
  await expect(window.getByRole('dialog')).toBeHidden()

  await later.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  const laterBox = (await later.boundingBox())!
  const laterTop = { x: laterBox.x + laterBox.width / 2, y: laterBox.y + 2 }
  await drag(window, laterTop, { x: laterTop.x, y: laterTop.y - hourHeight / 4 })
  const longer = window.getByRole('button', {
    name: 'Team Meeting, Internal, 4:45 PM – 6:00 PM, 1:15'
  })
  await expect(longer).toBeVisible()

  const sunday = window.getByRole('button', { name: /^Show Sunday/ })
  const sundayX = (await sunday.boundingBox())!.x + 20
  await longer.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  const longerBox = (await longer.boundingBox())!
  await drag(
    window,
    { x: longerBox.x + longerBox.width / 2, y: longerBox.y + 30 },
    { x: sundayX, y: longerBox.y + 30 }
  )
  await expect.poll(() => totalOf(sunday)).toBe(75)

  const ten = window.getByText('10 AM', { exact: true })
  await ten.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  const tenBox = (await ten.boundingBox())!
  const tenY = tenBox.y + tenBox.height / 2 + 3
  await drag(window, { x: sundayX, y: tenY }, { x: sundayX, y: tenY + hourHeight * 1.5 })
  const dialog = window.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'New entry' })).toBeVisible()
  await expect(dialog.getByRole('group', { name: 'Start' })).toContainText('10:00')
  await expect(dialog.getByRole('group', { name: 'End' })).toContainText('11:30')
  await dialog.getByRole('button', { name: 'Cancel' }).click()

  await longer.click()
  await expect(dialog.getByRole('heading', { name: 'Edit entry' })).toBeVisible()
  expect(errors).toEqual([])
})

test('moves an entry to another day', async ({ window, errors }) => {
  await window.getByRole('button', { name: 'Try sample profile' }).click()
  await expect(window.getByRole('button', { name: 'Try sample profile' })).toBeHidden()
  await window.evaluate(() => {
    location.hash = '#/tracking?range=workWeek'
  })
  await window.getByRole('button', { name: 'Previous week' }).click()
  await window.getByRole('button', { name: /^Show Monday/ }).click()
  await expect(window.getByRole('heading', { name: 'Monday' })).toBeVisible()
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
  expect(errors).toEqual([])
})

test('scrolls and switches the week while dragging', async ({ window, errors }) => {
  await window.setViewportSize({ width: 1000, height: 700 })
  const meeting = await openWeekWithTeamMeeting(window)
  const shownWeek = await window.getByRole('heading').first().textContent()
  const monday = window.getByRole('button', { name: /^Show Monday/ })
  const mondayTotal = await totalOf(monday)

  const calendarScroll = (): Promise<number> =>
    window.evaluate(
      () => document.querySelector('[data-entry-id]')!.closest('.overflow-y-auto')!.scrollTop
    )
  await window.evaluate(() => {
    document.querySelector('[data-entry-id]')!.closest('.overflow-y-auto')!.scrollTop = 0
  })
  const sundayX = (await window.getByRole('button', { name: /^Show Sunday/ }).boundingBox())!.x + 20
  const nineBox = (await window.getByText('9 AM', { exact: true }).boundingBox())!
  await window.mouse.move(sundayX, nineBox.y + nineBox.height / 2 + 3)
  await window.mouse.down()
  await window.mouse.move(sundayX, window.viewportSize()!.height - 5, { steps: 10 })
  await expect.poll(calendarScroll).toBeGreaterThan(50)
  await window.keyboard.press('Escape')
  await window.mouse.up()

  await meeting.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  const meetingBox = (await meeting.boundingBox())!
  await window.mouse.move(meetingBox.x + 20, meetingBox.y + 10)
  await window.mouse.down()
  await window.mouse.move(meetingBox.x + 10, meetingBox.y + 10, { steps: 3 })
  const targetWeek = (await window.locator('[data-week-edge="previous"]').textContent())!
  const left = (await window.getByRole('main').boundingBox())!.x + 10
  await window.mouse.move(left, meetingBox.y + 10, { steps: 5 })
  await expect(window.getByRole('heading').first()).not.toHaveText(shownWeek!)
  await expect(window.locator('span.fixed').getByText(targetWeek, { exact: true })).toBeVisible()
  const sunday = window.getByRole('button', { name: /^Show Sunday/ })
  const sundayBox = (await sunday.boundingBox())!
  await window.mouse.move(sundayBox.x + 20, meetingBox.y + 10, { steps: 5 })
  await window.mouse.up()
  await expect.poll(() => totalOf(sunday)).toBe(60)

  await window.getByRole('button', { name: 'Next week' }).click()
  await expect(window.getByRole('heading').first()).toHaveText(shownWeek!)
  await expect.poll(() => totalOf(monday)).toBe(mondayTotal - 60)
  expect(errors).toEqual([])
})

test('moves a calendar entry with the keyboard', async ({ window, errors }) => {
  const meeting = await openWeekWithTeamMeeting(window)
  const shownWeek = await window.getByRole('heading').first().textContent()
  const tuesday = window.getByRole('button', { name: /^Show Tuesday/ })
  const tuesdayTotal = await totalOf(tuesday)

  await meeting.focus()
  await window.keyboard.press('ArrowUp')
  await window.keyboard.press('Shift+ArrowDown')
  await window.keyboard.press('ArrowRight')
  const moved = window.getByRole('button', {
    name: 'Team Meeting, Internal, 3:45 PM – 5:00 PM, 1:15'
  })
  await expect(moved).toBeFocused()
  await expect.poll(() => totalOf(tuesday)).toBe(tuesdayTotal + 75)
  await expect(window.getByRole('heading').first()).toHaveText(shownWeek!)

  await tuesday.click()
  await expect(window.getByRole('row', { name: /Team Meeting/ })).toContainText('3:45 PM')
  expect(errors).toEqual([])
})

test('starts and stops a timer from a second start of the app', async ({
  window,
  userData,
  errors
}) => {
  await window.getByRole('button', { name: 'Try sample profile' }).click()
  await expect(window.getByRole('button', { name: 'Try sample profile' })).toBeHidden()
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

  // A jump list entry starts the app again with an argument; the second start hands it over to
  // the running one and quits.
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
  expect(errors).toEqual([])
})
