import { useTranslations } from 'use-intl'
import type { ExportPreview, ExportValue } from '../../../../shared/export'

function formatCell(value: ExportValue): string {
  return Array.isArray(value) ? value.join(', ') : String(value ?? '')
}

interface ExportPreviewTableProps {
  readonly preview: ExportPreview
}

export function ExportPreviewTable({ preview }: ExportPreviewTableProps): React.JSX.Element {
  const t = useTranslations('ExportPreviewTable')

  if (preview.count === 0)
    return <p className="text-center text-sm text-muted-foreground">{t('empty')}</p>

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">
        {t('title', { shown: preview.rows.length, count: preview.count })}
      </h2>
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
