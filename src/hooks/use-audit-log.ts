import { useQuery } from 'react-query'
import { AUDIT_LOG_QUERY_KEYS, getAuditLog } from '@/lib/api/audit'
import type { AuditEntityType } from '@/lib/types'

export function useAuditLogQuery(input: {
  entityType: AuditEntityType
  entityId: string
  limit?: number
  enabled?: boolean
}) {
  return useQuery(
    AUDIT_LOG_QUERY_KEYS.entity(input.entityType, input.entityId),
    () => getAuditLog(input),
    {
      enabled: input.enabled ?? Boolean(input.entityId),
    },
  )
}
