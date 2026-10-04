import { apiClient } from '@/lib/api/api-client'
import type { AuditEntityType, AuditLogItem, AuditLogQueryResult } from '@/lib/types'

export const AUDIT_LOG_QUERY_KEYS = {
  all: ['audit'] as const,
  entity: (input: {
    entityType: AuditEntityType
    entityId?: string
    limit?: number
    cursor?: string
  }) =>
    [
      ...AUDIT_LOG_QUERY_KEYS.all,
      input.entityType,
      input.entityId ?? 'all',
      input.limit ?? 'default',
      input.cursor ?? 'first',
    ] as const,
  item: (input: { entityType: AuditEntityType; entityId: string; auditId: string }) =>
    [...AUDIT_LOG_QUERY_KEYS.all, input.entityType, input.entityId, 'item', input.auditId] as const,
}

export async function getAuditLog(input: {
  entityType: AuditEntityType
  entityId?: string
  limit?: number
  cursor?: string
}): Promise<AuditLogQueryResult> {
  const response = await apiClient.get<AuditLogQueryResult>('/audit', {
    params: input,
  })
  return response.data
}

export async function getAuditLogItem(input: {
  entityType: AuditEntityType
  entityId: string
  auditId: string
}): Promise<AuditLogItem | null> {
  let cursor: string | undefined

  do {
    const page = await getAuditLog({
      entityType: input.entityType,
      entityId: input.entityId,
      limit: 100,
      cursor,
    })
    const item = page.items.find(
      (entry) => entry.auditId === input.auditId || entry.occurredAtAuditId === input.auditId,
    )

    if (item) {
      return item
    }

    cursor = page.nextCursor ?? undefined
  } while (cursor)

  return null
}
