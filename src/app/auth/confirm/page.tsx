'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { BadgeCheck, RefreshCw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  clearPendingSignUpCredentials,
  confirmUserSignUp,
  readPendingSignUpCredentials,
  resendUserSignUpCode,
  signInWithPassword,
} from '@/lib/auth'
import { recordLoginContext } from '@/lib/api/users'
import { confirmSignUpSchema, type ConfirmSignUpValues } from '@/lib/schemas'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RequiredMark } from '@/components/shared/required-mark'

export default function ConfirmSignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hydrate = useAuthStore((state) => state.hydrate)
  const next = searchParams.get('next') || '/'
  const form = useForm<ConfirmSignUpValues>({
    resolver: zodResolver(confirmSignUpSchema),
    defaultValues: {
      username: searchParams.get('username') ?? '',
      confirmationCode: '',
    },
  })
  const isPending = form.formState.isSubmitting

  async function handleSubmit(values: ConfirmSignUpValues) {
    try {
      await confirmUserSignUp(values)
      const credentials = readPendingSignUpCredentials(values.username)

      if (!credentials) {
        toast.success('Account confirmed. Please sign in.')
        router.push('/auth/login')
        return
      }

      const result = await signInWithPassword(credentials)
      if (result.status !== 'signed-in') {
        toast.success('Account confirmed. Please sign in.')
        router.push('/auth/login')
        return
      }

      clearPendingSignUpCredentials()
      await hydrate(true)
      await recordLoginContextBestEffort()
      toast.success('Account confirmed')
      router.push(next)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to confirm account')
    }
  }

  async function handleResendCode() {
    const username = form.getValues('username').trim()
    if (!username) {
      form.setError('username', { message: 'Email or username is required' })
      return
    }

    try {
      await resendUserSignUpCode(username)
      toast.success('Confirmation code sent')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to resend confirmation code')
    }
  }

  return (
    <div className='mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center'>
      <Card className='w-full'>
        <CardHeader>
          <CardTitle>Confirmation code</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <form className='space-y-4' onSubmit={form.handleSubmit(handleSubmit)}>
            <div className='space-y-2'>
              <Label htmlFor='username'>Username<RequiredMark /></Label>
              <Input
                id='username'
                autoComplete='username'
                aria-invalid={Boolean(form.formState.errors.username)}
                {...form.register('username')}
              />
              {form.formState.errors.username ? (
                <p className='text-xs text-destructive'>{form.formState.errors.username.message}</p>
              ) : null}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmationCode'>Code<RequiredMark /></Label>
              <Input
                id='confirmationCode'
                aria-invalid={Boolean(form.formState.errors.confirmationCode)}
                {...form.register('confirmationCode')}
              />
              {form.formState.errors.confirmationCode ? (
                <p className='text-xs text-destructive'>
                  {form.formState.errors.confirmationCode.message}
                </p>
              ) : null}
            </div>
            <Button type='submit' className='w-full' disabled={isPending}>
              <BadgeCheck />
              {isPending ? 'Confirming...' : 'Confirm account'}
            </Button>
          </form>
          <Button
            type='button'
            variant='outline'
            className='w-full'
            onClick={handleResendCode}
            disabled={isPending}
          >
            <RefreshCw />
            Resend code
          </Button>
          <Link href='/auth/login' className='block text-sm text-primary hover:underline'>
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

async function recordLoginContextBestEffort(): Promise<void> {
  try {
    await recordLoginContext()
  } catch {
    // Login itself succeeded; context tracking can be retried on a future sign-in.
  }
}
