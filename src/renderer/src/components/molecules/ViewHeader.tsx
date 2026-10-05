interface ViewHeaderProps {
  readonly title: React.ReactNode
  readonly subtitle?: React.ReactNode
  readonly actions?: React.ReactNode
  readonly children?: React.ReactNode
}

export function ViewHeader({
  title,
  subtitle,
  actions,
  children
}: ViewHeaderProps): React.JSX.Element {
  return (
    <header className="border-b border-border px-8 pt-5">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pb-5">
        <div className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        {actions && (
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">{actions}</div>
        )}
      </div>
      {children}
    </header>
  )
}
