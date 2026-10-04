import { getLocalTimeZone, today } from '@internationalized/date'
import { RiDownload2Line } from '@remixicon/react'
import { useEffect, useMemo, useState } from 'react'
import { useLocale } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import { exportColumns, type ExportPreview } from '../../../shared/export'
import type { Project } from '../../../shared/projects'
import type { Tag } from '../../../shared/tags'
import { Button } from '../components/atoms/Button'
import { Select, SelectItem } from '../components/atoms/Select'
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
  const [period, setPeriod] = useState<Period>(() => ({
    preset: 'lastMonth',
    range: presetRange('lastMonth', today(getLocalTimeZone()), locale)
  }))
  const [projectIds, setProjectIds] = useState<readonly number[]>([])
  const [tagIds, setTagIds] = useState<readonly number[]>([])
  const [projects, setProjects] = useState<readonly Project[]>([])
  const [tags, setTags] = useState<readonly Tag[]>([])
  const [preview, setPreview] = useState<ExportPreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { from, to } = periodFilter(period)
  const filter = useMemo(
    () => ({
      from,
      to,
      projectIds: projectIds.length > 0 ? projectIds : undefined,
      tagIds: tagIds.length > 0 ? tagIds : undefined
    }),
    [from, to, projectIds, tagIds]
  )

  useEffect(() => {
    let isCurrent = true
    Promise.all([api.projects.list({ includeArchived: true }), api.tags.list()])
      .then(([loadedProjects, loadedTags]) => {
        if (!isCurrent) return
        setProjects(loadedProjects)
        setTags(loadedTags)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [activeProfile?.path, errorMessage])

  useEffect(() => {
    let isCurrent = true
    api.export
      .preview(filter)
      .then((loaded) => {
        if (!isCurrent) return
        setPreview(loaded)
        setError(null)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [activeProfile?.path, filter, errorMessage])

  const exportCsv = async (): Promise<void> => {
    try {
      await api.export.csv(filter)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title={t('title')}
        actions={
          <Button onPress={exportCsv} isDisabled={!preview || preview.count === 0}>
            <RiDownload2Line className="size-4" />
            {t('export')}
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2 pb-4">
          <Select
            aria-label={t('projects')}
            placeholder={t('allProjects')}
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
            aria-label={t('tags')}
            placeholder={t('allTags')}
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
        <dl className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3">
            <dt className="text-xs text-muted-foreground">{t('format')}</dt>
            <dd className="text-sm font-medium">{t('csv')}</dd>
          </div>
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
        {preview && preview.count === 0 && (
          <p className="text-center text-sm text-muted-foreground">{t('empty')}</p>
        )}
        {preview && preview.count > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">
              {t('preview', { shown: preview.rows.length, count: preview.count })}
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    {exportColumns.map((column) => (
                      <th key={column} scope="col" className="px-3 py-2 font-medium">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, index) => (
                    <tr key={index} className="border-b border-border last:border-0">
                      {exportColumns.map((column) => (
                        <td
                          key={column}
                          className="max-w-64 truncate px-3 py-2 align-top"
                          title={String(row[column] ?? '')}
                        >
                          {row[column]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default ExportView
