'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PasswordInput } from '@/components/auth/password-input'
import { FormDialog } from '@/components/shared/form-dialog'
import { RequiredMark } from '@/components/shared/required-mark'
import { Label } from '@/components/ui/label'
import {
  setSignInPasswordSchema,
  type SetSignInPasswordInput,
  type SetSignInPasswordValues,
} from '@/lib/schemas'
import type { ManagedUser } from '@/lib/types'

const emptyPasswords: SetSignInPasswordInput = {
  password: '',
  confirmPassword: '',
}

export function ResetPasswordDialog({
  user,
  isPending,
  onOpenChange,
  onReset,
}: {
  user: ManagedUser | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onReset: (input: SetSignInPasswordValues) => Promise<void>
}) {
  const form = useForm<SetSignInPasswordInput, unknown, SetSignInPasswordValues>({
    resolver: zodResolver(setSignInPasswordSchema),
    defaultValues: emptyPasswords,
  })

  function handleOpenChange(open: boolean) {
    if (!open) {
      form.reset(emptyPasswords)
    }
    onOpenChange(open)
  }

  async function onSubmit(values: SetSignInPasswordValues) {
    try {
      await onReset(values)
      form.reset(emptyPasswords)
    } catch {
      // onReset already surfaces a toast on failure; keep entered values for retry.
    }
  }

  return (
    <FormDialog
      trigger={() => null}
      title='Reset password'
      description={`Set a temporary password for ${user?.username ?? ''}. They must change it on next sign in.`}
      open={Boolean(user)}
      onOpenChange={handleOpenChange}
      isPending={isPending}
      onSubmit={form.handleSubmit(onSubmit)}
      submitLabel='Reset password'
      contentClassName='sm:max-w-md'
    >
      <div className='grid gap-2'>
        <Label htmlFor='temporaryPassword'>
          Temporary password
          <RequiredMark />
        </Label>
        <PasswordInput
          id='temporaryPassword'
          autoComplete='new-password'
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register('password')}
        />
        {form.formState.errors.password ? (
          <p className='text-xs text-destructive'>{form.formState.errors.password.message}</p>
        ) : null}
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='confirmTemporaryPassword'>
          Confirm temporary password
          <RequiredMark />
        </Label>
        <PasswordInput
          id='confirmTemporaryPassword'
          autoComplete='new-password'
          aria-invalid={Boolean(form.formState.errors.confirmPassword)}
          {...form.register('confirmPassword')}
        />
        {form.formState.errors.confirmPassword ? (
          <p className='text-xs text-destructive'>
            {form.formState.errors.confirmPassword.message}
          </p>
        ) : null}
      </div>
    </FormDialog>
  )
}
