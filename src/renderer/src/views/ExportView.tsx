import { getLocalTimeZone, today } from '@internationalized/date'
import { RiAddLine, RiDownload2Line, RiPencilLine } from '@remixicon/react'
import { useEffect, useMemo, useState } from 'react'
import { useLocale } from 'react-aria-components'
import { useNavigate, useSearchParams } from 'react-router'
import { useTranslations } from 'use-intl'
import {
  exportFormats,
  type ExportFormat,
  type ExportPreview,
  type ExportTemplate
} from '../../../shared/export'
import type { Client } from '../../../shared/clients'
import type { Project } from '../../../shared/projects'
import type { Tag } from '../../../shared/tags'
import { Button } from '../components/atoms/Button'
import { Select, SelectItem } from '../components/atoms/Select'
import { ExportPreviewTable } from '../components/molecules/ExportPreviewTable'
import { PeriodPicker } from '../components/molecules/PeriodPicker'
import { ViewHeader } from '../components/molecules/ViewHeader'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { useProfiles } from '../hooks/useProfiles'
import { api } from '../lib/api'
import { formatDuration } from '../lib/duration'
import { periodFilter, presetRange, type Period } from '../lib/period'

function ExportView(): React.JSX.Element {
  const t = useTranslations('ExportView')
  const errorMessage = useErrorMessage()
  const { locale } = useLocale()
  const { activeProfile } = useProfiles()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [period, setPeriod] = useState<Period>(() => ({
    preset: 'lastMonth',
    range: presetRange('lastMonth', today(getLocalTimeZone()), locale)
  }))
  const [clientIds, setClientIds] = useState<readonly number[]>([])
  const [projectIds, setProjectIds] = useState<readonly number[]>([])
  const [tagIds, setTagIds] = useState<readonly number[]>([])
  const [clients, setClients] = useState<readonly Client[]>([])
  const [projects, setProjects] = useState<readonly Project[]>([])
  const [tags, setTags] = useState<readonly Tag[]>([])
  const [templates, setTemplates] = useState<readonly ExportTemplate[] | null>(null)
  const [chosenFormat, setFormat] = useState<ExportFormat | null>(null)
  const [preview, setPreview] = useState<ExportPreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const template = templates?.find(
    (candidate) => String(candidate.id) === searchParams.get('template')
  )
  const columns = template?.columns
  const format = chosenFormat ?? template?.format ?? 'csv'

  const { from, to } = periodFilter(period)
  const filter = useMemo(
    () => ({
      from,
      to,
      clientIds: clientIds.length > 0 ? clientIds : undefined,
      projectIds: projectIds.length > 0 ? projectIds : undefined,
      tagIds: tagIds.length > 0 ? tagIds : undefined
    }),
    [from, to, clientIds, projectIds, tagIds]
  )

  useEffect(() => {
    let isCurrent = true
    Promise.all([
      api.clients.list({ includeArchived: true }),
      api.projects.list({ includeArchived: true }),
      api.tags.list(),
      api.exportTemplates.list()
    ])
      .then(([loadedClients, loadedProjects, loadedTags, loadedTemplates]) => {
        if (!isCurrent) return
        setClients(loadedClients)
        setProjects(loadedProjects)
        setTags(loadedTags)
        setTemplates(loadedTemplates)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [activeProfile?.path, errorMessage])

  useEffect(() => {
    if (templates === null) return
    let isCurrent = true
    api.export
      .preview(filter, columns)
      .then((loaded) => {
        if (!isCurrent) return
        setPreview(loaded)
        setError(null)
      })
      .catch((caught) => {
        if (!isCurrent) return
        setPreview(null)
        setError(errorMessage(caught))
      })
    return () => {
      isCurrent = false
    }
  }, [activeProfile?.path, templates, filter, columns, errorMessage])

  const chooseTemplate = (id: string): void => {
    setFormat(null)
    setSearchParams(id === 'default' ? {} : { template: id }, { replace: true })
  }

  const exportFile = async (): Promise<void> => {
    try {
      await api.export.file(filter, format, columns)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title={t('title')}
        help={t('help')}
        actions={
          <>
            <Select
              aria-label={t('template')}
              value={template ? String(template.id) : 'default'}
              onChange={(key) => key && chooseTemplate(String(key))}
              className="w-56"
            >
              <SelectItem id="default">{t('defaultTemplate')}</SelectItem>
              {(templates ?? []).map((candidate) => (
                <SelectItem key={candidate.id} id={String(candidate.id)}>
                  {candidate.name}
                </SelectItem>
              ))}
            </Select>
            <Button
              variant="icon"
              aria-label={t('editTemplate')}
              isDisabled={!template}
              onPress={() => template && navigate(`/export/templates/${template.id}`)}
            >
              <RiPencilLine className="size-4" />
            </Button>
            <Button
              variant="icon"
              aria-label={t('newTemplate')}
              onPress={() => navigate('/export/templates/new')}
            >
              <RiAddLine className="size-4" />
            </Button>
            <Select
              aria-label={t('format')}
              value={format}
              onChange={(key) => key && setFormat(key as ExportFormat)}
              className="w-48"
            >
              {exportFormats.map((option) => (
                <SelectItem key={option} id={option}>
                  {t(`formats.${option}`)}
                </SelectItem>
              ))}
            </Select>
            <Button onPress={exportFile} isDisabled={!preview || preview.count === 0}>
              <RiDownload2Line className="size-4" />
              {t('export')}
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2 pb-4">
          <Select
            aria-label={t('projects')}
            placeholder={t('allProjects')}
            search={{ label: t('searchProjects'), empty: t('noMatches') }}
            selectionMode="multiple"
            value={[...projectIds]}
            onChange={(keys) => setProjectIds(keys.map(Number))}
            className="w-48"
          >
            {projects.map((project) => (
              <SelectItem key={project.id} id={project.id} textValue={project.name}>
                {project.name}
              </SelectItem>
            ))}
          </Select>
          <Select
            aria-label={t('clients')}
            placeholder={t('allClients')}
            search={{ label: t('searchClients'), empty: t('noMatches') }}
            selectionMode="multiple"
            value={[...clientIds]}
            onChange={(keys) => setClientIds(keys.map(Number))}
            className="w-60"
          >
            {clients.map((client) => (
              <SelectItem key={client.id} id={client.id} textValue={client.name}>
                {client.name}
              </SelectItem>
            ))}
          </Select>
          <Select
            aria-label={t('tags')}
            placeholder={t('allTags')}
            search={{ label: t('searchTags'), empty: t('noMatches') }}
            selectionMode="multiple"
            value={[...tagIds]}
            onChange={(keys) => setTagIds(keys.map(Number))}
            className="w-48"
          >
            {tags.map((tag) => (
              <SelectItem key={tag.id} id={tag.id} textValue={tag.name}>
                {tag.name}
              </SelectItem>
            ))}
          </Select>
          <PeriodPicker value={period} onChange={setPeriod} className="ml-auto" />
        </div>
      </ViewHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-8 py-6">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <dl className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3">
            <dt className="text-xs text-muted-foreground">{t('entries')}</dt>
            <dd className="text-xl font-semibold tabular-nums">{preview?.count ?? 0}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3">
            <dt className="text-xs text-muted-foreground">{t('total')}</dt>
            <dd className="text-xl font-semibold tabular-nums">
              {formatDuration((preview?.totalMin ?? 0) * 60)}
            </dd>
          </div>
        </dl>
        {preview && <ExportPreviewTable preview={preview} />}
      </div>
    </div>
  )
}

export default ExportView
