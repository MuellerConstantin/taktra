import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Settings } from '../../../shared/settings'
import { api, events } from '../lib/api'
import { SettingsContext } from './SettingsContext'

interface SettingsProviderProps {
  readonly children: React.ReactNode
}

function SettingsProvider({ children }: SettingsProviderProps): React.JSX.Element | null {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    const load = (): void => void api.settings.get().then(setSettings)
    load()
    return events.onSettingsChanged(load)
  }, [])

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    setSettings(await api.settings.update(patch))
  }, [])

  const setQuickStartShortcut = useCallback(async (accelerator: string) => {
    setSettings(await api.shortcuts.setQuickStart(accelerator))
  }, [])

  const value = useMemo(
    () => (settings ? { settings, updateSettings, setQuickStartShortcut } : null),
    [settings, updateSettings, setQuickStartShortcut]
  )

  if (!value) return null

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export default SettingsProvider
