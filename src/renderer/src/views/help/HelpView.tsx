import { useTranslations } from 'use-intl'
import { TabViewTemplate } from '../../components/templates/TabViewTemplate'
import { helpTopics } from '../../lib/help'

function HelpView(): React.JSX.Element {
  const t = useTranslations('HelpView')

  return (
    <TabViewTemplate
      title={t('title')}
      sections={helpTopics.map((topic) => ({
        path: `/help/${topic}`,
        label: t(`topics.${topic}`)
      }))}
    />
  )
}

export default HelpView
