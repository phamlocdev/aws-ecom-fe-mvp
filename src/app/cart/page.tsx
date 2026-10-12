'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { CartLineItems } from '@/components/customer/cart-line-items'
import { ResourceError } from '@/components/resource-error'
import { PageHeader } from '@/components/shared/page-header'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useActiveCart } from '@/hooks/use-active-cart'
import { useCartProductDetails } from '@/hooks/use-cart-product-details'
import { useCartQuery, useRemoveCartItemMutation, useUpdateCartItemMutation } from '@/hooks/use-carts'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { toApiClientError } from '@/lib/api/errors'
import { formatVnd } from '@/lib/format'

export default function CartPage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const { activeCartId, isHydrated: isCartHydrated, clearActiveCart } = useActiveCart()
  const cartResult = useCartQuery(activeCartId, isAuthenticated && isCartHydrated)
  const updateItemMutation = useUpdateCartItemMutation()
  const removeItemMutation = useRemoveCartItemMutation()
  const cartError = cartResult.error ? toApiClientError(cartResult.error) : null
  const cartStatus = cartResult.data?.status
  const { items, totalAmount, isLoading: isProductsLoading, error: cartProductsError } =
    useCartProductDetails(cartResult.data)

  useEffect(() => {
    if (cartError?.statusCode === 404 || (cartStatus && cartStatus !== 'ACTIVE')) {
      clearActiveCart()
    }
  }, [cartError?.statusCode, cartStatus, clearActiveCart])

  if (isHydrating || !isCartHydrated) {
    return <CartSkeleton />
  }

  if (!isAuthenticated) {
    return <CartSkeleton />
  }

  if (!activeCartId) {
    return <EmptyCartState />
  }

  if (cartStatus && cartStatus !== 'ACTIVE') {
    return <EmptyCartState />
  }

  if (cartError && cartError.statusCode !== 404) {
    return <ResourceError title='Cart error' message={cartError.message} details={cartError.details} />
  }

  if (cartResult.isLoading || isProductsLoading) {
    return <CartSkeleton />
  }

  if (cartProductsError) {
    const normalized = toApiClientError(cartProductsError)
    return (
      <ResourceError
        title='Cart products error'
        message={normalized.message}
        details={normalized.details}
      />
    )
  }

  if (!cartResult.data || items.length === 0) {
    return <EmptyCartState />
  }

  const isPending = updateItemMutation.isLoading || removeItemMutation.isLoading

  async function handleDecrease(productId: string, quantity: number) {
    if (!activeCartId || quantity <= 1) {
      return
    }

    try {
      await updateItemMutation.mutateAsync({
        cartId: activeCartId,
        productId,
        quantity: quantity - 1,
      })
    } catch (error) {
      toast.error(toApiClientError(error).message)
    }
  }

  async function handleIncrease(productId: string, quantity: number) {
    if (!activeCartId) {
      return
    }

    try {
      await updateItemMutation.mutateAsync({
        cartId: activeCartId,
        productId,
        quantity: quantity + 1,
      })
    } catch (error) {
      toast.error(toApiClientError(error).message)
    }
  }

  async function handleRemove(productId: string) {
    if (!activeCartId) {
      return
    }

    try {
      await removeItemMutation.mutateAsync({
        cartId: activeCartId,
        productId,
      })
      toast.success('Item removed from cart')
    } catch (error) {
      toast.error(toApiClientError(error).message)
    }
  }

  return (
    <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
      <section className='space-y-4'>
        <PageHeader title='Your cart' subtitle='Review items before continuing to checkout.' />
        <CartLineItems
          items={items}
          isPending={isPending}
          onDecrease={handleDecrease}
          onIncrease={handleIncrease}
          onRemove={handleRemove}
        />
      </section>

      <aside>
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Items</span>
              <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className='flex items-center justify-between text-base font-semibold'>
              <span>Total</span>
              <span>{formatVnd(totalAmount)}</span>
            </div>
          </CardContent>
          <CardFooter className='flex-col gap-3'>
            <Link href='/checkout' className={buttonVariants({ className: 'w-full' })}>
              Go to checkout
            </Link>
            <Link
              href='/'
              className={buttonVariants({ variant: 'outline', className: 'w-full' })}
            >
              Continue shopping
            </Link>
          </CardFooter>
        </Card>
      </aside>
    </div>
  )
}

function EmptyCartState() {
  return (
    <div className='mx-auto max-w-xl rounded-xl border bg-card p-10 text-center'>
      <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted'>
        <ShoppingBag className='size-5 text-muted-foreground' />
      </div>
      <h1 className='text-xl font-semibold'>Your cart is empty</h1>
      <p className='mt-2 text-sm text-muted-foreground'>
        Add a product to cart before continuing to checkout.
      </p>
      <Link href='/' className={buttonVariants({ className: 'mt-6' })}>
        Browse products
      </Link>
    </div>
  )
}

function CartSkeleton() {
  return (
    <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
      <div className='space-y-4'>
        <Skeleton className='h-8 w-40' />
        <Skeleton className='h-32 w-full' />
        <Skeleton className='h-32 w-full' />
      </div>
      <Skeleton className='h-56 w-full' />
    </div>
  )
}
