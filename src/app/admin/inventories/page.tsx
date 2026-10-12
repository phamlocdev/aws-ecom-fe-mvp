'use client'

import { useState } from 'react'
import { PaginationControls } from '@/components/pagination/pagination-controls'
import { InventoriesTable } from '@/components/inventories/inventories-table'
import { ResourceError } from '@/components/resource-error'
import { PageHeader } from '@/components/shared/page-header'
import { PageHeaderSkeleton } from '@/components/shared/page-header-skeleton'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategoriesQuery } from '@/hooks/use-categories'
import { useInventoriesQuery } from '@/hooks/use-inventories'
import { useInventoryQueryParams } from '@/hooks/use-inventory-query-params'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { toApiClientError } from '@/lib/api/errors'

export default function InventoriesPage() {
  const { isAuthenticated, isHydrating } = useRequireAuth()
  const { filters, paginationParams, setCursor, setFilters, setLimit } = useInventoryQueryParams()
  const [draftQuery, setDraftQuery] = useState(filters.q ?? '')
  const inventoriesResult = useInventoriesQuery(paginationParams, {
    enabled: isAuthenticated && !isHydrating,
  })
  const categoriesResult = useCategoriesQuery(
    { limit: 200 },
    {
      enabled: isAuthenticated && !isHydrating,
    },
  )
  const inventoriesPage = inventoriesResult.data
  const inventories = inventoriesPage?.items ?? []
  const categories = categoriesResult.data?.items ?? []
  const inventoriesError = inventoriesResult.error ? toApiClientError(inventoriesResult.error) : null
  const categoriesError = categoriesResult.error ? toApiClientError(categoriesResult.error) : null

  if (isHydrating || !isAuthenticated) {
    return (
      <div className='space-y-6'>
        <PageHeaderSkeleton />
        <InventoriesSkeleton />
      </div>
    )
  }

  function applyFilters() {
    setFilters({
      q: draftQuery.trim() || undefined,
      status: filters.status,
    })
  }

  function resetFilters() {
    setDraftQuery('')
    setFilters({})
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Inventories'
        subtitle='Monitor stock levels and adjust available quantities through the backend `/inventories` API.'
      />

      <div className='grid gap-3 rounded-md border bg-card p-4 md:grid-cols-[minmax(0,1fr)_180px_auto_auto]'>
        <Input
          value={draftQuery}
          placeholder='Search by product name or ID'
          onChange={(event) => setDraftQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              applyFilters()
            }
          }}
        />
        <Select
          value={filters.status ?? 'ALL'}
          onValueChange={(value) =>
            setFilters({
              q: draftQuery.trim() || undefined,
              status: value === 'ACTIVE' || value === 'INACTIVE' ? value : undefined,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder='Product status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>All statuses</SelectItem>
            <SelectItem value='ACTIVE'>ACTIVE</SelectItem>
            <SelectItem value='INACTIVE'>INACTIVE</SelectItem>
          </SelectContent>
        </Select>
        <Button type='button' onClick={applyFilters}>
          Apply
        </Button>
        <Button type='button' variant='outline' onClick={resetFilters}>
          Reset
        </Button>
      </div>

      {inventoriesError ? (
        <ResourceError
          title='Inventories endpoint error'
          message={inventoriesError.message}
          details={inventoriesError.details}
        />
      ) : null}
      {categoriesError ? (
        <ResourceError
          title='Categories endpoint error'
          message={categoriesError.message}
          details={categoriesError.details}
        />
      ) : null}

      {inventoriesResult.isLoading ? (
        <InventoriesSkeleton />
      ) : !inventoriesError ? (
        <>
          <InventoriesTable inventories={inventories} categories={categories} />
          {inventoriesPage ? (
            <PaginationControls
              limit={inventoriesPage.limit}
              currentPage={inventoriesPage.currentPage}
              previousCursor={inventoriesPage.previousCursor}
              nextCursor={inventoriesPage.nextCursor}
              onLimitChange={setLimit}
              onCursorChange={setCursor}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function InventoriesSkeleton() {
  return <TableSkeleton rows={6} cols={7} />
}
