import {
  TimeField as RACTimeField,
  type TimeFieldProps as RACTimeFieldProps,
  type TimeValue,
  type ValidationResult
} from 'react-aria-components'
import { DateInput } from './DateInput'
import { Description, FieldError, Label } from './Field'
import { composeTailwindRenderProps } from './utils'

export interface TimeFieldProps<T extends TimeValue> extends RACTimeFieldProps<T> {
  readonly label?: string
  readonly description?: string
  readonly errorMessage?: string | ((validation: ValidationResult) => string)
}

export function TimeField<T extends TimeValue>({
  label,
  description,
  errorMessage,
  ...props
}: TimeFieldProps<T>): React.JSX.Element {
  return (
    <RACTimeField
      {...props}
      className={composeTailwindRenderProps(props.className, 'flex flex-col gap-1')}
    >
      {label && <Label>{label}</Label>}
      <DateInput />
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </RACTimeField>
  )
}
