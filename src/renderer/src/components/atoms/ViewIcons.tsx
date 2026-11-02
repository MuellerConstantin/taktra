interface ViewIconProps {
  readonly className?: string
}

function CalendarIcon({
  className,
  children
}: ViewIconProps & { readonly children: React.ReactNode }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
      <path d="M8 2.5v4M16 2.5v4" />
      <g strokeWidth={1.75}>{children}</g>
    </svg>
  )
}

export function DayViewIcon({ className }: ViewIconProps): React.JSX.Element {
  return (
    <CalendarIcon className={className}>
      <path d="M10.5 11.25 12.5 10v8" />
    </CalendarIcon>
  )
}

export function WorkWeekViewIcon({ className }: ViewIconProps): React.JSX.Element {
  return (
    <CalendarIcon className={className}>
      <path d="M14.25 10h-4l-.4 3.4a3 3 0 0 1 1.9-.6c1.6 0 2.75 1 2.75 2.6S13.35 18 11.75 18c-1 0-1.9-.4-2.35-1.1" />
    </CalendarIcon>
  )
}

export function WeekViewIcon({ className }: ViewIconProps): React.JSX.Element {
  return (
    <CalendarIcon className={className}>
      <path d="M9.5 10h5l-3.5 8" />
    </CalendarIcon>
  )
}
