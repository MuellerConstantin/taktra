import { useTranslations } from 'use-intl'
import { TabViewTemplate } from '../../../components/templates/TabViewTemplate'

function AppSettingsView(): React.JSX.Element {
  const t = useTranslations('AppSettingsView')

  return (
    <TabViewTemplate
      title={t('title')}
      sections={[
        { path: '/settings/appearance', label: t('appearance') },
        { path: '/settings/controls', label: t('controls') }
      ]}
    />
  )
}

export default AppSettingsView
