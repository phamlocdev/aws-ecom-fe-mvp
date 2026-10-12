'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CartLineItems } from '@/components/customer/cart-line-items'
import { ResourceError } from '@/components/resource-error'
import { PageHeader } from '@/components/shared/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useActiveCart } from '@/hooks/use-active-cart'
import { useCartProductDetails } from '@/hooks/use-cart-product-details'
import { useCartQuery } from '@/hooks/use-carts'
import { usePlaceOrderMutation } from '@/hooks/use-orders'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { toApiClientError } from '@/lib/api/errors'
import { formatVnd } from '@/lib/format'

export default function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const { activeCartId, isHydrated: isCartHydrated, clearActiveCart } = useActiveCart()
  const [additionalReceivingEmailsInput, setAdditionalReceivingEmailsInput] = useState('')
  const [additionalReceivingEmailsError, setAdditionalReceivingEmailsError] = useState<
    string | null
  >(null)
  const cartResult = useCartQuery(activeCartId, isAuthenticated && isCartHydrated)
  const placeOrderMutation = usePlaceOrderMutation()
  const cartError = cartResult.error ? toApiClientError(cartResult.error) : null
  const cartStatus = cartResult.data?.status
  const {
    items,
    totalAmount,
    isLoading: isProductsLoading,
    error: cartProductsError,
  } = useCartProductDetails(cartResult.data)

  useEffect(() => {
    if (cartError?.statusCode === 404 || (cartStatus && cartStatus !== 'ACTIVE')) {
      clearActiveCart()
    }
  }, [cartError?.statusCode, cartStatus, clearActiveCart])

  if (isHydrating || !isCartHydrated) {
    return <CheckoutSkeleton />
  }

  if (!isAuthenticated) {
    return <CheckoutSkeleton />
  }

  if (!activeCartId) {
    return <CheckoutEmptyState />
  }

  if (cartStatus && cartStatus !== 'ACTIVE') {
    return <CheckoutEmptyState />
  }

  if (cartError && cartError.statusCode !== 404) {
    return (
      <ResourceError
        title='Checkout cart error'
        message={cartError.message}
        details={cartError.details}
      />
    )
  }

  if (cartResult.isLoading || isProductsLoading) {
    return <CheckoutSkeleton />
  }

  if (cartProductsError) {
    const normalized = toApiClientError(cartProductsError)
    return (
      <ResourceError
        title='Checkout products error'
        message={normalized.message}
        details={normalized.details}
      />
    )
  }

  if (!cartResult.data || items.length === 0) {
    return <CheckoutEmptyState />
  }

  async function handlePlaceOrder() {
    if (!activeCartId) {
      return
    }

    setAdditionalReceivingEmailsError(null)
    const additionalReceivingEmails = parseAdditionalReceivingEmails(additionalReceivingEmailsInput)
    if (additionalReceivingEmails.invalidEmails.length > 0) {
      setAdditionalReceivingEmailsError(`Invalid email: ${additionalReceivingEmails.invalidEmails[0]}`)
      return
    }

    if (additionalReceivingEmails.emails.length > 49) {
      setAdditionalReceivingEmailsError('You can add up to 49 additional receiving emails.')
      return
    }

    try {
      const response = await placeOrderMutation.mutateAsync({
        cartId: activeCartId,
        additionalReceivingEmails:
          additionalReceivingEmails.emails.length > 0
            ? additionalReceivingEmails.emails
            : undefined,
      })
      clearActiveCart()
      toast.success('Order request accepted. We are preparing your checkout.')
      router.push(`/orders/${encodeURIComponent(response.orderId)}`)
    } catch (error) {
      toast.error(toApiClientError(error).message)
    }
  }

  return (
    <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]'>
      <section className='space-y-4'>
        <PageHeader
          title='Checkout'
          subtitle='Place the order first, then continue to the payment-mocking step.'
        />
        <CartLineItems
          items={items}
          isPending
          onDecrease={() => {}}
          onIncrease={() => {}}
          onRemove={() => {}}
        />
      </section>

      <aside>
        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
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
            <div className='space-y-2 pt-2'>
              <Label htmlFor='additionalReceivingEmails'>Additional receiving emails</Label>
              <Textarea
                id='additionalReceivingEmails'
                value={additionalReceivingEmailsInput}
                onChange={(event) => {
                  setAdditionalReceivingEmailsInput(event.target.value)
                  setAdditionalReceivingEmailsError(null)
                }}
                placeholder='a@gmail.com, b@gmail.com'
                className='h-40'
                aria-invalid={Boolean(additionalReceivingEmailsError)}
                disabled={placeOrderMutation.isLoading}
              />
              {additionalReceivingEmailsError ? (
                <p className='text-xs text-destructive'>{additionalReceivingEmailsError}</p>
              ) : (
                <p className='text-xs text-muted-foreground'>
                  Separate multiple recipients with commas.
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className='flex-col gap-3'>
            <Button
              type='button'
              className='w-full'
              disabled={placeOrderMutation.isLoading}
              onClick={() => void handlePlaceOrder()}
            >
              {placeOrderMutation.isLoading ? 'Submitting order...' : 'Place order'}
            </Button>
            <Link
              href='/cart'
              className={buttonVariants({ variant: 'outline', className: 'w-full' })}
            >
              Back to cart
            </Link>
          </CardFooter>
        </Card>
      </aside>
    </div>
  )
}

function parseAdditionalReceivingEmails(value: string): {
  emails: string[]
  invalidEmails: string[]
} {
  const emails = Array.from(
    new Set(
      value
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  )
  const invalidEmails = emails.filter((email) => !isValidEmail(email))

  return { emails, invalidEmails }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function CheckoutEmptyState() {
  return (
    <div className='mx-auto max-w-xl rounded-xl border bg-card p-10 text-center'>
      <h1 className='text-xl font-semibold'>Nothing to checkout</h1>
      <p className='mt-2 text-sm text-muted-foreground'>
        Your active cart is empty. Add products first.
      </p>
      <Link href='/' className={buttonVariants({ className: 'mt-6' })}>
        Browse products
      </Link>
    </div>
  )
}

function CheckoutSkeleton() {
  return (
    <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]'>
      <div className='space-y-4'>
        <Skeleton className='h-8 w-40' />
        <Skeleton className='h-32 w-full' />
      </div>
      <Skeleton className='h-56 w-full' />
    </div>
  )
}
