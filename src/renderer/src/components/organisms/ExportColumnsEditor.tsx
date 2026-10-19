import { RiAddLine, RiCloseLine, RiDraggable } from '@remixicon/react'
import { useDragAndDrop } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import { customFieldScopes, type CustomField } from '../../../../shared/customFields'
import {
  allowedAggregations,
  builtinExportColumns,
  columnAggregation,
  columnError,
  durationError,
  type ExportAggregation,
  type ExportColumn,
  type ExportColumnKind,
  type ExportLayout
} from '../../../../shared/export'
import { toNameKey } from '../../../../shared/names'
import { MAX_EXPORT_COLUMNS, MAX_NAME_LENGTH } from '../../../../shared/validation/limits'
import { Button } from '../atoms/Button'
import { GridList, GridListDropIndicator, GridListItem } from '../atoms/GridList'
import { Menu, MenuItem, MenuSection, MenuTrigger } from '../atoms/Menu'
import { Select, SelectItem } from '../atoms/Select'
import { TextField } from '../atoms/TextField'

function columnKey(column: ExportColumn): string {
  return 'builtin' in column ? column.builtin : `field:${column.fieldId}`
}

interface ExportColumnsEditorProps {
  readonly fields: readonly CustomField[]
  readonly layout: ExportLayout
  readonly columns: readonly ExportColumn[]
  readonly onColumnsChange: (columns: readonly ExportColumn[]) => void
}

export function ExportColumnsEditor({
  fields,
  layout,
  columns,
  onColumnsChange
}: ExportColumnsEditorProps): React.JSX.Element {
  const t = useTranslations('ExportColumnsEditor')

  const fieldsById = new Map(fields.map((field) => [field.id, field]))
  const labelOf = (column: ExportColumn): string =>
    'builtin' in column
      ? t(`builtins.${column.builtin}`)
      : (fieldsById.get(column.fieldId)?.name ?? String(column.fieldId))
  const defaultHeaderOf = (column: ExportColumn): string =>
    'builtin' in column ? column.builtin : (fieldsById.get(column.fieldId)?.nameKey ?? '')

  const headerKeys = columns.map((column) =>
    toNameKey(column.header?.trim() || defaultHeaderOf(column))
  )
  const isConflict = (index: number): boolean =>
    headerKeys.indexOf(headerKeys[index]) !== headerKeys.lastIndexOf(headerKeys[index])

  const kindOf = (column: ExportColumn): ExportColumnKind =>
    'builtin' in column ? column : { fieldType: fieldsById.get(column.fieldId)?.type ?? 'text' }
  const durationProblem = durationError(layout, columns)

  const selected = new Set(columns.map(columnKey))
  const availableBuiltins = builtinExportColumns.filter(
    (builtin) => !selected.has(builtin) && columnError(layout, { builtin }, { builtin }) === null
  )
  const availableFields = fields.filter((field) => !selected.has(columnKey({ fieldId: field.id })))
  const isFull = columns.length >= MAX_EXPORT_COLUMNS

  const candidates: readonly ExportColumn[] = [
    ...availableBuiltins.map((builtin) => ({ builtin })),
    ...availableFields.map((field) => ({ fieldId: field.id }))
  ]

  const { dragAndDropHooks } = useDragAndDrop<ExportColumn>({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder: ({ keys, target }) => {
      const moving = columns.filter((column) => keys.has(columnKey(column)))
      const rest = columns.filter((column) => !keys.has(columnKey(column)))
      const targetIndex = rest.findIndex((column) => columnKey(column) === target.key)
      const insertAt = target.dropPosition === 'before' ? targetIndex : targetIndex + 1
      onColumnsChange([...rest.slice(0, insertAt), ...moving, ...rest.slice(insertAt)])
    },
    renderDropIndicator: (target) => <GridListDropIndicator target={target} />
  })

  const updateColumn = (key: string, change: Partial<ExportColumn>): void =>
    onColumnsChange(
      columns.map((column) => (columnKey(column) === key ? { ...column, ...change } : column))
    )

  const addColumn = (key: React.Key): void => {
    const column = candidates.find((candidate) => columnKey(candidate) === key)
    if (column) onColumnsChange([...columns, column])
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">{t('help')}</p>
      <GridList
        aria-label={t('columns')}
        items={columns.map((column) => ({ id: columnKey(column), column }))}
        dragAndDropHooks={dragAndDropHooks}
        // Typing a column name would otherwise move the focus to a matching row.
        disallowTypeAhead
        className="rounded-xl border border-border bg-card"
      >
        {({ id, column }) => {
          const index = columns.findIndex((candidate) => columnKey(candidate) === id)
          const label = labelOf(column)
          const field = 'fieldId' in column ? fieldsById.get(column.fieldId) : undefined
          const error = columnError(layout, column, kindOf(column))
          const aggregations = allowedAggregations(kindOf(column))
          return (
            <GridListItem
              id={id}
              textValue={label}
              className="h-auto gap-2 px-3 py-2 last:border-0"
            >
              <Button slot="drag" variant="icon" aria-label={t('reorder', { name: label })}>
                <RiDraggable className="size-4" />
              </Button>
              <div className="flex min-w-24 flex-1 flex-col">
                <span className="truncate">{label}</span>
                {field && (
                  <span className="truncate text-xs text-muted-foreground">
                    {t(`scopes.${field.scope}`)}
                    {field.archivedAt && ` · ${t('archived')}`}
                  </span>
                )}
                {error && (
                  <span className="truncate text-xs text-destructive">
                    {error === 'EXPORT_DATE_IN_PIVOT'
                      ? t('dateInPivot')
                      : error === 'EXPORT_COLUMN_NOT_SUMMABLE'
                        ? t('notSummable')
                        : t('aggregationNotAllowed')}
                  </span>
                )}
              </div>
              <div className="flex min-w-56 flex-wrap justify-end gap-2">
                {layout !== 'entries' && aggregations.length > 1 && (
                  <Select
                    aria-label={t('aggregation', { name: label })}
                    value={columnAggregation(column, kindOf(column))}
                    onChange={(key) =>
                      key && updateColumn(id, { aggregation: key as ExportAggregation })
                    }
                    className="w-56"
                  >
                    {aggregations.map((option) => (
                      <SelectItem key={option} id={option}>
                        {t(`aggregations.${option}`)}
                      </SelectItem>
                    ))}
                  </Select>
                )}
                <TextField
                  aria-label={t('header', { name: label })}
                  placeholder={defaultHeaderOf(column)}
                  maxLength={MAX_NAME_LENGTH}
                  value={column.header ?? ''}
                  onChange={(header) => updateColumn(id, { header })}
                  isInvalid={isConflict(index)}
                  errorMessage={t('conflict')}
                  className="w-56"
                />
              </div>
              <Button
                variant="icon"
                aria-label={t('remove', { name: label })}
                isDisabled={columns.length === 1}
                onPress={() =>
                  onColumnsChange(columns.filter((candidate) => columnKey(candidate) !== id))
                }
              >
                <RiCloseLine className="size-4" />
              </Button>
            </GridListItem>
          )
        }}
      </GridList>
      <div className="flex flex-wrap items-center gap-3">
        <MenuTrigger placement="bottom start">
          <Button variant="secondary" isDisabled={isFull || candidates.length === 0}>
            <RiAddLine className="size-4" />
            {t('addColumn')}
          </Button>
          <Menu onAction={addColumn}>
            {availableBuiltins.length > 0 && (
              <MenuSection title={t('builtinSection')}>
                {availableBuiltins.map((builtin) => (
                  <MenuItem key={builtin} id={builtin}>
                    {t(`builtins.${builtin}`)}
                  </MenuItem>
                ))}
              </MenuSection>
            )}
            {customFieldScopes.map((scope) => {
              const scoped = availableFields.filter((field) => field.scope === scope)
              if (scoped.length === 0) return null
              return (
                <MenuSection key={scope} title={t(`scopeSections.${scope}`)}>
                  {scoped.map((field) => {
                    const key = columnKey({ fieldId: field.id })
                    return (
                      <MenuItem key={key} id={key} textValue={field.name}>
                        {field.archivedAt ? t('archivedField', { name: field.name }) : field.name}
                      </MenuItem>
                    )
                  })}
                </MenuSection>
              )
            })}
          </Menu>
        </MenuTrigger>
        {isFull && (
          <p className="text-sm text-muted-foreground">{t('limit', { max: MAX_EXPORT_COLUMNS })}</p>
        )}
        {durationProblem && (
          <p className="text-sm text-destructive">
            {durationProblem === 'EXPORT_DURATION_MISSING'
              ? t('durationMissing')
              : t('durationTwice')}
          </p>
        )}
      </div>
    </div>
  )
}
