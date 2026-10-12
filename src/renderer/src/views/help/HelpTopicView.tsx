import Markdown from 'react-markdown'
import { Navigate, useParams } from 'react-router'
import remarkGfm from 'remark-gfm'
import { useLocale } from 'use-intl'
import { helpTexts, helpTopics, isHelpTopic } from '../../lib/help'

function HelpTopicView(): React.JSX.Element {
  const { topic } = useParams()
  const locale = useLocale()

  if (!isHelpTopic(topic)) return <Navigate to={`/help/${helpTopics[0]}`} replace />

  return (
    <article className="max-w-prose space-y-3 text-sm leading-relaxed [&_a]:cursor-default [&_a]:rounded-sm [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-ring [&_h2]:pt-3 [&_h2]:text-base [&_h2]:font-semibold [&_li]:mt-1 [&_strong]:font-medium [&_ul]:list-disc [&_ul]:pl-5 [&>h2:first-child]:pt-0">
      <Markdown remarkPlugins={[remarkGfm]}>{helpTexts[locale][topic]}</Markdown>
    </article>
  )
}

export default HelpTopicView
