'use client'

import Link from 'next/link'
import { ResourceError } from '@/components/resource-error'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/customer/order-status-badges'
import { PageHeader } from '@/components/shared/page-header'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrdersQuery } from '@/hooks/use-orders'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { toApiClientError } from '@/lib/api/errors'
import { formatDateTime, formatVnd } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function OrdersPage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const ordersResult = useOrdersQuery(undefined)
  const ordersError = ordersResult.error ? toApiClientError(ordersResult.error) : null

  if (isHydrating || !isAuthenticated) {
    return <OrdersSkeleton />
  }

  if (ordersError) {
    return <ResourceError title='Orders error' message={ordersError.message} details={ordersError.details} />
  }

  if (ordersResult.isLoading) {
    return <OrdersSkeleton />
  }

  const orders = ordersResult.data?.items ?? []
  if (orders.length === 0) {
    return (
      <div className='rounded-xl border bg-card p-10 text-center'>
        <h1 className='text-xl font-semibold'>No orders yet</h1>
        <p className='mt-2 text-sm text-muted-foreground'>Place your first order from the checkout page.</p>
        <Link href='/' className={cn(buttonVariants({ className: 'mt-6' }))}>
          Browse products
        </Link>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <PageHeader title='Your orders' subtitle='Track checkout and payment progress.' />
      <div className='space-y-4'>
        {orders.map((order) => (
          <Card key={order.orderId}>
            <CardHeader className='gap-3 sm:flex-row sm:items-start sm:justify-between'>
              <div className='space-y-2'>
                <CardTitle className='font-mono text-sm'>{order.orderId}</CardTitle>
                <div className='flex flex-wrap gap-2'>
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>
              </div>
              <div className='text-right text-sm'>
                <div className='font-medium'>{order.totalAmount ? formatVnd(order.totalAmount) : 'Pending total'}</div>
                <div className='text-muted-foreground'>{formatDateTime(order.createdAt)}</div>
              </div>
            </CardHeader>
            <CardContent className='flex items-center justify-between gap-4'>
              <p className='text-sm text-muted-foreground'>
                {order.failureReason ?? order.paymentFailureReason ?? 'Open the order to continue or inspect status.'}
              </p>
              <Link
                href={`/orders/${encodeURIComponent(order.orderId)}`}
                className={buttonVariants({ variant: 'outline' })}
              >
                View order
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function OrdersSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-8 w-32' />
      <Skeleton className='h-28 w-full' />
      <Skeleton className='h-28 w-full' />
    </div>
  )
}
