import { RiArrowDownSLine } from '@remixicon/react'
import {
  Button,
  ListBox,
  Select as RACSelect,
  SelectValue,
  type ListBoxItemProps,
  type SelectProps as RACSelectProps,
  type ValidationResult
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { Description, FieldError, Label } from './Field'
import { DropdownItem } from './ListBox'
import { Popover } from './Popover'
import { composeTailwindRenderProps, focusRing } from './utils'

const styles = tv({
  extend: focusRing,
  base: 'flex h-9 w-full min-w-[180px] cursor-default items-center gap-4 rounded-lg border bg-card pr-2 pl-3 text-start shadow-xs transition [-webkit-tap-highlight-color:transparent]',
  variants: {
    isDisabled: {
      false:
        'border-input text-foreground group-invalid:border-destructive hover:bg-accent pressed:bg-accent',
      true: 'border-transparent bg-muted text-muted-foreground forced-colors:text-[GrayText]'
    }
  }
})

export interface SelectProps<T extends object, M extends 'single' | 'multiple'> extends Omit<
  RACSelectProps<T, M>,
  'children'
> {
  readonly label?: string
  readonly description?: string
  readonly errorMessage?: string | ((validation: ValidationResult) => string)
  readonly items?: Iterable<T>
  readonly children: React.ReactNode | ((item: T) => React.ReactNode)
}

export function Select<T extends object, M extends 'single' | 'multiple' = 'single'>({
  label,
  description,
  errorMessage,
  children,
  items,
  ...props
}: SelectProps<T, M>): React.JSX.Element {
  return (
    <RACSelect
      {...props}
      className={composeTailwindRenderProps(props.className, 'group relative flex flex-col gap-2')}
    >
      {label && <Label>{label}</Label>}
      <Button className={styles}>
        <SelectValue className="flex-1 text-sm">
          {({ selectedText, defaultChildren }) => selectedText || defaultChildren}
        </SelectValue>
        <RiArrowDownSLine
          aria-hidden
          className="size-4 text-muted-foreground forced-colors:text-[ButtonText]"
        />
      </Button>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="min-w-(--trigger-width)">
        <ListBox
          items={items}
          className="box-border max-h-[inherit] overflow-auto p-1 outline-hidden [clip-path:inset(0_0_0_0_round_.75rem)]"
        >
          {children}
        </ListBox>
      </Popover>
    </RACSelect>
  )
}

export function SelectItem(props: ListBoxItemProps): React.JSX.Element {
  return <DropdownItem {...props} />
}
