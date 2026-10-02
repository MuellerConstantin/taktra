import { DateInput as RACDateInput, DateSegment, type DateInputProps } from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { fieldGroupStyles } from './styles'

const segmentStyles = tv({
  base: 'inline rounded-xs p-0.5 whitespace-nowrap text-foreground tabular-nums caret-transparent outline outline-0 forced-color-adjust-none type-literal:p-0 forced-colors:text-[ButtonText] [-webkit-tap-highlight-color:transparent]',
  variants: {
    isPlaceholder: {
      true: 'text-muted-foreground'
    },
    isDisabled: {
      true: 'text-muted-foreground forced-colors:text-[GrayText]'
    },
    isFocused: {
      true: 'bg-primary text-primary-foreground forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]'
    }
  }
})

export function DateInput(props: Omit<DateInputProps, 'children'>): React.JSX.Element {
  return (
    <RACDateInput
      className={(renderProps) =>
        fieldGroupStyles({
          ...renderProps,
          class:
            'inline h-9 min-w-[150px] cursor-text [scrollbar-width:none] overflow-x-auto px-3 text-sm leading-8.5 whitespace-nowrap disabled:cursor-default'
        })
      }
      {...props}
    >
      {(segment) => <DateSegment segment={segment} className={segmentStyles} />}
    </RACDateInput>
  )
}
