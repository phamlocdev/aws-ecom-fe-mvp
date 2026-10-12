import Link from 'next/link'
import { Eye } from 'lucide-react'
import { PaymentStatusBadge } from '@/components/customer/order-status-badges'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { buttonVariants } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDateTime, formatVnd } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus } from '@/lib/types'

export function AdminOrdersTable({
  orders,
  updatingOrderId,
  onStatusChange,
}: {
  orders: Order[]
  updatingOrderId?: string
  onStatusChange: (order: Order, status: OrderStatus) => void
}) {
  const columns: ColumnDef<Order>[] = [
    {
      id: 'order',
      header: 'Order',
      headerClassName: 'w-[28%]',
      cell: (order) => (
        <div className='min-w-0 space-y-1'>
          <p className='truncate font-mono text-xs font-medium'>{order.orderId}</p>
          <p className='text-xs text-muted-foreground'>Cart {order.cartId}</p>
        </div>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: (order) => (
        <div className='min-w-0 space-y-1'>
          <p className='truncate text-sm'>{order.customerEmail ?? order.customerId}</p>
          {order.customerName ? (
            <p className='truncate text-xs text-muted-foreground'>{order.customerName}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (order) => {
        const canShip = order.status === 'CONFIRMED' && order.paymentStatus === 'PAID'
        const isUpdating = updatingOrderId === order.orderId

        return (
          <div className='flex items-center gap-2'>
            <Select
              value={order.status}
              disabled={!canShip || isUpdating}
              onValueChange={(value) => onStatusChange(order, value as OrderStatus)}
            >
              <SelectTrigger size='sm' className='w-32'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={order.status}>{order.status}</SelectItem>
                {order.status !== 'SHIPPED' ? (
                  <SelectItem value='SHIPPED'>SHIPPED</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
            {isUpdating ? <span className='text-xs text-muted-foreground'>Saving</span> : null}
          </div>
        )
      },
    },
    {
      id: 'payment',
      header: 'Payment',
      cell: (order) => <PaymentStatusBadge status={order.paymentStatus} />,
    },
    {
      id: 'total',
      header: 'Total',
      cell: (order) => formatVnd(order.totalAmount ?? 0),
    },
    {
      id: 'created',
      header: 'Created',
      cell: (order) => (
        <span className='text-sm text-muted-foreground'>{formatDateTime(order.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      headerClassName: 'w-20 text-right',
      cell: (order) => (
        <div className='flex justify-end'>
          <Link
            href={`/admin/orders/${order.orderId}`}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
            title='View order'
            aria-label='View order'
          >
            <Eye />
          </Link>
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={orders}
      rowKey={(order) => order.orderId}
      emptyTitle='No orders found'
      emptyDescription='Orders will appear here after checkout.'
      mobileCard={(order) => (
        <div className='space-y-2 p-4'>
          <div className='flex items-start justify-between gap-2'>
            <div className='min-w-0'>
              <p className='truncate font-mono text-xs font-medium'>{order.orderId}</p>
              <p className='truncate text-xs text-muted-foreground'>
                {order.customerEmail ?? order.customerId}
              </p>
            </div>
            <Link
              href={`/admin/orders/${order.orderId}`}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
              title='View order'
              aria-label='View order'
            >
              <Eye />
            </Link>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span>{formatVnd(order.totalAmount ?? 0)}</span>
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>
      )}
    />
  )
}
