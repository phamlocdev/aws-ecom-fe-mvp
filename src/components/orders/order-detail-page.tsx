'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { ArrowRight, CreditCard, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import { ResourceError } from '@/components/resource-error'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/customer/order-status-badges'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrderQuery, useTriggerPaymentMutation } from '@/hooks/use-orders'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { isPaymentRetryable } from '@/lib/api/orders'
import { toApiClientError } from '@/lib/api/errors'
import { formatDateTime, formatVnd } from '@/lib/format'
import { resolveDynamicRouteSegment } from '@/lib/routing'

export function OrderDetailPage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const pathname = usePathname()
  const params = useParams<{ orderId?: string }>()
  const orderId = resolveDynamicRouteSegment(params.orderId, pathname, '/orders')
  const orderResult = useOrderQuery(orderId, { pollPending: true, pollPayment: true })
  const triggerPaymentMutation = useTriggerPaymentMutation()
  const hasAutoTriggeredRef = useRef(false)
  const orderError = orderResult.error ? toApiClientError(orderResult.error) : null

  const canManuallyPay = useMemo(() => {
    const order = orderResult.data
    const isExpired =
      typeof order?.paymentExpiresAt === 'number' &&
      order.paymentExpiresAt <= Math.floor(Date.now() / 1000)
    return Boolean(
      order && order.status === 'RESERVED' && isPaymentRetryable(order.paymentStatus) && !isExpired,
    )
  }, [orderResult.data])

  const canAutoRedirect = useMemo(() => {
    const order = orderResult.data
    const isExpired =
      typeof order?.paymentExpiresAt === 'number' &&
      order.paymentExpiresAt <= Math.floor(Date.now() / 1000)

    return Boolean(
      order && order.status === 'RESERVED' && order.paymentStatus === 'NOT_STARTED' && !isExpired,
    )
  }, [orderResult.data])

  useEffect(() => {
    if (!orderId) {
      return
    }

    const storageKey = getAutoRedirectStorageKey(orderId)
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(storageKey) === '1') {
      hasAutoTriggeredRef.current = true
    }
  }, [orderId])

  useEffect(() => {
    if (!canAutoRedirect || triggerPaymentMutation.isLoading || hasAutoTriggeredRef.current) {
      return
    }

    hasAutoTriggeredRef.current = true
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(getAutoRedirectStorageKey(orderId), '1')
    }
    void handleTriggerPayment(true)
  }, [canAutoRedirect, orderId, triggerPaymentMutation.isLoading])

  async function handleTriggerPayment(isAutomatic = false) {
    try {
      const response = await triggerPaymentMutation.mutateAsync(orderId)
      toast.success(isAutomatic ? 'Redirecting to VNPay...' : 'Opening VNPay checkout...')
      window.location.assign(response.paymentUrl)
    } catch (error) {
      hasAutoTriggeredRef.current = false
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(getAutoRedirectStorageKey(orderId))
      }
      toast.error(toApiClientError(error).message)
    }
  }

  if (isHydrating || !isAuthenticated) {
    return <OrderDetailSkeleton />
  }

  if (orderError) {
    return (
      <ResourceError
        title='Order error'
        message={orderError.message}
        details={orderError.details}
      />
    )
  }

  if (orderResult.isLoading || !orderResult.data) {
    return <OrderDetailSkeleton />
  }

  const order = orderResult.data

  return (
    <div className='space-y-6'>
      <PageHeader
        className='sm:items-start'
        title='Order details'
        subtitle={<span className='font-mono text-xs'>{order.orderId}</span>}
        actions={
          <div className='flex flex-wrap gap-2'>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>Created</span>
            <span>{formatDateTime(order.createdAt)}</span>
          </div>
          {order.reservedAt ? (
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Reserved</span>
              <span>{formatDateTime(order.reservedAt)}</span>
            </div>
          ) : null}
          {order.paymentExpiresAt ? (
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Pay before</span>
              <span>{formatDateTime(new Date(order.paymentExpiresAt * 1000).toISOString())}</span>
            </div>
          ) : null}
          {order.paymentRequestedAt ? (
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Payment requested</span>
              <span>{formatDateTime(order.paymentRequestedAt)}</span>
            </div>
          ) : null}
          {order.paidAt ? (
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Paid</span>
              <span>{formatDateTime(order.paidAt)}</span>
            </div>
          ) : null}
          {order.totalAmount ? (
            <div className='flex items-center justify-between text-base font-semibold'>
              <span>Total</span>
              <span>{formatVnd(order.totalAmount)}</span>
            </div>
          ) : null}
          {order.failureReason || order.paymentFailureReason ? (
            <div className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'>
              {order.paymentFailureReason ?? order.failureReason}
            </div>
          ) : null}
          {order.paymentStatus === 'PROCESSING' ? (
            <div className='rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700'>
              Payment is being confirmed. This page refreshes automatically while VNPay finalizes
              the transaction.
            </div>
          ) : null}
        </CardContent>
        <CardFooter className='justify-end gap-3'>
          {order.status === 'PENDING' ? (
            <Button type='button' variant='outline' disabled>
              <RefreshCcw />
              Waiting for reservation...
            </Button>
          ) : null}
          {canManuallyPay ? (
            <Button
              type='button'
              disabled={triggerPaymentMutation.isLoading}
              onClick={() => void handleTriggerPayment()}
            >
              <CreditCard />
              {triggerPaymentMutation.isLoading
                ? 'Redirecting to VNPay...'
                : order.paymentStatus === 'FAILED'
                  ? 'Retry payment'
                  : 'Continue to payment'}
              <ArrowRight />
            </Button>
          ) : null}
        </CardFooter>
      </Card>

      <section className='space-y-4'>
        <h2 className='text-lg font-semibold'>Items</h2>
        <div className='space-y-4'>
          {order.items.map((item) => (
            <Card key={item.lineId}>
              <CardHeader className='gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div className='space-y-1'>
                  <CardTitle>{item.productName}</CardTitle>
                  <p className='text-sm text-muted-foreground'>
                    {formatVnd(item.unitPrice)} x {item.quantity}
                  </p>
                </div>
                <div className='text-sm font-medium'>{formatVnd(item.lineTotal)}</div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

function getAutoRedirectStorageKey(orderId: string): string {
  return `order-payment-auto-redirected:${orderId}`
}

export function OrderDetailSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-8 w-40' />
      <Skeleton className='h-56 w-full' />
      <Skeleton className='h-24 w-full' />
    </div>
  )
}
