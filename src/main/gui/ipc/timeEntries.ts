import { z } from 'zod'
import { id, localDate, note, timeEntryFilter, timeEntryInput } from '@/shared/validation'
import { timeEntries } from '@/main/core'
import { handle } from './handle'

export function registerTimeEntriesHandlers(): void {
  handle('timeEntries:list', z.tuple([timeEntryFilter]), (_, filter) => timeEntries.list(filter))
  handle('timeEntries:create', z.tuple([timeEntryInput]), (_, input) => timeEntries.create(input))
  handle('timeEntries:update', z.tuple([id, timeEntryInput]), (_, entryId, input) =>
    timeEntries.update(entryId, input)
  )
  handle('timeEntries:moveToDay', z.tuple([id, localDate]), (_, entryId, date) =>
    timeEntries.moveToDay(entryId, date)
  )
  handle('timeEntries:note', z.tuple([id, note]), (_, entryId, entryNote) =>
    timeEntries.setNote(entryId, entryNote)
  )
  handle('timeEntries:delete', z.tuple([id]), (_, entryId) => timeEntries.delete(entryId))
}
