import {
  ToggleButton as RACToggleButton,
  composeRenderProps,
  type ToggleButtonProps
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { focusRing } from './utils'

const styles = tv({
  extend: focusRing,
  base: 'relative box-border inline-flex h-9 cursor-default items-center justify-center gap-2 rounded-lg border border-border px-3.5 text-center text-sm transition forced-color-adjust-none [-webkit-tap-highlight-color:transparent]',
  variants: {
    isSelected: {
      false:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80 pressed:bg-secondary/60 forced-colors:bg-[ButtonFace]! forced-colors:text-[ButtonText]!',
      true: 'bg-primary text-primary-foreground hover:bg-primary/90 pressed:bg-primary/80 forced-colors:bg-[Highlight]! forced-colors:text-[HighlightText]!'
    },
    isDisabled: {
      true: 'border-transparent bg-muted text-muted-foreground forced-colors:bg-[ButtonFace]! forced-colors:text-[GrayText]!'
    }
  }
})

export function ToggleButton(props: ToggleButtonProps): React.JSX.Element {
  return (
    <RACToggleButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        styles({ ...renderProps, className })
      )}
    />
  )
}
