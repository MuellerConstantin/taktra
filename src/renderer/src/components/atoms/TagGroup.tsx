import { RiCloseLine } from '@remixicon/react'
import {
  Button,
  Tag as RACTag,
  TagGroup as RACTagGroup,
  TagList,
  composeRenderProps,
  type TagGroupProps as RACTagGroupProps,
  type TagListProps,
  type TagProps as RACTagProps
} from 'react-aria-components'
import { twMerge } from 'tailwind-merge'
import { tv } from 'tailwind-variants'
import { tintStyle } from './styles'
import { focusRing } from './utils'

export interface TagGroupProps<T>
  extends
    Omit<RACTagGroupProps, 'children'>,
    Pick<TagListProps<T>, 'items' | 'children' | 'renderEmptyState'> {
  readonly listClassName?: string
}

export function TagGroup<T extends object>({
  items,
  children,
  renderEmptyState,
  listClassName,
  ...props
}: TagGroupProps<T>): React.JSX.Element {
  return (
    <RACTagGroup {...props} className={twMerge('flex flex-col gap-2', props.className)}>
      <TagList
        items={items}
        renderEmptyState={renderEmptyState}
        className={twMerge('flex flex-wrap gap-1', listClassName)}
      >
        {children}
      </TagList>
    </RACTagGroup>
  )
}

const tagStyles = tv({
  extend: focusRing,
  base: 'flex max-w-full cursor-default items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground transition [-webkit-tap-highlight-color:transparent]',
  variants: {
    allowsRemoving: {
      true: 'pr-1'
    }
  }
})

const removeButtonStyles = tv({
  extend: focusRing,
  base: 'flex cursor-default items-center justify-center rounded-full border-0 bg-transparent p-0.5 text-[inherit] transition-[background-color] hover:bg-accent pressed:bg-accent/80'
})

export interface TagProps extends RACTagProps {
  readonly color?: string | null
}

export function Tag({ children, color, ...props }: TagProps): React.JSX.Element {
  const textValue = typeof children === 'string' ? children : undefined

  return (
    <RACTag
      textValue={textValue}
      {...props}
      style={tintStyle(color)}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tagStyles({ ...renderProps, className })
      )}
    >
      {composeRenderProps(children, (children, { allowsRemoving }) => (
        <>
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full bg-muted-foreground"
            style={color ? { backgroundColor: color } : undefined}
          />
          <span className="truncate">{children}</span>
          {allowsRemoving && (
            <Button slot="remove" className={removeButtonStyles}>
              <RiCloseLine aria-hidden className="size-3" />
            </Button>
          )}
        </>
      ))}
    </RACTag>
  )
}
