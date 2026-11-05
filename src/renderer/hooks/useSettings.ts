import { useContext } from 'react'
import { SettingsContext, type SettingsContextValue } from '@/renderer/contexts/SettingsContext'

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)

  if (!context) throw new Error('useSettings must be used within a SettingsProvider')

  return context
}
