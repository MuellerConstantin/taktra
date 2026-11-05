import { ModalOverlay, Modal as RACModal, type ModalOverlayProps } from 'react-aria-components'
import { tv } from 'tailwind-variants'

const container = tv({
  base: 'sticky top-0 left-0 box-border flex h-(--visual-viewport-height) w-full justify-center',
  variants: {
    placement: {
      center: 'items-center',
      top: 'items-start pt-[10vh]'
    }
  },
  defaultVariants: {
    placement: 'center'
  }
})

const modal = tv({
  base: 'max-h-[calc(var(--visual-viewport-height)*.9)] w-full rounded-2xl border border-border bg-popover bg-clip-padding text-left align-middle text-popover-foreground shadow-2xl forced-colors:bg-[Canvas]',
  variants: {
    size: {
      default: 'max-w-[min(90vw,450px)]',
      wide: 'max-w-[min(90vw,640px)]'
    }
  },
  defaultVariants: {
    size: 'default'
  }
})

interface ModalProps extends ModalOverlayProps {
  readonly size?: 'default' | 'wide'
  readonly placement?: 'center' | 'top'
}

export function Modal({ size, placement, ...props }: ModalProps): React.JSX.Element {
  return (
    <ModalOverlay
      {...props}
      className="absolute top-0 left-0 isolate z-[100] h-(--page-height) w-full bg-black/30 text-center"
    >
      <div className={container({ placement })}>
        <RACModal className={modal({ size })}>{props.children}</RACModal>
      </div>
    </ModalOverlay>
  )
}
