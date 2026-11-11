import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  addCartItem,
  CART_QUERY_KEYS,
  createCart,
  findAllCarts,
  findCartById,
  removeCartItem,
  updateCartItem,
} from '@/lib/api/carts'

export function useCartsQuery() {
  return useQuery(CART_QUERY_KEYS.lists(), findAllCarts)
}

export function useCartQuery(cartId: string | null, enabled = true) {
  return useQuery(CART_QUERY_KEYS.detail(cartId), () => findCartById(cartId ?? ''), {
    enabled: enabled && Boolean(cartId),
  })
}

export function useCreateCartMutation() {
  const queryClient = useQueryClient()

  return useMutation((input?: { ttlDays?: number }) => createCart(input), {
    onSuccess: (cart) => {
      void queryClient.invalidateQueries(CART_QUERY_KEYS.lists())
      void queryClient.invalidateQueries(CART_QUERY_KEYS.detail(cart.id))
    },
  })
}

export function useAddCartItemMutation() {
  const queryClient = useQueryClient()

  return useMutation(addCartItem, {
    onSuccess: (cart) => {
      void queryClient.invalidateQueries(CART_QUERY_KEYS.lists())
      void queryClient.invalidateQueries(CART_QUERY_KEYS.detail(cart.id))
    },
  })
}

export function useUpdateCartItemMutation() {
  const queryClient = useQueryClient()

  return useMutation(updateCartItem, {
    onSuccess: (cart) => {
      void queryClient.invalidateQueries(CART_QUERY_KEYS.lists())
      void queryClient.invalidateQueries(CART_QUERY_KEYS.detail(cart.id))
    },
  })
}

export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient()

  return useMutation(removeCartItem, {
    onSuccess: (_value, variables) => {
      void queryClient.invalidateQueries(CART_QUERY_KEYS.lists())
      void queryClient.invalidateQueries(CART_QUERY_KEYS.detail(variables.cartId))
    },
  })
}
