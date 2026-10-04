'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, KeyRound, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateUserProfileMutation, useUserProfileQuery } from '@/hooks/use-user-profile'
import { apiErrorDescription, toApiClientError } from '@/lib/api/errors'
import { presignUpload, uploadWithPresignedPost } from '@/lib/api/upload'
import { changeOwnPassword } from '@/lib/auth'
import {
  changePasswordSchema,
  userProfileFormSchema,
  type ChangePasswordInput,
  type ChangePasswordValues,
  type UserProfileFormInput,
  type UserProfileFormValues,
} from '@/lib/schemas'
import { PasswordInput } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResourceError } from '@/components/resource-error'
import { Skeleton } from '@/components/ui/skeleton'

export function UserProfileForm({
  title,
  enableAddress = false,
}: {
  title: string
  enableAddress?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const profileResult = useUserProfileQuery()
  const updateProfileMutation = useUpdateUserProfileMutation()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const profile = profileResult.data
  const profileError = profileResult.error ? toApiClientError(profileResult.error) : null
  const isPending = updateProfileMutation.isLoading || isUploading

  const form = useForm<UserProfileFormInput, unknown, UserProfileFormValues>({
    resolver: zodResolver(userProfileFormSchema),
    defaultValues: {
      name: '',
      address: {
        recipientName: '',
        phone: '',
        line1: '',
        location: {
          ward: '',
          district: '',
          city: '',
        },
        notes: '',
      },
    },
  })
  const changePasswordForm = useForm<ChangePasswordInput, unknown, ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    form.reset({
      name: profile?.name ?? '',
      address: {
        recipientName: profile?.address?.recipientName ?? '',
        phone: profile?.address?.phone ?? '',
        line1: profile?.address?.line1 ?? '',
        location: {
          ward: profile?.address?.location?.ward ?? '',
          district: profile?.address?.location?.district ?? '',
          city: profile?.address?.location?.city ?? '',
        },
        notes: profile?.address?.notes ?? '',
      },
    })
  }, [form, profile])

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
    }
  }, [avatarPreviewUrl])

  function handleAvatarSelected(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) {
      return
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    setAvatarFile(file)
    setAvatarPreviewUrl(nextPreviewUrl)
    setRemoveAvatar(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleRemoveAvatar() {
    setAvatarFile(null)
    setAvatarPreviewUrl(null)
    setRemoveAvatar(true)
  }

  async function onSubmit(values: UserProfileFormValues) {
    try {
      setIsUploading(true)
      let avatarKey: string | null | undefined

      if (avatarFile) {
        const presigned = await presignUpload({
          target: 'avatar',
          files: [
            {
              fileName: avatarFile.name,
              contentType: avatarFile.type,
              sizeBytes: avatarFile.size,
            },
          ],
        })
        const upload = presigned.items[0]
        await uploadWithPresignedPost(avatarFile, upload)
        avatarKey = upload.imageKey
      } else if (removeAvatar) {
        avatarKey = null
      }

      await updateProfileMutation.mutateAsync({
        name: values.name,
        ...(avatarKey !== undefined ? { avatarKey } : {}),
        ...(enableAddress ? { address: values.address } : {}),
      })

      setAvatarFile(null)
      setAvatarPreviewUrl(null)
      setRemoveAvatar(false)
      toast.success('Profile updated')
    } catch (error) {
      toast.error(toApiClientError(error).message, { description: apiErrorDescription(error) })
    } finally {
      setIsUploading(false)
    }
  }

  async function onChangePasswordSubmit(values: ChangePasswordValues) {
    try {
      await changeOwnPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      changePasswordForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      toast.success('Password changed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to change password')
    }
  }

  if (profileResult.isLoading) {
    return <Skeleton className='h-96 w-full' />
  }

  if (profileError) {
    return (
      <ResourceError
        title='Profile endpoint error'
        message={profileError.message}
        details={profileError.details}
      />
    )
  }

  const avatarSrc = removeAvatar ? null : (avatarPreviewUrl ?? profile?.avatarReadUrl)

  return (
    <div className='mx-auto max-w-3xl space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-normal'>{title}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>Manage your account profile.</p>
      </div>

      <form
        className='grid gap-6 rounded-md border bg-card p-4'
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <section className='grid gap-4 sm:grid-cols-[160px_1fr]'>
          <div className='space-y-3'>
            <div className='aspect-square overflow-hidden rounded-md border bg-muted'>
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={profile?.name || profile?.username || 'User avatar'}
                  className='h-full w-full object-cover'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center text-sm text-muted-foreground'>
                  No avatar
                </div>
              )}
            </div>
            <div className='flex gap-2'>
              <Button type='button' variant='outline' onClick={() => fileInputRef.current?.click()}>
                <ImagePlus />
                Upload
              </Button>
              <Button type='button' variant='destructive' onClick={handleRemoveAvatar}>
                <Trash2 />
                Remove
              </Button>
            </div>
            <Input
              ref={fileInputRef}
              type='file'
              accept='image/jpeg,image/png,image/webp'
              className='hidden'
              onChange={(event) => handleAvatarSelected(event.target.files)}
            />
          </div>

          <div className='grid gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='username'>Username</Label>
              <Input id='username' value={profile?.username ?? ''} readOnly />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' value={profile?.email ?? ''} readOnly />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='name'>Name</Label>
              <Input
                id='name'
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register('name')}
              />
              {form.formState.errors.name ? (
                <p className='text-xs text-destructive'>{form.formState.errors.name.message}</p>
              ) : null}
            </div>
          </div>
        </section>

        {enableAddress ? (
          <section className='grid gap-4 border-t pt-4'>
            <div>
              <h2 className='text-base font-semibold tracking-normal'>Address</h2>
              <p className='mt-1 text-sm text-muted-foreground'>
                Save your default delivery contact and location.
              </p>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='addressRecipientName'>Recipient name</Label>
                <Input
                  id='addressRecipientName'
                  aria-invalid={Boolean(form.formState.errors.address?.recipientName)}
                  {...form.register('address.recipientName')}
                />
                {form.formState.errors.address?.recipientName ? (
                  <p className='text-xs text-destructive'>
                    {form.formState.errors.address.recipientName.message}
                  </p>
                ) : null}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='addressPhone'>Phone</Label>
                <Input
                  id='addressPhone'
                  aria-invalid={Boolean(form.formState.errors.address?.phone)}
                  {...form.register('address.phone')}
                />
                {form.formState.errors.address?.phone ? (
                  <p className='text-xs text-destructive'>
                    {form.formState.errors.address.phone.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='addressLine1'>Address line</Label>
              <Input
                id='addressLine1'
                aria-invalid={Boolean(form.formState.errors.address?.line1)}
                {...form.register('address.line1')}
              />
              {form.formState.errors.address?.line1 ? (
                <p className='text-xs text-destructive'>
                  {form.formState.errors.address.line1.message}
                </p>
              ) : null}
            </div>
            <div className='grid gap-4 sm:grid-cols-3'>
              <div className='space-y-2'>
                <Label htmlFor='addressWard'>Ward</Label>
                <Input
                  id='addressWard'
                  aria-invalid={Boolean(form.formState.errors.address?.location?.ward)}
                  {...form.register('address.location.ward')}
                />
                {form.formState.errors.address?.location?.ward ? (
                  <p className='text-xs text-destructive'>
                    {form.formState.errors.address.location.ward.message}
                  </p>
                ) : null}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='addressDistrict'>District</Label>
                <Input
                  id='addressDistrict'
                  aria-invalid={Boolean(form.formState.errors.address?.location?.district)}
                  {...form.register('address.location.district')}
                />
                {form.formState.errors.address?.location?.district ? (
                  <p className='text-xs text-destructive'>
                    {form.formState.errors.address.location.district.message}
                  </p>
                ) : null}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='addressCity'>City</Label>
                <Input
                  id='addressCity'
                  aria-invalid={Boolean(form.formState.errors.address?.location?.city)}
                  {...form.register('address.location.city')}
                />
                {form.formState.errors.address?.location?.city ? (
                  <p className='text-xs text-destructive'>
                    {form.formState.errors.address.location.city.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='addressNotes'>Notes</Label>
              <Input
                id='addressNotes'
                aria-invalid={Boolean(form.formState.errors.address?.notes)}
                {...form.register('address.notes')}
              />
              {form.formState.errors.address?.notes ? (
                <p className='text-xs text-destructive'>
                  {form.formState.errors.address.notes.message}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        <div className='flex justify-end'>
          <Button type='submit' disabled={isPending}>
            <Save />
            {isPending ? 'Saving...' : 'Save profile'}
          </Button>
        </div>
      </form>

      <form
        className='grid gap-4 rounded-md border bg-card p-4'
        onSubmit={changePasswordForm.handleSubmit(onChangePasswordSubmit)}
      >
        <div>
          <h2 className='text-base font-semibold tracking-normal'>Change password</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Update your password by confirming the current one first.
          </p>
        </div>
        <div className='grid gap-4 sm:grid-cols-3'>
          <div className='space-y-2'>
            <Label htmlFor='currentPassword'>Current password</Label>
            <PasswordInput
              id='currentPassword'
              autoComplete='current-password'
              aria-invalid={Boolean(changePasswordForm.formState.errors.currentPassword)}
              {...changePasswordForm.register('currentPassword')}
            />
            {changePasswordForm.formState.errors.currentPassword ? (
              <p className='text-xs text-destructive'>
                {changePasswordForm.formState.errors.currentPassword.message}
              </p>
            ) : null}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='newPassword'>New password</Label>
            <PasswordInput
              id='newPassword'
              autoComplete='new-password'
              aria-invalid={Boolean(changePasswordForm.formState.errors.newPassword)}
              {...changePasswordForm.register('newPassword')}
            />
            {changePasswordForm.formState.errors.newPassword ? (
              <p className='text-xs text-destructive'>
                {changePasswordForm.formState.errors.newPassword.message}
              </p>
            ) : null}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='confirmNewPassword'>Confirm password</Label>
            <PasswordInput
              id='confirmNewPassword'
              autoComplete='new-password'
              aria-invalid={Boolean(changePasswordForm.formState.errors.confirmPassword)}
              {...changePasswordForm.register('confirmPassword')}
            />
            {changePasswordForm.formState.errors.confirmPassword ? (
              <p className='text-xs text-destructive'>
                {changePasswordForm.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
        </div>
        <div className='flex justify-end'>
          <Button type='submit' disabled={changePasswordForm.formState.isSubmitting}>
            <KeyRound />
            {changePasswordForm.formState.isSubmitting ? 'Changing...' : 'Change password'}
          </Button>
        </div>
      </form>
    </div>
  )
}
