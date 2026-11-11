'use client'

import Link from 'next/link'
import { LayoutGrid, List, ShoppingCart } from 'lucide-react'
import { formatVnd } from '@/lib/format'
import {
  getProductImageAlt,
  getProductImageSrc,
  getPrimaryProductImage,
} from '@/lib/product-images'
import type { Category, Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type ProductViewMode = 'grid' | 'row'

type CatalogProductListProps = {
  products: Product[]
  categories: Category[]
  viewMode: ProductViewMode
  isFetchingMore: boolean
  hasMore: boolean
  onViewModeChange: (viewMode: ProductViewMode) => void
  onViewMore: () => void
}

export function CatalogProductList({
  products,
  categories,
  viewMode,
  isFetchingMore,
  hasMore,
  onViewModeChange,
  onViewMore,
}: CatalogProductListProps) {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]))

  return (
    <section className='space-y-4'>
      <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
        <div>
          <h2 className='text-xl font-semibold'>Products</h2>
          <p className='text-sm text-muted-foreground'>{products.length} products loaded</p>
        </div>
        <Select
          value={viewMode}
          onValueChange={(value) => onViewModeChange(value as ProductViewMode)}
        >
          <SelectTrigger className='w-full sm:w-44'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='grid'>
              <span className='inline-flex items-center gap-2'>
                <LayoutGrid className='size-4' />
                Grid view
              </span>
            </SelectItem>
            <SelectItem value='row'>
              <span className='inline-flex items-center gap-2'>
                <List className='size-4' />
                Row view
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {products.length === 0 ? (
        <div className='rounded-md border bg-card p-10 text-center'>
          <p className='font-medium'>No products found</p>
          <p className='mt-1 text-sm text-muted-foreground'>Try changing the filters.</p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'grid gap-3',
          )}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categoryName={categoryNames.get(product.categoryId) ?? product.categoryId}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {hasMore ? (
        <div className='flex justify-center pt-2'>
          <Button type='button' variant='outline' onClick={onViewMore} disabled={isFetchingMore}>
            {isFetchingMore ? 'Loading...' : 'View more'}
          </Button>
        </div>
      ) : null}
    </section>
  )
}

function ProductCard({
  product,
  categoryName,
  viewMode,
}: {
  product: Product
  categoryName: string
  viewMode: ProductViewMode
}) {
  const primaryImage = getPrimaryProductImage(product)
  const imageSrc = getProductImageSrc(product)

  return (
    <article
      className={cn(
        'overflow-hidden rounded-md border bg-card transition-colors hover:border-primary/50',
        viewMode === 'row' ? 'grid gap-4 p-3 sm:grid-cols-[180px_1fr_auto]' : 'flex flex-col',
      )}
    >
      <Link
        href={`/products/${product.id}`}
        className={cn(
          'block overflow-hidden bg-muted',
          viewMode === 'row' ? 'aspect-[4/3] rounded-md' : 'aspect-[4/3]',
        )}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={getProductImageAlt(product, primaryImage)}
            className='h-full w-full object-cover transition-transform hover:scale-105'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-muted text-sm font-medium text-muted-foreground'>
            No image
          </div>
        )}
      </Link>
      <div
        className={cn('min-w-0 space-y-3', viewMode === 'grid' ? 'flex flex-1 flex-col p-4' : '')}
      >
        <div className='space-y-2'>
          <div className='flex items-start justify-between gap-3'>
            <Link href={`/products/${product.id}`} className='min-w-0'>
              <h3 className='line-clamp-2 text-base font-semibold hover:text-primary'>
                {product.name}
              </h3>
            </Link>
            <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {product.status}
            </Badge>
          </div>
          <p className='text-xs text-muted-foreground'>{categoryName}</p>
          <p className='line-clamp-2 text-sm text-muted-foreground'>{product.description}</p>
        </div>
        <div className='mt-auto flex items-center justify-between gap-3'>
          <p className='text-lg font-semibold'>{formatVnd(product.price)}</p>
          <Link
            href={`/products/${product.id}`}
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            <ShoppingCart />
            View
          </Link>
        </div>
      </div>
    </article>
  )
}
