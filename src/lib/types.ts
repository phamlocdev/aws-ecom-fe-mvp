export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED'
export type CartStatus = 'ACTIVE' | 'EXPIRED'
export type OrderStatus =
  'PENDING' | 'RESERVED' | 'CONFIRMED' | 'SHIPPED' | 'CANCELLED' | 'FAILED' | 'EXPIRED'
export type PaymentStatus = 'NOT_STARTED' | 'PROCESSING' | 'PAID' | 'FAILED'
export type InventoryStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
export type UserAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL' | 'DELETED'
export type UserPasswordStatus = 'REQUIRED' | 'SET'
export type EmailDeliveryStatus =
  'PENDING' | 'SENT' | 'DELIVERED' | 'BOUNCED' | 'COMPLAINED' | 'REJECTED' | 'FAILED' | 'SKIPPED'
export type EmailType =
  | 'ORDER_CONFIRMATION'
  | 'WELCOME_NEW_CUSTOMER'
  | 'SHIPPED_ORDER_NOTIFICATION'
  | 'CANCELLED_ORDER_NOTIFICATION'
  | 'COGNITO_SIGN_UP'
  | 'COGNITO_RESEND_CODE'
  | 'COGNITO_FORGOT_PASSWORD'
  | 'COGNITO_ADMIN_CREATE_USER'
  | 'COGNITO_UPDATE_USER_ATTRIBUTE'
  | 'COGNITO_VERIFY_USER_ATTRIBUTE'
  | 'COGNITO_AUTHENTICATION'
  | 'COGNITO_ACCOUNT_TAKEOVER_NOTIFICATION'
export type EmailContextType = 'ORDER' | 'USER'
export type Permission =
  | 'audit:read'
  | 'products:read'
  | 'products:create'
  | 'products:update'
  | 'products:delete'
  | 'categories:read'
  | 'categories:create'
  | 'categories:update'
  | 'categories:delete'
  | 'inventories:read'
  | 'inventories:update'
  | 'orders:read'
  | 'orders:update'
  | 'orders:email:read'
  | 'orders:email:resend'
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:disable'
  | 'users:permissions:update'
  | 'users:email:read'
  | 'users:email:resend'
  | 'users:login-audit:read'

export type UserAddress = {
  recipientName?: string
  phone?: string
  line1?: string
  location?: {
    ward?: string
    district?: string
    city?: string
  }
  notes?: string
}

export type Product = {
  productId: string
  name: string
  description: string
  categoryId: string
  price: number
  currency: string
  imageUrl?: string
  images?: ProductImage[]
  status: ProductStatus
  deletedAt?: string
  createdAt: string
  updatedAt: string
}

export type ProductImage = {
  key: string
  sortOrder: number
  isPrimary: boolean
  altText?: string
  readUrl?: string
  readUrlExpiresInSeconds?: number
}

export type UserProfile = {
  userId: string
  username: string
  email?: string
  name?: string
  avatarKey?: string
  avatarReadUrl?: string
  avatarReadUrlExpiresInSeconds?: number
  address?: UserAddress
  passwordStatus: UserPasswordStatus
  createdAt: string
  updatedAt: string
}

export type ManagedUser = {
  username: string
  enabled: boolean
  status?: string
  accountStatus?: UserAccountStatus
  name?: string
  sub?: string
  email?: string
  emailVerified: boolean
  groups: string[]
  permissions: Permission[]
  createdAt?: string
  updatedAt?: string
  welcomeEmailTracking?: EmailDeliverySummary
  passwordStatus?: UserPasswordStatus
}

export type UserLoginAudit = {
  userId: string
  loginAt: string
  loginId: string
  username?: string
  email?: string
  ipAddress?: string
  userAgent?: string
  userPoolId: string
  clientId?: string
  triggerSource: string
  newDeviceUsed?: boolean
  createdAt: string
  expiresAt: number
}

export type UserLoginAuditQueryResult = {
  items: UserLoginAudit[]
  nextCursor: string | null
}

export type EmailDeliverySummary = {
  recipientEmail: string
  emailType: EmailType
  status: EmailDeliveryStatus
  updatedAt: string
  emailId: string
  isRetryable: boolean
  attemptNumber: number
}

export type EmailTracking = {
  emailId: string
  emailType: EmailType
  recipientEmail: string
  status: EmailDeliveryStatus
  contextType: EmailContextType
  contextId: string
  contextKey: string
  sesMessageId?: string
  attemptNumber: number
  resendOfEmailId?: string
  bounceType?: 'Permanent' | 'Transient' | 'Undetermined'
  bounceSubType?: string
  complaintSubType?: string
  failureReason?: string
  configurationSetName?: string
  createdAt: string
  updatedAt: string
  sentAt?: string
  deliveredAt?: string
  bouncedAt?: string
  complainedAt?: string
  failedAt?: string
  isRetryable: boolean
}

export type EmailDeliveryStatistics = Record<EmailType, Record<EmailDeliveryStatus, number>>

export type ResendEmailResult = {
  orderId?: string
  userId?: string
  emailType: EmailType
  recipientEmails: string[]
  resentCount: number
  status: string
  reason?: string
}

export type InventoryRecord = {
  productId: string
  availableQuantity: number
  reservedQuantity: number
  updatedAt: string
}

export type InventorySummary = InventoryRecord & {
  productName: string
  categoryId: string
  imageUrl?: string
  productStatus: ProductStatus
}

export type Category = {
  categoryId: string
  name: string
  description?: string
  status?: 'ACTIVE' | 'DELETED'
  deletedAt?: string
  createdAt: string
  updatedAt: string
}

export type AuditEntityType = 'ORDER' | 'PRODUCT' | 'CATEGORY' | 'INVENTORY' | 'USER_ACCOUNT'

export type AuditFieldChange = {
  before?: unknown
  after?: unknown
}

export type AuditLogItem = {
  entityKey: string
  occurredAtAuditId: string
  auditId: string
  entityType: AuditEntityType
  entityId: string
  sourceTable?: string
  eventName: 'INSERT' | 'MODIFY' | 'REMOVE'
  occurredAt: string
  actorType: 'customer' | 'admin' | 'system' | 'unknown'
  actorId?: string
  actorEmail?: string
  reason?: string
  diff: Record<string, AuditFieldChange>
  before: Record<string, unknown>
  after: Record<string, unknown>
  keys?: Record<string, unknown>
  schemaVersion: number
  expiresAt: number
}

export type AuditLogQueryResult = {
  items: AuditLogItem[]
  nextCursor: string | null
}

export type Cart = {
  customerId: string
  cartId: string
  status: CartStatus
  createdAt: string
  updatedAt: string
  expiresAt: number
}

export type CartItem = {
  cartId: string
  customerId: string
  productId: string
  quantity: number
  createdAt: string
  updatedAt: string
}

export type CartDetails = Cart & {
  items: CartItem[]
}

export type Order = {
  orderId: string
  customerId: string
  customerEmail?: string
  customerName?: string
  additionalReceivingEmails?: string[]
  cartId: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  createdAt: string
  updatedAt: string
  shippedAt?: string
  reservedAt?: string
  paymentExpiresAt?: number
  paymentRequestedAt?: string
  paidAt?: string
  paymentTransactionId?: string
  paymentFailureReason?: string
  failureReason?: string
  totalAmount?: number
}

export type OrderItem = {
  lineId: string
  orderId: string
  productId: string
  productName: string
  imageUrl?: string
  unitPrice: number
  quantity: number
  lineTotal: number
  createdAt: string
}

export type OrderDetails = Order & {
  items: OrderItem[]
}

export type PlaceOrderResponse = {
  orderId: string
  status: OrderStatus
}

export type TriggerPaymentResponse = {
  orderId: string
  paymentStatus: PaymentStatus
  paymentUrl: string
  paymentExpiresAt?: number
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 200] as const
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]
export const DEFAULT_PAGE_SIZE: PageSize = 10

export type PaginationParams = {
  limit?: PageSize
  cursor?: string
  categoryId?: string
  status?: ProductStatus
  minPrice?: number
  maxPrice?: number
  updatedFrom?: string
  updatedTo?: string
  q?: string
}

export type ProductFilterParams = Omit<PaginationParams, 'limit' | 'cursor'>
export type InventoryPaginationParams = Pick<
  PaginationParams,
  'limit' | 'cursor' | 'status' | 'q'
> & {
  productIds?: string[]
}

export type PaginatedResponse<T> = {
  items: T[]
  previousCursor: string | null
  nextCursor: string | null
  limit: PageSize
  currentPage: number
  scannedCount?: number
}

export type ApiErrorPayload = {
  statusCode?: number
  message?: string | string[]
  error?: string
}
