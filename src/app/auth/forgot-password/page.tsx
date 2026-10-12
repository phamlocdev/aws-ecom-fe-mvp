'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { confirmPasswordReset, requestPasswordReset } from '@/lib/auth'
import {
  confirmForgotPasswordSchema,
  forgotPasswordSchema,
  type ConfirmForgotPasswordValues,
  type ForgotPasswordValues,
} from '@/lib/schemas'
import { PasswordInput } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RequiredMark } from '@/components/shared/required-mark'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [codeRequested, setCodeRequested] = useState(false)
  const requestForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: '',
    },
  })
  const confirmForm = useForm<ConfirmForgotPasswordValues>({
    resolver: zodResolver(confirmForgotPasswordSchema),
    defaultValues: {
      confirmationCode: '',
      newPassword: '',
      confirmPassword: '',
    },
  })
  const isPending = requestForm.formState.isSubmitting || confirmForm.formState.isSubmitting

  async function handleRequestCode(values: ForgotPasswordValues) {
    try {
      await requestPasswordReset(values)
      setCodeRequested(true)
      toast.success('Reset code sent')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to request reset code')
    }
  }

  async function handleConfirm(values: ConfirmForgotPasswordValues) {
    try {
      await confirmPasswordReset({
        username: requestForm.getValues('username'),
        confirmationCode: values.confirmationCode,
        newPassword: values.newPassword,
      })
      toast.success('Password updated')
      setCodeRequested(false)
      requestForm.reset()
      confirmForm.reset()
      router.push('/auth/login')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to reset password')
    }
  }

  return (
    <div className='mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center'>
      <Card className='w-full'>
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {!codeRequested ? (
            <form className='space-y-4' onSubmit={requestForm.handleSubmit(handleRequestCode)}>
              <div className='space-y-2'>
                <Label htmlFor='username'>Email or username<RequiredMark /></Label>
                <Input
                  id='username'
                  autoComplete='username'
                  aria-invalid={Boolean(requestForm.formState.errors.username)}
                  {...requestForm.register('username')}
                />
                {requestForm.formState.errors.username ? (
                  <p className='text-xs text-destructive'>
                    {requestForm.formState.errors.username.message}
                  </p>
                ) : null}
              </div>
              <Button type='submit' className='w-full' disabled={isPending}>
                <Send />
                {isPending ? 'Sending...' : 'Send reset code'}
              </Button>
            </form>
          ) : (
            <form className='space-y-4' onSubmit={confirmForm.handleSubmit(handleConfirm)}>
              <div className='space-y-2'>
                <Label htmlFor='confirmationCode'>Code<RequiredMark /></Label>
                <Input
                  id='confirmationCode'
                  aria-invalid={Boolean(confirmForm.formState.errors.confirmationCode)}
                  {...confirmForm.register('confirmationCode')}
                />
                {confirmForm.formState.errors.confirmationCode ? (
                  <p className='text-xs text-destructive'>
                    {confirmForm.formState.errors.confirmationCode.message}
                  </p>
                ) : null}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='newPassword'>New password<RequiredMark /></Label>
                <PasswordInput
                  id='newPassword'
                  autoComplete='new-password'
                  aria-invalid={Boolean(confirmForm.formState.errors.newPassword)}
                  {...confirmForm.register('newPassword')}
                />
                {confirmForm.formState.errors.newPassword ? (
                  <p className='text-xs text-destructive'>
                    {confirmForm.formState.errors.newPassword.message}
                  </p>
                ) : null}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>Confirm password<RequiredMark /></Label>
                <PasswordInput
                  id='confirmPassword'
                  autoComplete='new-password'
                  aria-invalid={Boolean(confirmForm.formState.errors.confirmPassword)}
                  {...confirmForm.register('confirmPassword')}
                />
                {confirmForm.formState.errors.confirmPassword ? (
                  <p className='text-xs text-destructive'>
                    {confirmForm.formState.errors.confirmPassword.message}
                  </p>
                ) : null}
              </div>
              <Button type='submit' className='w-full' disabled={isPending}>
                <KeyRound />
                {isPending ? 'Updating...' : 'Update password'}
              </Button>
            </form>
          )}
          <Link href='/auth/login' className='block text-sm text-primary hover:underline'>
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
