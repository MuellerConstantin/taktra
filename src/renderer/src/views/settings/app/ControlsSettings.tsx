import { RiArrowGoBackLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'
import { DEFAULT_QUICK_START_SHORTCUT, type ShortcutStatus } from '../../../../../shared/settings'
import { Button } from '../../../components/atoms/Button'
import { KeyCombo } from '../../../components/atoms/KeyCombo'
import { Switch } from '../../../components/atoms/Switch'
import { ShortcutRecorder } from '../../../components/molecules/ShortcutRecorder'
import { useErrorMessage } from '../../../hooks/useErrorMessage'
import { useSettings } from '../../../hooks/useSettings'
import { api } from '../../../lib/api'
import { appShortcuts, type AppShortcut } from '../../../lib/shortcuts'

function ControlsSettings(): React.JSX.Element {
  const t = useTranslations('ControlsSettings')
  const errorMessage = useErrorMessage()
  const { settings, updateSettings, setQuickStartShortcut } = useSettings()
  const [status, setStatus] = useState<ShortcutStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    api.shortcuts
      .status()
      .then((result) => isCurrent && setStatus(result))
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [settings, errorMessage])

  const changeShortcut = async (accelerator: string): Promise<void> => {
    setError(null)
    try {
      await setQuickStartShortcut(accelerator)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{t('miniTimer.title')}</h2>
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium">{t('miniTimer.label')}</span>
            <span className="text-sm text-muted-foreground">{t('miniTimer.description')}</span>
          </div>
          <Switch
            aria-label={t('miniTimer.label')}
            isSelected={settings.miniTimer}
            onChange={(miniTimer) => updateSettings({ miniTimer })}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold">{t('global.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('global.description')}</p>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
              <span className="text-sm font-medium">{t('global.quickStart')}</span>
              <span className="text-sm text-muted-foreground">
                {t('global.quickStartDescription')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShortcutRecorder
                aria-label={t('global.record')}
                value={settings.quickStartShortcut}
                onChange={changeShortcut}
                isDisabled={!settings.quickStartShortcutEnabled}
              />
              <Button
                variant="icon"
                aria-label={t('global.reset')}
                isDisabled={
                  !settings.quickStartShortcutEnabled ||
                  settings.quickStartShortcut === DEFAULT_QUICK_START_SHORTCUT
                }
                onPress={() => changeShortcut(DEFAULT_QUICK_START_SHORTCUT)}
              >
                <RiArrowGoBackLine className="size-4" />
              </Button>
              <Switch
                aria-label={t('global.enabled')}
                isSelected={settings.quickStartShortcutEnabled}
                onChange={(quickStartShortcutEnabled) =>
                  updateSettings({ quickStartShortcutEnabled })
                }
              />
            </div>
          </div>
          {status === 'unavailable' && (
            <p className="text-sm text-destructive">{t('global.unavailable')}</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold">{t('app.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('app.description')}</p>
        </div>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {(Object.keys(appShortcuts) as AppShortcut[]).map((shortcut) => (
            <li key={shortcut} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <span className="text-sm">{t(`app.${shortcut}`)}</span>
              <KeyCombo accelerator={appShortcuts[shortcut]} size="md" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default ControlsSettings
