import { RiCheckLine } from '@remixicon/react'
import {
  Collection,
  Header,
  ListBoxItem,
  ListBoxSection,
  composeRenderProps,
  type ListBoxItemProps,
  type ListBoxSectionProps
} from 'react-aria-components'
import { dropdownItemStyles } from './styles'

export function DropdownItem(props: ListBoxItemProps): React.JSX.Element {
  const textValue =
    props.textValue || (typeof props.children === 'string' ? props.children : undefined)

  return (
    <ListBoxItem {...props} textValue={textValue} className={dropdownItemStyles}>
      {composeRenderProps(props.children, (children, { isSelected }) => (
        <>
          <span className="flex flex-1 items-center gap-2 truncate font-normal group-selected:font-semibold">
            {children}
          </span>
          <span className="flex w-5 items-center">
            {isSelected && <RiCheckLine className="size-4" />}
          </span>
        </>
      ))}
    </ListBoxItem>
  )
}

export interface DropdownSectionProps<T> extends ListBoxSectionProps<T> {
  readonly title: string
}

export function DropdownSection<T extends object>({
  title,
  items,
  children,
  ...props
}: DropdownSectionProps<T>): React.JSX.Element {
  return (
    <ListBoxSection {...props} className="not-first:mt-2">
      <Header className="px-3 pt-1 pb-1 text-xs font-medium text-muted-foreground">{title}</Header>
      <Collection items={items}>{children}</Collection>
    </ListBoxSection>
  )
}
