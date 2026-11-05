import { createContext } from 'react'

/** Counts changes of the profile data from any source, so views reload what they show. */
export const DataRevisionContext = createContext<number | null>(null)
