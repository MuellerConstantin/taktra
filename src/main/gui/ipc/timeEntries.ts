import { z } from 'zod'
import { id, note, timeEntryFilter, timeEntryInput } from '../../../shared/validation'
import {
  createTimeEntry,
  deleteTimeEntry,
  listTimeEntries,
  setTimeEntryNote,
  updateTimeEntry
} from '../../core/domain/timeEntries'
import { handle } from './handle'

export function initTimeEntries(): void {
  handle('timeEntries:list', z.tuple([timeEntryFilter]), (_, filter) => listTimeEntries(filter))
  handle('timeEntries:create', z.tuple([timeEntryInput]), (_, input) => createTimeEntry(input))
  handle('timeEntries:update', z.tuple([id, timeEntryInput]), (_, entryId, input) =>
    updateTimeEntry(entryId, input)
  )
  handle('timeEntries:note', z.tuple([id, note]), (_, entryId, entryNote) =>
    setTimeEntryNote(entryId, entryNote)
  )
  handle('timeEntries:delete', z.tuple([id]), (_, entryId) => deleteTimeEntry(entryId))
}
