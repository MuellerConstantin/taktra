import {
  CalendarDate,
  endOfMonth,
  endOfWeek,
  endOfYear,
  getDayOfWeek,
  isWeekend,
  startOfMonth,
  startOfWeek,
  startOfYear
} from '@internationalized/date'
import type { TimeFilter } from '@/shared/model/reports'

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

export type CalendarRange = 'day' | 'workWeek' | 'week'

export function daysOf(date: CalendarDate, range: CalendarRange, locale: string): CalendarDate[] {
  if (range === 'day') return [date]
  const start = startOfWeek(date, locale)
  const days = Array.from({ length: 7 }, (_, index) => start.add({ days: index }))
  return range === 'workWeek' ? days.filter((day) => !isWeekend(day, locale)) : days
}

/**
 * The ISO 8601 week number of a shown week. ISO weeks start on Monday and belong to the year of
 * their Thursday, so the Thursday of the shown days decides, whatever day the locale starts on.
 */
export function weekNumberOf(days: readonly CalendarDate[]): number {
  const mondayFirst = 'de-DE'
  const thursday = days.find((day) => getDayOfWeek(day, mondayFirst) === 3) ?? days[0]
  return Math.floor(thursday.compare(new CalendarDate(thursday.year, 1, 1)) / 7) + 1
}

export function periodFilter({ range }: Period): Pick<TimeFilter, 'from' | 'to'> {
  return range ? { from: range.start.toString(), to: range.end.toString() } : {}
}
