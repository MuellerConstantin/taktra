interface ViewPlaceholderProps {
  readonly title: string
  readonly description: string
}

function ViewPlaceholder({ title, description }: ViewPlaceholderProps): React.JSX.Element {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-8 py-5">
        <h1 className="text-xl font-semibold">{title}</h1>
      </header>
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export default ViewPlaceholder
