'use client'

import Link from 'next/link'
import { Ban, KeyRound, RefreshCcw } from 'lucide-react'
import { EmailStatusBadge } from '@/components/email/email-status-badge'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { Button, buttonVariants } from '@/components/ui/button'
import { formatDateTime } from '@/lib/format'
import type { ManagedUser } from '@/lib/types'
import { cn } from '@/lib/utils'

export function AccountsTable({
  users,
  resendingUserId,
  currentUserId,
  disablingUserId,
  resettingPasswordUserId,
  onResendWelcome,
  onDisableUser,
  onResetPassword,
}: {
  users: ManagedUser[]
  resendingUserId?: string
  currentUserId?: string | null
  disablingUserId?: string
  resettingPasswordUserId?: string
  onResendWelcome: (user: ManagedUser) => void
  onDisableUser: (user: ManagedUser) => void
  onResetPassword: (user: ManagedUser) => void
}) {
  const columns: ColumnDef<ManagedUser>[] = [
    {
      id: 'account',
      header: 'Account',
      headerClassName: 'w-[28%]',
      cell: (user) => (
        <div className='min-w-0 space-y-1'>
          <p className='truncate text-sm font-medium'>{user.name ?? user.username}</p>
          <p className='truncate font-mono text-[11px] text-muted-foreground'>
            {user.sub ?? user.username}
          </p>
        </div>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      cell: (user) => (
        <div className='space-y-1'>
          <p className='text-sm'>{user.email ?? 'No email'}</p>
          <p className='text-xs text-muted-foreground'>
            {user.emailVerified ? 'Verified' : 'Unverified'}
          </p>
        </div>
      ),
    },
    {
      id: 'groups',
      header: 'Groups',
      cell: (user) => (
        <div className='space-y-1 text-sm'>
          <p>{user.groups.join(', ') || 'No groups'}</p>
          <p className='text-xs text-muted-foreground'>{user.permissions.length} permissions</p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cellClassName: 'text-sm text-muted-foreground',
      cell: (user) =>
        user.enabled ? (user.accountStatus ?? user.status ?? 'Enabled') : 'Disabled',
    },
    {
      id: 'welcome',
      header: 'Welcome email',
      cell: (user) => {
        const tracking = user.welcomeEmailTracking
        return (
          <div className='space-y-1'>
            <EmailStatusBadge status={tracking?.status} />
            {tracking ? (
              <p className='text-xs text-muted-foreground'>
                Attempt {tracking.attemptNumber} - {formatDateTime(tracking.updatedAt)}
              </p>
            ) : null}
          </div>
        )
      },
    },
    {
      id: 'created',
      header: 'Created',
      cellClassName: 'text-sm text-muted-foreground',
      cell: (user) => (user.createdAt ? formatDateTime(user.createdAt) : 'N/A'),
    },
    {
      id: 'actions',
      header: 'Actions',
      headerClassName: 'w-28 text-right',
      cell: (user) => {
        const tracking = user.welcomeEmailTracking
        const canResend = Boolean(user.sub && tracking?.recipientEmail && tracking.isRetryable)
        const isResending = resendingUserId === user.sub
        const isSelf = Boolean(currentUserId && user.sub === currentUserId)
        const canMutate = Boolean(user.sub && !isSelf)

        return (
          <div className='flex justify-end gap-2'>
            {user.sub ? (
              <Link
                href={`/admin/users/${encodeURIComponent(user.sub)}/access`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                <KeyRound />
                Permissions
              </Link>
            ) : null}
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!canResend || isResending}
              onClick={() => onResendWelcome(user)}
            >
              <RefreshCcw />
              Resend
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!canMutate || resettingPasswordUserId === user.sub}
              onClick={() => onResetPassword(user)}
            >
              <KeyRound />
              Reset
            </Button>
            <Button
              type='button'
              variant='destructive'
              size='sm'
              disabled={!canMutate || !user.enabled || disablingUserId === user.sub}
              onClick={() => onDisableUser(user)}
            >
              <Ban />
              Disable
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={users}
      rowKey={(user) => user.username}
      emptyTitle='No accounts found'
      emptyDescription='Cognito users will appear here.'
      mobileCard={(user) => {
        const tracking = user.welcomeEmailTracking
        const canResend = Boolean(user.sub && tracking?.recipientEmail && tracking.isRetryable)
        const isResending = resendingUserId === user.sub
        const isSelf = Boolean(currentUserId && user.sub === currentUserId)
        const canMutate = Boolean(user.sub && !isSelf)

        return (
          <div className='space-y-3 p-4'>
            <div>
              <p className='truncate text-sm font-medium'>{user.name ?? user.username}</p>
              <p className='truncate text-xs text-muted-foreground'>{user.email ?? 'No email'}</p>
            </div>
            <div className='flex flex-wrap gap-2'>
              {user.sub ? (
                <Link
                  href={`/admin/users/${encodeURIComponent(user.sub)}/access`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                >
                  <KeyRound />
                  Permissions
                </Link>
              ) : null}
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={!canResend || isResending}
                onClick={() => onResendWelcome(user)}
              >
                <RefreshCcw />
                Resend
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={!canMutate || resettingPasswordUserId === user.sub}
                onClick={() => onResetPassword(user)}
              >
                <KeyRound />
                Reset
              </Button>
              <Button
                type='button'
                variant='destructive'
                size='sm'
                disabled={!canMutate || !user.enabled || disablingUserId === user.sub}
                onClick={() => onDisableUser(user)}
              >
                <Ban />
                Disable
              </Button>
            </div>
          </div>
        )
      }}
    />
  )
}
