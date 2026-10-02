interface ChartTooltipProps {
  readonly color: string
  readonly title: string
  readonly detail: string
}

export function ChartTooltip({ color, title, detail }: ChartTooltipProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs whitespace-nowrap text-popover-foreground shadow-md">
      <div className="flex items-center gap-2 font-medium">
        <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
        {title}
      </div>
      <div className="mt-0.5 text-muted-foreground tabular-nums">{detail}</div>
    </div>
  )
}
