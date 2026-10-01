interface ViewHeaderProps {
  readonly title: string
  readonly children?: React.ReactNode
}

function ViewHeader({ title, children }: ViewHeaderProps): React.JSX.Element {
  return (
    <header className="border-b border-border px-8 pt-5">
      <h1 className="pb-5 text-xl font-semibold">{title}</h1>
      {children}
    </header>
  )
}

export default ViewHeader
