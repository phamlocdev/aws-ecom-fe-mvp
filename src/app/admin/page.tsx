'use client'

import Link from 'next/link'
import type { ComponentType } from 'react'
import { AlertCircle, ArrowRight, Layers3, Package, Tags } from 'lucide-react'
import { formatVnd } from '@/lib/format'
import type { Category, Product } from '@/lib/types'
import { ResourceError } from '@/components/resource-error'
import { PageHeader } from '@/components/shared/page-header'
import { PageHeaderSkeleton } from '@/components/shared/page-header-skeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useProductsQuery } from '@/hooks/use-products'
import { useCategoriesQuery } from '@/hooks/use-categories'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { toApiClientError } from '@/lib/api/errors'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminDashboardPage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const canLoadProtectedResources = isAuthenticated && !isHydrating
  const productsResult = useProductsQuery(undefined, {
    enabled: canLoadProtectedResources,
  })
  const categoriesResult = useCategoriesQuery(undefined, {
    enabled: canLoadProtectedResources,
  })

  const products = productsResult.data?.items ?? []
  const categories = categoriesResult.data?.items ?? []
  const activeProducts = products.filter((product) => product.status === 'ACTIVE').length
  const inventoryValue = products.reduce((sum, product) => sum + product.price, 0)
  const orphanProducts = products.filter(
    (product) => !categories.some((category) => category.categoryId === product.categoryId),
  ).length

  const productsError = productsResult.error ? toApiClientError(productsResult.error) : null
  const categoriesError = categoriesResult.error ? toApiClientError(categoriesResult.error) : null

  if (isHydrating || !isAuthenticated) {
    return (
      <div className='space-y-6'>
        <PageHeaderSkeleton hasActions />
        <Skeleton className='h-96 w-full' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Dashboard'
        subtitle='Overview for products and categories stored through the NestJS API.'
        actions={
          <>
            <Link href='/admin/categories' className={cn(buttonVariants({ variant: 'outline' }))}>
              Categories
              <ArrowRight />
            </Link>
            <Link href='/admin/inventories' className={cn(buttonVariants({ variant: 'outline' }))}>
              Inventories
              <ArrowRight />
            </Link>
            <Link href='/admin/products' className={cn(buttonVariants())}>
              Products
              <ArrowRight />
            </Link>
          </>
        }
      />

      {productsError ? (
        <ResourceError
          title='Products endpoint error'
          message={productsError.message}
          details={productsError.details}
        />
      ) : null}
      {categoriesError ? (
        <ResourceError
          title='Categories endpoint error'
          message={categoriesError.message}
          details={categoriesError.details}
        />
      ) : null}

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          title='Products'
          value={products.length.toString()}
          icon={Package}
          detail={`${activeProducts} active`}
        />
        <MetricCard
          title='Categories'
          value={categories.length.toString()}
          icon={Tags}
          detail='Stable categoryId slugs'
        />
        <MetricCard
          title='Catalog Value'
          value={formatVnd(inventoryValue)}
          icon={Layers3}
          detail='Sum of product prices'
        />
        <MetricCard
          title='Unmatched Refs'
          value={orphanProducts.toString()}
          icon={AlertCircle}
          detail='Products with missing category'
        />
      </div>

      <div className='grid gap-4 xl:grid-cols-2'>
        <RecentProducts products={products.slice(0, 5)} />
        <RecentCategories categories={categories.slice(0, 5)} />
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string
  value: string
  detail: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
        <Icon className='size-4 text-primary' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-semibold'>{value}</div>
        <p className='mt-1 text-xs text-muted-foreground'>{detail}</p>
      </CardContent>
    </Card>
  )
}

function RecentProducts({ products }: { products: Product[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Products</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {products.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No products loaded.</p>
        ) : (
          products.map((product) => (
            <div
              key={product.productId}
              className='flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0'
            >
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{product.name}</p>
                <p className='text-xs text-muted-foreground'>{formatVnd(product.price)}</p>
              </div>
              <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {product.status}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function RecentCategories({ categories }: { categories: Category[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Categories</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {categories.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No categories loaded.</p>
        ) : (
          categories.map((category) => (
            <div
              key={category.categoryId}
              className='flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0'
            >
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{category.name}</p>
                <p className='font-mono text-xs text-muted-foreground'>{category.categoryId}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
