import { useEffect, useMemo, useState } from 'react'
import { AboutDialog } from '../components/molecules/AboutDialog'
import { events } from '../lib/api'
import { AboutContext } from './AboutContext'

interface AboutProviderProps {
  readonly children: React.ReactNode
}

function AboutProvider({ children }: AboutProviderProps): React.JSX.Element {
  const [isOpen, setOpen] = useState(false)

  useEffect(() => events.onShowAbout(() => setOpen(true)), [])

  const value = useMemo(() => ({ showAbout: () => setOpen(true) }), [])

  return (
    <AboutContext.Provider value={value}>
      {children}
      <AboutDialog isOpen={isOpen} onOpenChange={setOpen} />
    </AboutContext.Provider>
  )
}

export default AboutProvider
