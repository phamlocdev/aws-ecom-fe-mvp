import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { formatDateTime, formatVnd } from '@/lib/format'
import {
  getProductImageAlt,
  getProductImageSrc,
  getPrimaryProductImage,
} from '@/lib/product-images'
import type { Category, Product } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

export function CustomerProductsGrid({
  products,
  categories,
}: {
  products: Product[]
  categories: Category[]
}) {
  const categoryNames = new Map(categories.map((category) => [category.categoryId, category.name]))

  if (products.length === 0) {
    return (
      <div className='rounded-[2rem] border bg-card/85 p-10 text-center shadow-sm'>
        <p className='text-lg font-semibold'>No products match your filters</p>
        <p className='mt-2 text-sm text-muted-foreground'>
          Try widening the price range or removing the keyword/category filter.
        </p>
      </div>
    )
  }

  return (
    <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
      {products.map((product) => {
        const primaryImage = getPrimaryProductImage(product)
        const imageSrc = getProductImageSrc(product)

        return (
          <article
            key={product.productId}
            className='group overflow-hidden rounded-[1.75rem] border bg-card/88 shadow-sm transition-transform duration-200 hover:-translate-y-1'
          >
            <div className='relative aspect-[4/3] overflow-hidden bg-[linear-gradient(135deg,_rgba(245,158,11,0.2),_rgba(15,23,42,0.04))]'>
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={getProductImageAlt(product, primaryImage)}
                  className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]'
                />
              ) : (
                <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
                  Product preview unavailable
                </div>
              )}
            </div>

            <div className='space-y-4 p-5'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='truncate text-lg font-semibold'>{product.name}</p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {categoryNames.get(product.categoryId) ?? product.categoryId}
                  </p>
                </div>
                <Badge>{product.status}</Badge>
              </div>

              <p className='line-clamp-3 text-sm leading-6 text-muted-foreground'>
                {product.description}
              </p>

              <div className='flex items-center justify-between gap-3'>
                <div>
                  <p className='text-xs uppercase tracking-[0.18em] text-muted-foreground'>Price</p>
                  <p className='mt-1 text-xl font-semibold text-amber-700'>
                    {formatVnd(product.price)}
                  </p>
                </div>
                <p className='text-xs text-muted-foreground'>{formatDateTime(product.updatedAt)}</p>
              </div>

              <div className='flex items-center justify-between gap-3'>
                <Link
                  href={`/customer/products/${encodeURIComponent(product.productId)}`}
                  className='inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90'
                >
                  View detail
                  <ArrowRight className='size-4' />
                </Link>

                {imageSrc ? (
                  <a
                    href={imageSrc}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground'
                  >
                    Image
                    <ExternalLink className='size-4' />
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
