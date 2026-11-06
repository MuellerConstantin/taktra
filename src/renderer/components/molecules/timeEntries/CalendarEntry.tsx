import { TooltipTrigger, type ButtonProps } from 'react-aria-components'
import type { TimeEntryDetails } from '@/shared/model/timeEntries'
import { Button } from '@/renderer/components/atoms/Button'
import { Tooltip } from '@/renderer/components/atoms/Tooltip'

const TOOLTIP_DELAY = 500

interface CalendarEntryProps {
  readonly details: TimeEntryDetails
  readonly label: string
  readonly onPress: () => void
  readonly onKeyDown?: ButtonProps['onKeyDown']
  readonly isResizable?: boolean
  /** Keeps the tooltip closed, as while an entry is dragged over this one. */
  readonly isTooltipDisabled?: boolean
  readonly className: string
  readonly style?: React.CSSProperties
  readonly children: React.ReactNode
}

/** An entry in a calendar, marked with `data-entry-id` and `data-edge` for `useCalendarDrag`. */
export function CalendarEntry({
  details,
  label,
  onPress,
  onKeyDown,
  isResizable = false,
  isTooltipDisabled = false,
  className,
  style,
  children
}: CalendarEntryProps): React.JSX.Element {
  const color = details.project.color ?? 'var(--color-muted-foreground)'
  return (
    <TooltipTrigger delay={TOOLTIP_DELAY} isDisabled={isTooltipDisabled}>
      <Button
        variant="secondary"
        tooltip={false}
        aria-label={label}
        data-entry-id={details.entry.id}
        onPress={onPress}
        onKeyDown={onKeyDown}
        className={`${className} min-w-0 flex-col items-stretch justify-start gap-0 overflow-hidden rounded-sm border-0 border-l-[3px] px-1 py-px text-left text-[11px] leading-3.5 text-foreground hover:brightness-95`}
        style={{
          ...style,
          borderLeftColor: color,
          backgroundColor: `color-mix(in srgb, ${color} 18%, var(--color-background))`
        }}
      >
        {children}
        {isResizable && (
          <>
            <span
              aria-hidden
              data-edge="start"
              className="absolute inset-x-0 top-0 h-1.5 cursor-ns-resize"
            />
            <span
              aria-hidden
              data-edge="end"
              className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize"
            />
          </>
        )}
      </Button>
      <Tooltip>{label}</Tooltip>
    </TooltipTrigger>
  )
}
