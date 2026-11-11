import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  findAllOrders,
  findOrderById,
  getOrderEmailStatistics,
  getOrderEmailTracking,
  ORDER_QUERY_KEYS,
  placeOrder,
  resendFailedOrderEmail,
  triggerOrderPayment,
  updateOrderStatus,
  type FindAllOrdersQueryParams,
  type PlaceOrderInput,
} from '@/lib/api/orders'
import type { EmailType, Order, OrderDetails } from '@/lib/types'

export function useOrdersQuery(params?: FindAllOrdersQueryParams) {
  return useQuery(ORDER_QUERY_KEYS.list(params), () => findAllOrders(params), {
    keepPreviousData: true,
  })
}

export function useOrderQuery(
  orderId: string,
  options?: { pollPending?: boolean; pollPayment?: boolean },
) {
  return useQuery<OrderDetails>(ORDER_QUERY_KEYS.detail(orderId), () => findOrderById(orderId), {
    enabled: Boolean(orderId),
    refetchInterval: (data) => {
      if (!data) {
        return false
      }
      if (options?.pollPending && data.status === 'PENDING') {
        return 2000
      }
      if (options?.pollPayment && data.paymentStatus === 'PROCESSING') {
        return 2000
      }
      return false
    },
  })
}

export function useOrderEmailStatisticsQuery() {
  return useQuery(ORDER_QUERY_KEYS.emailStatistics(), getOrderEmailStatistics)
}

export function useOrderEmailTrackingQuery(orderId: string) {
  return useQuery(ORDER_QUERY_KEYS.emailTracking(orderId), () => getOrderEmailTracking(orderId), {
    enabled: Boolean(orderId),
  })
}

export function usePlaceOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation((input: PlaceOrderInput) => placeOrder(input), {
    onSuccess: (response) => {
      void queryClient.invalidateQueries(ORDER_QUERY_KEYS.lists())
      void queryClient.invalidateQueries(ORDER_QUERY_KEYS.detail(response.orderId))
    },
  })
}

export function useTriggerPaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation((orderId: string) => triggerOrderPayment(orderId), {
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.lists()),
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.detail(response.orderId)),
      ])
    },
  })
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation(
    ({ orderId, status }: { orderId: string; status: Order['status'] }) =>
      updateOrderStatus(orderId, status),
    {
      onSuccess: async (order) => {
        await Promise.all([
          queryClient.invalidateQueries(ORDER_QUERY_KEYS.lists()),
          queryClient.invalidateQueries(ORDER_QUERY_KEYS.detail(order.id)),
          queryClient.invalidateQueries(ORDER_QUERY_KEYS.emailStatistics()),
          queryClient.invalidateQueries(ORDER_QUERY_KEYS.emailTracking(order.id)),
        ])
      },
    },
  )
}

export function useResendFailedOrderEmailMutation(orderId: string) {
  const queryClient = useQueryClient()

  return useMutation(
    ({
      emailType,
      recipientEmail,
    }: {
      emailType: Extract<EmailType, 'ORDER_CONFIRMATION' | 'SHIPPED_ORDER_NOTIFICATION'>
      recipientEmail?: string
    }) => resendFailedOrderEmail(orderId, emailType, recipientEmail),
    {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(ORDER_QUERY_KEYS.emailStatistics()),
          queryClient.invalidateQueries(ORDER_QUERY_KEYS.emailTracking(orderId)),
        ])
      },
    },
  )
}
