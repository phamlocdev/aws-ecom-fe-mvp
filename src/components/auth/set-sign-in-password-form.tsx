'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useSetOwnPasswordMutation } from '@/hooks/use-user-profile'
import { apiErrorDescription, toApiClientError } from '@/lib/api/errors'
import {
  setSignInPasswordSchema,
  type SetSignInPasswordInput,
  type SetSignInPasswordValues,
} from '@/lib/schemas'
import { useAuthStore } from '@/store/auth-store'
import { PasswordInput } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RequiredMark } from '@/components/shared/required-mark'

export function SetSignInPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hydrate = useAuthStore((state) => state.hydrate)
  const setPasswordMutation = useSetOwnPasswordMutation()
  const next = searchParams.get('next') || '/'
  const form = useForm<SetSignInPasswordInput, unknown, SetSignInPasswordValues>({
    resolver: zodResolver(setSignInPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })
  const isPending = form.formState.isSubmitting || setPasswordMutation.isLoading

  async function handleSubmit(values: SetSignInPasswordValues) {
    try {
      await setPasswordMutation.mutateAsync({ password: values.password })
      form.reset({ password: '', confirmPassword: '' })
      await hydrate(true)
      toast.success('Sign-in password set')
      router.replace(next)
      router.refresh()
    } catch (error) {
      toast.error(toApiClientError(error).message, { description: apiErrorDescription(error) })
    }
  }

  return (
    <div className='mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center'>
      <Card className='w-full'>
        <CardHeader>
          <CardTitle>Set sign-in password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className='space-y-4' onSubmit={form.handleSubmit(handleSubmit)}>
            <div className='space-y-2'>
              <Label htmlFor='signInPassword'>Password<RequiredMark /></Label>
              <PasswordInput
                id='signInPassword'
                autoComplete='new-password'
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register('password')}
              />
              {form.formState.errors.password ? (
                <p className='text-xs text-destructive'>{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmSignInPassword'>Confirm password<RequiredMark /></Label>
              <PasswordInput
                id='confirmSignInPassword'
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
            <Button type='submit' className='w-full' disabled={isPending}>
              <KeyRound />
              {isPending ? 'Saving...' : 'Set password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
