import { apiClient } from '@/lib/api/api-client'
import type { AuditEntityType, AuditLogQueryResult } from '@/lib/types'

export const AUDIT_LOG_QUERY_KEYS = {
  all: ['audit'] as const,
  entity: (entityType: AuditEntityType, entityId: string) =>
    [...AUDIT_LOG_QUERY_KEYS.all, entityType, entityId] as const,
}

export async function getAuditLog(input: {
  entityType: AuditEntityType
  entityId: string
  limit?: number
  cursor?: string
}): Promise<AuditLogQueryResult> {
  const response = await apiClient.get<AuditLogQueryResult>('/audit', {
    params: input,
  })
  return response.data
}
