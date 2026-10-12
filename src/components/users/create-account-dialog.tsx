'use client'

import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { FormDialog } from '@/components/shared/form-dialog'
import { RequiredMark } from '@/components/shared/required-mark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createManagedAccountSchema,
  type CreateManagedAccountInput,
  type CreateManagedAccountValues,
} from '@/lib/schemas'

const emptyAccount: CreateManagedAccountInput = {
  username: '',
  email: '',
  password: '',
  name: '',
  group: 'customer',
}

export function CreateAccountDialog({
  isPending,
  onCreate,
}: {
  isPending: boolean
  onCreate: (input: CreateManagedAccountValues) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const form = useForm<CreateManagedAccountInput, unknown, CreateManagedAccountValues>({
    resolver: zodResolver(createManagedAccountSchema),
    defaultValues: emptyAccount,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(emptyAccount)
  }, [form, open])

  async function onSubmit(values: CreateManagedAccountValues) {
    try {
      await onCreate(values)
      setOpen(false)
    } catch {
      // onCreate already surfaces a toast on failure; keep the dialog open to retry.
    }
  }

  return (
    <FormDialog
      trigger={(triggerProps) => (
        <Button type='button' {...triggerProps}>
          <Plus />
          Create account
        </Button>
      )}
      title='Create account'
      description='New accounts start with no permissions until you update the checklist.'
      open={open}
      onOpenChange={setOpen}
      isPending={isPending}
      onSubmit={form.handleSubmit(onSubmit)}
      submitLabel='Create'
    >
      <div className='grid gap-2'>
        <Label htmlFor='username'>
          Username
          <RequiredMark />
        </Label>
        <Input
          id='username'
          aria-invalid={Boolean(form.formState.errors.username)}
          {...form.register('username')}
        />
        {form.formState.errors.username ? (
          <p className='text-xs text-destructive'>{form.formState.errors.username.message}</p>
        ) : null}
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='email'>
          Email
          <RequiredMark />
        </Label>
        <Input
          id='email'
          type='email'
          aria-invalid={Boolean(form.formState.errors.email)}
          {...form.register('email')}
        />
        {form.formState.errors.email ? (
          <p className='text-xs text-destructive'>{form.formState.errors.email.message}</p>
        ) : null}
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='password'>
          Temporary password
          <RequiredMark />
        </Label>
        <Input
          id='password'
          type='password'
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register('password')}
        />
        {form.formState.errors.password ? (
          <p className='text-xs text-destructive'>{form.formState.errors.password.message}</p>
        ) : null}
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='name'>Name</Label>
        <Input id='name' {...form.register('name')} />
      </div>
      <div className='grid gap-2'>
        <Label>Group</Label>
        <Controller
          control={form.control}
          name='group'
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='customer'>customer</SelectItem>
                <SelectItem value='manager'>manager</SelectItem>
                <SelectItem value='admin'>admin</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
    </FormDialog>
  )
}
