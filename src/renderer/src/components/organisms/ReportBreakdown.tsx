import { useLocale } from 'react-aria-components'
import { twMerge } from 'tailwind-merge'
import { useTranslations } from 'use-intl'
import type { AggregateRow } from '../../../../shared/reports'
import { formatDuration } from '../../lib/duration'
import {
  clientShares,
  NEUTRAL_COLOR,
  projectShares,
  projectTotals,
  tagShare,
  tagShares,
  type ShareItem
} from '../../lib/report'
import { Disclosure, DisclosureGroup, DisclosureHeader, DisclosurePanel } from '../atoms/Disclosure'
import { ShareBarChart } from '../molecules/ShareBarChart'
import { SharePieChart } from '../molecules/SharePieChart'

export type Breakdown = 'project' | 'client' | 'tag' | 'projectTag'

interface ShareCellsProps {
  readonly item: ShareItem
  readonly formatShare: (totalSec: number) => string
  readonly showColor?: boolean
}

function ShareCells({ item, formatShare, showColor = true }: ShareCellsProps): React.JSX.Element {
  return (
    <>
      {showColor && (
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: item.color }}
        />
      )}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      <span className="w-12 text-right text-muted-foreground tabular-nums">
        {formatShare(item.totalSec)}
      </span>
      <span className="w-14 text-right font-medium tabular-nums">
        {formatDuration(item.totalSec)}
      </span>
    </>
  )
}

interface ReportBreakdownProps {
  readonly breakdown: Breakdown
  readonly rows: readonly AggregateRow[]
  readonly timelineRows: readonly AggregateRow[]
  readonly totalSec: number
}

export function ReportBreakdown({
  breakdown,
  rows,
  timelineRows,
  totalSec
}: ReportBreakdownProps): React.JSX.Element {
  const t = useTranslations('ReportBreakdown')
  const { locale } = useLocale()
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
  const formatShare = (sec: number): string => percent.format(totalSec ? sec / totalSec : 0)

  const items =
    breakdown === 'tag'
      ? tagShares(rows, t('untagged'))
      : breakdown === 'client'
        ? clientShares(rows, t('noClient'))
        : projectShares(rows, projectTotals(timelineRows), (row) =>
            breakdown === 'projectTag'
              ? tagShare(row, t('untagged'))
              : row.activity && {
                  id: `activity-${row.activity.id}`,
                  label: row.activity.name,
                  color: row.project?.color ?? NEUTRAL_COLOR,
                  totalSec: row.totalSec
                }
          )

  return (
    <div className="flex flex-col gap-4">
      {(breakdown === 'tag' || breakdown === 'projectTag') && (
        <p className="text-xs text-muted-foreground">{t('overlap')}</p>
      )}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="lg:w-72 lg:shrink-0">
          {breakdown === 'tag' ? (
            <ShareBarChart items={items} formatShare={formatShare} />
          ) : (
            <SharePieChart items={items} formatShare={formatShare} />
          )}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-card text-sm">
          {breakdown === 'tag' ? (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
              >
                <ShareCells item={item} formatShare={formatShare} />
              </div>
            ))
          ) : (
            <DisclosureGroup allowsMultipleExpanded>
              {items.map((item) => (
                <Disclosure
                  key={item.id}
                  id={item.id}
                  className="border-b border-border last:border-b-0"
                >
                  <DisclosureHeader className="px-4 py-2.5">
                    <ShareCells item={item} formatShare={formatShare} />
                  </DisclosureHeader>
                  <DisclosurePanel>
                    {item.children.map((child) => (
                      <div
                        key={child.id}
                        className={twMerge(
                          'flex items-center gap-3 border-t border-border py-2 pr-4',
                          breakdown === 'project' ? 'pl-16.5' : 'pl-11'
                        )}
                      >
                        <ShareCells
                          item={child}
                          formatShare={formatShare}
                          showColor={breakdown !== 'project'}
                        />
                      </div>
                    ))}
                  </DisclosurePanel>
                </Disclosure>
              ))}
            </DisclosureGroup>
          )}
        </div>
      </div>
    </div>
  )
}
