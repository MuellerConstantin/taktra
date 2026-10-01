import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Settings } from '../../../shared/settings'
import { SettingsContext } from './SettingsContext'

interface SettingsProviderProps {
  readonly children: React.ReactNode
}

function SettingsProvider({ children }: SettingsProviderProps): React.JSX.Element | null {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    window.api.settings.get().then(setSettings)
  }, [])

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    setSettings(await window.api.settings.update(patch))
  }, [])

  const value = useMemo(
    () => (settings ? { settings, updateSettings } : null),
    [settings, updateSettings]
  )

  if (!value) return null

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export default SettingsProvider
