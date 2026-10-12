'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export type ConfirmDeleteDialogProps = {
  trigger: (triggerProps: { onClick: () => void }) => ReactNode
  title: string
  description: ReactNode
  isPending: boolean
  /**
   * Owns its own try/catch + toast, same as before this wrapper existed. Call the
   * provided `close` callback only on success, so the dialog stays open on failure
   * exactly like the dialogs this component replaces.
   */
  onConfirm: (close: () => void) => void | Promise<void>
  confirmLabel?: string
  pendingLabel?: string
}

export function ConfirmDeleteDialog({
  trigger,
  title,
  description,
  isPending,
  onConfirm,
  confirmLabel = 'Delete',
  pendingLabel = 'Deleting...',
}: ConfirmDeleteDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {trigger({ onClick: () => setOpen(true) })}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className='text-destructive' />
            </AlertDialogMedia>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => onConfirm(() => setOpen(false))}
              disabled={isPending}
            >
              {isPending ? pendingLabel : confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
