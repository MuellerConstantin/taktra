import {
  Popover as RACPopover,
  composeRenderProps,
  type PopoverProps as RACPopoverProps
} from 'react-aria-components'
import { tv } from 'tailwind-variants'

export interface PopoverProps extends Omit<RACPopoverProps, 'children'> {
  readonly children: React.ReactNode
}

const styles = tv({
  base: 'rounded-xl border border-border bg-popover bg-clip-padding text-popover-foreground shadow-lg outline-0 forced-colors:bg-[Canvas]'
})

export function Popover({ children, className, ...props }: PopoverProps): React.JSX.Element {
  return (
    <RACPopover
      offset={8}
      {...props}
      className={composeRenderProps(className, (className, renderProps) =>
        styles({ ...renderProps, className })
      )}
    >
      {children}
    </RACPopover>
  )
}
