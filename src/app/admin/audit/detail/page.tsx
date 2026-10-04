'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AuditLogDetailContent } from '@/components/audit/audit-log-table'
import { ResourceError } from '@/components/resource-error'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuditLogItemQuery } from '@/hooks/use-audit-log'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { toApiClientError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import type { AuditEntityType } from '@/lib/types'

const AUDIT_ENTITY_TYPES: AuditEntityType[] = [
  'ORDER',
  'PRODUCT',
  'CATEGORY',
  'INVENTORY',
  'USER_ACCOUNT',
]

export default function AdminAuditDetailPage() {
  return (
    <Suspense fallback={<AuditDetailSkeleton />}>
      <AdminAuditDetailContent />
    </Suspense>
  )
}

function AdminAuditDetailContent() {
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const searchParams = useSearchParams()
  const entityType = parseAuditEntityType(searchParams.get('entityType'))
  const entityId = searchParams.get('entityId')?.trim() ?? ''
  const auditId = searchParams.get('auditId')?.trim() ?? ''
  const canLoadProtectedResources =
    isAuthenticated && !isHydrating && Boolean(entityType && entityId && auditId)

  const auditItemResult = useAuditLogItemQuery({
    entityType: entityType ?? 'ORDER',
    entityId,
    auditId,
    enabled: canLoadProtectedResources,
  })
  const error = auditItemResult.error ? toApiClientError(auditItemResult.error) : null

  if (isHydrating || !isAuthenticated) {
    return <AuditDetailSkeleton />
  }

  if (!entityType || !entityId || !auditId) {
    return (
      <AuditDetailFrame>
        <ResourceError
          title='Invalid audit detail link'
          message='entityType, entityId, and auditId are required.'
        />
      </AuditDetailFrame>
    )
  }

  return (
    <AuditDetailFrame
      title={`${entityType} / ${entityId}`}
      description='Review the complete audit entry and nested field changes.'
    >
      {error ? (
        <ResourceError
          title='Audit detail endpoint error'
          message={error.message}
          details={error.details}
        />
      ) : auditItemResult.isLoading ? (
        <AuditDetailSkeleton />
      ) : auditItemResult.data ? (
        <AuditLogDetailContent item={auditItemResult.data} />
      ) : (
        <div className='rounded-md border bg-card p-8 text-center'>
          <p className='font-medium'>Audit entry not found</p>
          <p className='mt-1 text-sm text-muted-foreground'>
            The entry may be outside the retained audit history or the link is no longer valid.
          </p>
        </div>
      )}
    </AuditDetailFrame>
  )
}

function AuditDetailFrame({
  title = 'Audit log detail',
  description = 'Review one audit entry.',
  children,
}: {
  title?: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className='space-y-6'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-start'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold tracking-normal'>Audit log detail</h1>
          <p className='mt-1 break-words text-sm text-muted-foreground'>{title}</p>
          <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
        </div>
        <Link href='/admin/audit' className={cn(buttonVariants({ variant: 'outline' }))}>
          <ArrowLeft />
          Back to audit log
        </Link>
      </div>
      {children}
    </div>
  )
}

function AuditDetailSkeleton() {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-32 w-full' />
      <Skeleton className='h-72 w-full' />
    </div>
  )
}

function parseAuditEntityType(value: string | null): AuditEntityType | null {
  return AUDIT_ENTITY_TYPES.includes(value as AuditEntityType) ? (value as AuditEntityType) : null
}
