import { Link } from 'react-aria-components'
import { Outlet, useLocation } from 'react-router'
import { useTranslations } from 'use-intl'
import { ViewHeader } from '../../components/molecules/ViewHeader'
import { helpTopics } from '../../lib/help'

const chapterLinkClassName =
  'block cursor-default rounded-md px-3 py-1.5 text-sm text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-accent aria-[current=page]:font-medium aria-[current=page]:text-accent-foreground'

function HelpView(): React.JSX.Element {
  const t = useTranslations('HelpView')
  const { pathname } = useLocation()

  return (
    <div className="flex h-full flex-col">
      <ViewHeader title={t('title')} />
      <div className="flex flex-1 flex-wrap content-start gap-x-8 gap-y-6 overflow-y-auto px-8 py-6">
        <nav aria-label={t('chapters')} className="w-44 shrink-0">
          <ul className="space-y-0.5">
            {helpTopics.map((topic) => {
              const path = `/help/${topic}`
              return (
                <li key={topic}>
                  <Link
                    href={path}
                    aria-current={pathname === path ? 'page' : undefined}
                    className={chapterLinkClassName}
                  >
                    {t(`topics.${topic}`)}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="min-w-0 flex-1 basis-72">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default HelpView
