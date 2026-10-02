import { ResponsivePie } from '@nivo/pie'
import { chartTheme } from '../../lib/chartTheme'
import { formatDuration } from '../../lib/duration'
import type { ShareItem } from '../../lib/report'
import { ChartTooltip } from './ChartTooltip'

interface SharePieChartProps {
  readonly items: readonly ShareItem[]
  readonly formatShare: (totalSec: number) => string
}

export function SharePieChart({ items, formatShare }: SharePieChartProps): React.JSX.Element {
  return (
    <div className="h-56">
      <ResponsivePie
        data={items.map(({ id, label, color, totalSec }) => ({
          id,
          label,
          color,
          value: totalSec
        }))}
        colors={({ data }) => data.color}
        margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
        innerRadius={0.62}
        padAngle={1}
        cornerRadius={3}
        activeOuterRadiusOffset={4}
        enableArcLabels={false}
        enableArcLinkLabels={false}
        theme={chartTheme}
        tooltip={({ datum }) => (
          <ChartTooltip
            color={datum.color}
            title={String(datum.label)}
            detail={`${formatShare(datum.value)} · ${formatDuration(datum.value)}`}
          />
        )}
      />
    </div>
  )
}
