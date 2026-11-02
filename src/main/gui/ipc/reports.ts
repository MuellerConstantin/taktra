import { z } from 'zod'
import { grouping, timeFilter } from '../../../shared/validation'
import { aggregate } from '../../core/domain/reports'
import { handle } from './handle'

export function initReports(): void {
  handle('reports:aggregate', z.tuple([timeFilter, grouping]), (_, filter, groupBy) =>
    aggregate(filter, groupBy)
  )
}
