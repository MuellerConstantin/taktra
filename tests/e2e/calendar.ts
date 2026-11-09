import type { Locator, Page } from '@playwright/test'
import { expect, goTo, openSampleProfile } from './app'

export const HOUR_HEIGHT = 64

/** The duration a day header of the week calendar shows, in minutes. */
export async function totalOf(dayButton: Locator): Promise<number> {
  const [hours, minutes] = (await dayButton.locator('span').last().textContent())!
    .split(':')
    .map(Number)
  return hours * 60 + minutes
}

export async function drag(
  window: Page,
  from: { readonly x: number; readonly y: number },
  to: { readonly x: number; readonly y: number }
): Promise<void> {
  await window.mouse.move(from.x, from.y)
  await window.mouse.down()
  await window.mouse.move(from.x, from.y + 5)
  await window.mouse.move(to.x, to.y, { steps: 5 })
  await window.mouse.up()
}

export async function scrollToCenter(locator: Locator): Promise<void> {
  await locator.evaluate((element) => element.scrollIntoView({ block: 'center' }))
}

/**
 * Opens the sample profile and, in the week calendar, a past week whose Monday has the team
 * meeting from 4 to 5 PM. The sample data are laid out relative to today and skip a few workdays
 * at random, so tests rely on this meeting and on empty weekends only, never on other entries or
 * on day totals.
 */
export async function openWeekWithTeamMeeting(window: Page): Promise<Locator> {
  await openSampleProfile(window)
  await goTo(window, '#/tracking?range=week')
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

/** The day view of the Monday that `openWeekWithTeamMeeting()` finds. */
export async function openMondayWithTeamMeeting(window: Page): Promise<void> {
  await openWeekWithTeamMeeting(window)
  await window.getByRole('button', { name: /^Show Monday/ }).click()
  await expect(window.getByRole('heading', { name: 'Monday' })).toBeVisible()
}
