import { DateFormatter, getLocalTimeZone, type CalendarDate } from '@internationalized/date'
import { RiArrowLeftSLine, RiArrowRightSLine, RiCalendarLine } from '@remixicon/react'
import { useState } from 'react'
import { DialogTrigger, useLocale } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import { Button } from '../atoms/Button'
import { Calendar } from '../atoms/Calendar'
import { Dialog } from '../atoms/Dialog'
import { Popover } from '../atoms/Popover'

interface DayNavigatorProps {
  readonly date: CalendarDate
  readonly today: CalendarDate
  readonly onChange: (date: CalendarDate) => void
}

export function DayNavigator({ date, today, onChange }: DayNavigatorProps): React.JSX.Element {
  const t = useTranslations('DayNavigator')
  const { locale } = useLocale()
  const [isCalendarOpen, setCalendarOpen] = useState(false)

  const formatter = new DateFormatter(locale, { dateStyle: 'medium' })

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="icon"
        aria-label={t('previous')}
        onPress={() => onChange(date.subtract({ days: 1 }))}
      >
        <RiArrowLeftSLine className="size-5" />
      </Button>
      <DialogTrigger isOpen={isCalendarOpen} onOpenChange={setCalendarOpen}>
        <Button variant="secondary" aria-label={t('choose')}>
          <RiCalendarLine className="size-4" />
          {formatter.format(date.toDate(getLocalTimeZone()))}
        </Button>
        <Popover>
          <Dialog className="p-3">
            <Calendar
              aria-label={t('choose')}
              value={date}
              onChange={(value) => {
                onChange(value)
                setCalendarOpen(false)
              }}
            />
          </Dialog>
        </Popover>
      </DialogTrigger>
      <Button variant="icon" aria-label={t('next')} onPress={() => onChange(date.add({ days: 1 }))}>
        <RiArrowRightSLine className="size-5" />
      </Button>
      {date.compare(today) !== 0 && (
        <Button variant="secondary" onPress={() => onChange(today)}>
          {t('today')}
        </Button>
      )}
    </div>
  )
}
