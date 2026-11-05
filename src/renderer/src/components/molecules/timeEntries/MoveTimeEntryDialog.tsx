import {
  DateFormatter,
  fromDate,
  getLocalTimeZone,
  parseDate,
  toCalendarDateTime,
  type CalendarDate
} from '@internationalized/date'
import { useState } from 'react'
import { Form, useLocale } from 'react-aria-components'
import { useNavigate } from 'react-router'
import { useTranslations } from 'use-intl'
import type {
  TimeEntry,
  TimeEntryDetails,
  TimeEntryInput
} from '../../../../../shared/model/timeEntries'
import { useErrorMessage } from '../../../hooks/useErrorMessage'
import { api } from '../../../lib/api'
import { toastQueue } from '../../../lib/toasts'
import { Button } from '../../atoms/Button'
import { Calendar } from '../../atoms/Calendar'
import { Dialog, DialogHeading } from '../../atoms/Dialog'
import { Modal } from '../../atoms/Modal'

const TOAST_TIMEOUT = 8000

/** The entry on another day, at the clock times of the timezone it was recorded in. */
function movedEntry(entry: TimeEntry, date: CalendarDate): TimeEntryInput {
  const base = { activityId: entry.activityId, date: date.toString(), note: entry.note }
  if (!entry.startedAt || !entry.endedAt) return { ...base, durationSec: entry.durationSec ?? 0 }

  const timezone = entry.timezone ?? getLocalTimeZone()
  const days = date.compare(parseDate(entry.date))
  const shift = (time: Date): Date =>
    toCalendarDateTime(fromDate(time, timezone)).add({ days }).toDate(timezone)
  return { ...base, startedAt: shift(entry.startedAt), endedAt: shift(entry.endedAt), timezone }
}

interface MoveTimeEntryDialogProps {
  readonly details: TimeEntryDetails
  readonly onClose: () => void
  readonly onMoved: () => void
}

export function MoveTimeEntryDialog({
  details,
  onClose,
  onMoved
}: MoveTimeEntryDialogProps): React.JSX.Element {
  const t = useTranslations('MoveTimeEntryDialog')
  const errorMessage = useErrorMessage()
  const navigate = useNavigate()
  const { locale } = useLocale()
  const { entry, activity, project } = details
  const currentDate = parseDate(entry.date)
  const [date, setDate] = useState<CalendarDate>(currentDate)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)

  const timeFormatter = new DateFormatter(locale, { timeStyle: 'short' })
  const dayFormatter = new DateFormatter(locale, { dateStyle: 'full' })
  const times =
    entry.startedAt && entry.endedAt
      ? timeFormatter.formatRange(entry.startedAt, entry.endedAt)
      : null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await api.timeEntries.update(entry.id, movedEntry(entry, date))
      onMoved()
      onClose()
      toastQueue.add(
        {
          text: t('moved', { date: dayFormatter.format(date.toDate(getLocalTimeZone())) }),
          actions: [{ label: t('show'), onAction: () => navigate(`/tracking?date=${date}`) }]
        },
        { timeout: TOAST_TIMEOUT }
      )
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal isOpen onOpenChange={(isOpen) => !isOpen && onClose()} isDismissable>
      <Dialog>
        {({ close }) => (
          <Form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <DialogHeading>{t('title')}</DialogHeading>
            <p className="text-sm text-muted-foreground">
              {[activity.name, project.name, times].filter(Boolean).join(' · ')}
            </p>
            <Calendar
              aria-label={t('dateLabel')}
              value={date}
              onChange={setDate}
              autoFocus
              className="self-center"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onPress={close}>
                {t('cancel')}
              </Button>
              <Button type="submit" isDisabled={isPending || date.compare(currentDate) === 0}>
                {t('move')}
              </Button>
            </div>
          </Form>
        )}
      </Dialog>
    </Modal>
  )
}
