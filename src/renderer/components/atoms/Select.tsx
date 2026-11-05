import { RiArrowDownSLine } from '@remixicon/react'
import {
  Autocomplete,
  Button,
  ListBox,
  Select as RACSelect,
  SelectValue,
  type ListBoxItemProps,
  type SelectProps as RACSelectProps,
  type ValidationResult,
  useFilter
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { Description, FieldError, Label } from './Field'
import { DropdownItem } from './ListBox'
import { Popover } from './Popover'
import { SearchField } from './SearchField'
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
  /** Adds a search field above the options, for long lists. */
  readonly search?: { readonly label: string; readonly empty: string }
  readonly children: React.ReactNode | ((item: T) => React.ReactNode)
}

export function Select<T extends object, M extends 'single' | 'multiple' = 'single'>({
  label,
  description,
  errorMessage,
  children,
  items,
  search,
  ...props
}: SelectProps<T, M>): React.JSX.Element {
  const { contains } = useFilter({ sensitivity: 'base' })

  const listBox = (
    <ListBox
      items={items}
      renderEmptyState={
        search
          ? () => <p className="px-3 py-2 text-sm text-muted-foreground">{search.empty}</p>
          : undefined
      }
      className="box-border min-h-0 flex-1 overflow-auto p-1 outline-hidden [clip-path:inset(0_0_0_0_round_.75rem)]"
    >
      {children}
    </ListBox>
  )

  return (
    <RACSelect
      {...props}
      className={composeTailwindRenderProps(props.className, 'group relative flex flex-col gap-2')}
    >
      {label && <Label>{label}</Label>}
      <Button className={styles}>
        <SelectValue className="min-w-0 flex-1 truncate text-sm">
          {({ selectedText, defaultChildren }) => selectedText || defaultChildren}
        </SelectValue>
        <RiArrowDownSLine
          aria-hidden
          className="size-4 text-muted-foreground forced-colors:text-[ButtonText]"
        />
      </Button>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="flex min-w-(--trigger-width) flex-col">
        {search ? (
          <Autocomplete filter={contains}>
            <SearchField
              aria-label={search.label}
              placeholder={search.label}
              autoFocus
              className="m-1 mb-0"
            />
            {listBox}
          </Autocomplete>
        ) : (
          listBox
        )}
      </Popover>
    </RACSelect>
  )
}

export function SelectItem(props: ListBoxItemProps): React.JSX.Element {
  return <DropdownItem {...props} />
}
