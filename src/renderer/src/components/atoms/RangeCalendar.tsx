import {
  RangeCalendar as RACRangeCalendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  Text,
  type DateValue,
  type RangeCalendarProps as RACRangeCalendarProps
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { CalendarGridHeader, CalendarHeader } from './Calendar'
import { composeTailwindRenderProps, focusRing } from './utils'

const cellStyles = tv({
  extend: focusRing,
  base: 'flex size-full items-center justify-center rounded-full text-foreground forced-color-adjust-none',
  variants: {
    selectionState: {
      none: 'group-hover:bg-accent group-pressed:bg-accent/80',
      middle: [
        'group-hover:bg-primary/20 forced-colors:group-hover:bg-[Highlight]',
        'group-invalid:group-hover:bg-destructive/20 forced-colors:group-invalid:group-hover:bg-[Mark]',
        'group-pressed:bg-primary/30 forced-colors:text-[HighlightText] forced-colors:group-pressed:bg-[Highlight]',
        'group-invalid:group-pressed:bg-destructive/30 forced-colors:group-invalid:group-pressed:bg-[Mark]'
      ],
      cap: 'bg-primary text-primary-foreground group-invalid:bg-destructive forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:group-invalid:bg-[Mark]'
    },
    isDisabled: {
      true: 'text-muted-foreground forced-colors:text-[GrayText]'
    }
  }
})

export interface RangeCalendarProps<T extends DateValue> extends Omit<
  RACRangeCalendarProps<T>,
  'visibleDuration'
> {
  readonly errorMessage?: string
}

export function RangeCalendar<T extends DateValue>({
  errorMessage,
  ...props
}: RangeCalendarProps<T>): React.JSX.Element {
  return (
    <RACRangeCalendar
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        '@container flex w-[calc(9*var(--spacing)*7)] max-w-full flex-col'
      )}
    >
      <CalendarHeader />
      <CalendarGrid className="border-spacing-0 [&_td]:px-0 [&_td]:py-px">
        <CalendarGridHeader />
        <CalendarGridBody>
          {(date) => (
            <CalendarCell
              date={date}
              className="group aspect-square w-[calc(100cqw/7)] cursor-default text-sm outline outline-0 [-webkit-tap-highlight-color:transparent] outside-month:text-muted-foreground selected:bg-primary/10 invalid:selected:bg-destructive/10 forced-colors:selected:bg-[Highlight] forced-colors:invalid:selected:bg-[Mark] selection-start:rounded-s-full selection-end:rounded-e-full [td:first-child_&]:rounded-s-full [td:last-child_&]:rounded-e-full"
            >
              {({
                formattedDate,
                isSelected,
                isSelectionStart,
                isSelectionEnd,
                isFocusVisible,
                isDisabled
              }) => (
                <span
                  className={cellStyles({
                    selectionState:
                      isSelected && (isSelectionStart || isSelectionEnd)
                        ? 'cap'
                        : isSelected
                          ? 'middle'
                          : 'none',
                    isDisabled,
                    isFocusVisible
                  })}
                >
                  {formattedDate}
                </span>
              )}
            </CalendarCell>
          )}
        </CalendarGridBody>
      </CalendarGrid>
      {errorMessage && (
        <Text slot="errorMessage" className="text-sm text-destructive">
          {errorMessage}
        </Text>
      )}
    </RACRangeCalendar>
  )
}
