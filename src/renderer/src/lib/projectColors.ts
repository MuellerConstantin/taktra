import type { Project } from '../../../shared/projects'

export const PROJECT_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#78716c'
] as const

/** The palette color used by the fewest projects; ties go to the earlier palette entry. */
export function suggestProjectColor(projects: readonly Project[]): string {
  const usage = new Map<string, number>(PROJECT_COLORS.map((color) => [color, 0]))
  for (const { color } of projects) {
    if (color && usage.has(color)) usage.set(color, usage.get(color)! + 1)
  }
  return PROJECT_COLORS.reduce((best, color) =>
    usage.get(color)! < usage.get(best)! ? color : best
  )
}
