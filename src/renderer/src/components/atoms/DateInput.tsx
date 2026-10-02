import { DateInput as RACDateInput, DateSegment, type DateInputProps } from 'react-aria-components'
import { fieldGroupStyles, segmentStyles } from './styles'

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
