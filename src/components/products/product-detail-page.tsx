'use client'

import Link from 'next/link'
import { notFound, useParams, usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, ShoppingCart, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useActiveCart } from '@/hooks/use-active-cart'
import { useAddCartItemMutation } from '@/hooks/use-carts'
import { ProductImageGallery } from '@/components/products/product-image-gallery'
import { ResourceError } from '@/components/resource-error'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategoriesQuery } from '@/hooks/use-categories'
import { useProductQuery } from '@/hooks/use-products'
import { toApiClientError } from '@/lib/api/errors'
import { formatDateTime, formatVnd } from '@/lib/format'
import { resolveDynamicRouteSegment } from '@/lib/routing'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'

export function ProductDetailPage() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams<{ id?: string }>()
  const productId = resolveDynamicRouteSegment(params.id, pathname, '/products')
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { ensureActiveCart } = useActiveCart()
  const addCartItemMutation = useAddCartItemMutation()
  const productResult = useProductQuery(productId)
  const categoriesResult = useCategoriesQuery({ limit: 200 })
  const product = productResult.data
  const categories = categoriesResult.data?.items ?? []
  const category = product
    ? categories.find((item) => item.categoryId === product.categoryId)
    : undefined
  const productError = productResult.error ? toApiClientError(productResult.error) : null

  if (productResult.isLoading) {
    return <ProductDetailSkeleton />
  }

  if (productError?.statusCode === 404) {
    return notFound()
  }

  if (productError) {
    return (
      <ResourceError
        title='Product endpoint error'
        message={productError.message}
        details={productError.details}
      />
    )
  }

  if (!product) {
    return notFound()
  }

  const resolvedProduct = product

  async function handleAddToCart(redirectToCheckout = false) {
    if (!isAuthenticated) {
      router.push(`/auth/login?next=${encodeURIComponent(`/products/${productId}`)}`)
      return
    }

    try {
      const cartId = await ensureActiveCart()
      await addCartItemMutation.mutateAsync({
        cartId,
        productId: resolvedProduct.productId,
        quantity: 1,
      })
      toast.success(`${resolvedProduct.name} added to cart`)

      if (redirectToCheckout) {
        router.push('/checkout')
      }
    } catch (error) {
      const normalized = toApiClientError(error)
      toast.error(normalized.message)
    }
  }

  return (
    <div className='space-y-6'>
      <Link href='/' className={cn(buttonVariants({ variant: 'ghost', className: 'px-0' }))}>
        <ArrowLeft />
        Back to catalog
      </Link>

      <div className='grid gap-8 lg:grid-cols-12'>
        <section className='lg:sticky lg:top-24 lg:col-span-7 lg:self-start'>
          <ProductImageGallery product={product} />
        </section>

        <section className='space-y-6 lg:col-span-5'>
          <div className='space-y-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {product.status}
              </Badge>
              <span className='text-sm text-muted-foreground'>
                {category?.name ?? product.categoryId}
              </span>
            </div>
            <h1 className='text-3xl font-semibold tracking-normal'>{resolvedProduct.name}</h1>
            <p className='text-3xl font-semibold'>{formatVnd(resolvedProduct.price)}</p>
          </div>

          <div className='space-y-3 border-y py-5'>
            <div className='flex items-center gap-2 text-sm'>
              <CheckCircle2 className='size-4 text-primary' />
              <span>Ready for checkout</span>
            </div>
            <p className='text-sm leading-6 text-muted-foreground'>{resolvedProduct.description}</p>
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            <Button
              size='lg'
              disabled={product.status !== 'ACTIVE' || addCartItemMutation.isLoading}
              onClick={() => void handleAddToCart(true)}
            >
              <Zap />
              Buy now
            </Button>
            <Button
              size='lg'
              variant='outline'
              disabled={product.status !== 'ACTIVE' || addCartItemMutation.isLoading}
              onClick={() => void handleAddToCart(false)}
            >
              <ShoppingCart />
              Add to cart
            </Button>
          </div>

          <dl className='grid gap-3 rounded-xl border bg-card p-4 text-sm'>
            <div className='flex justify-between gap-4'>
              <dt className='text-muted-foreground'>Product ID</dt>
              <dd className='font-mono text-xs'>{product.productId}</dd>
            </div>
            <div className='flex justify-between gap-4'>
              <dt className='text-muted-foreground'>Currency</dt>
              <dd>{product.currency}</dd>
            </div>
            <div className='flex justify-between gap-4'>
              <dt className='text-muted-foreground'>Updated</dt>
              <dd>{formatDateTime(product.updatedAt)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-10 w-36' />
      <div className='grid gap-8 lg:grid-cols-12'>
        <Skeleton className='h-[520px] lg:col-span-7' />
        <div className='space-y-4 lg:col-span-5'>
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-10 w-40' />
          <Skeleton className='h-36 w-full' />
          <Skeleton className='h-12 w-full' />
        </div>
      </div>
    </div>
  )
}
