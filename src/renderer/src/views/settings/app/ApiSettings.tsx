import { RiFileCopyLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'
import type { ApiState } from '../../../../../shared/model/apiAccess'
import { Button } from '../../../components/atoms/Button'
import { Switch } from '../../../components/atoms/Switch'
import { TextField } from '../../../components/atoms/TextField'
import { useErrorMessage } from '../../../hooks/useErrorMessage'
import { useSettings } from '../../../hooks/useSettings'
import { api, events } from '../../../lib/api'

const MIN_PORT = 1024
const MAX_PORT = 65535

function ApiSettings(): React.JSX.Element {
  const t = useTranslations('ApiSettings')
  const errorMessage = useErrorMessage()
  const { settings, updateSettings } = useSettings()
  const [state, setState] = useState<ApiState | null>(null)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [portDraft, setPortDraft] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    const load = (): void => {
      api.apiAccess
        .state()
        .then((result) => isCurrent && setState(result))
        .catch((caught) => isCurrent && setError(errorMessage(caught)))
    }
    load()
    const unsubscribe = events.onApiChanged(load)
    return () => {
      isCurrent = false
      unsubscribe()
    }
  }, [errorMessage])

  const port = portDraft ?? String(settings.apiPort)
  const portNumber = Number(port)
  const isPortValid = /^\d+$/.test(port) && portNumber >= MIN_PORT && portNumber <= MAX_PORT

  const run = async (action: () => Promise<void>): Promise<void> => {
    setError(null)
    try {
      await action()
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  const createKey = (): Promise<void> =>
    run(async () => {
      setNewKey(await api.apiAccess.createKey())
      setCopied(false)
    })

  const setEnabled = (apiEnabled: boolean): Promise<void> =>
    run(async () => {
      if (apiEnabled && !state?.hasKey) {
        setNewKey(await api.apiAccess.createKey())
        setCopied(false)
      }
      await updateSettings({ apiEnabled })
    })

  const savePort = (): Promise<void> =>
    run(async () => {
      if (!isPortValid) return
      if (portNumber !== settings.apiPort) await updateSettings({ apiPort: portNumber })
      setPortDraft(null)
    })

  const copyKey = async (): Promise<void> => {
    if (!newKey) return
    await navigator.clipboard.writeText(newKey)
    setCopied(true)
  }

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium">{t('enabled')}</span>
              <span className="text-sm text-muted-foreground">{t('enabledDescription')}</span>
            </div>
            <Switch
              aria-label={t('enabled')}
              isSelected={settings.apiEnabled}
              onChange={setEnabled}
            />
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <TextField
              className="w-32"
              label={t('port')}
              inputMode="numeric"
              value={port}
              onChange={setPortDraft}
              onBlur={savePort}
              onKeyDown={(event) => event.key === 'Enter' && void savePort()}
              isInvalid={!isPortValid}
              errorMessage={t('portInvalid', { min: MIN_PORT, max: MAX_PORT })}
            />
            {settings.apiEnabled && state?.status === 'running' && (
              <span className="min-w-0 pb-2 text-sm break-all text-muted-foreground">
                {t('running', { url: `http://127.0.0.1:${settings.apiPort}/api/v1` })}
              </span>
            )}
          </div>
          {settings.apiEnabled && state?.status === 'portInUse' && (
            <p className="text-sm text-destructive">{t('portInUse')}</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold">{t('key.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('key.description')}</p>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          {newKey ? (
            <>
              <div className="flex items-center gap-2">
                <code
                  aria-label={t('key.label')}
                  className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 font-mono text-sm break-all"
                >
                  {newKey}
                </code>
                <Button variant="secondary" onPress={copyKey}>
                  <RiFileCopyLine aria-hidden className="size-4" />
                  {copied ? t('key.copied') : t('key.copy')}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{t('key.shownOnce')}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {state?.hasKey ? t('key.exists') : t('key.missing')}
            </p>
          )}
          <div>
            <Button variant="secondary" onPress={createKey}>
              {state?.hasKey || newKey ? t('key.recreate') : t('key.create')}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </section>
    </div>
  )
}

export default ApiSettings
