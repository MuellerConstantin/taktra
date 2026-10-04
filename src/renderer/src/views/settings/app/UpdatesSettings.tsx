import { useTranslations } from 'use-intl'
import { Switch } from '../../../components/atoms/Switch'
import { useSettings } from '../../../hooks/useSettings'

function UpdatesSettings(): React.JSX.Element {
  const t = useTranslations('UpdatesSettings')
  const { settings, updateSettings } = useSettings()

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
            isSelected={settings.autoUpdate}
            onChange={(autoUpdate) => updateSettings({ autoUpdate })}
          />
        </div>
      </section>
    </div>
  )
}

export default UpdatesSettings
