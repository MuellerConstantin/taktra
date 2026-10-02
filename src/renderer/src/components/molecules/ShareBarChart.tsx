import { ResponsiveBar } from '@nivo/bar'
import { chartTheme } from '../../lib/chartTheme'
import { formatDuration } from '../../lib/duration'
import type { ShareItem } from '../../lib/report'
import { ChartTooltip } from './ChartTooltip'

const ROW_HEIGHT = 28
const MAX_LABEL_LENGTH = 16

interface ShareBarChartProps {
  readonly items: readonly ShareItem[]
  readonly formatShare: (totalSec: number) => string
}

export function ShareBarChart({ items, formatShare }: ShareBarChartProps): React.JSX.Element {
  const byId = new Map(items.map((item) => [item.id, item]))
  const truncate = (label: string): string =>
    label.length > MAX_LABEL_LENGTH ? `${label.slice(0, MAX_LABEL_LENGTH - 1)}…` : label

  return (
    <div style={{ height: items.length * ROW_HEIGHT + 16 }}>
      <ResponsiveBar
        data={[...items].reverse().map(({ id, totalSec }) => ({ id, value: totalSec / 3600 }))}
        keys={['value']}
        indexBy="id"
        layout="horizontal"
        colors={({ indexValue }) => byId.get(String(indexValue))?.color ?? ''}
        margin={{ top: 8, right: 8, bottom: 8, left: 112 }}
        padding={0.35}
        borderRadius={2}
        enableLabel={false}
        enableGridY={false}
        axisBottom={null}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          format: (id) => truncate(byId.get(String(id))?.label ?? '')
        }}
        theme={chartTheme}
        tooltip={({ indexValue, value }) => {
          const item = byId.get(String(indexValue))
          return (
            <ChartTooltip
              color={item?.color ?? ''}
              title={item?.label ?? ''}
              detail={`${formatShare(value * 3600)} · ${formatDuration(value * 3600)}`}
            />
          )
        }}
      />
    </div>
  )
}
