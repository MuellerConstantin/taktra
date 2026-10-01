import { useTranslations } from 'use-intl'
import { ViewPlaceholder } from '../components/molecules/ViewPlaceholder'

function ProjectsView(): React.JSX.Element {
  const t = useTranslations('ProjectsView')

  return <ViewPlaceholder title={t('title')} description={t('placeholder')} />
}

export default ProjectsView
