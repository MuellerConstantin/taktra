import { createContext } from 'react'

export interface AboutContextValue {
  readonly showAbout: () => void
}

export const AboutContext = createContext<AboutContextValue | null>(null)
