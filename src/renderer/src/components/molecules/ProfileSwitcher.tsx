import { useState } from 'react'
import { RiAddLine, RiExpandUpDownLine, RiFolderOpenLine, RiSettings3Line } from '@remixicon/react'
import { Button } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { ProfileSummary } from '../../../../shared/profiles'
import { useProfiles } from '../../hooks/useProfiles'
import { Menu, MenuItem, MenuSection, MenuSeparator, MenuTrigger } from '../atoms/Menu'
import { focusRing } from '../atoms/utils'
import { CreateProfileDialog } from './CreateProfileDialog'
import { InvalidProfileAlert } from './InvalidProfileAlert'

function fileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path
}

export function ProfileSwitcher(): React.JSX.Element {
  const t = useTranslations('ProfileSwitcher')
  const { profiles, activeProfile, setActiveProfile, openProfile } = useProfiles()
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [isInvalidOpen, setInvalidOpen] = useState(false)

  const handleOpen = async (): Promise<void> => {
    if ((await openProfile()) === 'invalid') setInvalidOpen(true)
  }

  const label = (profile: ProfileSummary): string =>
    profile.name ?? t('missing', { file: fileName(profile.path) })

  return (
    <>
      <MenuTrigger placement="bottom start" popoverClassName="min-w-(--trigger-width)">
        <Button
          aria-label={t('label')}
          className={(renderProps) =>
            focusRing({
              ...renderProps,
              className:
                'flex w-full cursor-default items-center gap-2 rounded-lg border border-sidebar-border bg-card px-3 py-2 text-left text-sm shadow-xs transition hover:bg-sidebar-accent pressed:bg-sidebar-accent'
            })
          }
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs text-muted-foreground">{t('label')}</span>
            <span className="truncate font-medium">
              {activeProfile ? label(activeProfile) : t('none')}
            </span>
          </span>
          <RiExpandUpDownLine aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        </Button>
        <Menu>
          {profiles.length > 0 && (
            <>
              <MenuSection
                title={t('profiles')}
                items={profiles}
                selectionMode="single"
                selectedKeys={activeProfile ? [activeProfile.path] : []}
                onSelectionChange={(keys) => {
                  const [key] = keys === 'all' ? [] : [...keys]
                  if (key !== undefined) setActiveProfile(String(key))
                }}
              >
                {(profile) => (
                  <MenuItem
                    id={profile.path}
                    textValue={label(profile)}
                    isDisabled={!profile.isAvailable}
                  >
                    {label(profile)}
                  </MenuItem>
                )}
              </MenuSection>
              <MenuSeparator />
            </>
          )}
          {activeProfile?.isAvailable && (
            <MenuItem href="/profile" textValue={t('profileSettings')}>
              <RiSettings3Line aria-hidden className="size-4" />
              {t('profileSettings')}
            </MenuItem>
          )}
          <MenuItem onAction={() => setCreateOpen(true)} textValue={t('newProfile')}>
            <RiAddLine aria-hidden className="size-4" />
            {t('newProfile')}
          </MenuItem>
          <MenuItem onAction={handleOpen} textValue={t('openProfile')}>
            <RiFolderOpenLine aria-hidden className="size-4" />
            {t('openProfile')}
          </MenuItem>
        </Menu>
      </MenuTrigger>
      <CreateProfileDialog isOpen={isCreateOpen} onOpenChange={setCreateOpen} />
      <InvalidProfileAlert isOpen={isInvalidOpen} onOpenChange={setInvalidOpen} />
    </>
  )
}
