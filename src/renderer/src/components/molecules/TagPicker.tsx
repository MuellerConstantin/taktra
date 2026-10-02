import { useTranslations } from 'use-intl'
import type { Tag } from '../../../../shared/tags'
import { ComboBox, ComboBoxItem } from '../atoms/ComboBox'
import { Tag as TagItem, TagGroup } from '../atoms/TagGroup'

interface TagPickerProps {
  readonly tags: readonly Tag[]
  readonly value: readonly number[]
  readonly onChange: (value: readonly number[]) => void
  readonly isDisabled?: boolean
}

export function TagPicker({
  tags,
  value,
  onChange,
  isDisabled
}: TagPickerProps): React.JSX.Element {
  const t = useTranslations('TagPicker')
  const selectedTags = tags.filter((tag) => value.includes(tag.id))

  return (
    <div className="flex flex-col gap-2">
      <ComboBox
        label={t('label')}
        description={t('description')}
        placeholder={t('placeholder')}
        selectionMode="multiple"
        defaultItems={tags}
        value={[...value]}
        onChange={(keys) => onChange(keys.filter((key): key is number => typeof key === 'number'))}
        isDisabled={isDisabled}
      >
        {(tag) => (
          <ComboBoxItem id={tag.id} textValue={tag.name}>
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full bg-muted"
              style={tag.color ? { backgroundColor: tag.color } : undefined}
            />
            {tag.name}
          </ComboBoxItem>
        )}
      </ComboBox>
      {selectedTags.length > 0 && (
        <TagGroup
          aria-label={t('selected')}
          items={selectedTags}
          onRemove={(keys) => onChange(value.filter((id) => !keys.has(id)))}
          className="rounded-lg border border-input p-2"
          listClassName="max-h-[calc(3*1.375rem+2*0.25rem)] overflow-y-auto"
        >
          {(tag) => (
            <TagItem id={tag.id} color={tag.color}>
              {tag.name}
            </TagItem>
          )}
        </TagGroup>
      )}
    </div>
  )
}
