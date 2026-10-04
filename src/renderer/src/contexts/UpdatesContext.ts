import { createContext } from 'react'
import type { UpdateStatus } from '../../../shared/updates'

export interface UpdatesContextValue {
  readonly status: UpdateStatus
  readonly check: () => Promise<void>
  readonly install: () => Promise<void>
}

export const UpdatesContext = createContext<UpdatesContextValue | null>(null)
