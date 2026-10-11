import { RiEyeLine } from '@remixicon/react'
import { useId, useState } from 'react'
import { useTranslations } from 'use-intl'
import { MAX_NOTE_LENGTH } from '../../../../shared/validation/limits'
import { TextField } from '../atoms/TextField'
import { ToggleButton } from '../atoms/ToggleButton'
import { Note } from './Note'

interface NoteFieldProps {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly rows: number
  readonly autoFocus?: boolean
}

export function NoteField({ value, onChange, rows, autoFocus }: NoteFieldProps): React.JSX.Element {
  const t = useTranslations('NoteField')
  const [isPreview, setPreview] = useState(false)
  const labelId = useId()

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <span id={labelId} className="text-sm font-medium">
          {t('label')}
        </span>
        <ToggleButton
          isSelected={isPreview}
          onChange={setPreview}
          className="h-7 gap-1.5 px-2.5 text-xs"
        >
          <RiEyeLine aria-hidden className="size-3.5" />
          {t('preview')}
        </ToggleButton>
      </div>
      <div className="grid">
        <TextField
          aria-labelledby={labelId}
          description={t('description')}
          value={value}
          onChange={onChange}
          maxLength={MAX_NOTE_LENGTH}
          multiline
          rows={rows}
          autoFocus={autoFocus}
          className={isPreview ? 'invisible [grid-area:1/1]' : '[grid-area:1/1]'}
        />
        {isPreview && (
          <div className="overflow-auto rounded-lg border border-border px-3 py-2 text-sm [grid-area:1/1]">
            {value.trim() ? (
              <Note text={value} />
            ) : (
              <span className="text-muted-foreground">{t('previewEmpty')}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
