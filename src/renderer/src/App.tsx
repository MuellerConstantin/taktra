import { Button } from 'react-aria-components'

function App(): React.JSX.Element {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4 bg-neutral-50 text-neutral-900">
      <h1 className="text-3xl font-semibold">taktra</h1>
      <Button className="rounded-md bg-blue-600 px-4 py-2 text-white outline-none hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 pressed:bg-blue-800">
        Test-Button
      </Button>
    </main>
  )
}

export default App
