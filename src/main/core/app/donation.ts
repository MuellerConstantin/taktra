import { notifyChanged } from '../events'
import { lazyStore } from './store'

const FIRST_HINT_AFTER_DAYS = 14
const SNOOZE_MS = 90 * 24 * 60 * 60 * 1000

type DonationState = {
  readonly usageDays: number
  readonly lastUsageDay: string | null
  readonly snoozedUntil: number | null
  readonly dismissed: boolean
}

const store = lazyStore<DonationState>('donation', {
  usageDays: { type: 'integer', minimum: 0, default: 0 },
  lastUsageDay: { type: ['string', 'null'], default: null },
  snoozedUntil: { type: ['number', 'null'], default: null },
  dismissed: { type: 'boolean', default: false }
})

function update(patch: Partial<DonationState>): void {
  store().set({ ...store().store, ...patch })
  notifyChanged('donation')
}

/** Counts each local day on which the main window was in use once. */
export function recordUsageDay(): void {
  const today = new Date().toDateString()
  if (store().get('lastUsageDay') === today) return
  update({ usageDays: store().get('usageDays') + 1, lastUsageDay: today })
}

export function isHintDue(): boolean {
  const { usageDays, snoozedUntil, dismissed } = store().store
  if (dismissed || usageDays < FIRST_HINT_AFTER_DAYS) return false
  return snoozedUntil === null || Date.now() >= snoozedUntil
}

export function snoozeHint(): void {
  update({ snoozedUntil: Date.now() + SNOOZE_MS })
}

export function dismissHint(): void {
  update({ dismissed: true })
}
