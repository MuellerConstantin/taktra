import { expect, test } from './app'
import { HOUR_HEIGHT, drag, openWeekWithTeamMeeting, scrollToCenter, totalOf } from './calendar'

test('drags entries in the week calendar', async ({ window }) => {
  await window.setViewportSize({ width: 1200, height: 800 })
  const meeting = await openWeekWithTeamMeeting(window)

  await scrollToCenter(meeting)
  const meetingBox = (await meeting.boundingBox())!
  const meetingCenter = { x: meetingBox.x + meetingBox.width / 2, y: meetingBox.y + 20 }
  await drag(window, meetingCenter, { x: meetingCenter.x, y: meetingCenter.y + HOUR_HEIGHT })
  const later = window.getByRole('button', {
    name: 'Team Meeting, Internal, 5:00 PM – 6:00 PM, 1:00'
  })
  await expect(later).toBeVisible()
  await expect(window.getByRole('dialog')).toBeHidden()

  await scrollToCenter(later)
  const laterBox = (await later.boundingBox())!
  const laterTop = { x: laterBox.x + laterBox.width / 2, y: laterBox.y + 2 }
  await drag(window, laterTop, { x: laterTop.x, y: laterTop.y - HOUR_HEIGHT / 4 })
  const longer = window.getByRole('button', {
    name: 'Team Meeting, Internal, 4:45 PM – 6:00 PM, 1:15'
  })
  await expect(longer).toBeVisible()

  const sunday = window.getByRole('button', { name: /^Show Sunday/ })
  const sundayX = (await sunday.boundingBox())!.x + 20
  await scrollToCenter(longer)
  const longerBox = (await longer.boundingBox())!
  await drag(
    window,
    { x: longerBox.x + longerBox.width / 2, y: longerBox.y + 30 },
    { x: sundayX, y: longerBox.y + 30 }
  )
  await expect.poll(() => totalOf(sunday)).toBe(75)

  const ten = window.getByText('10 AM', { exact: true })
  await scrollToCenter(ten)
  const tenBox = (await ten.boundingBox())!
  const tenY = tenBox.y + tenBox.height / 2 + 3
  await drag(window, { x: sundayX, y: tenY }, { x: sundayX, y: tenY + HOUR_HEIGHT * 1.5 })
  const dialog = window.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'New entry' })).toBeVisible()
  await expect(dialog.getByRole('group', { name: 'Start' })).toContainText('10:00')
  await expect(dialog.getByRole('group', { name: 'End' })).toContainText('11:30')
  await dialog.getByRole('button', { name: 'Cancel' }).click()

  await longer.click()
  await expect(dialog.getByRole('heading', { name: 'Edit entry' })).toBeVisible()
})

test('scrolls and switches the week while dragging', async ({ window }) => {
  await window.setViewportSize({ width: 1000, height: 700 })
  const meeting = await openWeekWithTeamMeeting(window)
  const shownWeek = await window.getByRole('heading').first().textContent()
  const monday = window.getByRole('button', { name: /^Show Monday/ })
  const mondayTotal = await totalOf(monday)

  const calendar = window.locator('.overflow-y-auto', { has: window.locator('[data-entry-id]') })
  const calendarScroll = (): Promise<number> =>
    calendar.last().evaluate((element) => element.scrollTop)
  await calendar.last().evaluate((element) => (element.scrollTop = 0))
  const sundayX = (await window.getByRole('button', { name: /^Show Sunday/ }).boundingBox())!.x + 20
  const nineBox = (await window.getByText('9 AM', { exact: true }).boundingBox())!
  await window.mouse.move(sundayX, nineBox.y + nineBox.height / 2 + 3)
  await window.mouse.down()
  await window.mouse.move(sundayX, window.viewportSize()!.height - 5, { steps: 10 })
  await expect.poll(calendarScroll).toBeGreaterThan(50)
  await window.keyboard.press('Escape')
  await window.mouse.up()

  await scrollToCenter(meeting)
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
})

test('moves a calendar entry with the keyboard', async ({ window }) => {
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
})
