import { twMerge } from 'tailwind-merge'

interface BadgeProps {
  readonly color?: string | null
  readonly className?: string
  readonly children: React.ReactNode
}

export function Badge({ color, className, children }: BadgeProps): React.JSX.Element {
  return (
    <span
      className={twMerge(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground',
        className
      )}
      style={
        color
          ? {
              backgroundColor: `color-mix(in oklab, ${color} 18%, transparent)`,
              borderColor: `color-mix(in oklab, ${color} 45%, transparent)`
            }
          : undefined
      }
    >
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full bg-muted-foreground"
        style={color ? { backgroundColor: color } : undefined}
      />
      <span className="truncate">{children}</span>
    </span>
  )
}
