import { z } from 'zod'
import { dismissHint, isHintDue, snoozeHint } from '../../core/app/donation'
import { handle } from './handle'

export function initDonation(): void {
  handle('donation:hint', z.tuple([]), () => isHintDue())
  handle('donation:snooze', z.tuple([]), () => snoozeHint())
  handle('donation:dismiss', z.tuple([]), () => dismissHint())
}
