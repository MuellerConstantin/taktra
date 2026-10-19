import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { ExportFormat, ExportTable } from '../../../src/shared/export'
import type { Grouping, TimeFilter } from '../../../src/shared/reports'
import { getActivityDetails, listActivities } from '../../../src/main/domain/activities'
import { listClients } from '../../../src/main/domain/clients'
import { previewExport, toCsv, toJson, toXlsx } from '../../../src/main/domain/export'
import { listExportTemplates } from '../../../src/main/domain/exportTemplates'
import { listProjects } from '../../../src/main/domain/projects'
import { aggregate } from '../../../src/main/domain/reports'
import { listTags } from '../../../src/main/domain/tags'
import { listTimeEntries } from '../../../src/main/domain/timeEntries'
import {
  getRunningTimer,
  listRecentActivities,
  startTimer,
  stopTimer
} from '../../../src/main/domain/timer'
import { createTestProfile } from '../../profiles'
import {
  activateDatabase,
  closeActiveDatabase,
  getActiveDatabase
} from '../../../src/main/db/database'
import { seedSampleData } from '../../../src/main/db/sample'

const writers: Record<ExportFormat, (table: ExportTable) => string | Promise<Buffer>> = {
  csv: toCsv,
  json: toJson,
  xlsx: toXlsx
}

function daysAgo(days: number): string {
  const day = new Date()
  day.setDate(day.getDate() - days)
  return day.toISOString().slice(0, 10)
}

const filters: readonly TimeFilter[] = [{}, { from: daysAgo(90), to: daysAgo(30) }]

/** Every entry falls into exactly one group of these, unlike with tags. */
const additiveGroupings: readonly (readonly Grouping[])[] = [
  ['date'],
  ['client'],
  ['project'],
  ['activity'],
  ['client', 'project']
]

function totalSec(filter: TimeFilter, groupBy: readonly Grouping[]): number {
  return aggregate(filter, groupBy).reduce((sum, row) => sum + row.totalSec, 0)
}

describe('sample profile', () => {
  beforeAll(() => activateDatabase(createTestProfile(seedSampleData)))
  afterAll(() => closeActiveDatabase())

  it('is a consistent database', () => {
    const client = getActiveDatabase().$client
    expect(client.pragma('integrity_check', { simple: true })).toBe('ok')
    expect(client.pragma('foreign_key_check')).toEqual([])
  })

  it('lists its master data', () => {
    expect(listProjects({ includeArchived: true }).length).toBeGreaterThan(0)
    expect(listClients({ includeArchived: true }).length).toBeGreaterThan(0)
    expect(listTags().length).toBeGreaterThan(0)
    expect(listExportTemplates().length).toBeGreaterThan(0)
    expect(listRecentActivities(10).length).toBeGreaterThan(0)

    const activities = listActivities({ includeArchived: true })
    expect(activities.length).toBeGreaterThan(0)
    for (const activity of activities) getActivityDetails(activity.id)
  })

  it.each(filters)('reports sums that add up for %o', (filter) => {
    const total = totalSec(filter, [])
    expect(total).toBeGreaterThan(0)

    for (const groupBy of additiveGroupings) expect(totalSec(filter, groupBy)).toBe(total)
    expect(totalSec(filter, ['tag'])).toBeGreaterThanOrEqual(total)
  })

  it.each(filters)('previews and writes every export template for %o', async (filter) => {
    const total = totalSec(filter, [])
    const standard = previewExport(filter)
    expect(standard.count).toBeGreaterThan(0)
    expect(standard.totalMin * 60).toBe(total)

    for (const template of listExportTemplates()) {
      const preview = previewExport(filter, template.columns, template.layout)
      expect(preview.totalMin).toBe(standard.totalMin)
      expect(preview.rows.length).toBeGreaterThan(0)
      for (const row of preview.rows) expect(row).toHaveLength(preview.headers.length)

      const content = await writers[template.format](preview)
      expect(content.length).toBeGreaterThan(0)
    }
  })

  it('books a started and stopped timer as whole minutes', () => {
    const [{ activity }] = listRecentActivities(1)

    const timer = startTimer(activity.id, 'smoke test')
    expect(getRunningTimer()?.entry.id).toBe(timer.entry.id)

    stopTimer()
    expect(getRunningTimer()).toBeNull()

    const stopped = listTimeEntries({ from: timer.entry.date, to: timer.entry.date }).find(
      ({ entry }) => entry.id === timer.entry.id
    )
    expect(stopped?.entry.durationSec).toBe(60)
    expect(stopped?.entry.note).toBe('smoke test')
  })
})
