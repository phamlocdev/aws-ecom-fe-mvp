'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Search } from 'lucide-react'
import { AuditLogTable } from '@/components/audit/audit-log-table'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useAuditLogQuery } from '@/hooks/use-audit-log'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { toApiClientError } from '@/lib/api/errors'
import type { AuditEntityType, PageSize } from '@/lib/types'

const AUDIT_ENTITY_TYPES: AuditEntityType[] = [
  'ORDER',
  'PRODUCT',
  'CATEGORY',
  'INVENTORY',
  'USER_ACCOUNT',
]
const AUDIT_PAGE_SIZE_OPTIONS: PageSize[] = [10, 25, 50, 100]

type AuditFilterForm = {
  entityType: AuditEntityType
  entityId: string
  limit: PageSize
}

type SubmittedAuditFilter = {
  entityType: AuditEntityType
  entityId?: string
  limit: PageSize
  cursor?: string
}

export default function AdminAuditPage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const canLoadProtectedResources = isAuthenticated && !isHydrating
  const [form, setForm] = useState<AuditFilterForm>({
    entityType: 'USER_ACCOUNT',
    entityId: '',
    limit: 25,
  })
  const [submittedFilter, setSubmittedFilter] = useState<SubmittedAuditFilter>({
    entityType: 'USER_ACCOUNT',
    limit: 25,
  })
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([])

  const auditResult = useAuditLogQuery({
    ...submittedFilter,
    enabled: canLoadProtectedResources,
  })
  const auditPage = auditResult.data
  const error = auditResult.error ? toApiClientError(auditResult.error) : null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCursorHistory([])
    setSubmittedFilter({
      entityType: form.entityType,
      entityId: form.entityId.trim() || undefined,
      limit: form.limit,
    })
  }

  function handleNextPage() {
    if (!auditPage?.nextCursor) {
      return
    }
    setCursorHistory((current) => [...current, submittedFilter.cursor])
    setSubmittedFilter((current) => ({ ...current, cursor: auditPage.nextCursor ?? undefined }))
  }

  function handlePreviousPage() {
    setCursorHistory((current) => {
      const nextHistory = current.slice(0, -1)
      const previousCursor = current[current.length - 1]
      setSubmittedFilter((submitted) => ({ ...submitted, cursor: previousCursor }))
      return nextHistory
    })
  }

  if (isHydrating || !isAuthenticated) {
    return <AuditSkeleton />
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-normal'>Audit log</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Review changes captured from audited DynamoDB tables.
        </p>
      </div>

      <form
        className='grid gap-3 rounded-md border bg-card p-4 lg:grid-cols-[220px_1fr_160px_auto]'
        onSubmit={handleSubmit}
      >
        <div className='grid gap-2'>
          <Label>Entity type</Label>
          <Select
            value={form.entityType}
            onValueChange={(entityType) =>
              setForm({ ...form, entityType: entityType as AuditEntityType })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIT_ENTITY_TYPES.map((entityType) => (
                <SelectItem key={entityType} value={entityType}>
                  {entityType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='entityId'>Entity id</Label>
          <Input
            id='entityId'
            value={form.entityId}
            onChange={(event) => setForm({ ...form, entityId: event.target.value })}
            placeholder='Optional exact entity id'
          />
        </div>
        <div className='grid gap-2'>
          <Label>Limit</Label>
          <Select
            value={String(form.limit)}
            onValueChange={(limit) => setForm({ ...form, limit: Number(limit) as PageSize })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIT_PAGE_SIZE_OPTIONS.map((limit) => (
                <SelectItem key={limit} value={String(limit)}>
                  {limit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type='submit' className='self-end' disabled={auditResult.isLoading}>
          <Search />
          Search
        </Button>
      </form>

      {error ? (
        <ResourceError
          title='Audit endpoint error'
          message={error.message}
          details={error.details}
        />
      ) : null}

      {auditResult.isLoading ? (
        <AuditSkeleton />
      ) : !error ? (
        <>
          <AuditLogTable items={auditPage?.items ?? []} />
          <div className='flex items-center justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              disabled={cursorHistory.length === 0 || auditResult.isFetching}
              onClick={handlePreviousPage}
            >
              Previous
            </Button>
            <Button
              type='button'
              variant='outline'
              disabled={!auditPage?.nextCursor || auditResult.isFetching}
              onClick={handleNextPage}
            >
              Next
            </Button>
          </div>
        </>
      ) : null}
    </div>
  )
}

function AuditSkeleton() {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-64 w-full' />
      <Skeleton className='h-14 w-full' />
    </div>
  )
}
