import {
  Input,
  TextArea,
  TextField as RACTextField,
  type TextFieldProps as RACTextFieldProps,
  type ValidationResult
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { Description, FieldError, Label } from './Field'
import { fieldBorderStyles } from './styles'
import { composeTailwindRenderProps, focusRing } from './utils'

const inputStyles = tv({
  extend: focusRing,
  base: 'box-border min-h-9 min-w-0 rounded-lg border bg-transparent px-3 py-0 text-sm text-foreground transition placeholder:text-muted-foreground [-webkit-tap-highlight-color:transparent]',
  variants: {
    multiline: {
      true: 'resize-none py-2'
    },
    isFocused: fieldBorderStyles.variants.isFocusWithin,
    isInvalid: fieldBorderStyles.variants.isInvalid,
    isDisabled: fieldBorderStyles.variants.isDisabled
  }
})

export interface TextFieldProps extends RACTextFieldProps {
  readonly label?: string
  readonly description?: string
  readonly placeholder?: string
  readonly errorMessage?: string | ((validation: ValidationResult) => string)
  readonly multiline?: boolean
}

export function TextField({
  label,
  description,
  errorMessage,
  placeholder,
  multiline = false,
  ...props
}: TextFieldProps): React.JSX.Element {
  return (
    <RACTextField
      {...props}
      className={composeTailwindRenderProps(props.className, 'flex flex-col gap-1')}
    >
      {label && <Label>{label}</Label>}
      {multiline ? (
        <TextArea
          rows={3}
          placeholder={placeholder}
          className={(renderProps) => inputStyles({ ...renderProps, multiline })}
        />
      ) : (
        <Input placeholder={placeholder} className={inputStyles} />
      )}
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </RACTextField>
  )
}
