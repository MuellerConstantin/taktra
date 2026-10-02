import { RiCloseLine, RiSearchLine } from '@remixicon/react'
import {
  Button,
  Group,
  Input,
  SearchField as RACSearchField,
  type SearchFieldProps as RACSearchFieldProps
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { fieldBorderStyles } from './styles'
import { composeTailwindRenderProps, focusRing } from './utils'

const groupStyles = tv({
  extend: focusRing,
  base: 'flex h-9 items-center gap-2 rounded-lg border bg-transparent px-3 transition',
  variants: fieldBorderStyles.variants
})

interface SearchFieldProps extends RACSearchFieldProps {
  readonly placeholder?: string
}

export function SearchField({ placeholder, ...props }: SearchFieldProps): React.JSX.Element {
  return (
    <RACSearchField
      {...props}
      className={composeTailwindRenderProps(props.className, 'group flex min-w-0 flex-col')}
    >
      <Group className={groupStyles}>
        <RiSearchLine aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        <Button className="rounded-md p-0.5 text-muted-foreground outline-none group-empty:invisible hover:text-foreground">
          <RiCloseLine aria-hidden className="size-4" />
        </Button>
      </Group>
    </RACSearchField>
  )
}
