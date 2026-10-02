import {
  Dialog as RACDialog,
  Heading as RACHeading,
  type DialogProps,
  type HeadingProps
} from 'react-aria-components'
import { twMerge } from 'tailwind-merge'

export function Dialog(props: DialogProps): React.JSX.Element {
  return (
    <RACDialog
      {...props}
      className={twMerge(
        'relative box-border max-h-[inherit] overflow-auto p-6 outline outline-0',
        props.className
      )}
    />
  )
}

export function DialogHeading(props: HeadingProps): React.JSX.Element {
  return (
    <RACHeading
      slot="title"
      {...props}
      className={twMerge('text-lg font-semibold', props.className)}
    />
  )
}
