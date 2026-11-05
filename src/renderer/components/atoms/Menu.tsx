import { Children } from 'react'
import { RiCheckLine } from '@remixicon/react'
import {
  Collection,
  Header,
  Menu as RACMenu,
  MenuItem as RACMenuItem,
  MenuSection as RACMenuSection,
  MenuTrigger as RACMenuTrigger,
  Separator,
  composeRenderProps,
  type MenuItemProps,
  type MenuProps,
  type MenuSectionProps as RACMenuSectionProps,
  type MenuTriggerProps as RACMenuTriggerProps,
  type SeparatorProps
} from 'react-aria-components'
import { twMerge } from 'tailwind-merge'
import { Popover, type PopoverProps } from './Popover'
import { dropdownItemStyles } from './styles'

export function Menu<T extends object>(props: MenuProps<T>): React.JSX.Element {
  return (
    <RACMenu
      {...props}
      className="max-h-[inherit] overflow-auto p-1 outline outline-0 [clip-path:inset(0_0_0_0_round_.75rem)] empty:pb-2 empty:text-center"
    />
  )
}

export function MenuItem(props: MenuItemProps): React.JSX.Element {
  const textValue =
    props.textValue || (typeof props.children === 'string' ? props.children : undefined)

  return (
    <RACMenuItem textValue={textValue} {...props} className={dropdownItemStyles}>
      {composeRenderProps(props.children, (children, { selectionMode, isSelected }) => (
        <>
          {selectionMode !== 'none' && (
            <span className="flex w-4 items-center">
              {isSelected && <RiCheckLine aria-hidden className="size-4" />}
            </span>
          )}
          <span className="flex flex-1 items-center gap-2 truncate font-normal group-selected:font-semibold">
            {children}
          </span>
        </>
      ))}
    </RACMenuItem>
  )
}

export function MenuSeparator(props: SeparatorProps): React.JSX.Element {
  return <Separator {...props} className="mx-3 my-1 border-b border-border" />
}

export interface MenuSectionProps<T> extends RACMenuSectionProps<T> {
  readonly title?: string
  readonly items?: Iterable<T>
}

export function MenuSection<T extends object>({
  title,
  items,
  children,
  className,
  ...props
}: MenuSectionProps<T>): React.JSX.Element {
  return (
    <RACMenuSection {...props} className={twMerge('flex flex-col', className)}>
      {title && (
        <Header className="truncate px-3 pt-1.5 pb-1 text-xs font-semibold text-muted-foreground">
          {title}
        </Header>
      )}
      <Collection items={items}>{children}</Collection>
    </RACMenuSection>
  )
}

interface MenuTriggerProps extends RACMenuTriggerProps {
  readonly placement?: PopoverProps['placement']
  readonly popoverClassName?: string
}

export function MenuTrigger({
  placement,
  popoverClassName,
  children,
  ...props
}: MenuTriggerProps): React.JSX.Element {
  const [trigger, menu] = Children.toArray(children) as [React.ReactElement, React.ReactElement]

  return (
    <RACMenuTrigger {...props}>
      {trigger}
      <Popover placement={placement} className={twMerge('min-w-[150px]', popoverClassName)}>
        {menu}
      </Popover>
    </RACMenuTrigger>
  )
}
