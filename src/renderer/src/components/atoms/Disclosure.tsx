import { RiArrowRightSLine } from '@remixicon/react'
import { useContext } from 'react'
import {
  Button,
  Disclosure as RACDisclosure,
  DisclosureGroup as RACDisclosureGroup,
  DisclosurePanel as RACDisclosurePanel,
  DisclosureStateContext,
  Heading,
  composeRenderProps,
  type DisclosureGroupProps,
  type DisclosurePanelProps,
  type DisclosureProps
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { composeTailwindRenderProps, focusRing } from './utils'

const chevron = tv({
  base: 'size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-in-out',
  variants: {
    isExpanded: {
      true: 'rotate-90'
    }
  }
})

const trigger = tv({
  extend: focusRing,
  base: 'flex w-full cursor-default items-center gap-3 text-left text-sm text-foreground -outline-offset-2',
  variants: {
    isHovered: {
      true: 'bg-accent/50'
    }
  }
})

export function DisclosureGroup(props: DisclosureGroupProps): React.JSX.Element {
  return <RACDisclosureGroup {...props} />
}

export function Disclosure(props: DisclosureProps): React.JSX.Element {
  return (
    <RACDisclosure
      {...props}
      className={composeTailwindRenderProps(props.className, 'group text-foreground')}
    />
  )
}

interface DisclosureHeaderProps {
  readonly className?: string
  readonly children: React.ReactNode
}

export function DisclosureHeader({
  className,
  children
}: DisclosureHeaderProps): React.JSX.Element {
  const { isExpanded } = useContext(DisclosureStateContext)!

  return (
    <Heading className="m-0">
      <Button
        slot="trigger"
        className={composeRenderProps(className, (className, renderProps) =>
          trigger({ ...renderProps, className })
        )}
      >
        <RiArrowRightSLine aria-hidden className={chevron({ isExpanded })} />
        {children}
      </Button>
    </Heading>
  )
}

export function DisclosurePanel(props: DisclosurePanelProps): React.JSX.Element {
  return (
    <RACDisclosurePanel
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'h-(--disclosure-panel-height) overflow-clip motion-safe:transition-[height]'
      )}
    />
  )
}
