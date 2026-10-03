import { z } from 'zod'
import { emptyToNull, id, localDate } from './common'
import { MAX_NOTE_LENGTH } from './limits'

const MAX_DURATION_SEC = 24 * 3600

const timezone = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return true
  } catch {
    return false
  }
}, 'Invalid timezone')

const validDate = z.date().refine((value) => !Number.isNaN(value.getTime()), 'Invalid date')

const note = z.string().trim().max(MAX_NOTE_LENGTH).transform(emptyToNull).nullable()

const entryBase = {
  activityId: id,
  date: localDate,
  note: note.optional()
}

export const timeEntryInput = z.union([
  z.object({ ...entryBase, durationSec: z.number().int().positive().max(MAX_DURATION_SEC) }),
  z.object({ ...entryBase, startedAt: validDate, endedAt: validDate, timezone })
])

export const timeEntryRange = z.object({ from: localDate, to: localDate })
