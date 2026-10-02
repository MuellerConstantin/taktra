import { tv } from 'tailwind-variants'

export const dropdownItemStyles = tv({
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

export const fieldBorderStyles = tv({
  base: 'transition',
  variants: {
    isFocusWithin: {
      false: 'border-input hover:border-ring forced-colors:border-[ButtonBorder]',
      true: 'border-foreground forced-colors:border-[Highlight]'
    },
    isInvalid: {
      true: 'border-destructive forced-colors:border-[Mark]'
    },
    isDisabled: {
      true: 'border-muted forced-colors:border-[GrayText]'
    }
  }
})
