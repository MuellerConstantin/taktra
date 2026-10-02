import { useTranslations } from 'use-intl'
import { ViewPlaceholder } from '../../../components/molecules/ViewPlaceholder'
import { TabViewTemplate } from '../../../components/templates/TabViewTemplate'
import { useProfiles } from '../../../hooks/useProfiles'

function ProfileSettingsView(): React.JSX.Element {
  const t = useTranslations('ProfileSettingsView')
  const { activeProfile } = useProfiles()

  if (!activeProfile?.name) {
    return <ViewPlaceholder title={t('title')} description={t('noProfile')} />
  }

  return (
    <TabViewTemplate
      title={activeProfile.name}
      subtitle={t('title')}
      sections={[{ path: '/profile/general', label: t('general') }]}
    />
  )
}

export default ProfileSettingsView
