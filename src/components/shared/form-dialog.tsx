'use client'

import { useState } from 'react'
import type { FormEventHandler, ReactNode } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type FormDialogProps = {
  trigger: (triggerProps: { onClick: () => void }) => ReactNode
  title: ReactNode
  description?: ReactNode
  /** Controlled open state, for dialogs whose open/close is owned by a parent. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  isPending: boolean
  /** Pass `form.handleSubmit(onValid)` here — FormDialog does not own RHF wiring. */
  onSubmit: FormEventHandler<HTMLFormElement>
  submitLabel?: string
  pendingLabel?: string
  contentClassName?: string
  children: ReactNode
}

export function FormDialog({
  trigger,
  title,
  description,
  open: openProp,
  onOpenChange,
  isPending,
  onSubmit,
  submitLabel = 'Save',
  pendingLabel = 'Saving...',
  contentClassName,
  children,
}: FormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  return (
    <>
      {trigger({ onClick: () => setOpen(true) })}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={contentClassName ?? 'sm:max-w-lg'}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>

          <form className='space-y-4' onSubmit={onSubmit}>
            {children}

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isPending}>
                <Save />
                {isPending ? pendingLabel : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
