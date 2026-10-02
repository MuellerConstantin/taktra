import { useTranslations } from 'use-intl'
import { TabViewTemplate } from '../../../components/templates/TabViewTemplate'
import { useProfiles } from '../../../hooks/useProfiles'

function ProfileSettingsView(): React.JSX.Element | null {
  const t = useTranslations('ProfileSettingsView')
  const { activeProfile } = useProfiles()

  if (!activeProfile?.name) return null

  return (
    <TabViewTemplate
      title={activeProfile.name}
      subtitle={t('title')}
      sections={[{ path: '/profile/general', label: t('general') }]}
    />
  )
}

export default ProfileSettingsView
