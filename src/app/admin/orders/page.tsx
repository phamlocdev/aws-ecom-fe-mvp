'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { EmailStatisticsCards } from '@/components/email/email-statistics-cards'
import { AdminOrdersTable } from '@/components/orders/admin-orders-table'
import { PaginationControls } from '@/components/pagination/pagination-controls'
import { ResourceError } from '@/components/resource-error'
import { PageHeader } from '@/components/shared/page-header'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { useCatalogQueryParams } from '@/hooks/use-catalog-query-params'
import {
  useOrderEmailStatisticsQuery,
  useOrdersQuery,
  useUpdateOrderStatusMutation,
} from '@/hooks/use-orders'
import { toApiClientError } from '@/lib/api/errors'
import type { Order, OrderStatus } from '@/lib/types'

export default function AdminOrdersPage() {
  const { limit, paginationParams, setCursor, setLimit } = useCatalogQueryParams()
  const ordersResult = useOrdersQuery({
    limit,
    ...(paginationParams.cursor ? { cursor: paginationParams.cursor } : {}),
  })
  const statisticsResult = useOrderEmailStatisticsQuery()
  const updateStatusMutation = useUpdateOrderStatusMutation()
  const [updatingOrderId, setUpdatingOrderId] = useState<string>()
  const ordersPage = ordersResult.data
  const orders = ordersPage?.items ?? []
  const ordersError = ordersResult.error ? toApiClientError(ordersResult.error) : null
  const statisticsError = statisticsResult.error ? toApiClientError(statisticsResult.error) : null

  async function handleStatusChange(order: Order, status: OrderStatus) {
    if (status !== 'SHIPPED' || status === order.status) {
      return
    }

    setUpdatingOrderId(order.orderId)
    try {
      await updateStatusMutation.mutateAsync({ orderId: order.orderId, status })
      toast.success('Order marked as shipped.')
    } catch (error) {
      toast.error(toApiClientError(error).message)
    } finally {
      setUpdatingOrderId(undefined)
    }
  }

  return (
    <div className='space-y-6'>
      <PageHeader title='Orders' subtitle='Manage order status and customer email delivery.' />

      {ordersError ? (
        <ResourceError
          title='Orders endpoint error'
          message={ordersError.message}
          details={ordersError.details}
        />
      ) : null}
      {statisticsError ? (
        <ResourceError
          title='Email statistics endpoint error'
          message={statisticsError.message}
          details={statisticsError.details}
        />
      ) : null}

      <EmailStatisticsCards
        statistics={statisticsResult.data}
        emailTypes={['ORDER_CONFIRMATION', 'SHIPPED_ORDER_NOTIFICATION']}
      />

      {ordersResult.isLoading ? (
        <OrdersSkeleton />
      ) : !ordersError ? (
        <>
          <AdminOrdersTable
            orders={orders}
            updatingOrderId={updatingOrderId}
            onStatusChange={handleStatusChange}
          />
          {ordersPage ? (
            <PaginationControls
              limit={ordersPage.limit}
              currentPage={ordersPage.currentPage}
              previousCursor={ordersPage.previousCursor}
              nextCursor={ordersPage.nextCursor}
              onLimitChange={setLimit}
              onCursorChange={setCursor}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function OrdersSkeleton() {
  return <TableSkeleton rows={6} cols={7} />
}
