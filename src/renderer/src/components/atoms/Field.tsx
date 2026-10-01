import {
  FieldError as RACFieldError,
  Label as RACLabel,
  Text,
  type FieldErrorProps,
  type LabelProps,
  type TextProps
} from 'react-aria-components'
import { twMerge } from 'tailwind-merge'
import { composeTailwindRenderProps } from './utils'

export function Label(props: LabelProps): React.JSX.Element {
  return (
    <RACLabel
      {...props}
      className={twMerge(
        'w-fit cursor-default text-sm font-medium text-foreground',
        props.className
      )}
    />
  )
}

export function Description(props: TextProps): React.JSX.Element {
  return (
    <Text
      {...props}
      slot="description"
      className={twMerge('text-sm text-muted-foreground', props.className)}
    />
  )
}

export function FieldError(props: FieldErrorProps): React.JSX.Element {
  return (
    <RACFieldError
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'text-sm text-destructive forced-colors:text-[Mark]'
      )}
    />
  )
}
