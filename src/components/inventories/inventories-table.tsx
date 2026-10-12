import { formatDateTime } from '@/lib/format'
import {
  getInventoryStockBadgeVariant,
  getInventoryStockLabel,
  getInventoryStockStatus,
} from '@/lib/inventory'
import type { Category, InventorySummary } from '@/lib/types'
import { InventoryAdjustDialog } from '@/components/inventories/inventory-adjust-dialog'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'

export function InventoriesTable({
  inventories,
  categories,
}: {
  inventories: InventorySummary[]
  categories: Category[]
}) {
  const categoryNames = new Map(categories.map((category) => [category.categoryId, category.name]))

  const columns: ColumnDef<InventorySummary>[] = [
    {
      id: 'product',
      header: 'Product',
      headerClassName: 'w-[32%]',
      cell: (inventory) => (
        <div className='min-w-0 space-y-1'>
          <p className='truncate font-medium'>{inventory.productName}</p>
          <p className='font-mono text-[11px] text-muted-foreground'>{inventory.productId}</p>
        </div>
      ),
    },
    {
      id: 'context',
      header: 'Context',
      cell: (inventory) => (
        <div className='space-y-1'>
          <p className='text-sm'>
            {categoryNames.get(inventory.categoryId) ?? inventory.categoryId}
          </p>
          <div className='flex gap-2'>
            <Badge variant={inventory.productStatus === 'ACTIVE' ? 'default' : 'secondary'}>
              {inventory.productStatus}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      id: 'available',
      header: 'Available',
      cellClassName: 'font-medium',
      cell: (inventory) => inventory.availableQuantity,
    },
    {
      id: 'reserved',
      header: 'Reserved',
      cell: (inventory) => inventory.reservedQuantity,
    },
    {
      id: 'stock',
      header: 'Stock',
      cell: (inventory) => {
        const stockStatus = getInventoryStockStatus(inventory.availableQuantity)
        return (
          <Badge variant={getInventoryStockBadgeVariant(stockStatus)}>
            {getInventoryStockLabel(stockStatus)}
          </Badge>
        )
      },
    },
    {
      id: 'updated',
      header: 'Updated',
      cell: (inventory) => (
        <span className='text-sm text-muted-foreground'>{formatDateTime(inventory.updatedAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      headerClassName: 'w-20 text-right',
      cell: (inventory) => (
        <div className='flex justify-end'>
          <InventoryAdjustDialog inventory={inventory} />
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={inventories}
      rowKey={(inventory) => inventory.productId}
      emptyTitle='No inventory rows found'
      emptyDescription='Try broadening the search or create products to populate inventory.'
      mobileCard={(inventory) => {
        const stockStatus = getInventoryStockStatus(inventory.availableQuantity)

        return (
          <div className='space-y-2 p-4'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <p className='truncate font-medium'>{inventory.productName}</p>
                <p className='font-mono text-[11px] text-muted-foreground'>{inventory.productId}</p>
              </div>
              <Badge variant={getInventoryStockBadgeVariant(stockStatus)}>
                {getInventoryStockLabel(stockStatus)}
              </Badge>
            </div>
            <div className='flex items-center justify-between text-sm text-muted-foreground'>
              <span>{inventory.availableQuantity} available</span>
              <span>{inventory.reservedQuantity} reserved</span>
            </div>
            <div className='flex justify-end'>
              <InventoryAdjustDialog inventory={inventory} />
            </div>
          </div>
        )
      }}
    />
  )
}
