import { Switch as RACSwitch, type SwitchProps as RACSwitchProps } from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { composeTailwindRenderProps, focusRing } from './utils'

const track = tv({
  extend: focusRing,
  base: 'flex h-5 w-9 shrink-0 cursor-default items-center rounded-full border border-transparent px-0.5 transition duration-200 ease-in-out',
  variants: {
    isSelected: {
      false: 'bg-input/60 group-pressed:bg-input',
      true: 'bg-primary group-pressed:bg-primary/90 forced-colors:bg-[Highlight]!'
    },
    isDisabled: {
      true: 'bg-muted forced-colors:bg-[GrayText]'
    }
  }
})

const handle = tv({
  base: 'size-3.5 transform rounded-full bg-white shadow-xs outline outline-1 -outline-offset-1 outline-transparent transition duration-200 ease-in-out',
  variants: {
    isSelected: {
      false: 'translate-x-0',
      true: 'translate-x-4'
    }
  }
})

export interface SwitchProps extends Omit<RACSwitchProps, 'children'> {
  readonly children: React.ReactNode
}

export function Switch({ children, ...props }: SwitchProps): React.JSX.Element {
  return (
    <RACSwitch
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'group relative flex items-center gap-3 text-sm text-foreground transition disabled:text-muted-foreground'
      )}
    >
      {(renderProps) => (
        <>
          <div className={track(renderProps)}>
            <span className={handle(renderProps)} />
          </div>
          {children}
        </>
      )}
    </RACSwitch>
  )
}
