'use client'

import { useMemo, useState } from 'react'
import { CatalogFilterSidebar } from '@/components/products/catalog-filter-sidebar'
import {
  CatalogProductList,
  type ProductViewMode,
} from '@/components/products/catalog-product-list'
import { ResourceError } from '@/components/resource-error'
import { PageHeader } from '@/components/shared/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useCatalogQueryParams } from '@/hooks/use-catalog-query-params'
import { useCategoriesQuery } from '@/hooks/use-categories'
import { useInfiniteProductsQuery } from '@/hooks/use-infinite-products'
import { toApiClientError } from '@/lib/api/errors'

export default function ProductCatalogPage() {
  const [viewMode, setViewMode] = useState<ProductViewMode>('grid')
  const { filters, limit, setFilters } = useCatalogQueryParams()
  const productsResult = useInfiniteProductsQuery({ limit, ...filters })
  const categoriesResult = useCategoriesQuery({ limit: 200 })
  const products = useMemo(
    () => productsResult.data?.pages.flatMap((page) => page.items) ?? [],
    [productsResult.data],
  )
  const categories = categoriesResult.data?.items ?? []
  const productsError = productsResult.error ? toApiClientError(productsResult.error) : null
  const categoriesError = categoriesResult.error ? toApiClientError(categoriesResult.error) : null

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Product Catalog'
        subtitle='Browse products and narrow the catalog with filters.'
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

      <div className='grid gap-6 lg:grid-cols-12'>
        <div className='lg:col-span-3'>
          <CatalogFilterSidebar
            categories={categories}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
        <div className='lg:col-span-9'>
          {productsResult.isLoading ? (
            <CatalogSkeleton />
          ) : !productsError ? (
            <CatalogProductList
              products={products}
              categories={categories}
              viewMode={viewMode}
              isFetchingMore={productsResult.isFetchingNextPage}
              hasMore={Boolean(productsResult.hasNextPage)}
              onViewModeChange={setViewMode}
              onViewMore={() => void productsResult.fetchNextPage()}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CatalogSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='flex justify-between gap-3'>
        <Skeleton className='h-12 w-48' />
        <Skeleton className='h-10 w-44' />
      </div>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className='h-80 w-full' />
        ))}
      </div>
    </div>
  )
}
