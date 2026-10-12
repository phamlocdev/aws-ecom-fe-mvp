'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { EmailStatisticsCards } from '@/components/email/email-statistics-cards'
import { ResourceError } from '@/components/resource-error'
import { PageHeader } from '@/components/shared/page-header'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { AccountsTable } from '@/components/users/accounts-table'
import { CreateAccountDialog } from '@/components/users/create-account-dialog'
import { ResetPasswordDialog } from '@/components/users/reset-password-dialog'
import {
  useCreateManagedUserMutation,
  useDisableManagedUserMutation,
  useResetManagedUserPasswordMutation,
  useResendFailedWelcomeEmailMutation,
  useUserEmailStatisticsQuery,
  useUsersQuery,
} from '@/hooks/use-managed-users'
import { toApiClientError } from '@/lib/api/errors'
import type { CreateManagedAccountValues, SetSignInPasswordValues } from '@/lib/schemas'
import type { ManagedUser } from '@/lib/types'
import { useAuthStore } from '@/store/auth-store'

export default function AdminUsersPage() {
  const usersResult = useUsersQuery()
  const statisticsResult = useUserEmailStatisticsQuery()
  const createUserMutation = useCreateManagedUserMutation()
  const disableUserMutation = useDisableManagedUserMutation()
  const resetPasswordMutation = useResetManagedUserPasswordMutation()
  const resendMutation = useResendFailedWelcomeEmailMutation()
  const { userId } = useAuthStore()
  const [resendingUserId, setResendingUserId] = useState<string>()
  const [disablingUserId, setDisablingUserId] = useState<string>()
  const [resettingPasswordUser, setResettingPasswordUser] = useState<ManagedUser | null>(null)
  const users = usersResult.data ?? []
  const usersError = usersResult.error ? toApiClientError(usersResult.error) : null
  const statisticsError = statisticsResult.error ? toApiClientError(statisticsResult.error) : null

  async function handleResendWelcome(user: ManagedUser) {
    const recipientEmail = user.welcomeEmailTracking?.recipientEmail
    if (!user.sub || !recipientEmail) {
      return
    }

    setResendingUserId(user.sub)
    try {
      const result = await resendMutation.mutateAsync({
        userId: user.sub,
        recipientEmail,
      })
      if (result.resentCount === 0) {
        toast.info('This recipient is no longer retryable.')
      } else {
        toast.success(`Resent welcome email to ${recipientEmail}.`)
      }
    } catch (error) {
      toast.error(toApiClientError(error).message)
    } finally {
      setResendingUserId(undefined)
    }
  }

  async function handleCreateUser(input: CreateManagedAccountValues) {
    try {
      await createUserMutation.mutateAsync({
        ...input,
        permissions: [],
      })
      toast.success(`Created account ${input.username}.`)
    } catch (error) {
      toast.error(toApiClientError(error).message)
      throw error
    }
  }

  async function handleDisableUser(user: ManagedUser) {
    if (!user.sub) {
      return
    }

    setDisablingUserId(user.sub)
    try {
      await disableUserMutation.mutateAsync(user.sub)
      toast.success(`Disabled ${user.username}.`)
    } catch (error) {
      toast.error(toApiClientError(error).message)
    } finally {
      setDisablingUserId(undefined)
    }
  }

  async function handleResetPassword(input: SetSignInPasswordValues) {
    if (!resettingPasswordUser?.sub) {
      return
    }

    try {
      await resetPasswordMutation.mutateAsync({
        userId: resettingPasswordUser.sub,
        input: { password: input.password },
      })
      toast.success(`Set a temporary password for ${resettingPasswordUser.username}.`)
      setResettingPasswordUser(null)
    } catch (error) {
      toast.error(toApiClientError(error).message)
      throw error
    }
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Accounts'
        subtitle='Manage Cognito accounts, access token permissions, and welcome email delivery.'
        actions={
          <CreateAccountDialog
            isPending={createUserMutation.isLoading}
            onCreate={handleCreateUser}
          />
        }
      />

      {usersError ? (
        <ResourceError
          title='Users endpoint error'
          message={usersError.message}
          details={usersError.details}
        />
      ) : null}
      {statisticsError ? (
        <ResourceError
          title='Email statistics endpoint error'
          message={statisticsError.message}
          details={statisticsError.details}
        />
      ) : null}

      <EmailStatisticsCards
        statistics={statisticsResult.data}
        emailTypes={['WELCOME_NEW_CUSTOMER']}
      />

      {usersResult.isLoading ? (
        <UsersSkeleton />
      ) : !usersError ? (
        <AccountsTable
          users={users}
          resendingUserId={resendingUserId}
          currentUserId={userId}
          disablingUserId={disablingUserId}
          resettingPasswordUserId={
            resetPasswordMutation.isLoading ? resettingPasswordUser?.sub : undefined
          }
          onResendWelcome={handleResendWelcome}
          onDisableUser={handleDisableUser}
          onResetPassword={setResettingPasswordUser}
        />
      ) : null}

      <ResetPasswordDialog
        user={resettingPasswordUser}
        isPending={resetPasswordMutation.isLoading}
        onOpenChange={(open) => {
          if (!open && !resetPasswordMutation.isLoading) {
            setResettingPasswordUser(null)
          }
        }}
        onReset={handleResetPassword}
      />
    </div>
  )
}

function UsersSkeleton() {
  return <TableSkeleton rows={6} cols={7} />
}
