import { RiCheckLine } from '@remixicon/react'
import { ListBoxItem, composeRenderProps, type ListBoxItemProps } from 'react-aria-components'
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
