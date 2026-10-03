import { createContext } from 'react'
import type { Settings } from '../../../shared/settings'

export interface SettingsContextValue {
  readonly settings: Settings
  readonly updateSettings: (patch: Partial<Settings>) => Promise<void>
  readonly setQuickStartShortcut: (accelerator: string) => Promise<void>
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)
