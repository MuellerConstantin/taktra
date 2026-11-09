import {
  DateFormatter,
  fromDate,
  getLocalTimeZone,
  toCalendarDateTime,
  today,
  toTime,
  type Time
} from '@internationalized/date'
import { useEffect, useState } from 'react'
import { Form, useLocale } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { TimeEntryDetails } from '@/shared/model/timeEntries'
import { useErrorMessage } from '@/renderer/hooks/useErrorMessage'
import { api } from '@/renderer/lib/api'
import { Button } from '@/renderer/components/atoms/Button'
import { Dialog, DialogHeading } from '@/renderer/components/atoms/Dialog'
import { Modal } from '@/renderer/components/atoms/Modal'
import { TimeField } from '@/renderer/components/atoms/TimeField'

const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS

interface TimerStartDialogProps {
  readonly running: TimeEntryDetails
  readonly onClose: () => void
}

/** The field shows hours and minutes only, but would keep hidden seconds in its value. */
function timeOf(date: Date): Time {
  return toTime(fromDate(date, getLocalTimeZone())).set({ second: 0, millisecond: 0 })
}

/** The start is chosen to the minute, so other times are compared to the minute as well. */
function toMinute(date: Date): number {
  return Math.floor(date.getTime() / MINUTE_MS) * MINUTE_MS
}

/**
 * The start of a running timer can only lie in the last 24 hours, so a clock time later than now
 * means yesterday.
 */
function startAt(time: Time, now: number): { readonly date: Date; readonly isYesterday: boolean } {
  const timeZone = getLocalTimeZone()
  const todayAt = toCalendarDateTime(today(timeZone), time).toDate(timeZone)
  if (todayAt.getTime() <= now) return { date: todayAt, isYesterday: false }
  const yesterday = today(timeZone).subtract({ days: 1 })
  return { date: toCalendarDateTime(yesterday, time).toDate(timeZone), isYesterday: true }
}

export function TimerStartDialog({ running, onClose }: TimerStartDialogProps): React.JSX.Element {
  const t = useTranslations('TimerStartDialog')
  const errorMessage = useErrorMessage()
  const { locale } = useLocale()
  const [now] = useState(() => Date.now())
  const [time, setTime] = useState<Time | null>(() => timeOf(running.entry.startedAt!))
  const [ends, setEnds] = useState<readonly { start: number; end: number }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)
  const timeFormatter = new DateFormatter(locale, { timeStyle: 'short' })

  useEffect(() => {
    const day = today(getLocalTimeZone())
    api.timeEntries
      .list({ from: day.subtract({ days: 1 }).toString(), to: day.toString() })
      .then((entries) =>
        setEnds(
          entries.flatMap(({ entry }) =>
            entry.startedAt && entry.endedAt
              ? [{ start: toMinute(entry.startedAt), end: toMinute(entry.endedAt) }]
              : []
          )
        )
      )
      .catch((caught) => setError(errorMessage(caught)))
  }, [errorMessage])

  const resolved = time ? startAt(time, now) : null
  const start = resolved?.date ?? null
  const timerStart = running.entry.startedAt!.getTime()
  const lastEnd = ends
    .map(({ end }) => end)
    .filter((end) => end <= timerStart && end >= now - DAY_MS)
    .reduce<number | null>((latest, end) => Math.max(latest ?? end, end), null)
  const overlaps =
    start !== null && ends.some((entry) => entry.end > start.getTime() && entry.start < now)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!start) return
    setError(null)
    setPending(true)
    try {
      await api.timer.setStart(start)
      onClose()
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
            <TimeField
              label={t('startLabel')}
              value={time}
              onChange={setTime}
              description={resolved?.isYesterday ? t('yesterday') : undefined}
              isRequired
              autoFocus
            />
            {lastEnd !== null && lastEnd !== start?.getTime() && (
              <Button
                variant="secondary"
                className="self-start"
                onPress={() => setTime(timeOf(new Date(lastEnd)))}
              >
                {t('fromLastEnd', { time: timeFormatter.format(new Date(lastEnd)) })}
              </Button>
            )}
            {overlaps && <p className="text-sm text-muted-foreground">{t('overlap')}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onPress={close}>
                {t('cancel')}
              </Button>
              <Button type="submit" isDisabled={isPending || !start}>
                {t('save')}
              </Button>
            </div>
          </Form>
        )}
      </Dialog>
    </Modal>
  )
}
