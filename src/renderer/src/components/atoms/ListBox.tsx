import { RiCheckLine } from '@remixicon/react'
import { ListBoxItem, composeRenderProps, type ListBoxItemProps } from 'react-aria-components'
import { tv } from 'tailwind-variants'

const dropdownItemStyles = tv({
  base: 'group flex cursor-default items-center gap-4 rounded-lg py-2 pr-3 pl-3 text-sm outline outline-0 select-none forced-color-adjust-none selected:pr-1 [-webkit-tap-highlight-color:transparent]',
  variants: {
    isDisabled: {
      false: 'text-popover-foreground',
      true: 'text-muted-foreground forced-colors:text-[GrayText]'
    },
    isPressed: {
      true: 'bg-accent'
    },
    isFocused: {
      true: 'bg-primary text-primary-foreground forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]'
    }
  }
})

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
