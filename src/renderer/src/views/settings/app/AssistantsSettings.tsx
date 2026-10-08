import { RiCheckLine, RiFileCopyLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'
import type { McpClientConfig } from '../../../../../shared/mcp'
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

const SERVER_NAME = 'taktra'

function claudeDesktopConfig(config: McpClientConfig): string {
  return JSON.stringify({ mcpServers: { [SERVER_NAME]: config } }, null, 2)
}

function claudeCodeCommand({ command, args, env }: McpClientConfig): string {
  const envOptions = Object.entries(env).map(([key, value]) => `--env ${key}=${value}`)
  const quoted = [command, ...args].map((part) => `"${part}"`)
  return ['claude mcp add', SERVER_NAME, '--scope user', ...envOptions, '--', ...quoted].join(' ')
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

interface ClientSetupProps {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly code: string
}

function ClientSetup({ id, title, description, code }: ClientSetupProps): React.JSX.Element {
  return (
    <Disclosure id={id} className="border-b border-border last:border-b-0">
      <DisclosureHeader className="px-4 py-3 font-medium">{title}</DisclosureHeader>
      <DisclosurePanel>
        <div className="flex flex-col gap-3 px-4 pb-4">
          <p className="text-sm text-muted-foreground">{description}</p>
          <Code>{code}</Code>
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}

function GenericSetup({ config }: { readonly config: McpClientConfig }): React.JSX.Element {
  const t = useTranslations('AssistantsSettings.setup')
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
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{t('generic')}</span>
        <span className="text-sm text-muted-foreground">{t('genericDescription')}</span>
      </div>
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
  )
}

function AssistantsSettings(): React.JSX.Element {
  const t = useTranslations('AssistantsSettings')
  const errorMessage = useErrorMessage()
  const { settings, updateSettings } = useSettings()
  const [config, setConfig] = useState<McpClientConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    api.mcp
      .config()
      .then((loaded) => isCurrent && setConfig(loaded))
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [errorMessage])

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
          {config && (
            <>
              <GenericSetup config={config} />
              <DisclosureGroup
                allowsMultipleExpanded
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <ClientSetup
                  id="claudeDesktop"
                  title={t('setup.claudeDesktop')}
                  description={t('setup.claudeDesktopDescription')}
                  code={claudeDesktopConfig(config)}
                />
                <ClientSetup
                  id="claudeCode"
                  title={t('setup.claudeCode')}
                  description={t('setup.claudeCodeDescription')}
                  code={claudeCodeCommand(config)}
                />
              </DisclosureGroup>
            </>
          )}
        </section>
      )}
    </div>
  )
}

export default AssistantsSettings
