import { getLocalTimeZone, today } from '@internationalized/date'
import {
  RiArrowGoBackLine,
  RiDownload2Line,
  RiEqualizerLine,
  RiAddLine,
  RiSaveLine
} from '@remixicon/react'
import { useEffect, useMemo, useState } from 'react'
import { useLocale } from 'react-aria-components'
import { useSearchParams } from 'react-router'
import { useTranslations } from 'use-intl'
import {
  defaultExportColumns,
  exportFormats,
  exportLayouts,
  type ExportColumn,
  type ExportFormat,
  type ExportLayout,
  type ExportPreview,
  type ExportTemplate
} from '../../../shared/export'
import type { Client } from '../../../shared/clients'
import type { CustomField } from '../../../shared/customFields'
import type { Project } from '../../../shared/projects'
import type { Tag } from '../../../shared/tags'
import { Button } from '../components/atoms/Button'
import { Select, SelectItem } from '../components/atoms/Select'
import { ToggleButton } from '../components/atoms/ToggleButton'
import { ExportPreviewTable } from '../components/molecules/ExportPreviewTable'
import { ExportTemplateDialog } from '../components/molecules/ExportTemplateDialog'
import { FilterButton } from '../components/molecules/FilterButton'
import { PeriodPicker } from '../components/molecules/PeriodPicker'
import { ViewHeader } from '../components/molecules/ViewHeader'
import { ExportColumnsEditor } from '../components/organisms/ExportColumnsEditor'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { useProfiles } from '../hooks/useProfiles'
import { api } from '../lib/api'
import { periodFilter, presetRange, type Period } from '../lib/period'

/** What the file looks like, whether it comes from a template or is put together on the fly. */
interface ExportDraft {
  readonly format: ExportFormat
  readonly layout: ExportLayout
  readonly columns: readonly ExportColumn[]
}

const STANDARD = 'standard'

const standardDraft: ExportDraft = {
  format: 'csv',
  layout: 'entries',
  columns: defaultExportColumns
}

function draftOf(template: ExportTemplate | undefined): ExportDraft {
  return template
    ? { format: template.format, layout: template.layout, columns: template.columns }
    : standardDraft
}

/** Compares drafts as they would be saved: blank headers and missing aggregations mean none. */
function isSameDraft(a: ExportDraft, b: ExportDraft): boolean {
  const normalize = ({ format, layout, columns }: ExportDraft): string =>
    JSON.stringify({
      format,
      layout,
      columns: columns.map((column) => [
        'builtin' in column ? column.builtin : column.fieldId,
        column.header?.trim() || null,
        column.aggregation ?? null
      ])
    })
  return normalize(a) === normalize(b)
}

function ExportView(): React.JSX.Element {
  const t = useTranslations('ExportView')
  const errorMessage = useErrorMessage()
  const { locale } = useLocale()
  const { activeProfile } = useProfiles()
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
  const [fields, setFields] = useState<readonly CustomField[]>([])
  const [templates, setTemplates] = useState<readonly ExportTemplate[] | null>(null)
  const [draft, setDraft] = useState<ExportDraft>(standardDraft)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [isSaveOpen, setSaveOpen] = useState(false)
  const [isEditing, setEditing] = useState(false)
  const [preview, setPreview] = useState<ExportPreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const templateKey = searchParams.get('template') ?? STANDARD
  const template = templates?.find((candidate) => String(candidate.id) === templateKey)
  const isModified = !isSameDraft(draft, draftOf(template))

  // A template chosen here or linked from elsewhere replaces the draft once the templates are
  // loaded; saving sets the key first, so the draft stays as it is.
  if (templates !== null && loadedKey !== templateKey) {
    setLoadedKey(templateKey)
    setDraft(draftOf(template))
  }

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
      api.customFields.list({ includeArchived: true }),
      api.exportTemplates.list()
    ])
      .then(([loadedClients, loadedProjects, loadedTags, loadedFields, loadedTemplates]) => {
        if (!isCurrent) return
        setClients(loadedClients)
        setProjects(loadedProjects)
        setTags(loadedTags)
        setFields(loadedFields)
        setTemplates(loadedTemplates)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [activeProfile?.path, errorMessage])

  const { columns, layout, format } = draft
  const isLoaded = templates !== null && loadedKey === templateKey

  useEffect(() => {
    if (!isLoaded) return
    let isCurrent = true
    api.export
      .preview(filter, columns, layout)
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
  }, [isLoaded, filter, columns, layout, errorMessage])

  const showTemplate = (key: string): void => {
    setSearchParams(key === STANDARD ? {} : { template: key }, { replace: true })
  }

  /** Shows another template without loading it, because the draft already is its content. */
  const keepDraftAs = (key: string): void => {
    setLoadedKey(key)
    showTemplate(key)
  }

  const reloadTemplates = async (): Promise<void> => {
    setTemplates(await api.exportTemplates.list())
  }

  const run = async (action: () => Promise<void>): Promise<void> => {
    try {
      await action()
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  const exportFile = (): Promise<void> =>
    run(async () => {
      await api.export.file(filter, format, columns, layout)
    })

  const saveAsTemplate = async (name: string): Promise<void> => {
    const saved = await api.exportTemplates.create({ name, ...draft, columns: [...columns] })
    await reloadTemplates()
    keepDraftAs(String(saved.id))
  }

  const updateTemplate = (): Promise<void> =>
    run(async () => {
      if (!template) return
      await api.exportTemplates.update(template.id, {
        name: template.name,
        ...draft,
        columns: [...columns]
      })
      await reloadTemplates()
    })

  const filterCount = projectIds.length + clientIds.length + tagIds.length

  const clearFilters = (): void => {
    setProjectIds([])
    setClientIds([])
    setTagIds([])
  }

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title={t('title')}
        help={t('help')}
        helpTopic="export"
        actions={
          <Button onPress={exportFile} isDisabled={!preview || preview.count === 0}>
            <RiDownload2Line className="size-4" />
            {t('export')}
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2 pb-4">
          <PeriodPicker value={period} onChange={setPeriod} />
          <FilterButton count={filterCount} onClear={clearFilters}>
            <Select
              label={t('projects')}
              placeholder={t('allProjects')}
              search={{ label: t('searchProjects'), empty: t('noMatches') }}
              selectionMode="multiple"
              value={[...projectIds]}
              onChange={(keys) => setProjectIds(keys.map(Number))}
            >
              {projects.map((project) => (
                <SelectItem key={project.id} id={project.id} textValue={project.name}>
                  {project.name}
                </SelectItem>
              ))}
            </Select>
            <Select
              label={t('clients')}
              placeholder={t('allClients')}
              search={{ label: t('searchClients'), empty: t('noMatches') }}
              selectionMode="multiple"
              value={[...clientIds]}
              onChange={(keys) => setClientIds(keys.map(Number))}
            >
              {clients.map((client) => (
                <SelectItem key={client.id} id={client.id} textValue={client.name}>
                  {client.name}
                </SelectItem>
              ))}
            </Select>
            <Select
              label={t('tags')}
              placeholder={t('allTags')}
              search={{ label: t('searchTags'), empty: t('noMatches') }}
              selectionMode="multiple"
              value={[...tagIds]}
              onChange={(keys) => setTagIds(keys.map(Number))}
            >
              {tags.map((tag) => (
                <SelectItem key={tag.id} id={tag.id} textValue={tag.name}>
                  {tag.name}
                </SelectItem>
              ))}
            </Select>
          </FilterButton>
        </div>
      </ViewHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-8 py-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-2">
            <Select
              label={t('template')}
              value={templateKey}
              onChange={(key) => key && showTemplate(String(key))}
              className="w-48"
            >
              <SelectItem id={STANDARD}>{t('standardTemplate')}</SelectItem>
              {(templates ?? []).map((candidate) => (
                <SelectItem key={candidate.id} id={String(candidate.id)}>
                  {candidate.name}
                </SelectItem>
              ))}
            </Select>
            <ToggleButton isSelected={isEditing} onChange={setEditing}>
              <RiEqualizerLine className="size-4" />
              {t('customize')}
              {isModified && (
                <>
                  <span
                    aria-hidden
                    className="absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-background bg-primary"
                  />
                  <span className="sr-only">{t('modified')}</span>
                </>
              )}
            </ToggleButton>
          </div>
          {isEditing && (
            <div className="flex flex-col gap-4 border-y border-border py-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="flex flex-wrap items-end gap-2">
                  <Select
                    label={t('format')}
                    value={format}
                    onChange={(key) => key && setDraft({ ...draft, format: key as ExportFormat })}
                    className="w-44"
                  >
                    {exportFormats.map((option) => (
                      <SelectItem key={option} id={option}>
                        {option.toUpperCase()}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label={t('layout')}
                    value={layout}
                    onChange={(key) => key && setDraft({ ...draft, layout: key as ExportLayout })}
                    className="w-56"
                  >
                    {exportLayouts.map((option) => (
                      <SelectItem key={option} id={option}>
                        {t(`layouts.${option}`)}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  {template && (
                    <Button
                      variant="secondary"
                      className="size-9 px-0"
                      aria-label={t('updateTemplate', { name: template.name })}
                      isDisabled={!isModified || !preview}
                      onPress={updateTemplate}
                    >
                      <RiSaveLine className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    className="size-9 px-0"
                    aria-label={template ? t('saveAsNewTemplate') : t('saveAsTemplate')}
                    isDisabled={!preview}
                    onPress={() => setSaveOpen(true)}
                  >
                    <span aria-hidden className="relative">
                      <RiSaveLine className="size-4" />
                      <RiAddLine className="absolute -right-1.5 -bottom-1.5 size-3 rounded-full bg-secondary" />
                    </span>
                  </Button>
                  <Button
                    variant="secondary"
                    className="size-9 px-0"
                    aria-label={t('discardChanges')}
                    isDisabled={!isModified}
                    onPress={() => setDraft(draftOf(template))}
                  >
                    <RiArrowGoBackLine className="size-4" />
                  </Button>
                </div>
              </div>
              <ExportColumnsEditor
                fields={fields}
                layout={layout}
                columns={columns}
                onColumnsChange={(changed) => setDraft({ ...draft, columns: changed })}
              />
            </div>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {preview && <ExportPreviewTable preview={preview} format={format} />}
      </div>
      {isSaveOpen && (
        <ExportTemplateDialog
          title={t('saveAsTitle')}
          actionLabel={t('save')}
          onClose={() => setSaveOpen(false)}
          onSave={saveAsTemplate}
        />
      )}
    </div>
  )
}

export default ExportView
