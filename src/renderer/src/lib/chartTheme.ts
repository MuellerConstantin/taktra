import type { ResponsiveBar } from '@nivo/bar'

export const chartTheme: React.ComponentProps<typeof ResponsiveBar>['theme'] = {
  background: 'transparent',
  text: {
    fontFamily: 'inherit',
    fontSize: 11,
    fill: 'var(--muted-foreground)'
  },
  axis: {
    domain: { line: { stroke: 'transparent' } },
    ticks: {
      line: { stroke: 'var(--border)' },
      text: { fill: 'var(--muted-foreground)' }
    }
  },
  grid: {
    line: { stroke: 'var(--border)', strokeDasharray: '2 4' }
  },
  tooltip: {
    container: { background: 'transparent', boxShadow: 'none', padding: 0 }
  }
}
