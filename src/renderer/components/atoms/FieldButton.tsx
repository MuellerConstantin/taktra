import { Button as RACButton, composeRenderProps, type ButtonProps } from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { focusRing } from './utils'

const button = tv({
  extend: focusRing,
  base: 'relative flex cursor-default items-center justify-center rounded-md border-0 bg-transparent p-1 text-center text-sm text-muted-foreground transition hover:bg-accent pressed:bg-accent/80 disabled:bg-transparent [-webkit-tap-highlight-color:transparent]',
  variants: {
    isDisabled: {
      true: 'text-muted-foreground forced-colors:text-[GrayText]'
    }
  }
})

export function FieldButton(props: ButtonProps): React.JSX.Element {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        button({ ...renderProps, className })
      )}
    />
  )
}
