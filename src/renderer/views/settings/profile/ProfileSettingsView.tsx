import { useTranslations } from 'use-intl'
import { TabViewTemplate } from '@/renderer/components/templates/TabViewTemplate'
import { useProfiles } from '@/renderer/hooks/useProfiles'

function ProfileSettingsView(): React.JSX.Element | null {
  const t = useTranslations('ProfileSettingsView')
  const { activeProfile } = useProfiles()

  if (!activeProfile?.name) return null

  return (
    <TabViewTemplate
      title={activeProfile.name}
      subtitle={t('title')}
      help={t('help')}
      helpTopic="profiles"
      sections={[
        { path: '/profile/general', label: t('general') },
        { path: '/profile/fields', label: t('fields') },
        { path: '/profile/templates', label: t('templates') }
      ]}
    />
  )
}

export default ProfileSettingsView
