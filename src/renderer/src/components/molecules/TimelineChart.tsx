import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
import { ResponsiveBar, type BarDatum } from '@nivo/bar'
import { useLocale } from 'react-aria-components'
import type { AggregateRow } from '../../../../shared/reports'
import { chartTheme } from '../../lib/chartTheme'
import { formatDuration } from '../../lib/duration'
import type { DateRange } from '../../lib/period'
import { bucketFor, bucketStart, bucketStarts, NEUTRAL_COLOR, type Bucket } from '../../lib/report'
import { ChartTooltip } from './ChartTooltip'

const MAX_TICKS = 10

const labelFormats: Record<Bucket, Intl.DateTimeFormatOptions> = {
  day: { day: 'numeric', month: 'numeric' },
  week: { day: 'numeric', month: 'short' },
  month: { month: 'short', year: '2-digit' }
}

interface TimelineChartProps {
  readonly rows: readonly AggregateRow[]
  readonly range: DateRange
}

export function TimelineChart({ rows, range }: TimelineChartProps): React.JSX.Element {
  const { locale } = useLocale()
  const bucket = bucketFor(range)
  const starts = bucketStarts(range, bucket, locale).map((start) => start.toString())
  const formatter = new DateFormatter(locale, labelFormats[bucket])
  const formatLabel = (value: string | number): string =>
    formatter.format(parseDate(String(value)).toDate(getLocalTimeZone()))

  const projects = new Map<string, { readonly name: string; readonly color: string }>()
  const data = new Map<string, BarDatum>(starts.map((start) => [start, { bucket: start }]))
  for (const { date, project, totalSec } of rows) {
    if (!date || !project) continue
    const key = String(project.id)
    projects.set(key, { name: project.name, color: project.color ?? NEUTRAL_COLOR })
    const datum = data.get(bucketStart(parseDate(date), bucket, locale).toString())
    if (datum) datum[key] = (Number(datum[key]) || 0) + totalSec / 3600
  }

  const tickStep = Math.ceil(starts.length / MAX_TICKS)

  return (
    <div className="h-64">
      <ResponsiveBar
        data={[...data.values()]}
        keys={[...projects.keys()]}
        indexBy="bucket"
        colors={({ id }) => projects.get(String(id))?.color ?? NEUTRAL_COLOR}
        margin={{ top: 8, right: 8, bottom: 28, left: 40 }}
        padding={0.3}
        borderRadius={2}
        enableLabel={false}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          format: formatLabel,
          tickValues: starts.filter((_, index) => index % tickStep === 0)
        }}
        axisLeft={{ tickSize: 0, tickPadding: 8, tickValues: 4, format: (value) => `${value} h` }}
        gridYValues={4}
        theme={chartTheme}
        tooltip={({ id, value, indexValue }) => (
          <ChartTooltip
            color={projects.get(String(id))?.color ?? NEUTRAL_COLOR}
            title={projects.get(String(id))?.name ?? ''}
            detail={`${formatLabel(indexValue)} · ${formatDuration(value * 3600)}`}
          />
        )}
      />
    </div>
  )
}
