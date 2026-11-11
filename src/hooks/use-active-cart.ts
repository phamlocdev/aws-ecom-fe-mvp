'use client'

import { useCreateCartMutation } from '@/hooks/use-carts'
import { useCartStore } from '@/store/cart-store'

export function useActiveCart() {
  const activeCartId = useCartStore((state) => state.activeCartId)
  const isHydrated = useCartStore((state) => state.isHydrated)
  const setActiveCartId = useCartStore((state) => state.setActiveCartId)
  const clear = useCartStore((state) => state.clear)
  const createCartMutation = useCreateCartMutation()

  async function ensureActiveCart(): Promise<string> {
    if (activeCartId) {
      return activeCartId
    }

    const cart = await createCartMutation.mutateAsync({ ttlDays: 30 })
    setActiveCartId(cart.id)
    return cart.id
  }

  return {
    activeCartId,
    isHydrated,
    ensureActiveCart,
    setActiveCartId,
    clearActiveCart: clear,
    isCreatingCart: createCartMutation.isLoading,
  }
}
