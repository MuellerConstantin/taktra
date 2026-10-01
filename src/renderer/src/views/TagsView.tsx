import { useTranslations } from 'use-intl'
import { ViewPlaceholder } from '../components/molecules/ViewPlaceholder'

function TagsView(): React.JSX.Element {
  const t = useTranslations('TagsView')

  return <ViewPlaceholder title={t('title')} description={t('placeholder')} />
}

export default TagsView
