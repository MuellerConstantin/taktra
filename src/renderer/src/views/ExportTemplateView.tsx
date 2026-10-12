import { getLocalTimeZone, today } from '@internationalized/date'
import {
  RiAddLine,
  RiArrowGoBackLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiDraggable,
  RiMoreLine
} from '@remixicon/react'
import { useEffect, useMemo, useState } from 'react'
import { useDragAndDrop, useLocale } from 'react-aria-components'
import { useNavigate, useParams } from 'react-router'
import { useTranslations } from 'use-intl'
import { customFieldScopes, type CustomField } from '../../../shared/customFields'
import {
  builtinExportColumns,
  defaultExportColumns,
  exportFormats,
  type ExportColumn,
  type ExportFormat,
  type ExportPreview
} from '../../../shared/export'
import { toNameKey } from '../../../shared/names'
import { MAX_EXPORT_COLUMNS, MAX_NAME_LENGTH } from '../../../shared/validation/limits'
import { AlertDialog } from '../components/atoms/AlertDialog'
import { Button } from '../components/atoms/Button'
import { GridList, GridListDropIndicator, GridListItem } from '../components/atoms/GridList'
import { Menu, MenuItem, MenuSection, MenuTrigger } from '../components/atoms/Menu'
import { Modal } from '../components/atoms/Modal'
import { Select, SelectItem } from '../components/atoms/Select'
import { TextField } from '../components/atoms/TextField'
import { ExportPreviewTable } from '../components/molecules/ExportPreviewTable'
import { PeriodPicker } from '../components/molecules/PeriodPicker'
import { ViewHeader } from '../components/molecules/ViewHeader'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { api } from '../lib/api'
import { periodFilter, presetRange, type Period } from '../lib/period'

function columnKey(column: ExportColumn): string {
  return 'builtin' in column ? column.builtin : `field:${column.fieldId}`
}

function ExportTemplateView(): React.JSX.Element {
  const t = useTranslations('ExportTemplateView')
  const tExport = useTranslations('ExportView')
  const errorMessage = useErrorMessage()
  const navigate = useNavigate()
  const { locale } = useLocale()
  const { templateId: templateParam } = useParams()
  const templateId = templateParam === undefined ? null : Number(templateParam)
  const [fields, setFields] = useState<readonly CustomField[]>([])
  const [name, setName] = useState('')
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [columns, setColumns] = useState<readonly ExportColumn[]>(defaultExportColumns)
  const [isLoaded, setLoaded] = useState(false)
  const [period, setPeriod] = useState<Period>(() => ({
    preset: 'lastMonth',
    range: presetRange('lastMonth', today(getLocalTimeZone()), locale)
  }))
  const [preview, setPreview] = useState<ExportPreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)

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
  const hasConflict = headerKeys.some((_, index) => isConflict(index))

  const selected = new Set(columns.map(columnKey))
  const availableBuiltins = builtinExportColumns.filter((builtin) => !selected.has(builtin))
  const availableFields = fields.filter((field) => !selected.has(columnKey({ fieldId: field.id })))
  const isFull = columns.length >= MAX_EXPORT_COLUMNS

  const { from, to } = periodFilter(period)
  const filter = useMemo(() => ({ from, to }), [from, to])

  useEffect(() => {
    let isCurrent = true
    Promise.all([
      api.customFields.list({ includeArchived: true }),
      templateId === null ? null : api.exportTemplates.get(templateId)
    ])
      .then(([loadedFields, template]) => {
        if (!isCurrent) return
        setFields(loadedFields)
        if (template) {
          setName(template.name)
          setFormat(template.format)
          setColumns(template.columns)
        }
        setLoaded(true)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [templateId, errorMessage])

  useEffect(() => {
    if (!isLoaded || hasConflict) return
    let isCurrent = true
    api.export
      .preview(filter, columns)
      .then((loaded) => {
        if (!isCurrent) return
        setPreview(loaded)
        setPreviewError(null)
      })
      .catch((caught) => isCurrent && setPreviewError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [isLoaded, hasConflict, filter, columns, errorMessage])

  const { dragAndDropHooks } = useDragAndDrop<ExportColumn>({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder: ({ keys, target }) =>
      setColumns((current) => {
        const moving = current.filter((column) => keys.has(columnKey(column)))
        const rest = current.filter((column) => !keys.has(columnKey(column)))
        const targetIndex = rest.findIndex((column) => columnKey(column) === target.key)
        const insertAt = target.dropPosition === 'before' ? targetIndex : targetIndex + 1
        return [...rest.slice(0, insertAt), ...moving, ...rest.slice(insertAt)]
      }),
    renderDropIndicator: (target) => <GridListDropIndicator target={target} />
  })

  const setHeader = (key: string, header: string): void =>
    setColumns((current) =>
      current.map((column) => (columnKey(column) === key ? { ...column, header } : column))
    )

  const backToExport = (id: number | null = templateId): void => {
    void navigate(id === null ? '/export' : `/export?template=${id}`)
  }

  const run = async (action: () => Promise<void>): Promise<void> => {
    setPending(true)
    setError(null)
    try {
      await action()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  const save = (): Promise<void> =>
    run(async () => {
      const input = { name, format, columns: [...columns] }
      const saved =
        templateId === null
          ? await api.exportTemplates.create(input)
          : await api.exportTemplates.update(templateId, input)
      backToExport(saved.id)
    })

  const remove = (): Promise<void> =>
    run(async () => {
      if (templateId === null) return
      await api.exportTemplates.delete(templateId)
      backToExport(null)
    })

  const candidates: readonly ExportColumn[] = [
    ...availableBuiltins.map((builtin) => ({ builtin })),
    ...availableFields.map((field) => ({ fieldId: field.id }))
  ]

  const addColumn = (key: React.Key): void => {
    const column = candidates.find((candidate) => columnKey(candidate) === key)
    if (column) setColumns((current) => [...current, column])
  }

  const handleAction = (key: React.Key): void => {
    if (key === 'cancel') backToExport()
    if (key === 'delete') setDeleteOpen(true)
  }

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        subtitle={t('subtitle')}
        title={name.trim() || t('newTitle')}
        help={t('help')}
        helpTopic="export"
        actions={
          <>
            <Button
              onPress={save}
              isDisabled={!isLoaded || isPending || !name.trim() || hasConflict}
            >
              {t('save')}
            </Button>
            <MenuTrigger placement="bottom end">
              <Button variant="icon" aria-label={t('more')}>
                <RiMoreLine className="size-4" />
              </Button>
              <Menu onAction={handleAction}>
                <MenuItem id="cancel">
                  <RiArrowGoBackLine aria-hidden className="size-4" />
                  {t('cancel')}
                </MenuItem>
                {templateId !== null && (
                  <MenuItem id="delete">
                    <RiDeleteBinLine aria-hidden className="size-4" />
                    {t('delete')}
                  </MenuItem>
                )}
              </Menu>
            </MenuTrigger>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2 pb-4">
          <TextField
            aria-label={t('name')}
            placeholder={t('name')}
            maxLength={MAX_NAME_LENGTH}
            value={name}
            onChange={setName}
            isRequired
            autoFocus={templateId === null}
            className="w-64"
          />
          <Select
            aria-label={tExport('format')}
            value={format}
            onChange={(key) => key && setFormat(key as ExportFormat)}
            className="w-48"
          >
            {exportFormats.map((option) => (
              <SelectItem key={option} id={option}>
                {option.toUpperCase()}
              </SelectItem>
            ))}
          </Select>
        </div>
      </ViewHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-8 py-6">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-sm font-semibold">{t('selected')}</h2>
            <p className="text-xs text-muted-foreground">{t('selectedHelp')}</p>
          </div>
          <GridList
            aria-label={t('selected')}
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
              return (
                <GridListItem
                  id={id}
                  textValue={label}
                  className="h-auto gap-2 px-3 py-2 last:border-0"
                >
                  <Button slot="drag" variant="icon" aria-label={t('reorder', { name: label })}>
                    <RiDraggable className="size-4" />
                  </Button>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{label}</span>
                    {field && (
                      <span className="truncate text-xs text-muted-foreground">
                        {t(`scopes.${field.scope}`)}
                        {field.archivedAt && ` · ${t('archived')}`}
                      </span>
                    )}
                  </div>
                  <TextField
                    aria-label={t('header', { name: label })}
                    placeholder={defaultHeaderOf(column)}
                    maxLength={MAX_NAME_LENGTH}
                    value={column.header ?? ''}
                    onChange={(header) => setHeader(id, header)}
                    isInvalid={isConflict(index)}
                    errorMessage={t('conflict')}
                    className="w-56"
                  />
                  <Button
                    variant="icon"
                    aria-label={t('remove', { name: label })}
                    isDisabled={columns.length === 1}
                    onPress={() =>
                      setColumns((current) =>
                        current.filter((candidate) => columnKey(candidate) !== id)
                      )
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
                            {field.archivedAt
                              ? t('archivedField', { name: field.name })
                              : field.name}
                          </MenuItem>
                        )
                      })}
                    </MenuSection>
                  )
                })}
              </Menu>
            </MenuTrigger>
            {isFull && (
              <p className="text-sm text-muted-foreground">
                {t('limit', { max: MAX_EXPORT_COLUMNS })}
              </p>
            )}
          </div>
        </section>
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">{t('previewHelp')}</p>
            <PeriodPicker value={period} onChange={setPeriod} />
          </div>
          {hasConflict ? (
            <p className="text-sm text-destructive">{t('previewConflict')}</p>
          ) : previewError ? (
            <p className="text-sm text-destructive">{previewError}</p>
          ) : (
            preview && <ExportPreviewTable preview={preview} />
          )}
        </section>
      </div>
      <Modal isOpen={isDeleteOpen} onOpenChange={setDeleteOpen} isDismissable>
        <AlertDialog
          variant="destructive"
          title={t('deleteConfirmTitle', { name })}
          actionLabel={t('deleteConfirmAction')}
          cancelLabel={t('cancel')}
          onAction={remove}
        >
          {t('deleteConfirmText')}
        </AlertDialog>
      </Modal>
    </div>
  )
}

export default ExportTemplateView
