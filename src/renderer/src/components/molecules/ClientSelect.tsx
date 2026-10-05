import { useTranslations } from 'use-intl'
import type { Client } from '../../../../shared/clients'
import { Select, SelectItem } from '../atoms/Select'

const NONE = 'none'

interface ClientSelectProps {
  /** All clients including archived ones; an archived client is offered only while selected. */
  readonly clients: readonly Client[]
  readonly value: number | null
  readonly onChange: (clientId: number | null) => void
  readonly description?: string
  readonly isDisabled?: boolean
}

export function ClientSelect({
  clients,
  value,
  onChange,
  description,
  isDisabled
}: ClientSelectProps): React.JSX.Element {
  const t = useTranslations('ClientSelect')
  const items = [
    { id: NONE, name: t('none') },
    ...clients.filter((client) => !client.archivedAt || client.id === value)
  ]

  return (
    <Select
      label={t('label')}
      description={description}
      search={{ label: t('search'), empty: t('empty') }}
      items={items}
      value={value ?? NONE}
      onChange={(key) => onChange(typeof key === 'number' ? key : null)}
      isDisabled={isDisabled}
    >
      {(item) => (
        <SelectItem id={item.id} textValue={item.name}>
          {item.name}
        </SelectItem>
      )}
    </Select>
  )
}
