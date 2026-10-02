import { RiErrorWarningLine, RiInformationLine } from '@remixicon/react'
import type { DialogProps } from 'react-aria-components'
import { Button } from './Button'
import { Dialog, DialogHeading } from './Dialog'

interface AlertDialogProps extends Omit<DialogProps, 'children'> {
  readonly title: string
  readonly children: React.ReactNode
  readonly variant?: 'info' | 'destructive'
  readonly actionLabel: string
  readonly cancelLabel?: string
  readonly onAction?: () => void
}

export function AlertDialog({
  title,
  variant = 'info',
  cancelLabel,
  actionLabel,
  onAction,
  children,
  ...props
}: AlertDialogProps): React.JSX.Element {
  const Icon = variant === 'destructive' ? RiErrorWarningLine : RiInformationLine

  return (
    <Dialog role="alertdialog" {...props}>
      {({ close }) => (
        <>
          <DialogHeading className="pr-8">{title}</DialogHeading>
          <Icon
            aria-hidden
            className={`absolute top-6 right-6 size-6 ${variant === 'destructive' ? 'text-destructive' : 'text-primary'}`}
          />
          <div className="mt-3 text-sm text-muted-foreground">{children}</div>
          <div className="mt-6 flex justify-end gap-2">
            {cancelLabel && (
              <Button variant="secondary" autoFocus={variant === 'destructive'} onPress={close}>
                {cancelLabel}
              </Button>
            )}
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'primary'}
              autoFocus={variant !== 'destructive' || !cancelLabel}
              onPress={() => {
                onAction?.()
                close()
              }}
            >
              {actionLabel}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  )
}
