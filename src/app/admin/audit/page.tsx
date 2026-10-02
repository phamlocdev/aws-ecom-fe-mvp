'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Search } from 'lucide-react'
import { useAuditLogQuery } from '@/hooks/use-audit-log'
import { toApiClientError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import type { AuditEntityType, AuditFieldChange, AuditLogItem } from '@/lib/types'
import { ResourceError } from '@/components/resource-error'
import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const auditEntityTypes: AuditEntityType[] = [
  'ORDER',
  'PRODUCT',
  'CATEGORY',
  'INVENTORY',
  'USER_ACCOUNT',
]

export default function AdminAuditPage() {
  const [submittedFilter, setSubmittedFilter] = useState<{
    entityType: AuditEntityType
    entityId: string
  } | null>(null)
  const [form, setForm] = useState<{ entityType: AuditEntityType; entityId: string }>({
    entityType: 'ORDER',
    entityId: '',
  })
  const auditResult = useAuditLogQuery({
    entityType: submittedFilter?.entityType ?? form.entityType,
    entityId: submittedFilter?.entityId ?? '',
    limit: 25,
    enabled: Boolean(submittedFilter?.entityId),
  })
  const error = auditResult.error ? toApiClientError(auditResult.error) : null
  const items = auditResult.data?.items ?? []

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const entityId = form.entityId.trim()
    if (!entityId) {
      return
    }
    setSubmittedFilter({ ...form, entityId })
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-normal'>Audit log</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Query change history for one entity by exact entity id.
        </p>
      </div>

      <form
        className='flex flex-col gap-3 rounded-md border bg-card p-4 sm:flex-row sm:items-end'
        onSubmit={handleSubmit}
      >
        <div className='grid gap-2 sm:w-52'>
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
              {auditEntityTypes.map((entityType) => (
                <SelectItem key={entityType} value={entityType}>
                  {entityType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='grid flex-1 gap-2'>
          <Label htmlFor='entityId'>Entity ID</Label>
          <Input
            id='entityId'
            value={form.entityId}
            onChange={(event) => setForm({ ...form, entityId: event.target.value })}
            placeholder='order-id, product-id, category-id, user-id'
          />
        </div>
        <Button type='submit' disabled={!form.entityId.trim() || auditResult.isLoading}>
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
        <Skeleton className='h-80 w-full' />
      ) : submittedFilter && !error ? (
        <AuditTimeline items={items} />
      ) : null}
    </div>
  )
}

function AuditTimeline({ items }: { items: AuditLogItem[] }) {
  if (items.length === 0) {
    return (
      <div className='rounded-md border bg-card p-8 text-center'>
        <p className='font-medium'>No audit entries found</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          Changes for the selected entity will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {items.map((item) => (
        <AuditEntry key={item.occurredAtAuditId} item={item} />
      ))}
    </div>
  )
}

function AuditEntry({ item }: { item: AuditLogItem }) {
  const fields = Object.entries(item.diff)

  return (
    <section className='overflow-hidden rounded-md border bg-card'>
      <div className='flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant={item.eventName === 'INSERT' ? 'default' : 'secondary'}>
              {item.eventName}
            </Badge>
            <span className='font-mono text-xs text-muted-foreground'>{item.auditId}</span>
          </div>
          <p className='mt-2 text-sm text-muted-foreground'>
            {formatDateTime(item.occurredAt)} by {formatActor(item)}
          </p>
          {item.reason ? <p className='mt-1 text-sm'>{item.reason}</p> : null}
        </div>
        <div className='font-mono text-xs text-muted-foreground'>
          {item.entityType}#{item.entityId}
        </div>
      </div>

      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-48'>Field</TableHead>
              <TableHead>Before</TableHead>
              <TableHead>After</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map(([field, change]) => (
              <DiffRow key={field} field={field} change={change} />
            ))}
          </TableBody>
        </Table>
      </div>

      <details className='border-t p-4'>
        <summary className='cursor-pointer text-sm font-medium text-muted-foreground'>
          Raw audit JSON
        </summary>
        <pre className='mt-3 max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs'>
          {JSON.stringify(item, null, 2)}
        </pre>
      </details>
    </section>
  )
}

function DiffRow({ field, change }: { field: string; change: AuditFieldChange }) {
  const hasBefore = Object.prototype.hasOwnProperty.call(change, 'before')
  const hasAfter = Object.prototype.hasOwnProperty.call(change, 'after')

  return (
    <TableRow>
      <TableCell className='font-mono text-xs font-medium'>{field}</TableCell>
      <TableCell>
        <JsonCell value={change.before} tone={hasBefore && hasAfter ? 'changed' : 'removed'} />
      </TableCell>
      <TableCell>
        <JsonCell value={change.after} tone={hasAfter ? 'added' : 'empty'} />
      </TableCell>
    </TableRow>
  )
}

function JsonCell({
  value,
  tone,
}: {
  value: unknown
  tone: 'added' | 'changed' | 'removed' | 'empty'
}) {
  return (
    <pre
      className={cn(
        'max-h-60 min-w-64 overflow-auto rounded-md border p-2 text-xs',
        tone === 'added' && 'border-emerald-200 bg-emerald-50 text-emerald-950',
        tone === 'changed' && 'border-amber-200 bg-amber-50 text-amber-950',
        tone === 'removed' && 'border-red-200 bg-red-50 text-red-950',
        tone === 'empty' && 'bg-muted text-muted-foreground',
      )}
    >
      {value === undefined ? 'undefined' : JSON.stringify(value, null, 2)}
    </pre>
  )
}

function formatActor(item: AuditLogItem): string {
  const identity = item.actorEmail ?? item.actorId ?? 'unknown'
  return `${item.actorType}:${identity}`
}
