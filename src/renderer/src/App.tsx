import { Button, ToggleButton } from 'react-aria-components'

const swatches = [
  ['bg-background', 'background'],
  ['bg-card', 'card'],
  ['bg-primary', 'primary'],
  ['bg-secondary', 'secondary'],
  ['bg-muted', 'muted'],
  ['bg-accent', 'accent'],
  ['bg-destructive', 'destructive'],
  ['bg-border', 'border'],
  ['bg-input', 'input'],
  ['bg-ring', 'ring']
] as const

const charts = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
  'bg-chart-6',
  'bg-chart-7',
  'bg-chart-8',
  'bg-chart-9',
  'bg-chart-10'
] as const

function App(): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col gap-8 bg-background p-10 text-foreground">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">taktra</h1>
        <ToggleButton
          onChange={(isDark) => document.documentElement.classList.toggle('dark', isDark)}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm shadow-xs outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {({ isSelected }) => (isSelected ? 'Hell' : 'Dunkel')}
        </ToggleButton>
      </header>

      <section className="flex flex-wrap gap-3">
        <Button className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground shadow-sm outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background pressed:bg-primary/80">
          Primär
        </Button>
        <Button className="rounded-md bg-secondary px-4 py-2 font-medium text-secondary-foreground outline-none hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring">
          Sekundär
        </Button>
        <Button className="rounded-md px-4 py-2 font-medium outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring">
          Ghost
        </Button>
        <Button className="rounded-md bg-destructive px-4 py-2 font-medium text-destructive-foreground outline-none hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-ring">
          Löschen
        </Button>
      </section>

      <section className="max-w-md rounded-lg border border-border bg-card p-5 text-card-foreground shadow-md">
        <h2 className="font-semibold">Karte</h2>
        <p className="text-sm text-muted-foreground">Gedämpfter Text auf einer Karte.</p>
      </section>

      <section className="grid grid-cols-5 gap-3">
        {swatches.map(([className, label]) => (
          <div key={label} className="flex flex-col gap-1 text-xs">
            <div className={`h-12 rounded-md border border-border ${className}`} />
            {label}
          </div>
        ))}
      </section>

      <section className="flex gap-2">
        {charts.map((className) => (
          <div key={className} className={`h-8 flex-1 rounded-sm ${className}`} />
        ))}
      </section>
    </main>
  )
}

export default App
