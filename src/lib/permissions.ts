export const Permission = {
  AUDIT_READ: 'audit:read',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  CATEGORIES_READ: 'categories:read',
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',
  INVENTORIES_READ: 'inventories:read',
  INVENTORIES_UPDATE: 'inventories:update',
  ORDERS_READ: 'orders:read',
  ORDERS_UPDATE: 'orders:update',
  ORDERS_EMAIL_READ: 'orders:email:read',
  ORDERS_EMAIL_RESEND: 'orders:email:resend',
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DISABLE: 'users:disable',
  USERS_PERMISSIONS_UPDATE: 'users:permissions:update',
  USERS_EMAIL_READ: 'users:email:read',
  USERS_EMAIL_RESEND: 'users:email:resend',
  USERS_LOGIN_AUDIT_READ: 'users:login-audit:read',
} as const

export type Permission = (typeof Permission)[keyof typeof Permission]

export const ALL_PERMISSIONS = Object.values(Permission)

export const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.AUDIT_READ]: 'Read audit log',
  [Permission.PRODUCTS_READ]: 'Read products',
  [Permission.PRODUCTS_CREATE]: 'Create products',
  [Permission.PRODUCTS_UPDATE]: 'Update products',
  [Permission.PRODUCTS_DELETE]: 'Delete products',
  [Permission.CATEGORIES_READ]: 'Read categories',
  [Permission.CATEGORIES_CREATE]: 'Create categories',
  [Permission.CATEGORIES_UPDATE]: 'Update categories',
  [Permission.CATEGORIES_DELETE]: 'Delete categories',
  [Permission.INVENTORIES_READ]: 'Read inventories',
  [Permission.INVENTORIES_UPDATE]: 'Update inventories',
  [Permission.ORDERS_READ]: 'Read orders',
  [Permission.ORDERS_UPDATE]: 'Update orders',
  [Permission.ORDERS_EMAIL_READ]: 'Read order email tracking',
  [Permission.ORDERS_EMAIL_RESEND]: 'Resend order emails',
  [Permission.USERS_READ]: 'Read accounts',
  [Permission.USERS_CREATE]: 'Create accounts',
  [Permission.USERS_UPDATE]: 'Update accounts',
  [Permission.USERS_DISABLE]: 'Disable accounts',
  [Permission.USERS_PERMISSIONS_UPDATE]: 'Update account permissions',
  [Permission.USERS_EMAIL_READ]: 'Read account email tracking',
  [Permission.USERS_EMAIL_RESEND]: 'Resend welcome emails',
  [Permission.USERS_LOGIN_AUDIT_READ]: 'Read account login audit',
}

export function readPermissions(claims: Record<string, unknown> | null): Permission[] {
  const value = claims?.['app:permissions']
  const values = Array.isArray(value) ? value : typeof value === 'string' ? parseString(value) : []
  const allowed = new Set<string>(ALL_PERMISSIONS)

  return values.filter((item): item is Permission => typeof item === 'string' && allowed.has(item))
}

export function hasPermission(
  claims: Record<string, unknown> | null,
  permission: Permission,
): boolean {
  return readPermissions(claims).includes(permission)
}

function parseString(value: string): unknown[] {
  const normalized = value.trim()
  if (!normalized) {
    return []
  }

  if (normalized.startsWith('[') && normalized.endsWith(']')) {
    try {
      const parsed = JSON.parse(normalized) as unknown
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return normalized
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
