import { RiArrowDownSLine } from '@remixicon/react'
import { useContext } from 'react'
import {
  ComboBox as RACComboBox,
  ComboBoxStateContext,
  ListBox,
  type ComboBoxProps as RACComboBoxProps,
  type ListBoxItemProps,
  type ValidationResult
} from 'react-aria-components'
import { Description, FieldError, FieldGroup, Input, Label } from './Field'
import { FieldButton } from './FieldButton'
import { DropdownItem } from './ListBox'
import { Popover } from './Popover'
import { composeTailwindRenderProps } from './utils'

export interface ComboBoxProps<
  T extends object,
  M extends 'single' | 'multiple' = 'single'
> extends Omit<RACComboBoxProps<T, M>, 'children'> {
  readonly label?: string
  readonly description?: string
  readonly placeholder?: string
  readonly maxLength?: number
  readonly errorMessage?: string | ((validation: ValidationResult) => string)
  readonly children: React.ReactNode | ((item: T) => React.ReactNode)
}

interface ComboBoxInputProps {
  readonly placeholder?: string
  readonly maxLength?: number
}

function ComboBoxInput({ placeholder, maxLength }: ComboBoxInputProps): React.JSX.Element {
  const state = useContext(ComboBoxStateContext)

  return (
    <Input
      placeholder={placeholder}
      maxLength={maxLength}
      className="ps-3 pe-1"
      onClick={() => state && !state.isOpen && state.open(null, 'manual')}
    />
  )
}

export function ComboBox<T extends object, M extends 'single' | 'multiple' = 'single'>({
  label,
  description,
  placeholder,
  maxLength,
  errorMessage,
  children,
  items,
  ...props
}: ComboBoxProps<T, M>): React.JSX.Element {
  return (
    <RACComboBox
      menuTrigger="focus"
      {...props}
      className={composeTailwindRenderProps(props.className, 'group flex flex-col gap-1')}
    >
      {label && <Label>{label}</Label>}
      <FieldGroup>
        <ComboBoxInput placeholder={placeholder} maxLength={maxLength} />
        <FieldButton className="mr-1 w-6 outline-offset-0">
          <RiArrowDownSLine aria-hidden className="size-4" />
        </FieldButton>
      </FieldGroup>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="w-(--trigger-width) has-data-empty:hidden">
        <ListBox
          items={items}
          className="box-border max-h-[inherit] overflow-auto p-1 outline-0 [clip-path:inset(0_0_0_0_round_.75rem)]"
        >
          {children}
        </ListBox>
      </Popover>
    </RACComboBox>
  )
}

export function ComboBoxItem(props: ListBoxItemProps): React.JSX.Element {
  return <DropdownItem {...props} />
}
