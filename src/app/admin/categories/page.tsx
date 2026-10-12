'use client'

import { CategoriesTable } from '@/components/categories/categories-table'
import { CategoryFormDialog } from '@/components/categories/category-form-dialog'
import { PaginationControls } from '@/components/pagination/pagination-controls'
import { ResourceError } from '@/components/resource-error'
import { PageHeader } from '@/components/shared/page-header'
import { PageHeaderSkeleton } from '@/components/shared/page-header-skeleton'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { useCatalogQueryParams } from '@/hooks/use-catalog-query-params'
import { useCategoriesQuery } from '@/hooks/use-categories'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { toApiClientError } from '@/lib/api/errors'

export default function CategoriesPage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const { limit, paginationParams, setCursor, setLimit } = useCatalogQueryParams()
  const categoriesResult = useCategoriesQuery(
    {
      limit,
      ...(paginationParams.cursor ? { cursor: paginationParams.cursor } : {}),
    },
    {
      enabled: isAuthenticated && !isHydrating,
    },
  )
  const categoriesPage = categoriesResult.data
  const categories = categoriesPage?.items ?? []
  const error = categoriesResult.error ? toApiClientError(categoriesResult.error) : null

  if (isHydrating || !isAuthenticated) {
    return (
      <div className='space-y-6'>
        <PageHeaderSkeleton hasActions />
        <CategoriesSkeleton />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Categories'
        subtitle='Manage stable category slugs through the backend `/categories` API.'
        actions={<CategoryFormDialog />}
      />

      {error ? (
        <ResourceError
          title='Categories endpoint error'
          message={error.message}
          details={error.details}
        />
      ) : null}

      {categoriesResult.isLoading ? (
        <CategoriesSkeleton />
      ) : !error ? (
        <>
          <CategoriesTable categories={categories} />
          {categoriesPage ? (
            <PaginationControls
              limit={categoriesPage.limit}
              currentPage={categoriesPage.currentPage}
              previousCursor={categoriesPage.previousCursor}
              nextCursor={categoriesPage.nextCursor}
              onLimitChange={setLimit}
              onCursorChange={setCursor}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function CategoriesSkeleton() {
  return <TableSkeleton rows={5} cols={5} />
}
