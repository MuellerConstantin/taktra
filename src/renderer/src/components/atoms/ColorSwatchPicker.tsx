import { useId } from 'react'
import {
  ColorSwatch,
  ColorSwatchPickerItem,
  ColorSwatchPicker as RACColorSwatchPicker,
  type ColorSwatchPickerProps as RACColorSwatchPickerProps
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { Label } from './Field'
import { composeTailwindRenderProps, focusRing } from './utils'

const itemStyles = tv({
  extend: focusRing,
  base: 'relative rounded-full'
})

interface ColorSwatchPickerProps extends Omit<RACColorSwatchPickerProps, 'children'> {
  readonly label: string
  readonly colors: readonly string[]
}

export function ColorSwatchPicker({
  label,
  colors,
  ...props
}: ColorSwatchPickerProps): React.JSX.Element {
  const labelId = useId()

  return (
    <div className="flex flex-col gap-1">
      <Label id={labelId} elementType="span">
        {label}
      </Label>
      <RACColorSwatchPicker
        {...props}
        aria-labelledby={labelId}
        className={composeTailwindRenderProps(props.className, 'flex flex-wrap gap-2')}
      >
        {colors.map((color) => (
          <ColorSwatchPickerItem key={color} color={color} className={itemStyles}>
            {({ isSelected }) => (
              <>
                <ColorSwatch className="size-6 rounded-full" />
                {isSelected && (
                  <div className="absolute inset-0 rounded-full border-2 border-foreground outline outline-2 -outline-offset-4 outline-background" />
                )}
              </>
            )}
          </ColorSwatchPickerItem>
        ))}
      </RACColorSwatchPicker>
    </div>
  )
}
