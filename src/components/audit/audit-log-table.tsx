'use client'

import Link from 'next/link'
import { ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  buildAuditValueDiff,
  formatAuditValue,
  hasAuditDiffChanges,
  type AuditDiffNode,
  type AuditDiffStatus,
} from '@/lib/audit-diff'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { AuditFieldChange, AuditLogItem } from '@/lib/types'

export function AuditLogTable({ items }: { items: AuditLogItem[] }) {
  if (items.length === 0) {
    return (
      <div className='rounded-md border bg-card p-8 text-center'>
        <p className='font-medium'>No audit entries found</p>
        <p className='mt-1 text-sm text-muted-foreground'>Try another entity type or entity id.</p>
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-md border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Changed fields</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className='w-24 text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const fieldNames = Object.keys(item.diff)

            return (
              <TableRow key={`${item.entityKey}-${item.occurredAtAuditId}`}>
                <TableCell className='text-sm text-muted-foreground'>
                  {formatDateTime(item.occurredAt)}
                </TableCell>
                <TableCell>
                  <div className='min-w-0 space-y-1'>
                    <p className='text-sm font-medium'>{item.entityType}</p>
                    <p className='max-w-64 truncate font-mono text-[11px] text-muted-foreground'>
                      {item.entityId}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <AuditEventBadge eventName={item.eventName} />
                </TableCell>
                <TableCell>
                  <div className='min-w-0 space-y-1'>
                    <p className='text-sm'>{item.actorType}</p>
                    <p className='max-w-48 truncate text-xs text-muted-foreground'>
                      {item.actorEmail ?? item.actorId ?? 'N/A'}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex max-w-md flex-wrap gap-1'>
                    {fieldNames.map((field) => (
                      <Badge key={field} variant='secondary'>
                        {field}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className='max-w-64 truncate text-sm text-muted-foreground'>
                  {item.reason ?? 'N/A'}
                </TableCell>
                <TableCell>
                  <div className='flex justify-end'>
                    <Link
                      href={buildAuditDetailHref(item)}
                      className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                      title='View audit details'
                      aria-label='View audit details'
                    >
                      <Eye />
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export function AuditLogDetailContent({ item }: { item: AuditLogItem }) {
  const fields = Object.entries(item.diff)

  return (
    <div className='space-y-4'>
      <dl className='grid gap-3 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-2'>
        <MetadataItem label='Occurred at' value={formatDateTime(item.occurredAt)} />
        <MetadataItem label='Event' value={item.eventName} />
        <MetadataItem label='Actor' value={formatActor(item)} />
        <MetadataItem label='Reason' value={item.reason ?? 'N/A'} />
        <MetadataItem label='Audit id' value={item.auditId} mono />
        <MetadataItem label='Source table' value={item.sourceTable ?? 'N/A'} mono />
      </dl>

      <div className='space-y-3'>
        <h2 className='text-base font-semibold tracking-normal'>Changes</h2>
        {fields.map(([field, change]) => (
          <AuditFieldDiff key={field} field={field} change={change} />
        ))}
      </div>

      <details className='rounded-md border bg-card p-3'>
        <summary className='cursor-pointer text-sm font-medium'>Raw audit item</summary>
        <pre className='mt-3 max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs'>
          {JSON.stringify(item, null, 2)}
        </pre>
      </details>
    </div>
  )
}

function AuditFieldDiff({ field, change }: { field: string; change: AuditFieldChange }) {
  const root = buildAuditValueDiff(change.before, change.after, field, field)

  return (
    <section className='rounded-md border bg-card'>
      <div className='flex flex-wrap items-center justify-between gap-2 border-b p-3'>
        <div>
          <h4 className='font-mono text-sm font-semibold'>{field}</h4>
          <p className='mt-1 text-xs text-muted-foreground'>
            {root.valueType} {root.status !== 'unchanged' ? 'changed' : 'unchanged'}
          </p>
        </div>
        <StatusBadge status={root.status} />
      </div>
      <div className='p-3'>
        <AuditDiffTree node={root} />
      </div>
    </section>
  )
}

function AuditDiffTree({ node }: { node: AuditDiffNode }) {
  const hasChildren = node.children.length > 0
  const shouldExpand = hasChildren && hasAuditDiffChanges(node)

  if (hasChildren) {
    return (
      <details open={shouldExpand} className='group rounded-md'>
        <summary className='flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/70'>
          <span className='flex size-6 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground'>
            <ChevronDown className='size-4 group-open:hidden' />
            <ChevronUp className='hidden size-4 group-open:block' />
          </span>
          <span className='min-w-0 flex-1 truncate font-mono'>{node.label}</span>
          <StatusBadge status={node.status} compact />
          <span className='rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
            {node.valueType}
          </span>
        </summary>
        <div className={cn('ml-5 space-y-1 border-l-2 pl-4', branchBorderClass(node.status))}>
          {node.children.map((child) => (
            <AuditDiffTree key={child.key} node={child} />
          ))}
        </div>
      </details>
    )
  }

  return (
    <div className='grid gap-2 rounded-md border-t px-2 py-2 text-sm first:border-t-0 md:grid-cols-[minmax(120px,220px)_1fr_1fr]'>
      <div className='flex min-w-0 items-center gap-2'>
        <span className='truncate font-mono'>{node.label}</span>
        <StatusBadge status={node.status} compact />
      </div>
      <ValueBlock label='Before' value={node.before} status={node.status} side='before' />
      <ValueBlock label='After' value={node.after} status={node.status} side='after' />
    </div>
  )
}

function branchBorderClass(status: AuditDiffStatus): string {
  if (status === 'added') {
    return 'border-emerald-500/40'
  }

  if (status === 'removed') {
    return 'border-destructive/40'
  }

  if (status === 'changed') {
    return 'border-amber-500/40'
  }

  return 'border-border'
}

function ValueBlock({
  label,
  value,
  status,
  side,
}: {
  label: string
  value: unknown
  status: AuditDiffStatus
  side: 'before' | 'after'
}) {
  const highlighted =
    (status === 'removed' && side === 'before') ||
    (status === 'added' && side === 'after') ||
    status === 'changed'

  return (
    <div
      className={cn(
        'min-w-0 rounded-md border bg-muted/30 p-2',
        highlighted && side === 'before' ? 'border-destructive/30 bg-destructive/10' : '',
        highlighted && side === 'after' ? 'border-emerald-500/30 bg-emerald-500/10' : '',
      )}
    >
      <p className='mb-1 text-[11px] font-medium uppercase text-muted-foreground'>{label}</p>
      <pre className='whitespace-pre-wrap break-words text-xs'>{formatAuditValue(value)}</pre>
    </div>
  )
}

function MetadataItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className='min-w-0'>
      <dt className='text-xs text-muted-foreground'>{label}</dt>
      <dd className={cn('mt-1 truncate', mono ? 'font-mono text-xs' : '')}>{value}</dd>
    </div>
  )
}

function AuditEventBadge({ eventName }: { eventName: AuditLogItem['eventName'] }) {
  return (
    <Badge
      variant={
        eventName === 'REMOVE' ? 'destructive' : eventName === 'INSERT' ? 'default' : 'outline'
      }
    >
      {eventName}
    </Badge>
  )
}

function StatusBadge({ status, compact = false }: { status: AuditDiffStatus; compact?: boolean }) {
  const label = compact ? status[0].toUpperCase() : status
  const className =
    status === 'added'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
      : status === 'removed'
        ? 'border-destructive/40 bg-destructive/10 text-destructive'
        : status === 'changed'
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-700'
          : ''

  return (
    <Badge variant='outline' className={className}>
      {label}
    </Badge>
  )
}

function formatActor(item: AuditLogItem): string {
  const actor = item.actorEmail ?? item.actorId
  return actor ? `${item.actorType} / ${actor}` : item.actorType
}

function buildAuditDetailHref(item: AuditLogItem): string {
  const params = new URLSearchParams({
    entityType: item.entityType,
    entityId: item.entityId,
    auditId: item.auditId,
  })

  return `/admin/audit/detail?${params.toString()}`
}
