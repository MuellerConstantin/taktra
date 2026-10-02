import { useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { ProfileSummary } from '../../../../../shared/profiles'
import { Button } from '../../../components/atoms/Button'
import { TextField } from '../../../components/atoms/TextField'
import { DeleteProfileSection } from '../../../components/molecules/DeleteProfileSection'
import { useProfiles } from '../../../hooks/useProfiles'

interface ProfileNameFormProps {
  readonly profile: ProfileSummary
  readonly currentName: string
}

function ProfileNameForm({ profile, currentName }: ProfileNameFormProps): React.JSX.Element {
  const t = useTranslations('ProfileGeneralSettings')
  const { renameProfile } = useProfiles()
  const [name, setName] = useState(currentName)
  const [isPending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isChanged = name.trim() !== currentName

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await renameProfile(profile.path, name.trim())
    } catch {
      setError(t('renameFailed'))
    } finally {
      setPending(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <div className="flex items-start gap-2">
        <TextField
          label={t('nameLabel')}
          description={t('nameDescription')}
          value={name}
          onChange={setName}
          isRequired
          validate={(value) => (value.trim() ? null : t('nameRequired'))}
          className="min-w-0 flex-1"
        />
        <Button type="submit" isDisabled={!isChanged || isPending} className="mt-6">
          {t('save')}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </Form>
  )
}

function ProfileGeneralSettings(): React.JSX.Element | null {
  const { activeProfile } = useProfiles()

  if (!activeProfile?.name) return null

  return (
    <div className="flex flex-col gap-10">
      <ProfileNameForm
        key={activeProfile.path}
        profile={activeProfile}
        currentName={activeProfile.name}
      />
      <DeleteProfileSection profile={activeProfile} profileName={activeProfile.name} />
    </div>
  )
}

export default ProfileGeneralSettings
