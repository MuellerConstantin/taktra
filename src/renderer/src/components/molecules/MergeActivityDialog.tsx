import { useEffect, useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { ActivityRef, ActivityWithTags } from '../../../../shared/activities'
import type { Client } from '../../../../shared/clients'
import { isSimilarName } from '../../../../shared/names'
import type { Project } from '../../../../shared/projects'
import type { Tag } from '../../../../shared/tags'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { api } from '../../lib/api'
import { Button } from '../atoms/Button'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { Select, SelectItem } from '../atoms/Select'

interface MergeActivityDialogProps {
  readonly activity: ActivityRef
  readonly onClose: () => void
  readonly onMerged: (targetId: number) => void
}

interface Loaded {
  readonly projects: readonly Project[]
  readonly activities: readonly ActivityWithTags[]
  readonly clients: readonly Client[]
  readonly tags: readonly Tag[]
  readonly entryCount: number
}

export function MergeActivityDialog({
  activity,
  onClose,
  onMerged
}: MergeActivityDialogProps): React.JSX.Element {
  const t = useTranslations('MergeActivityDialog')
  const errorMessage = useErrorMessage()
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [targetId, setTargetId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)

  useEffect(() => {
    Promise.all([
      api.projects.list({ includeArchived: true }),
      api.activities.list({ includeArchived: true }),
      api.clients.list({ includeArchived: true }),
      api.tags.list(),
      api.timeEntries.list({ activityId: activity.id })
    ])
      .then(([projects, activities, clients, tags, entries]) =>
        setLoaded({ projects, activities, clients, tags, entryCount: entries.length })
      )
      .catch((caught) => setError(errorMessage(caught)))
  }, [activity.id, errorMessage])

  const projectOf = (projectId: number): Project | undefined =>
    loaded?.projects.find((project) => project.id === projectId)
  const source = loaded?.activities.find((candidate) => candidate.id === activity.id)
  const target = loaded?.activities.find((candidate) => candidate.id === targetId)
  const targets = (loaded?.activities ?? [])
    .filter(
      (candidate) => candidate.id !== activity.id && !projectOf(candidate.projectId)?.archivedAt
    )
    .sort(
      (a, b) =>
        Number(isSimilarName(b.name, activity.name)) - Number(isSimilarName(a.name, activity.name))
    )

  const clientOf = (candidate: ActivityWithTags): number | null =>
    projectOf(candidate.projectId)?.clientId ?? candidate.clientId
  const clientName = (clientId: number | null): string =>
    loaded?.clients.find((client) => client.id === clientId)?.name ?? t('noClient')
  const tagNames = (tagIds: readonly number[]): string =>
    loaded?.tags
      .filter((tag) => tagIds.includes(tag.id))
      .map((tag) => tag.name)
      .join(', ') || t('noTags')
  const sameTags = (a: readonly number[], b: readonly number[]): boolean =>
    a.length === b.length && a.every((tagId) => b.includes(tagId))

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (targetId === null) return
    setPending(true)
    setError(null)
    try {
      await api.activities.merge(activity.id, targetId)
      onMerged(targetId)
      onClose()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal isOpen onOpenChange={(isOpen) => !isOpen && onClose()} isDismissable>
      <Dialog>
        {({ close }) => (
          <Form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <DialogHeading>{t('title', { name: activity.name })}</DialogHeading>
            <Select
              label={t('targetLabel')}
              placeholder={t('targetPlaceholder')}
              search={{ label: t('searchActivities'), empty: t('noActivities') }}
              items={targets}
              value={targetId}
              onChange={(key) => setTargetId(typeof key === 'number' ? key : null)}
              isRequired
              autoFocus
            >
              {(candidate) => (
                <SelectItem
                  id={candidate.id}
                  textValue={`${candidate.name} ${projectOf(candidate.projectId)?.name ?? ''}`}
                >
                  <span className="min-w-0 truncate">
                    {candidate.name}
                    <span className="group-focused:text-primary-foreground/80 text-muted-foreground">
                      {` · ${projectOf(candidate.projectId)?.name ?? ''}`}
                      {candidate.archivedAt && ` · ${t('archived')}`}
                    </span>
                  </span>
                </SelectItem>
              )}
            </Select>
            {loaded && target && source && (
              <div className="flex flex-col gap-2 text-sm">
                <p className="text-muted-foreground">
                  {t('summary', {
                    count: loaded.entryCount,
                    source: activity.name,
                    target: target.name
                  })}
                </p>
                {target.projectId !== source.projectId && (
                  <p className="text-destructive">
                    {t('projectChanges', {
                      from: projectOf(source.projectId)?.name ?? '',
                      to: projectOf(target.projectId)?.name ?? ''
                    })}
                  </p>
                )}
                {clientOf(target) !== clientOf(source) && (
                  <p className="text-destructive">
                    {t('clientChanges', {
                      from: clientName(clientOf(source)),
                      to: clientName(clientOf(target))
                    })}
                  </p>
                )}
                {!sameTags(source.tagIds, target.tagIds) && (
                  <p className="text-destructive">
                    {t('tagsChange', {
                      from: tagNames(source.tagIds),
                      to: tagNames(target.tagIds)
                    })}
                  </p>
                )}
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onPress={close}>
                {t('cancel')}
              </Button>
              <Button type="submit" isDisabled={isPending || targetId === null}>
                {t('merge')}
              </Button>
            </div>
          </Form>
        )}
      </Dialog>
    </Modal>
  )
}
