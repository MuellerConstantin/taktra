import { z } from 'zod'
import { grouping, timeFilter } from '../../../shared/validation'
import { reports } from '../../core'
import { handle } from './handle'

export function registerReportsHandlers(): void {
  handle('reports:reports.aggregate', z.tuple([timeFilter, grouping]), (_, filter, groupBy) =>
    reports.aggregate(filter, groupBy)
  )
}
