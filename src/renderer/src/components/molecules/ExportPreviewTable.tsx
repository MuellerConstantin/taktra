import { useTranslations } from 'use-intl'
import type { ExportFormat, ExportPreview, ExportValue } from '../../../../shared/export'
import { formatDuration } from '../../lib/duration'

function formatCell(value: ExportValue): string {
  return Array.isArray(value) ? value.join(', ') : String(value ?? '')
}

interface ExportPreviewTableProps {
  readonly preview: ExportPreview
  readonly format: ExportFormat
}

export function ExportPreviewTable({
  preview,
  format
}: ExportPreviewTableProps): React.JSX.Element {
  const t = useTranslations('ExportPreviewTable')

  if (preview.count === 0)
    return <p className="text-center text-sm text-muted-foreground">{t('empty')}</p>

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-semibold">
          {preview.rows.length < preview.rowCount
            ? t('titlePartial', { shown: preview.rows.length, count: preview.rowCount })
            : t('title', { count: preview.rowCount })}
        </h2>
        <p className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
          {t('summary', {
            count: preview.count,
            total: formatDuration(preview.totalMin * 60),
            format: format.toUpperCase()
          })}
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left font-mono text-xs">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              {preview.headers.map((header, column) => (
                <th key={column} scope="col" className="px-3 py-2 font-medium whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, index) => (
              <tr key={index} className="border-b border-border last:border-0">
                {row.map((value, column) => (
                  <td
                    key={column}
                    className="max-w-64 truncate px-3 py-2 align-top"
                    title={formatCell(value)}
                  >
                    {formatCell(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
