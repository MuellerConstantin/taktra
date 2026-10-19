import { RiArrowRightSLine } from '@remixicon/react'
import {
  DropIndicator as RACDropIndicator,
  GridList as RACGridList,
  GridListItem as RACGridListItem,
  composeRenderProps,
  type DropIndicatorProps,
  type GridListItemProps,
  type GridListProps
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { composeTailwindRenderProps, focusRing } from './utils'

export function GridList<T extends object>(props: GridListProps<T>): React.JSX.Element {
  return (
    <RACGridList
      {...props}
      className={composeTailwindRenderProps(props.className, 'relative overflow-auto outline-0')}
    />
  )
}

const itemStyles = tv({
  extend: focusRing,
  base: 'relative flex h-full cursor-default items-center gap-3 border-b border-border px-8 text-sm text-foreground -outline-offset-2 select-none',
  variants: {
    isHovered: {
      true: 'bg-accent/50'
    },
    isPressed: {
      true: 'bg-accent'
    },
    isSelected: {
      true: 'bg-accent'
    },
    isDragging: {
      true: 'opacity-50'
    }
  }
})

export function GridListItem(props: GridListItemProps): React.JSX.Element {
  const textValue =
    props.textValue || (typeof props.children === 'string' ? props.children : undefined)

  return (
    <RACGridListItem
      {...props}
      textValue={textValue}
      className={composeRenderProps(props.className, (className, renderProps) =>
        itemStyles({ ...renderProps, className })
      )}
    />
  )
}

export function GridListDropIndicator(props: DropIndicatorProps): React.JSX.Element {
  return (
    <RACDropIndicator
      {...props}
      className={({ isDropTarget }) =>
        isDropTarget ? 'h-0.5 bg-primary outline-0' : 'h-0 outline-0'
      }
    />
  )
}

export function GridListChevron(): React.JSX.Element {
  return (
    <RiArrowRightSLine
      aria-hidden
      className="size-6 shrink-0 stroke-current stroke-1 text-primary"
    />
  )
}
