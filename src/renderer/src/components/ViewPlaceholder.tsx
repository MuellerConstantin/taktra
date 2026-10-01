import ViewHeader from './ViewHeader'

interface ViewPlaceholderProps {
  readonly title: string
  readonly description: string
}

function ViewPlaceholder({ title, description }: ViewPlaceholderProps): React.JSX.Element {
  return (
    <div className="flex h-full flex-col">
      <ViewHeader title={title} />
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export default ViewPlaceholder
