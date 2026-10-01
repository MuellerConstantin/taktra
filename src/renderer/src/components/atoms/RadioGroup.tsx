import {
  RadioButton,
  RadioField,
  RadioGroup as RACRadioGroup,
  type RadioFieldProps,
  type RadioGroupProps as RACRadioGroupProps,
  type ValidationResult
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { Description, FieldError, Label } from './Field'
import { composeTailwindRenderProps, focusRing } from './utils'

export interface RadioGroupProps extends Omit<RACRadioGroupProps, 'children'> {
  readonly label?: string
  readonly description?: string
  readonly errorMessage?: string | ((validation: ValidationResult) => string)
  readonly children?: React.ReactNode
}

export function RadioGroup(props: RadioGroupProps): React.JSX.Element {
  return (
    <RACRadioGroup
      {...props}
      className={composeTailwindRenderProps(props.className, 'group flex flex-col gap-2')}
    >
      <Label>{props.label}</Label>
      <div className="flex gap-3 group-orientation-vertical:flex-col">{props.children}</div>
      {props.description && <Description>{props.description}</Description>}
      <FieldError>{props.errorMessage}</FieldError>
    </RACRadioGroup>
  )
}

const cardStyles = tv({
  base: 'relative flex flex-1 flex-col gap-1 rounded-lg border bg-card p-4 text-card-foreground shadow-xs transition',
  variants: {
    isSelected: {
      false: 'border-border hover:bg-accent',
      true: 'border-primary ring-1 ring-primary'
    },
    isDisabled: {
      true: 'opacity-50'
    }
  }
})

const cardButtonStyles = tv({
  extend: focusRing,
  base: 'cursor-default rounded-sm text-sm font-medium after:absolute after:inset-0 after:rounded-lg'
})

export interface RadioCardProps extends Omit<RadioFieldProps, 'children'> {
  readonly label: string
  readonly description?: string
}

export function RadioCard({ label, description, ...props }: RadioCardProps): React.JSX.Element {
  return (
    <RadioField {...props} className={(renderProps) => cardStyles(renderProps)}>
      <RadioButton className={(renderProps) => cardButtonStyles(renderProps)}>{label}</RadioButton>
      {description && <Description className="text-xs">{description}</Description>}
    </RadioField>
  )
}
