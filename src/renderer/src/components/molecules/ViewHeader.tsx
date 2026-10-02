interface ViewHeaderProps {
  readonly title: string
  readonly subtitle?: string
  readonly children?: React.ReactNode
}

export function ViewHeader({ title, subtitle, children }: ViewHeaderProps): React.JSX.Element {
  return (
    <header className="border-b border-border px-8 pt-5">
      <div className="flex flex-col gap-0.5 pb-5">
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      {children}
    </header>
  )
}
