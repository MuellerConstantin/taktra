import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
  type CalendarDate
} from '@internationalized/date'
import type { TimeFilter } from '../../../shared/reports'

export const periodPresets = [
  'all',
  'thisWeek',
  'lastWeek',
  'thisMonth',
  'lastMonth',
  'thisYear'
] as const

export type PeriodPreset = (typeof periodPresets)[number]

export interface DateRange {
  readonly start: CalendarDate
  readonly end: CalendarDate
}

export interface Period {
  readonly preset: PeriodPreset | 'custom'
  readonly range: DateRange | null
}

export const allTime: Period = { preset: 'all', range: null }

export function presetRange(
  preset: PeriodPreset,
  today: CalendarDate,
  locale: string
): DateRange | null {
  switch (preset) {
    case 'all':
      return null
    case 'thisWeek':
      return { start: startOfWeek(today, locale), end: endOfWeek(today, locale) }
    case 'lastWeek': {
      const day = today.subtract({ weeks: 1 })
      return { start: startOfWeek(day, locale), end: endOfWeek(day, locale) }
    }
    case 'thisMonth':
      return { start: startOfMonth(today), end: endOfMonth(today) }
    case 'lastMonth': {
      const day = today.subtract({ months: 1 })
      return { start: startOfMonth(day), end: endOfMonth(day) }
    }
    case 'thisYear':
      return { start: startOfYear(today), end: endOfYear(today) }
  }
}

export function periodFilter({ range }: Period): Pick<TimeFilter, 'from' | 'to'> {
  return range ? { from: range.start.toString(), to: range.end.toString() } : {}
}
