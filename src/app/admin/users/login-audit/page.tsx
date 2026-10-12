'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search } from 'lucide-react'
import { z } from 'zod'
import { ResourceError } from '@/components/resource-error'
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
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { useUserLoginAuditQuery } from '@/hooks/use-managed-users'
import { toApiClientError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import type { UserLoginAudit } from '@/lib/types'

type AuditFilter = 'username' | 'email' | 'userId'

const loginAuditLookupSchema = z.object({
  filter: z.enum(['username', 'email', 'userId']),
  value: z.string().trim().min(1, 'Enter a value to search for'),
})

type LoginAuditLookupValues = z.output<typeof loginAuditLookupSchema>

export default function AdminUserLoginAuditPage() {
  const [submittedFilter, setSubmittedFilter] = useState<{
    filter: AuditFilter
    value: string
  } | null>(null)
  const form = useForm<LoginAuditLookupValues>({
    resolver: zodResolver(loginAuditLookupSchema),
    defaultValues: { filter: 'username', value: '' },
  })
  const auditResult = useUserLoginAuditQuery({
    filter: submittedFilter?.filter ?? 'username',
    value: submittedFilter?.value ?? '',
    enabled: Boolean(submittedFilter?.value),
  })
  const error = auditResult.error ? toApiClientError(auditResult.error) : null
  const items = auditResult.data?.items ?? []

  function onSubmit(values: LoginAuditLookupValues) {
    setSubmittedFilter(values)
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Login audit'
        subtitle='Query sign-in history for one account by exact username, email, or user id.'
      />

      <form
        className='flex flex-col gap-3 rounded-md border bg-card p-4 sm:flex-row sm:items-end'
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className='grid gap-2 sm:w-48'>
          <Label>Search by</Label>
          <Controller
            control={form.control}
            name='filter'
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='username'>Username</SelectItem>
                  <SelectItem value='email'>Email</SelectItem>
                  <SelectItem value='userId'>User ID</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className='grid flex-1 gap-2'>
          <Label htmlFor='auditSearch'>Exact value</Label>
          <Input
            id='auditSearch'
            aria-invalid={Boolean(form.formState.errors.value)}
            placeholder='admin@example.com'
            {...form.register('value')}
          />
          {form.formState.errors.value ? (
            <p className='text-xs text-destructive'>{form.formState.errors.value.message}</p>
          ) : null}
        </div>
        <Button type='submit' disabled={auditResult.isLoading}>
          <Search />
          Search
        </Button>
      </form>

      {error ? (
        <ResourceError
          title='Login audit endpoint error'
          message={error.message}
          details={error.details}
        />
      ) : null}

      {auditResult.isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : submittedFilter && !error ? (
        <LoginAuditTable items={items} />
      ) : null}
    </div>
  )
}

function LoginAuditTable({ items }: { items: UserLoginAudit[] }) {
  const columns: ColumnDef<UserLoginAudit>[] = [
    {
      id: 'loginTime',
      header: 'Login time',
      cellClassName: 'text-sm',
      cell: (item) => formatDateTime(item.loginAt),
    },
    {
      id: 'account',
      header: 'Account',
      cell: (item) => (
        <div className='min-w-0 space-y-1'>
          <p className='truncate text-sm font-medium'>{item.username ?? item.userId}</p>
          <p className='truncate text-xs text-muted-foreground'>{item.email ?? item.userId}</p>
        </div>
      ),
    },
    {
      id: 'ipAddress',
      header: 'IP address',
      cellClassName: 'text-sm text-muted-foreground',
      cell: (item) => item.ipAddress ?? 'N/A',
    },
    {
      id: 'userAgent',
      header: 'User agent',
      cellClassName: 'max-w-md truncate text-sm text-muted-foreground',
      cell: (item) => item.userAgent ?? 'N/A',
    },
    {
      id: 'client',
      header: 'Client',
      cellClassName: 'font-mono text-xs text-muted-foreground',
      cell: (item) => item.clientId ?? 'N/A',
    },
    {
      id: 'newDevice',
      header: 'New device',
      cellClassName: 'text-sm text-muted-foreground',
      cell: (item) => (item.newDeviceUsed ? 'Yes' : 'No'),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={items}
      rowKey={(item) => item.loginId}
      emptyTitle='No login audit entries found'
      emptyDescription='Successful sign-ins will appear here.'
    />
  )
}
