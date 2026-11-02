import { DateFormatter, getLocalTimeZone, type CalendarDate } from '@internationalized/date'
import { RiArrowLeftSLine, RiArrowRightSLine, RiCalendarLine } from '@remixicon/react'
import { useState } from 'react'
import { DialogTrigger, useLocale } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import { Button } from '../atoms/Button'
import { Calendar } from '../atoms/Calendar'
import { Dialog } from '../atoms/Dialog'
import { Popover } from '../atoms/Popover'
import { useShortcut } from '../../hooks/useShortcut'
import { daysOf, type CalendarRange } from '../../lib/period'
import { appShortcuts } from '../../lib/shortcuts'

interface DayNavigatorProps {
  readonly date: CalendarDate
  readonly today: CalendarDate
  readonly unit: CalendarRange
  readonly onChange: (date: CalendarDate) => void
}

export function DayNavigator({
  date,
  today,
  unit,
  onChange
}: DayNavigatorProps): React.JSX.Element {
  const t = useTranslations('DayNavigator')
  const { locale } = useLocale()
  const [isCalendarOpen, setCalendarOpen] = useState(false)

  const formatter = new DateFormatter(locale, { dateStyle: 'medium' })
  const timeZone = getLocalTimeZone()
  const isWeek = unit !== 'day'
  const step = isWeek ? { weeks: 1 } : { days: 1 }
  const days = daysOf(date, unit, locale)
  const label = isWeek
    ? formatter.formatRange(days[0].toDate(timeZone), days[days.length - 1].toDate(timeZone))
    : formatter.format(date.toDate(timeZone))

  useShortcut(appShortcuts.previousDay, () => onChange(date.subtract(step)))
  useShortcut(appShortcuts.nextDay, () => onChange(date.add(step)))
  useShortcut(appShortcuts.today, () => onChange(today))

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="icon"
        aria-label={t(isWeek ? 'previousWeek' : 'previous')}
        shortcut={appShortcuts.previousDay}
        onPress={() => onChange(date.subtract(step))}
      >
        <RiArrowLeftSLine className="size-5" />
      </Button>
      <DialogTrigger isOpen={isCalendarOpen} onOpenChange={setCalendarOpen}>
        <Button variant="secondary" aria-label={t('choose')}>
          <RiCalendarLine className="size-4" />
          {label}
        </Button>
        <Popover>
          <Dialog className="flex flex-col gap-2 p-3">
            <Calendar
              aria-label={t('choose')}
              value={date}
              onChange={(value) => {
                onChange(value)
                setCalendarOpen(false)
              }}
            />
            <Button
              variant="secondary"
              shortcut={appShortcuts.today}
              onPress={() => {
                onChange(today)
                setCalendarOpen(false)
              }}
            >
              {t('today')}
            </Button>
          </Dialog>
        </Popover>
      </DialogTrigger>
      <Button
        variant="icon"
        aria-label={t(isWeek ? 'nextWeek' : 'next')}
        shortcut={appShortcuts.nextDay}
        onPress={() => onChange(date.add(step))}
      >
        <RiArrowRightSLine className="size-5" />
      </Button>
    </div>
  )
}
