import { ModalOverlay, Modal as RACModal, type ModalOverlayProps } from 'react-aria-components'

export function Modal(props: ModalOverlayProps): React.JSX.Element {
  return (
    <ModalOverlay
      {...props}
      className="absolute top-0 left-0 isolate z-[100] h-(--page-height) w-full bg-black/30 text-center"
    >
      <div className="sticky top-0 left-0 box-border flex h-(--visual-viewport-height) w-full items-center justify-center">
        <RACModal className="max-h-[calc(var(--visual-viewport-height)*.9)] w-full max-w-[min(90vw,450px)] rounded-2xl border border-border bg-popover bg-clip-padding text-left align-middle text-popover-foreground shadow-2xl forced-colors:bg-[Canvas]">
          {props.children}
        </RACModal>
      </div>
    </ModalOverlay>
  )
}
