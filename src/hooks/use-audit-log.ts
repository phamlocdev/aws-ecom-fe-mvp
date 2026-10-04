import { useQuery } from 'react-query'
import { AUDIT_LOG_QUERY_KEYS, getAuditLog, getAuditLogItem } from '@/lib/api/audit'
import type { AuditEntityType } from '@/lib/types'

export function useAuditLogQuery(input: {
  entityType: AuditEntityType
  entityId?: string
  limit?: number
  cursor?: string
  enabled?: boolean
}) {
  return useQuery(AUDIT_LOG_QUERY_KEYS.entity(input), () => getAuditLog(input), {
    enabled: input.enabled ?? Boolean(input.entityType),
  })
}

export function useAuditLogItemQuery(input: {
  entityType: AuditEntityType
  entityId: string
  auditId: string
  enabled?: boolean
}) {
  return useQuery(AUDIT_LOG_QUERY_KEYS.item(input), () => getAuditLogItem(input), {
    enabled: input.enabled ?? Boolean(input.entityId && input.auditId),
  })
}
