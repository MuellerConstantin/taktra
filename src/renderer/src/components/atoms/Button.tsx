import {
  Button as RACButton,
  TooltipTrigger,
  composeRenderProps,
  type ButtonProps as RACButtonProps
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { Tooltip } from './Tooltip'
import { focusRing } from './utils'

const TOOLTIP_DELAY = 500

export interface ButtonProps extends RACButtonProps {
  readonly variant?: 'primary' | 'secondary' | 'destructive' | 'icon'
  readonly tooltip?: boolean
}

const button = tv({
  extend: focusRing,
  base: 'relative box-border inline-flex h-9 cursor-default items-center justify-center gap-2 rounded-lg border border-transparent px-3.5 py-0 text-center text-sm transition [-webkit-tap-highlight-color:transparent]',
  variants: {
    variant: {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 pressed:bg-primary/80',
      secondary:
        'border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 pressed:bg-secondary/60',
      destructive:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 pressed:bg-destructive/80',
      icon: 'h-fit w-fit rounded-md border-none bg-transparent p-1 text-muted-foreground hover:bg-accent hover:text-foreground pressed:bg-accent/80'
    },
    isDisabled: {
      true: 'border-transparent bg-muted text-muted-foreground forced-colors:text-[GrayText]'
    }
  },
  defaultVariants: {
    variant: 'primary'
  },
  compoundVariants: [
    {
      variant: 'icon',
      isDisabled: true,
      class: 'bg-transparent text-muted-foreground'
    }
  ]
})

export function Button({ tooltip = true, ...props }: ButtonProps): React.JSX.Element {
  const label = props['aria-label']
  const element = (
    <RACButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        button({ ...renderProps, variant: props.variant, className })
      )}
    />
  )

  if (props.variant !== 'icon' || !label || !tooltip) return element

  return (
    <TooltipTrigger delay={TOOLTIP_DELAY}>
      {element}
      <Tooltip>{label}</Tooltip>
    </TooltipTrigger>
  )
}
