import { useCallback, useEffect, useState } from 'react'
import type { Settings } from '../../../shared/settings'

interface UseSettingsResult {
  readonly settings: Settings | null
  readonly updateSettings: (patch: Partial<Settings>) => Promise<void>
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    window.api.settings.get().then(setSettings)
  }, [])

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    setSettings(await window.api.settings.update(patch))
  }, [])

  return { settings, updateSettings }
}
