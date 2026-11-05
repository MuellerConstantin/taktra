import { RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react'
import {
  Calendar as RACCalendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader as RACCalendarGridHeader,
  CalendarHeaderCell,
  Heading,
  Text,
  useLocale,
  type CalendarProps as RACCalendarProps,
  type DateValue
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { Button } from './Button'
import { composeTailwindRenderProps, focusRing } from './utils'

const cellStyles = tv({
  extend: focusRing,
  base: 'flex aspect-square w-[calc(100cqw/7)] cursor-default items-center justify-center rounded-full text-sm forced-color-adjust-none [-webkit-tap-highlight-color:transparent]',
  variants: {
    isSelected: {
      false: 'text-foreground hover:bg-accent pressed:bg-accent/80',
      true: 'bg-primary text-primary-foreground invalid:bg-destructive forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:invalid:bg-[Mark]'
    },
    isOutsideMonth: {
      true: 'text-muted-foreground'
    },
    isDisabled: {
      true: 'text-muted-foreground forced-colors:text-[GrayText]'
    }
  }
})

export interface CalendarProps<T extends DateValue> extends Omit<
  RACCalendarProps<T>,
  'visibleDuration'
> {
  readonly errorMessage?: string
}

export function Calendar<T extends DateValue>({
  errorMessage,
  ...props
}: CalendarProps<T>): React.JSX.Element {
  return (
    <RACCalendar
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        '@container flex w-[calc(9*var(--spacing)*7)] max-w-full flex-col'
      )}
    >
      <CalendarHeader />
      <CalendarGrid className="border-spacing-0">
        <CalendarGridHeader />
        <CalendarGridBody>
          {(date) => <CalendarCell date={date} className={cellStyles} />}
        </CalendarGridBody>
      </CalendarGrid>
      {errorMessage && (
        <Text slot="errorMessage" className="text-sm text-destructive">
          {errorMessage}
        </Text>
      )}
    </RACCalendar>
  )
}

export function CalendarHeader(): React.JSX.Element {
  const { direction } = useLocale()
  const Previous = direction === 'rtl' ? RiArrowRightSLine : RiArrowLeftSLine
  const Next = direction === 'rtl' ? RiArrowLeftSLine : RiArrowRightSLine

  return (
    <header className="flex items-center gap-1 px-1 pb-4">
      <Button variant="icon" slot="previous">
        <Previous aria-hidden className="size-5" />
      </Button>
      <Heading className="mx-2 my-0 flex-1 text-center text-base font-semibold text-foreground" />
      <Button variant="icon" slot="next">
        <Next aria-hidden className="size-5" />
      </Button>
    </header>
  )
}

export function CalendarGridHeader(): React.JSX.Element {
  return (
    <RACCalendarGridHeader>
      {(day) => (
        <CalendarHeaderCell className="text-xs font-semibold text-muted-foreground">
          {day}
        </CalendarHeaderCell>
      )}
    </RACCalendarGridHeader>
  )
}
