import { RiCalendarLine } from '@remixicon/react'
import {
  DateInput as RACDateInput,
  DateRangePicker as RACDateRangePicker,
  DateSegment,
  type DateRangePickerProps as RACDateRangePickerProps,
  type DateValue,
  type ValidationResult
} from 'react-aria-components'
import { twMerge } from 'tailwind-merge'
import { Dialog } from './Dialog'
import { Description, FieldError, FieldGroup, Label } from './Field'
import { FieldButton } from './FieldButton'
import { Popover } from './Popover'
import { RangeCalendar } from './RangeCalendar'
import { segmentStyles } from './styles'
import { composeTailwindRenderProps } from './utils'

export interface DateRangePickerProps<T extends DateValue> extends RACDateRangePickerProps<T> {
  readonly label?: string
  readonly description?: string
  readonly errorMessage?: string | ((validation: ValidationResult) => string)
}

interface RangeInputProps {
  readonly slot: 'start' | 'end'
  readonly className: string
}

function RangeInput({ slot, className }: RangeInputProps): React.JSX.Element {
  return (
    <RACDateInput slot={slot} className={twMerge('text-sm whitespace-nowrap', className)}>
      {(segment) => <DateSegment segment={segment} className={segmentStyles} />}
    </RACDateInput>
  )
}

export function DateRangePicker<T extends DateValue>({
  label,
  description,
  errorMessage,
  ...props
}: DateRangePickerProps<T>): React.JSX.Element {
  return (
    <RACDateRangePicker
      {...props}
      className={composeTailwindRenderProps(props.className, 'group flex flex-col gap-2')}
    >
      {label && <Label>{label}</Label>}
      <FieldGroup className="w-auto cursor-text disabled:cursor-default">
        <RangeInput slot="start" className="ps-3 pe-2" />
        <span aria-hidden className="text-muted-foreground">
          –
        </span>
        <RangeInput slot="end" className="flex-1 ps-2 pe-2" />
        <FieldButton className="mr-1">
          <RiCalendarLine aria-hidden className="size-4" />
        </FieldButton>
      </FieldGroup>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover>
        <Dialog className="p-3">
          <RangeCalendar />
        </Dialog>
      </Popover>
    </RACDateRangePicker>
  )
}
