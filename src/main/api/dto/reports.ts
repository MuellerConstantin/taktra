import type { AggregateRow } from '../../../shared/model/reports'
import { toRef, type RefV1 } from './common'

export interface ReportRowV1 {
  readonly date: string | null
  readonly client: RefV1 | null
  readonly project: RefV1 | null
  readonly activity: RefV1 | null
  readonly tag: RefV1 | null
  readonly totalSec: number
  readonly entryCount: number
}

export function toReportRow(row: AggregateRow): ReportRowV1 {
  return {
    date: row.date,
    client: toRef(row.client),
    project: toRef(row.project),
    activity: toRef(row.activity),
    tag: toRef(row.tag),
    totalSec: row.totalSec,
    entryCount: row.entryCount
  }
}
