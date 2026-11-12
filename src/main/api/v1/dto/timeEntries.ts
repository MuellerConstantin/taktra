import { z } from '@hono/zod-openapi'
import type { TimeEntryDetails } from '@/shared/model/timeEntries'
import { id, localDate, note } from '@/shared/validation'
import { ActivityDetailsV1, toActivityDetails } from './activities'
import { timestamp, TimestampV1 } from './common'

export const TimeEntryV1 = ActivityDetailsV1.extend({
  id: z.number().int(),
  date: z.iso.date().openapi({ description: 'The local day the entry counts towards.' }),
  start: TimestampV1.nullable(),
  end: TimestampV1.nullable().openapi({
    description: 'null while the timer runs, and for entries recorded with a duration only.'
  }),
  timezone: z.string().nullable().openapi({ example: 'Europe/Berlin' }),
  durationSec: z.number().int().nullable(),
  note: z
    .string()
    .nullable()
    .openapi({ description: 'Markdown: lists, bold, italic, code and links.' })
}).openapi('TimeEntry')

export type TimeEntryV1 = z.infer<typeof TimeEntryV1>

export function toTimeEntry(details: TimeEntryDetails): TimeEntryV1 {
  const { entry } = details
  return {
    id: entry.id,
    date: entry.date,
    start: timestamp(entry.startedAt),
    end: timestamp(entry.endedAt),
    timezone: entry.timezone,
    durationSec: entry.durationSec,
    note: entry.note,
    ...toActivityDetails(details)
  }
}

const entryBase = {
  activityId: id,
  date: localDate.openapi({ description: 'The local day the entry counts towards.' }),
  note: z.string().nullable().optional()
}

export const TimeEntryInputV1 = z
  .union([
    z.object({ ...entryBase, durationSec: z.number().int().positive() }),
    z.object({
      ...entryBase,
      start: TimestampV1,
      end: TimestampV1,
      timezone: z.string().openapi({ example: 'Europe/Berlin' })
    })
  ])
  .openapi('TimeEntryInput', {
    description: 'An entry with a duration only, or with start, end and the timezone they were in.'
  })

export type TimeEntryInputV1 = z.infer<typeof TimeEntryInputV1>

export const NoteInputV1 = z.object({ note }).strict().openapi('NoteInput')

export const TimerStartInputV1 = z
  .object({ activityId: id, note: note.optional() })
  .strict()
  .openapi('TimerStartInput')

export const TimerChangeInputV1 = z
  .object({
    start: TimestampV1.openapi({
      description: 'Rounded to the minute; not in the future and at most a day ago.'
    })
  })
  .strict()
  .openapi('TimerChangeInput')

export const TimeEntryMoveInputV1 = z
  .object({ date: localDate.openapi({ description: 'The day to move the entry to.' }) })
  .strict()
  .openapi('TimeEntryMoveInput')
