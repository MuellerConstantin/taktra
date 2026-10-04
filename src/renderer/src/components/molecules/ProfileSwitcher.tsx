import { useState } from 'react'
import { RiAddLine, RiExpandUpDownLine, RiFolderOpenLine, RiSettings3Line } from '@remixicon/react'
import { Button } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { ProfileSummary } from '../../../../shared/profiles'
import { useProfiles } from '../../hooks/useProfiles'
import { useTimer } from '../../hooks/useTimer'
import { AlertDialog } from '../atoms/AlertDialog'
import { Menu, MenuItem, MenuSection, MenuSeparator, MenuTrigger } from '../atoms/Menu'
import { Modal } from '../atoms/Modal'
import { focusRing } from '../atoms/utils'
import { CreateProfileDialog } from './CreateProfileDialog'
import { OpenProfileErrorAlert } from './OpenProfileErrorAlert'
import { UnavailableProfileDialog } from './UnavailableProfileDialog'

function fileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path
}

export function ProfileSwitcher(): React.JSX.Element {
  const t = useTranslations('ProfileSwitcher')
  const { profiles, activeProfile, setActiveProfile, openProfile } = useProfiles()
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [openError, setOpenError] = useState<unknown>(null)
  const [unavailableProfile, setUnavailableProfile] = useState<ProfileSummary | null>(null)
  const { running } = useTimer()
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const confirmIfRunning = (action: () => void): void => {
    if (running) setPendingAction(() => action)
    else action()
  }

  const handleOpen = async (): Promise<void> => {
    try {
      await openProfile()
    } catch (error) {
      setOpenError(error)
    }
  }

  const label = (profile: ProfileSummary): string => {
    const name = profile.name ?? fileName(profile.path)
    return profile.unavailableReason ? t(profile.unavailableReason, { file: name }) : name
  }

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
                  if (key === undefined) return
                  const profile = profiles.find((candidate) => candidate.path === key)
                  if (profile?.isAvailable && profile.path !== activeProfile?.path)
                    confirmIfRunning(() => setActiveProfile(profile.path))
                }}
              >
                {(profile) => (
                  <MenuItem
                    id={profile.path}
                    textValue={label(profile)}
                    onAction={() => !profile.isAvailable && setUnavailableProfile(profile)}
                  >
                    <span
                      className={
                        profile.isAvailable
                          ? undefined
                          : 'text-muted-foreground group-focus:text-primary-foreground'
                      }
                    >
                      {label(profile)}
                    </span>
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
          <MenuItem
            onAction={() => confirmIfRunning(() => setCreateOpen(true))}
            textValue={t('newProfile')}
          >
            <RiAddLine aria-hidden className="size-4" />
            {t('newProfile')}
          </MenuItem>
          <MenuItem onAction={() => confirmIfRunning(handleOpen)} textValue={t('openProfile')}>
            <RiFolderOpenLine aria-hidden className="size-4" />
            {t('openProfile')}
          </MenuItem>
        </Menu>
      </MenuTrigger>
      <CreateProfileDialog isOpen={isCreateOpen} onOpenChange={setCreateOpen} />
      <OpenProfileErrorAlert error={openError} onClose={() => setOpenError(null)} />
      <UnavailableProfileDialog
        profile={unavailableProfile}
        onClose={() => setUnavailableProfile(null)}
      />
      <Modal
        isOpen={pendingAction !== null}
        onOpenChange={(isOpen) => !isOpen && setPendingAction(null)}
        isDismissable
      >
        {running && (
          <AlertDialog
            title={t('runningTimerTitle')}
            actionLabel={t('runningTimerAction')}
            cancelLabel={t('cancel')}
            onAction={() => pendingAction?.()}
          >
            {t('runningTimerText', { name: running.activity.name })}
          </AlertDialog>
        )}
      </Modal>
    </>
  )
}
