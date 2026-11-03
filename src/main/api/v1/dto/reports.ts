import { z } from '@hono/zod-openapi'
import type { AggregateRow } from '../../../../shared/model/reports'
import { RefV1, toRef } from './common'

export const ReportRowV1 = z
  .object({
    date: z.iso.date().nullable(),
    client: RefV1.nullable(),
    project: RefV1.nullable(),
    activity: RefV1.nullable(),
    tag: RefV1.nullable(),
    totalSec: z.number().int(),
    entryCount: z.number().int()
  })
  .openapi('ReportRow', {
    description:
      'One group of the report; only the grouped dimensions are set. Rows per tag may overlap, because an activity can carry several tags.'
  })

export type ReportRowV1 = z.infer<typeof ReportRowV1>

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
