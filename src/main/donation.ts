import { BrowserWindow } from 'electron'
import Store from 'electron-store'
import { z } from 'zod'
import { handle } from './ipc'

const FIRST_HINT_AFTER_DAYS = 14
const SNOOZE_MS = 90 * 24 * 60 * 60 * 1000

interface DonationState {
  readonly usageDays: number
  readonly lastUsageDay: string | null
  readonly snoozedUntil: number | null
  readonly dismissed: boolean
}

const store = new Store<DonationState>({
  name: 'donation',
  schema: {
    usageDays: { type: 'integer', minimum: 0, default: 0 },
    lastUsageDay: { type: ['string', 'null'], default: null },
    snoozedUntil: { type: ['number', 'null'], default: null },
    dismissed: { type: 'boolean', default: false }
  },
  clearInvalidConfig: true
})

function update(patch: Partial<DonationState>): void {
  store.set({ ...store.store, ...patch })
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send('donation:changed')
}

/** Counts each local day on which the main window was in use once. */
export function recordUsageDay(): void {
  const today = new Date().toDateString()
  if (store.get('lastUsageDay') === today) return
  update({ usageDays: store.get('usageDays') + 1, lastUsageDay: today })
}

function isHintDue(): boolean {
  const { usageDays, snoozedUntil, dismissed } = store.store
  if (dismissed || usageDays < FIRST_HINT_AFTER_DAYS) return false
  return snoozedUntil === null || Date.now() >= snoozedUntil
}

export function initDonation(): void {
  handle('donation:hint', z.tuple([]), () => isHintDue())
  handle('donation:snooze', z.tuple([]), () => update({ snoozedUntil: Date.now() + SNOOZE_MS }))
  handle('donation:dismiss', z.tuple([]), () => update({ dismissed: true }))
}
