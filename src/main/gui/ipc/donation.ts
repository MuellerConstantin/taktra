import { z } from 'zod'
import { donation } from '@/main/core'
import { handle } from './handle'

export function registerDonationHandlers(): void {
  handle('donation:hint', z.tuple([]), () => donation.isHintDue())
  handle('donation:snooze', z.tuple([]), () => donation.snoozeHint())
  handle('donation:dismiss', z.tuple([]), () => donation.dismissHint())
}
