export const COLORS = [
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

/** The palette color used by the fewest items; ties go to the earlier palette entry. */
export function suggestColor(items: readonly { readonly color: string | null }[]): string {
  const usage = new Map<string, number>(COLORS.map((color) => [color, 0]))
  for (const { color } of items) {
    if (color && usage.has(color)) usage.set(color, usage.get(color)! + 1)
  }
  return COLORS.reduce((best, color) => (usage.get(color)! < usage.get(best)! ? color : best))
}
