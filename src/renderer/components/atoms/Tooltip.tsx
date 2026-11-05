import {
  OverlayArrow,
  Tooltip as RACTooltip,
  composeRenderProps,
  type TooltipProps as RACTooltipProps
} from 'react-aria-components'
import { tv } from 'tailwind-variants'

export interface TooltipProps extends Omit<RACTooltipProps, 'children'> {
  readonly children: React.ReactNode
}

const styles = tv({
  base: 'group box-border rounded-md border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md will-change-transform not-data-placement:invisible'
})

export function Tooltip({ children, ...props }: TooltipProps): React.JSX.Element {
  return (
    <RACTooltip
      {...props}
      offset={10}
      className={composeRenderProps(props.className, (className, renderProps) =>
        styles({ ...renderProps, className })
      )}
    >
      <OverlayArrow>
        <svg
          width={8}
          height={8}
          viewBox="0 0 8 8"
          className="block fill-popover stroke-border group-placement-left:-rotate-90 group-placement-right:rotate-90 group-placement-bottom:rotate-180 forced-colors:fill-[Canvas] forced-colors:stroke-[ButtonBorder]"
        >
          <path d="M0 0 L4 4 L8 0" />
        </svg>
      </OverlayArrow>
      {children}
    </RACTooltip>
  )
}
