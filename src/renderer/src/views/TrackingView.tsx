import { useTranslations } from 'use-intl'
import { ViewPlaceholder } from '../components/molecules/ViewPlaceholder'

function TrackingView(): React.JSX.Element {
  const t = useTranslations('TrackingView')

  return <ViewPlaceholder title={t('title')} description={t('placeholder')} />
}

export default TrackingView
