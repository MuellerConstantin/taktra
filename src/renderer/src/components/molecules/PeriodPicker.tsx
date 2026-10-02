import { getLocalTimeZone, today } from '@internationalized/date'
import { useLocale, type Key } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import { periodPresets, presetRange, type Period, type PeriodPreset } from '../../lib/period'
import { DateRangePicker } from '../atoms/DateRangePicker'
import { Select, SelectItem } from '../atoms/Select'

const options: readonly Period['preset'][] = [...periodPresets, 'custom']

interface PeriodPickerProps {
  readonly value: Period
  readonly onChange: (period: Period) => void
}

export function PeriodPicker({ value, onChange }: PeriodPickerProps): React.JSX.Element {
  const t = useTranslations('PeriodPicker')
  const { locale } = useLocale()

  const select = (key: Key | null): void => {
    const now = today(getLocalTimeZone())
    if (key === 'custom') {
      onChange({ preset: 'custom', range: value.range ?? presetRange('thisMonth', now, locale) })
      return
    }
    const preset = key as PeriodPreset
    onChange({ preset, range: presetRange(preset, now, locale) })
  }

  return (
    <div className="flex items-center gap-2">
      {value.preset === 'custom' && (
        <DateRangePicker
          aria-label={t('range')}
          value={value.range}
          onChange={(range) => range && onChange({ preset: 'custom', range })}
        />
      )}
      <Select aria-label={t('label')} selectedKey={value.preset} onSelectionChange={select}>
        {options.map((option) => (
          <SelectItem key={option} id={option}>
            {t(`presets.${option}`)}
          </SelectItem>
        ))}
      </Select>
    </div>
  )
}
