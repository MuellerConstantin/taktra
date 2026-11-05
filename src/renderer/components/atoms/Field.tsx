import {
  FieldError as RACFieldError,
  Group,
  Input as RACInput,
  Label as RACLabel,
  Text,
  composeRenderProps,
  type FieldErrorProps,
  type GroupProps,
  type InputProps,
  type LabelProps,
  type TextProps
} from 'react-aria-components'
import { twMerge } from 'tailwind-merge'
import { fieldGroupStyles } from './styles'
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

export function FieldGroup(props: GroupProps): React.JSX.Element {
  return (
    <Group
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        fieldGroupStyles({ ...renderProps, className })
      )}
    />
  )
}

export function Input(props: InputProps): React.JSX.Element {
  return (
    <RACInput
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'min-h-9 min-w-0 flex-1 border-0 bg-transparent px-3 py-0 text-sm text-foreground outline outline-0 [-webkit-tap-highlight-color:transparent] placeholder:text-muted-foreground disabled:text-muted-foreground'
      )}
    />
  )
}
