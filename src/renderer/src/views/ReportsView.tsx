import { useTranslations } from 'use-intl'
import { ViewPlaceholder } from '../components/molecules/ViewPlaceholder'

function ReportsView(): React.JSX.Element {
  const t = useTranslations('ReportsView')

  return <ViewPlaceholder title={t('title')} description={t('placeholder')} />
}

export default ReportsView
