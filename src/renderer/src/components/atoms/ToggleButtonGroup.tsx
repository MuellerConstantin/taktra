import {
  ToggleButtonGroup as RACToggleButtonGroup,
  composeRenderProps,
  type ToggleButtonGroupProps
} from 'react-aria-components'
import { tv } from 'tailwind-variants'

const styles = tv({
  base: 'flex gap-1',
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col'
    }
  }
})

export function ToggleButtonGroup(props: ToggleButtonGroupProps): React.JSX.Element {
  return (
    <RACToggleButtonGroup
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        styles({ ...renderProps, className })
      )}
    />
  )
}
