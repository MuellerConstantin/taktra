import { useTranslations } from 'use-intl'
import { RadioCard, RadioGroup } from '../../../components/atoms/RadioGroup'
import { Select, SelectItem } from '../../../components/atoms/Select'
import { Switch } from '../../../components/atoms/Switch'
import { useSettings } from '../../../hooks/useSettings'
import {
  languages,
  themeSources,
  type Language,
  type ThemeSource
} from '../../../../../shared/settings'

function AppearanceSettings(): React.JSX.Element {
  const t = useTranslations('AppearanceSettings')
  const { settings, updateSettings } = useSettings()

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <RadioGroup
        label={t('theme.label')}
        orientation="horizontal"
        value={settings.theme}
        onChange={(value) => updateSettings({ theme: value as ThemeSource })}
      >
        {themeSources.map((theme) => (
          <RadioCard
            key={theme}
            value={theme}
            label={t(`theme.${theme}`)}
            description={t(`theme.${theme}Description`)}
          />
        ))}
      </RadioGroup>

      <Select
        label={t('language.label')}
        value={settings.language}
        onChange={(value) => updateSettings({ language: value as Language })}
        className="w-64"
      >
        {languages.map((language) => (
          <SelectItem key={language} id={language}>
            {t(`language.${language}`)}
          </SelectItem>
        ))}
      </Select>

      <div className="flex flex-col gap-1">
        <Switch
          isSelected={settings.miniTimer}
          onChange={(miniTimer) => updateSettings({ miniTimer })}
        >
          {t('miniTimer.label')}
        </Switch>
        <p className="pl-12 text-sm text-muted-foreground">{t('miniTimer.description')}</p>
      </div>
    </div>
  )
}

export default AppearanceSettings
