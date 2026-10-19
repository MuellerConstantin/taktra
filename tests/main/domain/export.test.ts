import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import type { BuiltinExportColumn, ExportColumn, ExportLayout } from '../../../src/shared/export'
import type { TimeFilter } from '../../../src/shared/reports'
import { activateDatabase, closeActiveDatabase } from '../../../src/main/db/database'
import { createActivity, setActivityTags } from '../../../src/main/domain/activities'
import { createClient } from '../../../src/main/domain/clients'
import {
  createCustomField,
  createCustomFieldOption,
  setFieldValues
} from '../../../src/main/domain/customFields'
import { previewExport, toCsv, toJson } from '../../../src/main/domain/export'
import { createProject } from '../../../src/main/domain/projects'
import { createTag } from '../../../src/main/domain/tags'
import { createTimeEntry } from '../../../src/main/domain/timeEntries'
import { startTimer } from '../../../src/main/domain/timer'
import { createTestProfile } from '../../profiles'

const MARCH: TimeFilter = { from: '2026-03-01', to: '2026-03-04' }

let ids: ReturnType<typeof seed>

/**
 * Build (Alpha, client Contoso, tagged): 20 min each on 2 March by duration, 09:00–09:20 on
 * 4 March by clock. Run (Beta, no client): 10 min on 2 March.
 */
function seed(): { readonly alpha: number; readonly build: number; readonly run: number } {
  const contoso = createClient({ name: 'Contoso' })
  const alpha = createProject({ name: 'Alpha', clientId: contoso.id })
  const beta = createProject({ name: 'Beta' })
  const build = createActivity({ projectId: alpha.id, name: 'Build' })
  const run = createActivity({ projectId: beta.id, name: 'Run' })
  setActivityTags(build.id, [createTag({ name: 'support' }).id, createTag({ name: 'meeting' }).id])

  createTimeEntry({ activityId: build.id, date: '2026-03-02', durationSec: 1200 })
  createTimeEntry({ activityId: build.id, date: '2026-03-02', durationSec: 1200 })
  createTimeEntry({ activityId: run.id, date: '2026-03-02', durationSec: 600 })
  createTimeEntry({
    activityId: build.id,
    date: '2026-03-04',
    startedAt: new Date('2026-03-04T08:00:00Z'),
    endedAt: new Date('2026-03-04T08:20:00Z'),
    timezone: 'Europe/Berlin',
    note: 'Fixed "the" bug, finally'
  })
  return { alpha: alpha.id, build: build.id, run: run.id }
}

function builtins(...names: BuiltinExportColumn[]): ExportColumn[] {
  return names.map((builtin) => ({ builtin }))
}

function rowsOf(
  columns: readonly ExportColumn[],
  layout: ExportLayout,
  filter: TimeFilter = MARCH
): unknown[] {
  return [...previewExport(filter, columns, layout).rows].sort((a, b) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b))
  )
}

beforeEach(() => {
  activateDatabase(createTestProfile())
  ids = seed()
})

afterAll(() => closeActiveDatabase())

describe('entries layout', () => {
  it('writes one row per entry with local clock times and inherited client and tags', () => {
    const preview = previewExport(MARCH)

    expect(preview.headers).toEqual([
      'date',
      'project',
      'activity',
      'tags',
      'start',
      'end',
      'duration_min',
      'note',
      'client'
    ])
    expect(preview.count).toBe(4)
    expect(preview.totalMin).toBe(70)
    expect(preview.rows).toContainEqual([
      '2026-03-04',
      'Alpha',
      'Build',
      ['meeting', 'support'],
      '09:00',
      '09:20',
      20,
      'Fixed "the" bug, finally',
      'Contoso'
    ])
    expect(preview.rows).toContainEqual([
      '2026-03-02',
      'Beta',
      'Run',
      [],
      null,
      null,
      10,
      null,
      null
    ])
  })

  it('leaves out a running timer', () => {
    startTimer(ids.run)

    expect(previewExport({}).count).toBe(4)
  })

  it('rounds the duration in hours per entry', () => {
    expect(rowsOf(builtins('activity', 'duration_h'), 'entries')).toEqual([
      ['Build', 0.33],
      ['Build', 0.33],
      ['Build', 0.33],
      ['Run', 0.17]
    ])
  })

  it('exports custom fields of the owner under their name key or own header', () => {
    const field = createCustomField({ scope: 'project', type: 'select', name: 'Cost Center' })
    const sales = createCustomFieldOption(field.id, 'Sales')
    setFieldValues('project', ids.alpha, [
      { fieldId: field.id, textValue: null, optionId: sales.id }
    ])

    const preview = previewExport(MARCH, [{ builtin: 'activity' }, { fieldId: field.id }])
    expect(preview.headers).toEqual(['activity', 'cost center'])
    expect(preview.rows).toContainEqual(['Build', 'Sales'])
    expect(preview.rows).toContainEqual(['Run', null])

    const renamed = previewExport(MARCH, [{ fieldId: field.id, header: 'KST' }])
    expect(renamed.headers).toEqual(['KST'])
  })
})

describe('summed layout', () => {
  it('adds up whole minutes before converting them to hours', () => {
    expect(rowsOf(builtins('activity', 'duration_h', 'duration_min'), 'summed')).toEqual([
      ['Build', 1, 60],
      ['Run', 0.17, 10]
    ])
  })

  it('writes one row per combination of the other columns', () => {
    expect(rowsOf(builtins('date', 'client', 'duration_min'), 'summed')).toEqual([
      ['2026-03-02', 'Contoso', 40],
      ['2026-03-02', null, 10],
      ['2026-03-04', 'Contoso', 20]
    ])
  })

  it.each(['start', 'end', 'note'] as const)('rejects the entry column %s', (builtin) => {
    expect(() => previewExport(MARCH, builtins(builtin, 'duration_min'), 'summed')).toThrow(
      expect.objectContaining({ code: 'EXPORT_COLUMN_NOT_SUMMABLE' })
    )
  })

  it('rejects columns without a duration', () => {
    expect(() => previewExport(MARCH, builtins('activity'), 'summed')).toThrow(
      expect.objectContaining({ code: 'EXPORT_DURATION_MISSING' })
    )
  })
})

describe('pivot layout', () => {
  it('writes one column per day of the filter where the duration column stands', () => {
    const preview = previewExport(MARCH, builtins('activity', 'duration_min', 'client'), 'pivot')

    expect(preview.headers).toEqual([
      'activity',
      '2026-03-01',
      '2026-03-02',
      '2026-03-03',
      '2026-03-04',
      'client'
    ])
    expect(preview.isDate).toEqual([false, false, false, false, false, false])
    expect(preview.rows).toContainEqual(['Build', null, 40, null, 20, 'Contoso'])
    expect(preview.rows).toContainEqual(['Run', null, 10, null, null, null])
  })

  it('spans the days of the entries when the filter leaves the range open', () => {
    const preview = previewExport({}, builtins('activity', 'duration_h'), 'pivot')

    expect(preview.headers).toEqual(['activity', '2026-03-02', '2026-03-03', '2026-03-04'])
    expect(preview.rows).toContainEqual(['Build', 0.67, null, 0.33])
  })

  it('rejects the date column', () => {
    expect(() => previewExport(MARCH, builtins('date', 'duration_min'), 'pivot')).toThrow(
      expect.objectContaining({ code: 'EXPORT_DATE_IN_PIVOT' })
    )
  })

  it('rejects a second duration column', () => {
    expect(() => previewExport(MARCH, builtins('duration_min', 'duration_h'), 'pivot')).toThrow(
      expect.objectContaining({ code: 'EXPORT_DURATION_TWICE' })
    )
  })

  it('rejects a header that equals a day', () => {
    const columns = [{ builtin: 'activity', header: '2026-03-02' }, ...builtins('duration_min')]
    expect(() => previewExport(MARCH, columns as ExportColumn[], 'pivot')).toThrow(
      expect.objectContaining({ code: 'EXPORT_COLUMN_CONFLICT' })
    )
  })
})

describe('headers', () => {
  it('rejects names that differ only in case and whitespace', () => {
    const columns: ExportColumn[] = [
      { builtin: 'project', header: 'Work  Item' },
      { builtin: 'activity', header: ' work item' }
    ]
    expect(() => previewExport(MARCH, columns)).toThrow(
      expect.objectContaining({ code: 'EXPORT_COLUMN_CONFLICT' })
    )
  })

  it('rejects a custom header that equals a standard one', () => {
    const columns: ExportColumn[] = [
      { builtin: 'project', header: 'Activity' },
      { builtin: 'activity' }
    ]
    expect(() => previewExport(MARCH, columns)).toThrow(
      expect.objectContaining({ code: 'EXPORT_COLUMN_CONFLICT' })
    )
  })
})

describe('file formats', () => {
  const table = {
    headers: ['text', 'tags', 'number'],
    isDate: [false, false, false],
    rows: [
      ['a, b', ['meeting', 'support'], 1.5],
      ['say "hi"', [], null],
      ['line\nbreak', ['ops'], 0]
    ]
  }

  it('writes CSV after RFC 4180 with CRLF and without a BOM', () => {
    expect(toCsv(table)).toBe(
      'text,tags,number\r\n' +
        '"a, b","meeting, support",1.5\r\n' +
        '"say ""hi""",,\r\n' +
        '"line\nbreak",ops,0\r\n'
    )
  })

  it('writes JSON objects with the headers as keys in their order', () => {
    const json = toJson(table)

    expect(json.startsWith('[')).toBe(true)
    expect(JSON.parse(json)).toEqual([
      { text: 'a, b', tags: ['meeting', 'support'], number: 1.5 },
      { text: 'say "hi"', tags: [], number: null },
      { text: 'line\nbreak', tags: ['ops'], number: 0 }
    ])
    expect(Object.keys(JSON.parse(json)[0])).toEqual(['text', 'tags', 'number'])
  })
})
