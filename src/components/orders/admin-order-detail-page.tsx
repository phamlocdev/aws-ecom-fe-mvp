'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { OrderEmailTrackingPanel } from '@/components/email/order-email-tracking-panel'
import { OrderDetailSkeleton } from '@/components/orders/order-detail-page'
import { ResourceError } from '@/components/resource-error'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrderQuery } from '@/hooks/use-orders'
import { toApiClientError } from '@/lib/api/errors'
import { formatDateTime, formatVnd } from '@/lib/format'
import { resolveDynamicRouteSegment } from '@/lib/routing'

export function AdminOrderDetailPage() {
  const pathname = usePathname()
  const params = useParams<{ orderId?: string }>()
  const orderId = resolveDynamicRouteSegment(params.orderId, pathname, '/admin/orders')
  const orderResult = useOrderQuery(orderId, { pollPending: true, pollPayment: true })
  const order = orderResult.data
  const error = orderResult.error ? toApiClientError(orderResult.error) : null

  if (error) {
    return (
      <ResourceError title='Order endpoint error' message={error.message} details={error.details} />
    )
  }

  if (orderResult.isLoading || !order) {
    return <OrderDetailSkeleton />
  }

  return (
    <div className='space-y-6'>
      <Link href='/admin/orders' className='text-sm font-medium text-primary hover:underline'>
        Back to orders
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className='text-xl'>{order.orderId}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-3 text-sm'>
          <div>Customer: {order.customerEmail ?? order.customerId}</div>
          <div>Status: {order.status}</div>
          <div>Payment: {order.paymentStatus}</div>
          <div>Created: {formatDateTime(order.createdAt)}</div>
          <div>Updated: {formatDateTime(order.updatedAt)}</div>
          <div>Total: {formatVnd(order.totalAmount ?? 0)}</div>
          {order.failureReason ? <div>Failure: {order.failureReason}</div> : null}
          {order.paymentFailureReason ? (
            <div>Payment failure: {order.paymentFailureReason}</div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {order.items.map((item) => (
            <div
              key={item.lineId}
              className='flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0'
            >
              <div>
                <p className='font-medium'>{item.productName}</p>
                <p className='text-xs text-muted-foreground'>{item.productId}</p>
              </div>
              <div className='text-right text-sm'>
                <div>
                  {item.quantity} x {formatVnd(item.unitPrice)}
                </div>
                <div className='text-muted-foreground'>{formatVnd(item.lineTotal)}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <OrderEmailTrackingPanel orderId={order.orderId} />
    </div>
  )
}
