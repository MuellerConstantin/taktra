import {
  RiAddLine,
  RiBarChartBoxLine,
  RiBuilding2Line,
  RiCalendarCheckLine,
  RiDownload2Line,
  RiFolderLine,
  RiInformationLine,
  RiPriceTag3Line,
  RiSettings3Line,
  RiStopFill,
  RiTimerLine,
  RiUserSettingsLine,
  type RemixiconComponentType
} from '@remixicon/react'
import { useEffect, useState } from 'react'
import { Autocomplete, ListBox, useFilter } from 'react-aria-components'
import { useNavigate } from 'react-router'
import { useTranslations } from 'use-intl'
import { Dialog } from '../atoms/Dialog'
import { KeyCombo } from '../atoms/KeyCombo'
import { DropdownItem, DropdownSection } from '../atoms/ListBox'
import { Modal } from '../atoms/Modal'
import { SearchField } from '../atoms/SearchField'
import { useAbout } from '../../hooks/useAbout'
import { createRequest } from '../../hooks/useCreateRequest'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { useProfiles } from '../../hooks/useProfiles'
import { useTimer } from '../../hooks/useTimer'
import { api } from '../../lib/api'
import { NEUTRAL_COLOR } from '../../lib/report'
import { appShortcuts } from '../../lib/shortcuts'

interface Command {
  readonly id: string
  readonly label: string
  readonly detail?: string
  readonly keywords?: string
  readonly icon?: RemixiconComponentType
  readonly color?: string
  readonly shortcut?: string
  readonly run: () => void
}

interface Section {
  readonly id: string
  readonly title: string
  readonly items: readonly Command[]
}

interface CommandPaletteProps {
  readonly isOpen: boolean
  readonly onOpenChange: (isOpen: boolean) => void
}

export function CommandPalette({ isOpen, onOpenChange }: CommandPaletteProps): React.JSX.Element {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable size="wide" placement="top">
      <PaletteDialog onClose={() => onOpenChange(false)} />
    </Modal>
  )
}

interface PaletteDialogProps {
  readonly onClose: () => void
}

function PaletteDialog({ onClose }: PaletteDialogProps): React.JSX.Element {
  const t = useTranslations('CommandPalette')
  const tApp = useTranslations()
  const navigate = useNavigate()
  const errorMessage = useErrorMessage()
  const { contains } = useFilter({ sensitivity: 'base' })
  const { activeProfile } = useProfiles()
  const { running, stop } = useTimer()
  const { showAbout } = useAbout()
  const hasProfile = activeProfile?.isAvailable ?? false
  const [query, setQuery] = useState('')
  const [entities, setEntities] = useState<readonly Section[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasProfile) return
    let isCurrent = true
    Promise.all([api.projects.list(), api.activities.list(), api.tags.list()])
      .then(([projects, activities, tags]) => {
        if (!isCurrent) return
        const projectById = new Map(projects.map((project) => [project.id, project]))
        setEntities([
          {
            id: 'projects',
            title: t('sections.projects'),
            items: projects.map((project) => ({
              id: `project-${project.id}`,
              label: project.name,
              color: project.color ?? NEUTRAL_COLOR,
              run: () => navigate(`/projects/${project.id}`)
            }))
          },
          {
            id: 'activities',
            title: t('sections.activities'),
            items: activities.flatMap((activity) => {
              const project = projectById.get(activity.projectId)
              if (!project) return []
              return [
                {
                  id: `activity-${activity.id}`,
                  label: activity.name,
                  detail: project.name,
                  color: project.color ?? NEUTRAL_COLOR,
                  run: () => navigate(`/activities/${activity.id}`)
                }
              ]
            })
          },
          {
            id: 'tags',
            title: t('sections.tags'),
            items: tags.map((tag) => ({
              id: `tag-${tag.id}`,
              label: tag.name,
              color: tag.color ?? NEUTRAL_COLOR,
              run: () => navigate(`/tags/${tag.id}`)
            }))
          }
        ])
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [hasProfile, navigate, errorMessage, t])

  const goTo = (path: string, state?: unknown) => () => navigate(path, { state })
  const runAsync = (action: () => Promise<unknown>) => () => {
    action().catch(console.error)
  }

  const profileViews: readonly Command[] = [
    {
      id: 'timer',
      label: tApp('Navigation.timer'),
      icon: RiTimerLine,
      shortcut: appShortcuts.timer,
      run: goTo('/timer')
    },
    {
      id: 'tracking',
      label: tApp('Navigation.tracking'),
      icon: RiCalendarCheckLine,
      shortcut: appShortcuts.entries,
      run: goTo('/tracking')
    },
    {
      id: 'projects',
      label: tApp('Navigation.projects'),
      icon: RiFolderLine,
      shortcut: appShortcuts.projects,
      run: goTo('/projects')
    },
    {
      id: 'clients',
      label: tApp('Navigation.clients'),
      icon: RiBuilding2Line,
      shortcut: appShortcuts.clients,
      run: goTo('/clients')
    },
    {
      id: 'tags',
      label: tApp('Navigation.tags'),
      icon: RiPriceTag3Line,
      shortcut: appShortcuts.tags,
      run: goTo('/tags')
    },
    {
      id: 'reports',
      label: tApp('Navigation.reports'),
      icon: RiBarChartBoxLine,
      shortcut: appShortcuts.reports,
      run: goTo('/reports')
    },
    {
      id: 'export',
      label: tApp('Navigation.export'),
      icon: RiDownload2Line,
      shortcut: appShortcuts.export,
      run: goTo('/export')
    },
    {
      id: 'profile',
      label: tApp('ProfileSettingsView.title'),
      icon: RiUserSettingsLine,
      run: goTo('/profile')
    }
  ]

  const views: readonly Command[] = [
    ...(hasProfile ? profileViews : []),
    {
      id: 'settings',
      label: tApp('Navigation.settings'),
      icon: RiSettings3Line,
      shortcut: appShortcuts.settings,
      run: goTo('/settings')
    }
  ]

  const profileActions: readonly Command[] = [
    {
      id: 'quickStart',
      label: t('actions.quickStart'),
      icon: RiTimerLine,
      shortcut: appShortcuts.quickStart,
      run: runAsync(api.quick.toggle)
    },
    {
      id: 'newEntry',
      label: t('actions.newEntry'),
      icon: RiAddLine,
      run: goTo('/tracking', createRequest)
    },
    {
      id: 'newProject',
      label: t('actions.newProject'),
      icon: RiAddLine,
      run: goTo('/projects', createRequest)
    },
    {
      id: 'newClient',
      label: t('actions.newClient'),
      icon: RiAddLine,
      run: goTo('/clients', createRequest)
    },
    { id: 'newTag', label: t('actions.newTag'), icon: RiAddLine, run: goTo('/tags', createRequest) }
  ]

  const actions: readonly Command[] = [
    ...(running
      ? [
          {
            id: 'stopTimer',
            label: t('actions.stopTimer'),
            detail: running.activity.name,
            icon: RiStopFill,
            shortcut: appShortcuts.stopTimer,
            run: runAsync(stop)
          }
        ]
      : []),
    ...(hasProfile ? profileActions : []),
    { id: 'about', label: tApp('Navigation.about'), icon: RiInformationLine, run: showAbout }
  ]

  const profileSettings: readonly Command[] = [
    { id: 'profileName', label: t('settings.profileName'), run: goTo('/profile/general') },
    {
      id: 'deleteProfile',
      label: tApp('DeleteProfileSection.title'),
      run: goTo('/profile/general')
    }
  ]

  const settings: readonly Command[] = [
    {
      id: 'theme',
      label: tApp('AppearanceSettings.theme.label'),
      keywords: [
        tApp('AppearanceSettings.theme.system'),
        tApp('AppearanceSettings.theme.light'),
        tApp('AppearanceSettings.theme.dark')
      ].join(' '),
      run: goTo('/settings/appearance')
    },
    {
      id: 'language',
      label: tApp('AppearanceSettings.language.label'),
      keywords: [
        tApp('AppearanceSettings.language.en'),
        tApp('AppearanceSettings.language.de')
      ].join(' '),
      run: goTo('/settings/appearance')
    },
    {
      id: 'miniTimer',
      label: tApp('ControlsSettings.miniTimer.title'),
      run: goTo('/settings/controls')
    },
    {
      id: 'globalShortcuts',
      label: tApp('ControlsSettings.global.title'),
      keywords: t('actions.quickStart'),
      run: goTo('/settings/controls')
    },
    {
      id: 'appShortcuts',
      label: tApp('ControlsSettings.app.title'),
      run: goTo('/settings/controls')
    },
    { id: 'updates', label: tApp('UpdatesSettings.title'), run: goTo('/settings/updates') },
    ...(hasProfile ? profileSettings : [])
  ].map((command) => ({ ...command, icon: RiSettings3Line }))

  const sections: readonly Section[] = [
    { id: 'navigation', title: t('sections.navigation'), items: views },
    { id: 'actions', title: t('sections.actions'), items: actions },
    ...(query ? entities : []),
    { id: 'settings', title: t('sections.settings'), items: settings }
  ]

  const commandById = new Map(
    sections.flatMap((section) => section.items).map((command) => [command.id, command])
  )

  return (
    <Dialog aria-label={t('label')} className="flex max-h-[min(70vh,32rem)] flex-col p-0">
      <Autocomplete inputValue={query} onInputChange={setQuery} filter={contains}>
        <SearchField
          aria-label={t('label')}
          placeholder={t('placeholder')}
          autoFocus
          className="m-3"
        />
        <ListBox
          aria-label={t('label')}
          items={sections}
          onAction={(key) => {
            onClose()
            commandById.get(String(key))?.run()
          }}
          renderEmptyState={() => (
            <p className="px-3 py-2 text-sm text-muted-foreground">{t('noMatch')}</p>
          )}
          className="min-h-0 flex-1 overflow-y-auto border-t border-border p-2 outline-none"
        >
          {(section) => (
            <DropdownSection
              id={`section-${section.id}`}
              title={section.title}
              items={section.items}
            >
              {(command) => (
                <DropdownItem
                  id={command.id}
                  textValue={[command.label, command.detail, command.keywords]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {command.color ? (
                    <span
                      aria-hidden
                      className="mx-0.5 size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: command.color }}
                    />
                  ) : (
                    command.icon && <command.icon aria-hidden className="size-4 shrink-0" />
                  )}
                  <span className="min-w-0 truncate">
                    {command.label}
                    {command.detail && (
                      <span className="group-focused:text-primary-foreground/80 text-muted-foreground">
                        {' · '}
                        {command.detail}
                      </span>
                    )}
                  </span>
                  {command.shortcut && (
                    <span className="ml-auto pl-4">
                      <KeyCombo accelerator={command.shortcut} />
                    </span>
                  )}
                </DropdownItem>
              )}
            </DropdownSection>
          )}
        </ListBox>
      </Autocomplete>
      {error && (
        <p className="border-t border-border px-4 py-2 text-sm text-destructive">{error}</p>
      )}
    </Dialog>
  )
}
