'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Clock3, CircleAlert, ExternalLink } from 'lucide-react'
import { ResourceError } from '@/components/resource-error'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/customer/order-status-badges'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrderQuery } from '@/hooks/use-orders'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { toApiClientError } from '@/lib/api/errors'
import { formatDateTime, formatVnd } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function OrderPaymentReturnPage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('vnp_TxnRef') ?? ''
  const responseCode = searchParams.get('vnp_ResponseCode')
  const transactionStatus = searchParams.get('vnp_TransactionStatus')
  const payDate = searchParams.get('vnp_PayDate')
  const verified = searchParams.get('verified')
  const returnMessage = searchParams.get('returnMessage')

  const orderResult = useOrderQuery(orderId, { pollPayment: true })
  const orderError = orderResult.error ? toApiClientError(orderResult.error) : null

  const returnState = useMemo(() => {
    if (verified === '0') {
      return {
        icon: CircleAlert,
        title: 'Unable to verify VNPay return data',
        description:
          returnMessage ||
          'The payment gateway redirected back with data that could not be verified. Please inspect the latest order status below.',
        details: responseCode ? [`Response code: ${responseCode}`] : undefined,
      }
    }

    const isGatewaySuccess = responseCode === '00' && transactionStatus === '00'

    if (isGatewaySuccess) {
      return {
        icon: CheckCircle2,
        title: 'VNPay payment submitted',
        description:
          'VNPay reported a successful payment. We are waiting for the server-to-server confirmation to finalize your order.',
      }
    }

    return {
      icon: CircleAlert,
      title: 'VNPay reported a payment issue',
      description:
        'VNPay did not report a successful payment. Please check the latest order status below before retrying.',
      details:
        responseCode || transactionStatus
          ? [`Response code: ${responseCode ?? 'n/a'}`, `Transaction status: ${transactionStatus ?? 'n/a'}`]
          : undefined,
    }
  }, [responseCode, returnMessage, transactionStatus, verified])

  if (isHydrating || !isAuthenticated) {
    return <PaymentReturnSkeleton />
  }

  if (!orderId) {
    return (
      <ResourceError
        title='Missing VNPay order reference'
        message='The return URL does not include a valid order id.'
      />
    )
  }

  if (orderError) {
    return (
      <ResourceError
        title='Unable to load returned order'
        message={orderError.message}
        details={orderError.details}
      />
    )
  }

  if (orderResult.isLoading || !orderResult.data) {
    return <PaymentReturnSkeleton />
  }

  const order = orderResult.data
  const isStillProcessing = order.paymentStatus === 'PROCESSING'
  const StatusIcon = isStillProcessing ? Clock3 : returnState.icon

  return (
    <div className='mx-auto max-w-3xl space-y-6'>
      <div className='space-y-2 text-center'>
        <h1 className='text-3xl font-semibold tracking-normal'>Payment return</h1>
        <p className='text-sm text-muted-foreground'>
          VNPay redirected you back to the store after checkout. The final result is based on the
          latest order state below.
        </p>
      </div>

      <Card>
        <CardHeader className='items-center text-center'>
          <StatusIcon className={cn('size-10', isStillProcessing ? 'text-amber-500' : 'text-primary')} />
          <CardTitle className='text-2xl'>
            {isStillProcessing ? 'Confirming payment status...' : returnState.title}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 text-sm'>
          <p className='text-center text-muted-foreground'>
            {isStillProcessing
              ? 'The order is still waiting for VNPay IPN confirmation. This page refreshes automatically while the payment is processing.'
              : returnState.description}
          </p>

          <div className='grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <div className='text-xs uppercase tracking-wide text-muted-foreground'>Order</div>
              <div className='font-mono text-sm'>{order.id}</div>
              <div className='flex flex-wrap gap-2'>
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
            </div>
            <div className='space-y-2 text-sm sm:text-right'>
              <div>
                <span className='text-muted-foreground'>Total:</span>{' '}
                <span className='font-semibold'>{order.totalAmount ? formatVnd(order.totalAmount) : 'Pending total'}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>Updated:</span> {formatDateTime(order.updatedAt)}
              </div>
              {payDate ? (
                <div>
                  <span className='text-muted-foreground'>VNPay pay date:</span> {formatVnpayPayDate(payDate)}
                </div>
              ) : null}
            </div>
          </div>

          {order.paymentFailureReason || order.failureReason ? (
            <div className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive'>
              {order.paymentFailureReason ?? order.failureReason}
            </div>
          ) : null}

          {returnState.details?.length ? (
            <div className='rounded-lg border border-border/60 bg-background p-3 text-muted-foreground'>
              {returnState.details.map((detail) => (
                <div key={detail}>{detail}</div>
              ))}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
          <Button type='button' variant='outline' onClick={() => void orderResult.refetch()}>
            Refresh status
          </Button>
          <Link
            href={`/orders/${encodeURIComponent(order.id)}`}
            className={buttonVariants({ className: 'w-full sm:w-auto' })}
          >
            View order details
          </Link>
          <Link
            href='/orders'
            className={buttonVariants({ variant: 'ghost', className: 'w-full sm:w-auto' })}
          >
            All orders
            <ExternalLink />
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

function formatVnpayPayDate(value: string): string {
  if (!/^\d{14}$/.test(value)) {
    return value
  }

  const year = value.slice(0, 4)
  const month = value.slice(4, 6)
  const day = value.slice(6, 8)
  const hour = value.slice(8, 10)
  const minute = value.slice(10, 12)
  const second = value.slice(12, 14)

  return `${year}-${month}-${day} ${hour}:${minute}:${second} GMT+7`
}

function PaymentReturnSkeleton() {
  return (
    <div className='mx-auto max-w-3xl space-y-6'>
      <Skeleton className='mx-auto h-10 w-56' />
      <Skeleton className='h-80 w-full' />
    </div>
  )
}
