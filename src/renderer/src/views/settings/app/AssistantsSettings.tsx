import { RiCheckLine, RiExternalLinkLine, RiFileCopyLine, RiRobot2Line } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'
import type { AssistantStatus, McpLaunchConfig } from '../../../../../shared/mcp'
import { Button } from '../../../components/atoms/Button'
import {
  Disclosure,
  DisclosureGroup,
  DisclosureHeader,
  DisclosurePanel
} from '../../../components/atoms/Disclosure'
import { Switch } from '../../../components/atoms/Switch'
import { useErrorMessage } from '../../../hooks/useErrorMessage'
import { useSettings } from '../../../hooks/useSettings'
import { api } from '../../../lib/api'

const cardClassName = 'overflow-hidden rounded-xl border border-border bg-card'

const logos = import.meta.glob<string>('../../../assets/assistants/*.svg', {
  eager: true,
  query: '?url',
  import: 'default'
})

function AssistantLogo({ id }: { readonly id: string }): React.JSX.Element {
  const src = logos[`../../../assets/assistants/${id}.svg`]
  if (src) return <img src={src} alt="" className="size-8 shrink-0 rounded-md" />
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <RiRobot2Line aria-hidden className="size-4" />
    </span>
  )
}

function CopyButton({ text }: { readonly text: string }): React.JSX.Element {
  const t = useTranslations('AssistantsSettings')
  const [isCopied, setCopied] = useState(false)

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
  }

  return (
    <Button variant="icon" aria-label={isCopied ? t('copied') : t('copy')} onPress={copy}>
      {isCopied ? <RiCheckLine className="size-4" /> : <RiFileCopyLine className="size-4" />}
    </Button>
  )
}

function Code({ children }: { readonly children: string }): React.JSX.Element {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted py-2 pr-2 pl-3">
      <pre className="min-w-0 flex-1 font-mono text-xs break-all whitespace-pre-wrap">
        {children}
      </pre>
      <CopyButton text={children} />
    </div>
  )
}

function ManualSetup({ config }: { readonly config: McpLaunchConfig }): React.JSX.Element {
  const t = useTranslations('AssistantsSettings.manual')
  const values = [
    { label: t('command'), value: config.command },
    { label: t('arguments'), value: config.args.join(' ') },
    {
      label: t('environment'),
      value: Object.entries(config.env)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ')
    }
  ]

  return (
    <Disclosure id="manual" className={cardClassName}>
      <DisclosureHeader className="px-4 py-3">
        <span className="flex min-w-0 flex-col">
          <span className="font-medium">{t('title')}</span>
          <span className="text-muted-foreground">{t('subtitle')}</span>
        </span>
      </DisclosureHeader>
      <DisclosurePanel>
        <div className="flex flex-col gap-3 px-4 pb-4">
          <p className="text-sm text-muted-foreground">{t('description')}</p>
          <dl className="flex flex-col gap-2">
            {values.map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd>
                  <Code>{value}</Code>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}

interface AssistantRowProps {
  readonly assistant: AssistantStatus
  readonly onConnect: () => void
  readonly onDisconnect: () => void
}

function AssistantAction({
  assistant,
  onConnect,
  onDisconnect
}: AssistantRowProps): React.JSX.Element {
  const t = useTranslations('AssistantsSettings.assistants')

  switch (assistant.state) {
    case 'notInstalled':
      return (
        <Button variant="secondary" onPress={() => window.open(assistant.downloadUrl, '_blank')}>
          <RiExternalLinkLine className="size-4" />
          {t('download')}
        </Button>
      )
    case 'disconnected':
      return <Button onPress={onConnect}>{t('connect')}</Button>
    case 'outdated':
      return <Button onPress={onConnect}>{t('reconnect')}</Button>
    case 'connected':
      return (
        <Button variant="secondary" onPress={onDisconnect}>
          {t('disconnect')}
        </Button>
      )
    case 'invalid':
      return <></>
  }
}

function AssistantRow(props: AssistantRowProps): React.JSX.Element {
  const t = useTranslations('AssistantsSettings.assistants')
  const { assistant } = props

  return (
    <Disclosure id={assistant.id} className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-3 pr-4">
        <div className="min-w-0 flex-1">
          <DisclosureHeader className="px-4 py-3">
            <AssistantLogo id={assistant.id} />
            <span className="flex min-w-0 flex-col">
              <span className="font-medium">{assistant.name}</span>
              <span
                className={
                  assistant.state === 'connected' ? 'text-primary' : 'text-muted-foreground'
                }
              >
                {t(`states.${assistant.state}`)}
              </span>
            </span>
          </DisclosureHeader>
        </div>
        <AssistantAction {...props} />
      </div>
      <DisclosurePanel>
        <div className="flex flex-col gap-3 px-4 pb-4">
          <p className="text-sm wrap-anywhere text-muted-foreground">
            {t('manual', { path: assistant.configPath })}
          </p>
          <Code>{assistant.manualEntry}</Code>
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}

function AssistantsSettings(): React.JSX.Element {
  const t = useTranslations('AssistantsSettings')
  const errorMessage = useErrorMessage()
  const { settings, updateSettings } = useSettings()
  const [config, setConfig] = useState<McpLaunchConfig | null>(null)
  const [assistants, setAssistants] = useState<readonly AssistantStatus[]>([])
  const [restartName, setRestartName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    Promise.all([api.mcp.config(), api.mcp.assistants()])
      .then(([loadedConfig, loadedAssistants]) => {
        if (!isCurrent) return
        setConfig(loadedConfig)
        setAssistants(loadedAssistants)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [errorMessage])

  const change = async (
    assistant: AssistantStatus,
    action: (id: string) => Promise<AssistantStatus[]>
  ): Promise<void> => {
    setError(null)
    setRestartName(null)
    try {
      setAssistants(await action(assistant.id))
      setRestartName(assistant.name)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{t('title')}</h2>
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium">{t('label')}</span>
            <span className="text-sm text-muted-foreground">{t('description')}</span>
          </div>
          <Switch
            aria-label={t('label')}
            isSelected={settings.mcpAccess}
            onChange={(mcpAccess) => updateSettings({ mcpAccess })}
          />
        </div>
        <p className="text-sm text-muted-foreground">{t('privacy')}</p>
      </section>
      {settings.mcpAccess && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">{t('setup.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('setup.description')}</p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {restartName && (
            <p className="text-sm text-primary">{t('setup.restart', { name: restartName })}</p>
          )}
          {assistants.length > 0 && (
            <DisclosureGroup allowsMultipleExpanded className={cardClassName}>
              {assistants.map((assistant) => (
                <AssistantRow
                  key={assistant.id}
                  assistant={assistant}
                  onConnect={() => change(assistant, api.mcp.connect)}
                  onDisconnect={() => change(assistant, api.mcp.disconnect)}
                />
              ))}
            </DisclosureGroup>
          )}
          {config && (
            <>
              <p className="pt-2 text-sm text-muted-foreground">{t('setup.other')}</p>
              <ManualSetup config={config} />
            </>
          )}
        </section>
      )}
    </div>
  )
}

export default AssistantsSettings
