import { Children, isValidElement } from 'react'
import {
  Button as RACButton,
  TooltipTrigger,
  composeRenderProps,
  type ButtonProps as RACButtonProps
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { KeyCombo } from './KeyCombo'
import { Tooltip } from './Tooltip'
import { focusRing } from './utils'

const TOOLTIP_DELAY = 500

export interface ButtonProps extends RACButtonProps {
  readonly variant?: 'primary' | 'secondary' | 'destructive' | 'icon'
  readonly tooltip?: boolean
  readonly shortcut?: string
}

const button = tv({
  extend: focusRing,
  base: 'relative box-border inline-flex h-9 shrink-0 cursor-default items-center justify-center gap-2 rounded-lg border border-transparent px-3.5 py-0 text-center text-sm whitespace-nowrap transition [-webkit-tap-highlight-color:transparent]',
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

function textOf(node: React.ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      typeof child === 'string' || typeof child === 'number'
        ? String(child)
        : isValidElement<{ children?: React.ReactNode }>(child)
          ? textOf(child.props.children)
          : ''
    )
    .join('')
    .trim()
}

export function Button({ tooltip = true, shortcut, ...props }: ButtonProps): React.JSX.Element {
  const label =
    props.variant === 'icon'
      ? props['aria-label']
      : shortcut && typeof props.children !== 'function'
        ? props['aria-label'] || textOf(props.children)
        : undefined
  const element = (
    <RACButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        button({ ...renderProps, variant: props.variant, className })
      )}
    />
  )

  if (!tooltip || (!label && !shortcut)) return element

  return (
    <TooltipTrigger delay={TOOLTIP_DELAY}>
      {element}
      <Tooltip>
        <span className="flex items-center gap-2">
          {label}
          {shortcut && <KeyCombo accelerator={shortcut} />}
        </span>
      </Tooltip>
    </TooltipTrigger>
  )
}
