'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PaginationControls } from '@/components/pagination/pagination-controls'
import { ProductFiltersDialog } from '@/components/products/product-filters-dialog'
import { ProductsTable } from '@/components/products/products-table'
import { ResourceError } from '@/components/resource-error'
import { PageHeader } from '@/components/shared/page-header'
import { PageHeaderSkeleton } from '@/components/shared/page-header-skeleton'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { buttonVariants } from '@/components/ui/button'
import { useCatalogQueryParams } from '@/hooks/use-catalog-query-params'
import { useCategoriesQuery } from '@/hooks/use-categories'
import { useInventoriesQuery } from '@/hooks/use-inventories'
import { useProductsQuery } from '@/hooks/use-products'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { toApiClientError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'

export default function ProductsPage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const { filters, paginationParams, setCursor, setFilters, setLimit } = useCatalogQueryParams()
  const canLoadProtectedResources = isAuthenticated && !isHydrating
  const productsResult = useProductsQuery(paginationParams, {
    enabled: canLoadProtectedResources,
  })
  const categoriesResult = useCategoriesQuery(
    { limit: 200 },
    {
      enabled: canLoadProtectedResources,
    },
  )
  const productsPage = productsResult.data
  const products = productsPage?.items ?? []
  const productIds = products.map((product) => product.productId)
  const inventoryResult = useInventoriesQuery(
    {
      productIds,
    },
    {
      enabled: canLoadProtectedResources && Boolean(productsPage) && productIds.length > 0,
    },
  )
  const categories = categoriesResult.data?.items ?? []
  const productsError = productsResult.error ? toApiClientError(productsResult.error) : null
  const categoriesError = categoriesResult.error ? toApiClientError(categoriesResult.error) : null
  const inventoryError = inventoryResult.error ? toApiClientError(inventoryResult.error) : null
  const inventoryByProductId = new Map(
    (inventoryResult.data?.items ?? []).map(
      (inventory) => [inventory.productId, inventory] as const,
    ),
  )

  if (isHydrating || !isAuthenticated) {
    return (
      <div className='space-y-6'>
        <PageHeaderSkeleton hasActions />
        <ProductsSkeleton />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Products'
        subtitle='Manage product records through the backend `/products` API.'
        actions={
          <>
            <ProductFiltersDialog
              categories={categories}
              filters={filters}
              scannedCount={productsPage?.scannedCount}
              onApplyFilters={setFilters}
            />
            <Link href='/admin/products/new' className={cn(buttonVariants())}>
              <Plus />
              New product
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
      {inventoryError ? (
        <ResourceError
          title='Inventories endpoint error'
          message={inventoryError.message}
          details={inventoryError.details}
        />
      ) : null}

      {productsResult.isLoading ? (
        <ProductsSkeleton />
      ) : !productsError ? (
        <>
          <ProductsTable
            products={products}
            categories={categories}
            inventoryByProductId={inventoryByProductId}
          />
          {productsPage ? (
            <PaginationControls
              limit={productsPage.limit}
              currentPage={productsPage.currentPage}
              previousCursor={productsPage.previousCursor}
              nextCursor={productsPage.nextCursor}
              onLimitChange={setLimit}
              onCursorChange={setCursor}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function ProductsSkeleton() {
  return <TableSkeleton rows={6} cols={7} />
}
