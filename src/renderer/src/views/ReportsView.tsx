import { getLocalTimeZone, today } from '@internationalized/date'
import { useEffect, useMemo, useState } from 'react'
import { useLocale } from 'react-aria-components'
import { RiDownload2Line } from '@remixicon/react'
import { useTranslations } from 'use-intl'
import type { Project } from '../../../shared/projects'
import type { AggregateRow, Grouping } from '../../../shared/reports'
import type { Tag } from '../../../shared/tags'
import { Button } from '../components/atoms/Button'
import { Select, SelectItem } from '../components/atoms/Select'
import { ToggleButton } from '../components/atoms/ToggleButton'
import { ToggleButtonGroup } from '../components/atoms/ToggleButtonGroup'
import { PeriodPicker } from '../components/molecules/PeriodPicker'
import { TimelineChart } from '../components/molecules/TimelineChart'
import { ViewHeader } from '../components/molecules/ViewHeader'
import { ReportBreakdown, type Breakdown } from '../components/organisms/ReportBreakdown'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { useProfiles } from '../hooks/useProfiles'
import { api } from '../lib/api'
import { formatDuration } from '../lib/duration'
import { periodFilter, presetRange, type Period } from '../lib/period'
import { computeKpis, dataRange } from '../lib/report'

const breakdowns: readonly Breakdown[] = ['project', 'tag', 'projectTag']

const breakdownGrouping: Record<Breakdown, readonly Grouping[]> = {
  project: ['project', 'activity'],
  tag: ['tag'],
  projectTag: ['project', 'tag']
}

interface ReportData {
  readonly breakdownKind: Breakdown
  readonly timeline: readonly AggregateRow[]
  readonly breakdown: readonly AggregateRow[]
}

interface KpiProps {
  readonly label: string
  readonly value: string
}

function Kpi({ label, value }: KpiProps): React.JSX.Element {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3">
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
    </div>
  )
}

function ReportsView(): React.JSX.Element {
  const t = useTranslations('ReportsView')
  const errorMessage = useErrorMessage()
  const { locale } = useLocale()
  const { activeProfile } = useProfiles()
  const [period, setPeriod] = useState<Period>(() => ({
    preset: 'thisMonth',
    range: presetRange('thisMonth', today(getLocalTimeZone()), locale)
  }))
  const [breakdown, setBreakdown] = useState<Breakdown>('project')
  const [projectIds, setProjectIds] = useState<readonly number[]>([])
  const [tagIds, setTagIds] = useState<readonly number[]>([])
  const [projects, setProjects] = useState<readonly Project[]>([])
  const [tags, setTags] = useState<readonly Tag[]>([])
  const [data, setData] = useState<ReportData | null>(null)
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
    Promise.all([
      api.reports.aggregate(filter, ['date', 'project']),
      api.reports.aggregate(filter, breakdownGrouping[breakdown])
    ])
      .then(([timeline, breakdownRows]) => {
        if (!isCurrent) return
        setData({ timeline, breakdownKind: breakdown, breakdown: breakdownRows })
        setError(null)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [activeProfile?.path, filter, breakdown, errorMessage])

  const kpis = computeKpis(data?.timeline ?? [])

  const exportCsv = async (): Promise<void> => {
    try {
      await api.export.csv(filter)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }
  const chartRange = period.range ?? dataRange(data?.timeline ?? [])

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title={t('title')}
        actions={
          <Button variant="secondary" onPress={exportCsv} isDisabled={kpis.totalSec === 0}>
            <RiDownload2Line className="size-4" />
            {t('exportCsv')}
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
      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-8 py-6">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="grid grid-cols-3 gap-3">
          <Kpi label={t('total')} value={formatDuration(kpis.totalSec)} />
          <Kpi label={t('trackedDays')} value={String(kpis.trackedDays)} />
          <Kpi
            label={t('average')}
            value={formatDuration(kpis.trackedDays ? kpis.totalSec / kpis.trackedDays : 0)}
          />
        </div>
        {data && kpis.totalSec === 0 && (
          <p className="text-center text-sm text-muted-foreground">{t('empty')}</p>
        )}
        {data && kpis.totalSec > 0 && chartRange && (
          <>
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold">{t('timeline')}</h2>
              <div className="rounded-xl border border-border bg-card p-4">
                <TimelineChart rows={data.timeline} range={chartRange} />
              </div>
            </section>
            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{t('distribution')}</h2>
                <ToggleButtonGroup
                  aria-label={t('breakdown')}
                  selectionMode="single"
                  disallowEmptySelection
                  selectedKeys={[breakdown]}
                  onSelectionChange={(keys) => {
                    const [selected] = keys
                    if (breakdowns.includes(selected as Breakdown))
                      setBreakdown(selected as Breakdown)
                  }}
                >
                  {breakdowns.map((option) => (
                    <ToggleButton key={option} id={option}>
                      {t(`breakdowns.${option}`)}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </div>
              <ReportBreakdown
                breakdown={data.breakdownKind}
                rows={data.breakdown}
                timelineRows={data.timeline}
                totalSec={kpis.totalSec}
              />
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default ReportsView
