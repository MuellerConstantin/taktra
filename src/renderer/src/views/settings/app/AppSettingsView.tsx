import { RiInformationLine } from '@remixicon/react'
import { useTranslations } from 'use-intl'
import { Button } from '../../../components/atoms/Button'
import { TabViewTemplate } from '../../../components/templates/TabViewTemplate'
import { useAbout } from '../../../hooks/useAbout'

function AppSettingsView(): React.JSX.Element {
  const t = useTranslations('AppSettingsView')
  const { showAbout } = useAbout()

  return (
    <TabViewTemplate
      title={t('title')}
      sections={[
        { path: '/settings/appearance', label: t('appearance') },
        { path: '/settings/controls', label: t('controls') }
      ]}
      actions={
        <Button variant="secondary" onPress={showAbout}>
          <RiInformationLine aria-hidden className="size-4" />
          {t('about')}
        </Button>
      }
    />
  )
}

export default AppSettingsView
