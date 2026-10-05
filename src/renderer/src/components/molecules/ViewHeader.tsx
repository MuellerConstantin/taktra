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
      <div className="flex items-end justify-between gap-4 pb-5">
        <div className="flex flex-col gap-0.5">
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  )
}
