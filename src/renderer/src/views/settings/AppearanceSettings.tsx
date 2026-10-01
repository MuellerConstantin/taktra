import { Label, Radio, RadioGroup, Text } from 'react-aria-components'
import { useSettings } from '../../hooks/useSettings'
import type { ThemeSource } from '../../../../shared/settings'

const themeOptions: readonly { value: ThemeSource; label: string; description: string }[] = [
  { value: 'system', label: 'System', description: 'Folgt der Systemeinstellung' },
  { value: 'light', label: 'Hell', description: 'Immer helles Design' },
  { value: 'dark', label: 'Dunkel', description: 'Immer dunkles Design' }
]

function AppearanceSettings(): React.JSX.Element | null {
  const { settings, updateSettings } = useSettings()

  if (!settings) return null

  return (
    <RadioGroup
      value={settings.theme}
      onChange={(value) => updateSettings({ theme: value as ThemeSource })}
      className="flex max-w-xl flex-col gap-3"
    >
      <Label className="font-medium">Farbschema</Label>
      <div className="grid grid-cols-3 gap-3">
        {themeOptions.map(({ value, label, description }) => (
          <Radio
            key={value}
            value={value}
            className="flex cursor-default flex-col gap-1 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring selected:border-primary selected:ring-1 selected:ring-primary"
          >
            <span className="text-sm font-medium">{label}</span>
            <Text slot="description" className="text-xs text-muted-foreground">
              {description}
            </Text>
          </Radio>
        ))}
      </div>
    </RadioGroup>
  )
}

export default AppearanceSettings
