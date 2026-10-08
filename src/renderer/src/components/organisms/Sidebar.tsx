import {
  RiBarChartBoxLine,
  RiBuilding2Line,
  RiCalendarCheckLine,
  RiDownload2Line,
  RiFolderLine,
  RiPriceTag3Line,
  RiSearchLine,
  RiSettings3Line,
  RiShutDownLine,
  RiTimerLine,
  type RemixiconComponentType
} from '@remixicon/react'
import { Button, Link, TooltipTrigger } from 'react-aria-components'
import { useMatch } from 'react-router'
import { useTranslations } from 'use-intl'
import { useAbout } from '../../hooks/useAbout'
import { useProfiles } from '../../hooks/useProfiles'
import { api } from '../../lib/api'
import { appShortcuts } from '../../lib/shortcuts'
import { KeyCombo } from '../atoms/KeyCombo'
import { Tooltip } from '../atoms/Tooltip'
import { ProfileSwitcher } from '../molecules/ProfileSwitcher'
import { TimerIndicator } from '../molecules/TimerIndicator'
import { UpdateNotice } from '../molecules/UpdateNotice'
import logo from '../../../../../resources/icon.svg'

const navItemClassName =
  'flex cursor-default items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:opacity-50 aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium aria-[current=page]:text-sidebar-accent-foreground'

interface NavItemProps {
  readonly to: string
  readonly label: string
  readonly icon: RemixiconComponentType
  readonly shortcut: string
  readonly alsoActiveOn?: string
  readonly isDisabled?: boolean
}

function NavItem({
  to,
  label,
  icon: Icon,
  shortcut,
  alsoActiveOn,
  isDisabled
}: NavItemProps): React.JSX.Element {
  const isMatch = useMatch({ path: to, end: false }) !== null
  const isAlsoMatch = useMatch({ path: alsoActiveOn ?? to, end: false }) !== null
  const isActive = (isMatch || isAlsoMatch) && !isDisabled

  return (
    <TooltipTrigger delay={500}>
      <Link
        href={to}
        isDisabled={isDisabled}
        aria-current={isActive ? 'page' : undefined}
        className={navItemClassName}
      >
        <Icon aria-hidden className="size-4 shrink-0" />
        {label}
      </Link>
      <Tooltip placement="right">
        <span className="flex items-center gap-2">
          {label}
          <KeyCombo accelerator={shortcut} />
        </span>
      </Tooltip>
    </TooltipTrigger>
  )
}

interface SidebarProps {
  readonly onSearch: () => void
}

export function Sidebar({ onSearch }: SidebarProps): React.JSX.Element {
  const t = useTranslations('Navigation')
  const { activeProfile } = useProfiles()
  const { showAbout } = useAbout()
  const hasProfile = activeProfile?.isAvailable ?? false

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="px-3 py-3">
        <Button
          onPress={showAbout}
          aria-label={t('about')}
          className="flex w-full cursor-default items-center gap-2 rounded-md px-2 py-2 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <img src={logo} alt="" className="size-7 rounded-md" />
          <span className="text-lg font-semibold">Taktra</span>
        </Button>
      </div>
      <div className="flex flex-col gap-2 px-3 pb-4">
        <ProfileSwitcher />
        <Button
          onPress={onSearch}
          className="flex h-9 w-full cursor-default items-center gap-2 rounded-lg border border-sidebar-border px-3 text-sm text-muted-foreground outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <RiSearchLine aria-hidden className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">{t('search')}</span>
          <KeyCombo accelerator={appShortcuts.commandPalette} />
        </Button>
        <TimerIndicator />
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3">
        <NavItem
          to="/timer"
          shortcut={appShortcuts.timer}
          label={t('timer')}
          icon={RiTimerLine}
          isDisabled={!hasProfile}
        />
        <NavItem
          to="/tracking"
          shortcut={appShortcuts.entries}
          label={t('tracking')}
          icon={RiCalendarCheckLine}
          isDisabled={!hasProfile}
        />
        <hr className="mx-3 my-2 border-sidebar-border" />
        <NavItem
          to="/projects"
          alsoActiveOn="/activities"
          shortcut={appShortcuts.projects}
          label={t('projects')}
          icon={RiFolderLine}
          isDisabled={!hasProfile}
        />
        <NavItem
          to="/clients"
          shortcut={appShortcuts.clients}
          label={t('clients')}
          icon={RiBuilding2Line}
          isDisabled={!hasProfile}
        />
        <NavItem
          to="/tags"
          shortcut={appShortcuts.tags}
          label={t('tags')}
          icon={RiPriceTag3Line}
          isDisabled={!hasProfile}
        />
        <hr className="mx-3 my-2 border-sidebar-border" />
        <NavItem
          to="/reports"
          shortcut={appShortcuts.reports}
          label={t('reports')}
          icon={RiBarChartBoxLine}
          isDisabled={!hasProfile}
        />
        <NavItem
          to="/export"
          shortcut={appShortcuts.export}
          label={t('export')}
          icon={RiDownload2Line}
          isDisabled={!hasProfile}
        />
      </nav>
      <div className="px-3 pb-3">
        <UpdateNotice />
      </div>
      <nav className="flex flex-col gap-1 border-t border-sidebar-border px-3 py-3">
        <NavItem
          to="/settings"
          shortcut={appShortcuts.settings}
          label={t('settings')}
          icon={RiSettings3Line}
        />
        <Button
          onPress={() => api.app.quit().catch(console.error)}
          className={`${navItemClassName} w-full`}
        >
          <RiShutDownLine aria-hidden className="size-4 shrink-0" />
          {t('quit')}
        </Button>
      </nav>
    </aside>
  )
}
