import {
  RiBarChartBoxLine,
  RiFolderLine,
  RiPriceTag3Line,
  RiSettings3Line,
  RiTimerLine,
  type RemixiconComponentType
} from '@remixicon/react'
import { Link } from 'react-aria-components'
import { useMatch } from 'react-router'
import { useTranslations } from 'use-intl'
import logo from '../../../../../resources/icon.svg'

interface NavItemProps {
  readonly to: string
  readonly label: string
  readonly icon: RemixiconComponentType
}

function NavItem({ to, label, icon: Icon }: NavItemProps): React.JSX.Element {
  const isActive = useMatch({ path: to, end: false }) !== null

  return (
    <Link
      href={to}
      aria-current={isActive ? 'page' : undefined}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium aria-[current=page]:text-sidebar-accent-foreground"
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      {label}
    </Link>
  )
}

export function Sidebar(): React.JSX.Element {
  const t = useTranslations('Navigation')

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 py-5">
        <img src={logo} alt="" className="size-7 rounded-md" />
        <span className="text-lg font-semibold">Taktra</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        <NavItem to="/tracking" label={t('tracking')} icon={RiTimerLine} />
        <NavItem to="/projects" label={t('projects')} icon={RiFolderLine} />
        <NavItem to="/tags" label={t('tags')} icon={RiPriceTag3Line} />
        <NavItem to="/reports" label={t('reports')} icon={RiBarChartBoxLine} />
      </nav>
      <nav className="border-t border-sidebar-border px-3 py-3">
        <NavItem to="/settings" label={t('settings')} icon={RiSettings3Line} />
      </nav>
    </aside>
  )
}
