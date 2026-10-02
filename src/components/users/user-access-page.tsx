'use client'

import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, Check, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ResourceError } from '@/components/resource-error'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useUpdateUserPermissionsMutation, useUsersQuery } from '@/hooks/use-user-profile'
import { toApiClientError } from '@/lib/api/errors'
import { Permission } from '@/lib/permissions'
import { resolveDynamicRouteSegment } from '@/lib/routing'
import type { Permission as PermissionValue } from '@/lib/types'
import { cn } from '@/lib/utils'

type ActionKey = 'create' | 'read' | 'update' | 'delete'

type PermissionRow = {
  module: string
  permissions: Partial<Record<ActionKey, PermissionValue>>
}

const actionColumns: { key: ActionKey; label: string }[] = [
  { key: 'create', label: 'Create' },
  { key: 'read', label: 'Read' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
]

const emptyPermissions: PermissionValue[] = []

const permissionRows: PermissionRow[] = [
  {
    module: 'Products',
    permissions: {
      create: Permission.PRODUCTS_CREATE,
      read: Permission.PRODUCTS_READ,
      update: Permission.PRODUCTS_UPDATE,
      delete: Permission.PRODUCTS_DELETE,
    },
  },
  {
    module: 'Categories',
    permissions: {
      create: Permission.CATEGORIES_CREATE,
      read: Permission.CATEGORIES_READ,
      update: Permission.CATEGORIES_UPDATE,
      delete: Permission.CATEGORIES_DELETE,
    },
  },
  {
    module: 'Inventories',
    permissions: {
      read: Permission.INVENTORIES_READ,
      update: Permission.INVENTORIES_UPDATE,
    },
  },
  {
    module: 'Orders',
    permissions: {
      read: Permission.ORDERS_READ,
      update: Permission.ORDERS_UPDATE,
    },
  },
  {
    module: 'Order emails',
    permissions: {
      read: Permission.ORDERS_EMAIL_READ,
      update: Permission.ORDERS_EMAIL_RESEND,
    },
  },
  {
    module: 'User & access',
    permissions: {
      create: Permission.USERS_CREATE,
      read: Permission.USERS_READ,
      update: Permission.USERS_UPDATE,
      delete: Permission.USERS_DISABLE,
    },
  },
  {
    module: 'User permissions',
    permissions: {
      update: Permission.USERS_PERMISSIONS_UPDATE,
    },
  },
  {
    module: 'Welcome emails',
    permissions: {
      read: Permission.USERS_EMAIL_READ,
      update: Permission.USERS_EMAIL_RESEND,
    },
  },
  {
    module: 'Audit',
    permissions: {
      read: Permission.AUDIT_READ,
    },
  },
]

export function UserAccessPage() {
  const params = useParams<{ userId?: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const userId = resolveDynamicRouteSegment(params.userId, pathname, '/admin/users')
  const usersResult = useUsersQuery()
  const updatePermissionsMutation = useUpdateUserPermissionsMutation()
  const users = usersResult.data ?? []
  const user = users.find((item) => item.sub === userId)
  const usersError = usersResult.error ? toApiClientError(usersResult.error) : null
  const [selectedPermissionsOverride, setSelectedPermissionsOverride] = useState<
    PermissionValue[] | null
  >(null)
  const selectedPermissions = selectedPermissionsOverride ?? user?.permissions ?? emptyPermissions
  const selectedSet = useMemo(() => new Set(selectedPermissions), [selectedPermissions])

  if (usersResult.isLoading) {
    return <Skeleton className='h-[32rem] w-full' />
  }

  if (usersError) {
    return (
      <ResourceError
        title='Users endpoint error'
        message={usersError.message}
        details={usersError.details}
      />
    )
  }

  if (!user) {
    return (
      <ResourceError
        title='Account not found'
        message='This account no longer exists or cannot be loaded.'
      />
    )
  }

  function togglePermission(permission: PermissionValue) {
    setSelectedPermissionsOverride((current) => {
      const permissions = current ?? user?.permissions ?? []
      return permissions.includes(permission)
        ? permissions.filter((item) => item !== permission)
        : [...permissions, permission].sort()
    })
  }

  async function handleSave() {
    if (!user?.sub) {
      return
    }

    try {
      await updatePermissionsMutation.mutateAsync({
        userId: user.sub,
        permissions: selectedPermissions,
      })
      toast.success('Updated permissions. The user must refresh token or sign in again.')
      router.push('/admin/users')
    } catch (error) {
      toast.error(toApiClientError(error).message)
    }
  }

  return (
    <div className='min-h-[calc(100vh-7rem)] space-y-6'>
      <div className='space-y-1'>
        <div className='text-xs text-muted-foreground'>
          Settings <span className='px-1'>/</span> User & access
        </div>
        <h1 className='text-2xl font-semibold tracking-normal'>Edit user access</h1>
      </div>

      <section className='space-y-5 border-t pt-5'>
        <h2 className='text-sm font-semibold'>General Info</h2>
        <div className='grid gap-4 sm:grid-cols-2'>
          <ReadOnlyField label='Full name' value={user.name ?? user.username} />
          <ReadOnlyField label='Email' value={user.email ?? 'No email'} />
        </div>
      </section>

      <section className='space-y-4 border-t pt-5'>
        <div>
          <h2 className='text-sm font-semibold'>Role & access</h2>
          <div className='mt-4 inline-flex rounded-md border bg-muted p-1'>
            <span className='rounded px-3 py-1.5 text-xs text-muted-foreground'>Default role</span>
            <span className='rounded bg-background px-3 py-1.5 text-xs font-medium shadow-sm'>
              Custom role
            </span>
          </div>
        </div>

        <PermissionMatrix
          selectedPermissions={selectedSet}
          disabled={updatePermissionsMutation.isLoading}
          onToggle={togglePermission}
        />
      </section>

      <div className='flex items-center justify-between pt-10'>
        <Link href='/admin/users' className={cn(buttonVariants({ variant: 'ghost' }))}>
          <ArrowLeft />
          Back
        </Link>
        <div className='flex gap-2'>
          <Button type='button' variant='outline' onClick={() => router.push('/admin/users')}>
            Cancel
          </Button>
          <Button
            type='button'
            disabled={updatePermissionsMutation.isLoading}
            onClick={handleSave}
          >
            <Save />
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className='grid gap-2'>
      <Label>
        {label} <span className='text-destructive'>*</span>
      </Label>
      <Input value={value} readOnly />
    </div>
  )
}

function PermissionMatrix({
  selectedPermissions,
  disabled,
  onToggle,
}: {
  selectedPermissions: Set<PermissionValue>
  disabled: boolean
  onToggle: (permission: PermissionValue) => void
}) {
  return (
    <div className='overflow-x-auto rounded-md border bg-card'>
      <div className='min-w-[44rem]'>
        <div className='grid grid-cols-[minmax(11rem,2fr)_repeat(4,minmax(6rem,1fr))] border-b bg-muted/30 text-sm font-medium'>
          <div className='flex items-center gap-2 border-r p-3'>
            <span className='flex size-4 items-center justify-center rounded bg-foreground text-[10px] text-background'>
              -
            </span>
            Module
          </div>
          {actionColumns.map((column) => (
            <div key={column.key} className='flex items-center gap-2 border-r p-3 last:border-r-0'>
              <span className='flex size-4 items-center justify-center rounded bg-foreground text-[10px] text-background'>
                -
              </span>
              {column.label}
            </div>
          ))}
        </div>
        {permissionRows.map((row) => (
          <div
            key={row.module}
            className='grid grid-cols-[minmax(11rem,2fr)_repeat(4,minmax(6rem,1fr))] border-b text-sm last:border-b-0'
          >
            <div className='flex items-center gap-3 border-r p-3'>
              <ModuleCheckbox
                permissions={Object.values(row.permissions)}
                selectedPermissions={selectedPermissions}
                disabled={disabled}
                onToggle={onToggle}
              />
              <span>{row.module}</span>
            </div>
            {actionColumns.map((column) => {
              const permission = row.permissions[column.key]
              return (
                <div key={column.key} className='flex items-center border-r p-3 last:border-r-0'>
                  {permission ? (
                    <PermissionCheckbox
                      permission={permission}
                      checked={selectedPermissions.has(permission)}
                      disabled={disabled}
                      onToggle={onToggle}
                    />
                  ) : (
                    <span className='size-4 rounded border bg-muted/30' />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function ModuleCheckbox({
  permissions,
  selectedPermissions,
  disabled,
  onToggle,
}: {
  permissions: Array<PermissionValue | undefined>
  selectedPermissions: Set<PermissionValue>
  disabled: boolean
  onToggle: (permission: PermissionValue) => void
}) {
  const availablePermissions = permissions.filter((permission): permission is PermissionValue =>
    Boolean(permission),
  )
  const isChecked =
    availablePermissions.length > 0 &&
    availablePermissions.every((permission) => selectedPermissions.has(permission))

  function handleToggle() {
    const shouldSelect = !isChecked
    for (const permission of availablePermissions) {
      if (selectedPermissions.has(permission) !== shouldSelect) {
        onToggle(permission)
      }
    }
  }

  return (
    <MatrixCheckbox
      checked={isChecked}
      disabled={disabled || availablePermissions.length === 0}
      onChange={handleToggle}
    />
  )
}

function PermissionCheckbox({
  permission,
  checked,
  disabled,
  onToggle,
}: {
  permission: PermissionValue
  checked: boolean
  disabled: boolean
  onToggle: (permission: PermissionValue) => void
}) {
  return (
    <MatrixCheckbox checked={checked} disabled={disabled} onChange={() => onToggle(permission)} />
  )
}

function MatrixCheckbox({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled: boolean
  onChange: () => void
}) {
  return (
    <button
      type='button'
      disabled={disabled}
      aria-pressed={checked}
      onClick={onChange}
      className={cn(
        'relative flex size-4 items-center justify-center overflow-hidden rounded border text-[11px] transition-colors',
        checked
          ? 'border-foreground bg-foreground text-transparent'
          : 'border-border bg-background text-transparent',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {checked ? <Check className='absolute size-3 text-background' /> : null}
    </button>
  )
}
